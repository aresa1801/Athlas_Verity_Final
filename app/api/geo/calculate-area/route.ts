import { type NextRequest, NextResponse } from "next/server"

interface GeoJSONPoint {
  type: "Point"
  coordinates: [number, number] // [longitude, latitude]
}

interface GeoJSONPolygon {
  type: "Polygon"
  coordinates: Array<Array<[number, number]>> // [longitude, latitude]
}

interface AreaCalculationRequest {
  polygon: Array<[number, number]> // [latitude, longitude]
}

interface AreaCalculationResponse {
  areaM2: number
  areaHa: number
  areaKm2: number
  display: string
  epsg: number
  zone: number
  utmBands: string[]
  calculatedAt: string
  geometryHash: string
  warning?: string
}

/**
 * Determine UTM EPSG code based on longitude and latitude
 */
function getUTMEPSG(lon: number, lat: number): { epsg: number; zone: number } {
  const zone = Math.floor((lon + 180) / 6) + 1
  const epsg = lat >= 0 ? 32600 + zone : 32700 + zone
  return { epsg, zone }
}

/**
 * Convert lat/lon to UTM coordinates using full WGS84 ellipsoid parameters
 */
function latLonToUTM(lat: number, lon: number, zone: number): { easting: number; northing: number } {
  const a = 6378137.0 // WGS84 semi-major axis in meters
  const e2 = 0.00669438 // WGS84 eccentricity squared
  const e_prime2 = e2 / (1 - e2)
  const k0 = 0.9996 // UTM scale factor

  const falseEasting = 500000
  const falseNorthing = lat < 0 ? 10000000 : 0

  const latRad = (lat * Math.PI) / 180
  const lonRad = (lon * Math.PI) / 180
  const lonOriginRad = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180)

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2)
  const T = Math.tan(latRad) ** 2
  const C = e_prime2 * Math.cos(latRad) ** 2
  const A = Math.cos(latRad) * (((lonRad - lonOriginRad + Math.PI) % (2 * Math.PI)) - Math.PI)

  const M =
    a *
    ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * latRad -
      ((3 * e2) / 8 + (3 * e2 * e2) / 32 - (45 * e2 * e2 * e2) / 1024) * Math.sin(2 * latRad) +
      ((15 * e2 * e2) / 256 - (45 * e2 * e2 * e2) / 1024) * Math.sin(4 * latRad) -
      ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * latRad))

  const easting =
    falseEasting + k0 * N * (A + (A ** 3 / 6) * (1 - T + C) + (A ** 5 / 120) * (1 - 5 * T + 9 * C + 4 * C * C))

  const northing =
    falseNorthing +
    k0 *
      (M +
        N *
          Math.tan(latRad) *
          ((A * A) / 2 +
            (A ** 4 / 24) * (5 - T + 9 * C + 4 * C * C) +
            (A ** 6 / 720) * (61 - 58 * T + T * T + 600 * C - 330 * e_prime2)))

  return { easting, northing }
}

/**
 * Calculate polygon area using Shoelace formula on UTM projected coordinates
 * Accurate to ±1% for areas < 100,000 ha
 */
function calculateAreaFromUTMCoordinates(
  polygon: Array<[number, number]>,
  zone: number,
): {
  areaM2: number
  utmBands: string[]
} {
  if (polygon.length < 3) return { areaM2: 0, utmBands: [] }

  // Convert all points to UTM
  const utmPoints = polygon.map(([lat, lon]) => {
    const utm = latLonToUTM(lat, lon, zone)
    return { x: utm.easting, y: utm.northing }
  })

  // Shoelace formula for area
  let area = 0
  for (let i = 0; i < utmPoints.length; i++) {
    const current = utmPoints[i]
    const next = utmPoints[(i + 1) % utmPoints.length]
    area += current.x * next.y - next.x * current.y
  }

  area = Math.abs(area) / 2

  // Determine UTM bands covered
  const lons = polygon.map(([_, lon]) => lon)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const bandCount = Math.ceil(maxLon / 6) - Math.floor(minLon / 6)

  const utmBands: string[] = []
  for (const lon of lons) {
    const band = Math.floor((lon + 180) / 6) + 1
    const bandLetter = String.fromCharCode(
      67 + (Math.abs(polygon[0][0]) > 0 ? Math.floor(Math.abs(polygon[0][0]) / 8) : 0),
    )
    utmBands.push(`${band}${bandLetter}`)
  }

  return { areaM2: area, utmBands: [...new Set(utmBands)] }
}

/**
 * Calculate SHA256 hash of polygon geometry for audit trail
 */
async function hashGeometry(polygon: Array<[number, number]>): Promise<string> {
  const geomString = JSON.stringify(polygon)
  const encoder = new TextEncoder()
  const data = encoder.encode(geomString)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function POST(request: NextRequest): Promise<NextResponse<AreaCalculationResponse>> {
  try {
    const body: AreaCalculationRequest = await request.json()
    const { polygon } = body

    if (!polygon || !Array.isArray(polygon) || polygon.length < 3) {
      return NextResponse.json(
        {
          areaM2: 0,
          areaHa: 0,
          areaKm2: 0,
          display: "Error: Polygon requires minimum 3 points",
          epsg: 0,
          zone: 0,
          utmBands: [],
          calculatedAt: new Date().toISOString(),
          geometryHash: "",
        },
        { status: 400 },
      )
    }

    // Get centroid for UTM zone detection
    const centerLat = polygon.reduce((sum, [lat]) => sum + lat, 0) / polygon.length
    const centerLon = polygon.reduce((sum, [_, lon]) => sum + lon, 0) / polygon.length

    const { epsg, zone } = getUTMEPSG(centerLon, centerLat)

    // Calculate area
    const { areaM2, utmBands } = calculateAreaFromUTMCoordinates(polygon, zone)
    const areaHa = areaM2 / 10000 // Correct: 1 hectare = 10,000 m²
    const areaKm2 = areaM2 / 1000000 // Correct: 1 km² = 1,000,000 m²

    // Generate geometry hash for audit trail
    const geometryHash = await hashGeometry(polygon)

    // Check for edge cases
    let warning: string | undefined
    if (areaHa < 0.1) warning = "Polygon area < 0.1 ha - ensure sufficient precision"
    if (areaKm2 > 100000) warning = "Polygon area > 100,000 km² - may span multiple UTM zones"

    return NextResponse.json({
      areaM2,
      areaHa: Math.round(areaHa * 100) / 100,
      areaKm2: Math.round(areaKm2 * 10000) / 10000,
      display: `${Math.round(areaHa * 100) / 100} ha (${Math.round(areaKm2 * 10000) / 10000} km²)`,
      epsg,
      zone,
      utmBands,
      calculatedAt: new Date().toISOString(),
      geometryHash,
      warning,
    })
  } catch (error) {
    console.error("[v0] Area calculation error:", error)
    return NextResponse.json(
      {
        areaM2: 0,
        areaHa: 0,
        areaKm2: 0,
        display: "Calculation error",
        epsg: 0,
        zone: 0,
        utmBands: [],
        calculatedAt: new Date().toISOString(),
        geometryHash: "",
      },
      { status: 500 },
    )
  }
}
