/**
 * Polygon Location Detector
 * Determines if a polygon is in terrestrial (land), coastal, or marine areas
 * Uses simple heuristic approach based on geographic coordinates and ocean/land boundaries
 */

export type PolygonLocation = 'terrestrial' | 'coastal' | 'marine' | 'unknown'

interface LocationDetectionResult {
  location: PolygonLocation
  confidence: number // 0-1 confidence score
  warning?: string
  suggestion?: string
}

/**
 * Detect polygon location type based on coordinates
 * Uses simple ocean/land boundary detection
 */
export function detectPolygonLocation(coordinates: Array<[number, number]>): LocationDetectionResult {
  if (!coordinates || coordinates.length < 3) {
    return {
      location: 'unknown',
      confidence: 0,
      warning: 'Invalid polygon coordinates'
    }
  }

  // Calculate center point of polygon
  const centerLat = coordinates.reduce((sum, [lat]) => sum + lat, 0) / coordinates.length
  const centerLng = coordinates.reduce((sum, [, lng]) => sum + lng, 0) / coordinates.length

  // Approximate ocean/land classification
  // This is a simplified approach - in production, would use real ocean/land datasets
  const isInOcean = checkIfInOcean(centerLat, centerLng)
  const isCoastal = checkIfCoastal(coordinates)
  const oceanPolygonPercentage = calculateOceanCoverage(coordinates)

  let location: PolygonLocation = 'terrestrial'
  let confidence = 0.85
  let warning: string | undefined
  let suggestion: string | undefined

  if (oceanPolygonPercentage > 0.7) {
    // More than 70% in ocean
    location = 'marine'
    confidence = 0.9
    warning = 'This polygon is primarily in marine/ocean areas. Consider using Blue Carbon verification instead.'
    suggestion = 'Switch to Blue Carbon verification for mangrove, seagrass, or salt marsh ecosystems.'
  } else if (oceanPolygonPercentage > 0.3 || isCoastal) {
    // Between 30-70% ocean or detected as coastal
    location = 'coastal'
    confidence = 0.8
    warning = 'This polygon is in a coastal area with significant water coverage.'
    suggestion = 'This may be better suited for Blue Carbon verification if it contains mangroves or seagrass.'
  } else if (oceanPolygonPercentage > 0) {
    // Some ocean coverage but mostly land
    location = 'terrestrial'
    confidence = 0.75
    warning = 'This polygon partially extends into coastal/marine areas.'
    suggestion = 'Ensure the polygon boundaries are correctly placed if aiming for Green Carbon verification.'
  } else {
    // Completely terrestrial
    location = 'terrestrial'
    confidence = 0.95
  }

  return {
    location,
    confidence,
    warning,
    suggestion
  }
}

/**
 * Simplified ocean detection based on latitude/longitude
 * Real implementation would use ocean/land raster data
 */
function checkIfInOcean(lat: number, lng: number): boolean {
  // This is a very simplified check
  // Major ocean regions (simplified boundaries)
  const oceanRegions = [
    // Pacific Ocean
    { name: 'Pacific', minLat: -60, maxLat: 85, minLng: 100, maxLng: 180 },
    { name: 'Pacific', minLat: -60, maxLat: 85, minLng: -180, maxLng: -70 },
    // Atlantic Ocean
    { name: 'Atlantic', minLat: -60, maxLat: 85, minLng: -100, maxLng: 0 },
    // Indian Ocean
    { name: 'Indian', minLat: -60, maxLat: 30, minLng: 20, maxLng: 100 },
    // Arctic
    { name: 'Arctic', minLat: 70, maxLat: 90, minLng: -180, maxLng: 180 },
  ]

  // Check proximity to known land masses and exclude from ocean
  const landMasses = [
    // Indonesia (archipelago)
    { name: 'Indonesia', minLat: -12, maxLat: 8, minLng: 92, maxLng: 145 },
    // Malaysia
    { name: 'Malaysia', minLat: 0, maxLat: 8, minLng: 100, maxLng: 120 },
    // Southeast Asia coast
    { name: 'SE Asia', minLat: 0, maxLat: 25, minLng: 95, maxLng: 140 },
    // Coastal Africa
    { name: 'Africa Coast', minLat: -35, maxLat: 37, minLng: 0, maxLng: 55 },
    // Australia
    { name: 'Australia', minLat: -47, maxLat: -10, minLng: 112, maxLng: 155 },
  ]

  // Check if in known land mass
  const inLand = landMasses.some(
    region => lat >= region.minLat && lat <= region.maxLat && lng >= region.minLng && lng <= region.maxLng
  )

  if (inLand) return false

  // Very basic ocean detection - mostly works for equatorial regions
  return (lat >= -60 && lat <= 85) && (
    (lng > 100 && lng < 180) ||
    (lng < -70 && lng > -180) ||
    (lng > -100 && lng < 0) ||
    (lng > 20 && lng < 100)
  )
}

/**
 * Check if polygon is near coast (within ~50km buffer of land-sea boundary)
 */
function checkIfCoastal(coordinates: Array<[number, number]>): boolean {
  if (coordinates.length < 3) return false

  // Simple heuristic: check if coordinates span significant latitude/longitude range
  const lats = coordinates.map(c => c[0])
  const lngs = coordinates.map(c => c[1])
  const latRange = Math.max(...lats) - Math.min(...lats)
  const lngRange = Math.max(...lngs) - Math.min(...lngs)

  // Coastal areas often have irregular boundaries and specific coordinate patterns
  // If polygon has mixed lat/lng variation, likely coastal
  return (latRange > 0.01 && lngRange > 0.01) && (latRange < 2 || lngRange < 2)
}

/**
 * Estimate percentage of polygon area in ocean
 * Uses simple grid-based sampling
 */
function calculateOceanCoverage(coordinates: Array<[number, number]>): number {
  if (coordinates.length < 3) return 0

  const lats = coordinates.map(c => c[0])
  const lngs = coordinates.map(c => c[1])
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  // Sample points in grid
  const gridSize = 5
  let oceanPoints = 0
  let totalPoints = 0

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const lat = minLat + (maxLat - minLat) * (i / gridSize)
      const lng = minLng + (maxLng - minLng) * (j / gridSize)

      if (isPointInPolygon([lat, lng], coordinates)) {
        totalPoints++
        if (checkIfInOcean(lat, lng)) {
          oceanPoints++
        }
      }
    }
  }

  return totalPoints > 0 ? oceanPoints / totalPoints : 0
}

/**
 * Point-in-polygon test using ray casting algorithm
 */
function isPointInPolygon(point: [number, number], polygon: Array<[number, number]>): boolean {
  const [x, y] = point
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]
    const [xj, yj] = polygon[j]

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }

  return inside
}

/**
 * Get recommended verification type based on polygon location
 */
export function getRecommendedVerificationType(
  location: PolygonLocation
): 'green-carbon' | 'blue-carbon' {
  switch (location) {
    case 'marine':
    case 'coastal':
      return 'blue-carbon'
    case 'terrestrial':
    default:
      return 'green-carbon'
  }
}
