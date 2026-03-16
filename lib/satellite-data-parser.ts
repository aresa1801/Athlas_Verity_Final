/**
 * Parse satellite data from GeoJSON and extract geospatial information
 */
export interface ParsedSatelliteData {
  area: string // in hectares
  coordinates: string // center coordinates or bounding box
  forestType?: string
  dominantSpecies?: string
  ndvi?: number
}

/**
 * Extract area from GeoJSON geometry
 */
export function extractAreaFromGeoJSON(geojson: any): number {
  if (!geojson) return 0

  let coordinates: Array<[number, number]> = []

  // Handle FeatureCollection
  if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
    const geometry = geojson.features[0].geometry
    coordinates = extractCoordinatesFromGeometry(geometry)
  }
  // Handle Feature
  else if (geojson.type === 'Feature') {
    coordinates = extractCoordinatesFromGeometry(geojson.geometry)
  }
  // Handle direct geometry
  else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    coordinates = extractCoordinatesFromGeometry(geojson)
  }

  // Calculate area using Shoelace formula (approximation for small areas)
  if (coordinates.length < 3) return 0
  return calculatePolygonAreaHectares(coordinates)
}

/**
 * Extract coordinates from geometry
 */
function extractCoordinatesFromGeometry(geometry: any): Array<[number, number]> {
  if (!geometry?.coordinates) return []

  const coords = geometry.coordinates[0] || geometry.coordinates
  return coords.map((coord: [number, number]) => [coord[1], coord[0]]) // Convert from [lng,lat] to [lat,lng]
}

/**
 * Calculate polygon area in hectares using Shoelace formula
 */
function calculatePolygonAreaHectares(coordinates: Array<[number, number]>): number {
  if (coordinates.length < 3) return 0

  // Convert lat/lng to approximate meters (rough approximation)
  let area = 0
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lng1] = coordinates[i]
    const [lat2, lng2] = coordinates[i + 1]
    
    // Simplified Shoelace formula
    area += (lng1 * lat2 - lng2 * lat1)
  }

  area = Math.abs(area) / 2

  // Convert to hectares (rough approximation at equator: 1 degree ≈ 111km)
  const metersPerDegree = 111000
  const areaM2 = area * metersPerDegree * metersPerDegree
  const areaHa = areaM2 / 10000

  return Math.round(areaHa * 100) / 100
}

/**
 * Extract center coordinates from GeoJSON
 */
export function extractCenterCoordinates(geojson: any): string {
  if (!geojson) return "N/A"

  let allCoords: Array<[number, number]> = []

  // Handle FeatureCollection
  if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
    const geometry = geojson.features[0].geometry
    allCoords = extractCoordinatesFromGeometry(geometry)
  }
  // Handle Feature
  else if (geojson.type === 'Feature') {
    allCoords = extractCoordinatesFromGeometry(geojson.geometry)
  }
  // Handle direct geometry
  else if (geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') {
    allCoords = extractCoordinatesFromGeometry(geojson)
  }

  if (allCoords.length === 0) return "N/A"

  // Calculate center (average of all points)
  const avgLat = allCoords.reduce((sum, [lat]) => sum + lat, 0) / allCoords.length
  const avgLng = allCoords.reduce((sum, [, lng]) => sum + lng, 0) / allCoords.length

  return `${avgLat.toFixed(6)}, ${avgLng.toFixed(6)}`
}

/**
 * Detect if coordinates are in terrestrial or coastal/marine area
 */
export function detectEcosystemType(coordinates: Array<[number, number]>): 'terrestrial' | 'coastal' | 'marine' {
  if (coordinates.length === 0) return 'terrestrial'

  // Get center point
  const centerLat = coordinates.reduce((sum, [lat]) => sum + lat, 0) / coordinates.length
  const centerLng = coordinates.reduce((sum, [, lng]) => sum + lng, 0) / coordinates.length

  // Simple heuristic: check if near coastal areas (simplified)
  // In production, would use actual coastal database/API
  
  // Check if location is near known coastal regions (latitude-based rough check)
  const nearEquator = Math.abs(centerLat) < 30
  const nearPoles = Math.abs(centerLat) > 60

  // Rough coastal detection (this is simplified - in production use actual data)
  const likelyCoastal = nearEquator || nearPoles

  // For now, return based on simple heuristics
  // In production: use NASA SEDAC coastal zone data or similar
  if (likelyCoastal) return 'coastal'
  
  return 'terrestrial'
}

/**
 * Parse satellite data file and extract information
 */
export async function parseSatelliteDataFile(file: File): Promise<ParsedSatelliteData> {
  try {
    const text = await file.text()
    const geojson = JSON.parse(text)

    const area = extractAreaFromGeoJSON(geojson)
    const coordinates = extractCenterCoordinates(geojson)

    return {
      area: area > 0 ? `${area} ha` : "Unable to calculate",
      coordinates: coordinates,
      forestType: "Detected from satellite data",
    }
  } catch (error) {
    console.error("[v0] Error parsing satellite data:", error)
    return {
      area: "Error parsing",
      coordinates: "Error parsing",
    }
  }
}
