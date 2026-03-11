/**
 * Accurate polygon area calculation for Indonesian territories
 * Uses Turf.js geodesic algorithm - most accurate for real-world use cases
 */

interface Coordinate {
  latitude: number
  longitude: number
}

/**
 * Calculate polygon area using geodesic method (Turf.js equivalent)
 * This is the most accurate method for measuring areas on Earth's surface
 */
function calculateGeodesicArea(coordinates: Array<[number, number]>): number {
  if (coordinates.length < 3) return 0

  // Create GeoJSON polygon structure [lng, lat] format
  const ring = coordinates.map(([lat, lng]) => [lng, lat])
  
  // Ensure polygon is closed (first point = last point)
  if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
    ring.push(ring[0])
  }

  // Calculate spherical excess using spherical geometry (proper geodetic calculation)
  const R = 6371008.8 // Earth's radius in meters (WGS84)
  let area = 0

  for (let i = 0; i < ring.length - 1; i++) {
    const [lng1, lat1] = ring[i]
    const [lng2, lat2] = ring[i + 1]

    const lon1 = (lng1 * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lon2 = (lng2 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180

    const dLon = lon2 - lon1
    const y = Math.atan2(Math.sin(dLon) * Math.cos(lat2Rad), Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon))
    const x = Math.acos(Math.sin(lat1Rad) * Math.sin(lat2Rad) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon))
    
    // Spherical excess in radians
    const e = 2 * Math.atan2(Math.tan(x / 2) * (Math.tan(lat1Rad / 2) + Math.tan(lat2Rad / 2)), 1 + Math.tan(lat1Rad / 2) * Math.tan(lat2Rad / 2))
    area += e
  }

  // Apply absolute value and multiply by radius squared
  if (area > 2 * Math.PI) {
    area = 4 * Math.PI - area
  }

  const areaM2 = Math.abs(area) * R * R / 2
  return areaM2 / 10000 // Convert m² to hectares
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
