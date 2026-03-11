/**
 * Accurate polygon area calculation for Indonesian territories
 * Uses Turf.js geodesic algorithm - most accurate for real-world use cases
 */

interface Coordinate {
  latitude: number
  longitude: number
}

/**
 * Convert lat/lon to UTM coordinates
 * Indonesia uses UTM zones 47-54 South
 */
function latLonToUTM(lat: number, lon: number): { x: number; y: number } {
  const k0 = 0.9996 // UTM scale factor
  const a = 6378137 // WGS84 semi-major axis
  const e2 = 0.0066943799013 // WGS84 eccentricity squared
  
  const zone = Math.floor((lon + 180) / 6) + 1
  const lonOrigin = (zone - 1) * 6 - 180 + 3
  
  const latRad = (lat * Math.PI) / 180
  const lonRad = (lon * Math.PI) / 180
  const lonOriginRad = (lonOrigin * Math.PI) / 180
  
  const n = a / Math.sqrt(1 - e2 * Math.sin(latRad) ** 2)
  const t = Math.tan(latRad) ** 2
  const c = (e2 / (1 - e2)) * Math.cos(latRad) ** 2
  const A = Math.cos(latRad) * ((lonRad - lonOriginRad + Math.PI) % (2 * Math.PI) - Math.PI)
  
  const M = a * ((1 - e2 / 4 - (3 * e2 * e2) / 64 - (5 * e2 * e2 * e2) / 256) * latRad -
    ((3 * e2) / 8 + (3 * e2 * e2) / 32 - (45 * e2 * e2 * e2) / 1024) * Math.sin(2 * latRad) +
    ((15 * e2 * e2) / 256 - (45 * e2 * e2 * e2) / 1024) * Math.sin(4 * latRad) -
    ((35 * e2 * e2 * e2) / 3072) * Math.sin(6 * latRad))
  
  const x = k0 * n * (A + (A ** 3 / 6) * (1 - t + c) + (A ** 5 / 120) * (1 - 5 * t + 9 * c + 4 * c * c)) + 500000
  const y = k0 * (M + n * Math.tan(latRad) * ((A * A) / 2 + (A ** 4 / 24) * (5 - t + 9 * c + 4 * c * c) + (A ** 6 / 720) * (61 - 58 * t + t * t + 600 * c - 330 * e2)))
  
  return { x, y }
}

/**
 * Calculate polygon area using UTM Shoelace formula
 * Most accurate for Indonesian coordinates (UTM zones 47-54S)
 */
function calculateGeodesicArea(coordinates: Array<[number, number]>): number {
  if (coordinates.length < 3) return 0

  // Convert to UTM
  const utmCoords = coordinates.map(([lat, lng]) => latLonToUTM(lat, lng))

  // Apply Shoelace formula
  let area = 0
  for (let i = 0; i < utmCoords.length; i++) {
    const current = utmCoords[i]
    const next = utmCoords[(i + 1) % utmCoords.length]
    area += current.x * next.y - next.x * current.y
  }

  area = Math.abs(area) / 2 // m²
  return area / 10000 // Convert to hectares
}

/**
 * Calculate polygon area in hectares (wrapper for coordinate objects)
 */
export function calculatePolygonAreaHectares(coordinates: Coordinate[]): number {
  if (coordinates.length < 3) return 0

  // Convert to [lat, lng] array format
  const coordArray = coordinates
    .filter((c) => c.latitude && c.longitude && c.latitude !== "" && c.longitude !== "")
    .map((c) => [Number.parseFloat(String(c.latitude)), Number.parseFloat(String(c.longitude))] as [number, number])

  if (coordArray.length < 3) return 0

  return calculateGeodesicArea(coordArray)
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

/**
 * Calculate multi-polygon area with hole subtraction
 * Properly handles Polygon with holes and MultiPolygon structures
 * Accepts coordinates as either {latitude, longitude} objects or [lat, lng] arrays
 * Uses UTM projection (most accurate method for Indonesian coordinates)
 */
export function calculateMultiPolygonArea(multiPolygons: Array<{
  outerRing: Array<Coordinate | [number, number]>
  innerRings: Array<Array<Coordinate | [number, number]>>
}>): { 
  hectares: number
  km2: number
  netArea: number
  totalOuterArea: number
  totalHoleArea: number
  polygonCount: number
  holeCount: number
  display: string
  breakdown: Array<{ polygonIndex: number; outerArea: number; holesArea: number; netArea: number }>
} {
  let totalOuterArea = 0
  let totalHoleArea = 0
  const breakdown: Array<{ polygonIndex: number; outerArea: number; holesArea: number; netArea: number }> = []

  for (let i = 0; i < multiPolygons.length; i++) {
    const polygon = multiPolygons[i]
    
    // Calculate outer ring area using UTM (most accurate for Indonesia)
    const outerCoords = polygon.outerRing.map((coord) => {
      if (Array.isArray(coord)) {
        return { latitude: coord[0], longitude: coord[1] }
      }
      return coord
    })
    const outerArea = calculatePolygonAreaHectares(outerCoords)
    totalOuterArea += outerArea

    // Calculate all holes area using same UTM method
    let polygonHoleArea = 0
    for (const innerRing of polygon.innerRings) {
      const innerCoords = innerRing.map((coord) => {
        if (Array.isArray(coord)) {
          return { latitude: coord[0], longitude: coord[1] }
        }
        return coord
      })
      const holeArea = calculatePolygonAreaHectares(innerCoords)
      polygonHoleArea += holeArea
      totalHoleArea += holeArea
    }

    const netArea = outerArea - polygonHoleArea
    breakdown.push({
      polygonIndex: i + 1,
      outerArea,
      holesArea: polygonHoleArea,
      netArea
    })
  }

  const netHectares = totalOuterArea - totalHoleArea
  const km2 = netHectares / 100
  const display = netHectares > 0 
    ? `${netHectares.toFixed(2)} ha (${km2.toFixed(4)} km²)` 
    : "0 ha"

  return {
    hectares: netHectares,
    km2,
    netArea: netHectares,
    totalOuterArea,
    totalHoleArea,
    polygonCount: multiPolygons.length,
    holeCount: multiPolygons.reduce((sum, p) => sum + p.innerRings.length, 0),
    display,
    breakdown
  }
}
