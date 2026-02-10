/**
 * Accurate polygon area calculation for Indonesian territories
 * Uses UTM projection for precise hectare calculations
 */

interface Coordinate {
  latitude: number
  longitude: number
}

/**
 * Convert lat/lon to UTM coordinates for accurate area calculation
 * Indonesia primarily uses UTM zones 48S-54S
 */
function latLonToUTM(lat: number, lon: number): { easting: number; northing: number; zone: number } {
  const zone = Math.floor((lon + 180) / 6) + 1
  const falseEasting = 500000
  const falseNorthing = lat < 0 ? 10000000 : 0
  const k0 = 0.9996

  const latRad = (lat * Math.PI) / 180
  const lonRad = (lon * Math.PI) / 180
  const lonOriginRad = ((zone - 1) * 6 - 180 + 3) * (Math.PI / 180)

  const a = 6378137.0 // WGS84 semi-major axis
  const e2 = 0.00669438 // WGS84 eccentricity squared
  const e_prime2 = e2 / (1 - e2)

  const N = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2)
  const T = Math.tan(latRad) ** 2
  const C = e_prime2 * Math.cos(latRad) ** 2
  const A = Math.cos(latRad) * ((lonRad - lonOriginRad) % (2 * Math.PI))

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

  return { easting, northing, zone }
}

/**
 * Calculate polygon area in hectares using Shoelace formula on UTM projected coordinates
 * This method is accurate for Indonesian regions
 */
export function calculatePolygonAreaHectares(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0

  // Filter valid coordinates
  const validCoords = coordinates.filter((c) => c.latitude && c.longitude && c.latitude !== "" && c.longitude !== "")
  if (validCoords.length < 3) return 0

  // Convert to UTM
  const utmCoords = validCoords.map((coord) =>
    latLonToUTM(Number.parseFloat(String(coord.latitude)), Number.parseFloat(String(coord.longitude))),
  )

  // Apply Shoelace formula for area calculation
  let area = 0
  for (let i = 0; i < utmCoords.length; i++) {
    const current = utmCoords[i]
    const next = utmCoords[(i + 1) % utmCoords.length]
    area += current.easting * next.northing - next.easting * current.northing
  }

  area = Math.abs(area) / 2 // Square meters
  return area / 10000 // Convert m² to hectares
}

/**
 * Calculate polygon area with proper validation and display formatting
 */
export function calculateAndFormatArea(coordinates: Coordinate[]): { hectares: number; km2: number; display: string } {
  const hectares = calculatePolygonAreaHectares(coordinates)
  const km2 = hectares / 100 // Correct: 1 km² = 100 hectares
  const display = hectares > 0 ? `${hectares.toFixed(2)} ha (${km2.toFixed(4)} km²)` : "0 ha"
  return { hectares, km2, display }
}
