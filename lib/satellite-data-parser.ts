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
 * Using multiple heuristics based on coordinate patterns and known coastal regions
 */
export function detectEcosystemType(coordinates: Array<[number, number]>): 'terrestrial' | 'coastal' | 'marine' {
  if (coordinates.length === 0) return 'terrestrial'

  // Get center point
  const centerLat = coordinates.reduce((sum, [lat]) => sum + lat, 0) / coordinates.length
  const centerLng = coordinates.reduce((sum, [, lng]) => sum + lng, 0) / coordinates.length

  // Get bounding box (min/max lat/lng)
  const lats = coordinates.map(([lat]) => lat)
  const lngs = coordinates.map(([, lng]) => lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)

  // Calculate spread of coordinates
  const latSpread = maxLat - minLat
  const lngSpread = maxLng - minLng

  // Check known coastal regions and archipelago areas
  const isKnownCoastalRegion = checkKnownCoastalRegion(centerLat, centerLng)
  
  // Characteristics of coastal/archipelago areas:
  // - Often have irregular, elongated polygon shapes
  // - May have large lng spread relative to lat spread (coastal lines)
  // - Tend to be in specific regions (Southeast Asia, Mediterranean, etc.)
  
  // Irregular spread pattern suggests coastal (archipelago or irregular coastline)
  const hasIrregularSpread = Math.abs(lngSpread - latSpread) > 0.5
  
  // Very small spread in one dimension can indicate coastal strip
  const isCoastalStrip = (latSpread < 0.2 && lngSpread > 0.3) || 
                         (lngSpread < 0.2 && latSpread > 0.3)

  // Known coastal regions take priority
  if (isKnownCoastalRegion) {
    return 'coastal'
  }

  // Check for archipelago-like patterns (multiple clusters)
  const isArchipelago = detectArchipelagoPattern(coordinates)
  if (isArchipelago) {
    return 'coastal'
  }

  // Check coordinate density - coastal areas often have more scattered points
  const coordinateDensity = coordinates.length / (latSpread * lngSpread || 1)
  const isScatteredPattern = coordinateDensity < 50 && coordinates.length > 10

  if ((isCoastalStrip || isIrregularSpread) && isScatteredPattern) {
    return 'coastal'
  }

  // Default to terrestrial
  return 'terrestrial'
}

/**
 * Check if coordinates fall within known coastal regions
 * This includes major mangrove, seagrass, and salt marsh areas globally
 */
function checkKnownCoastalRegion(lat: number, lng: number): boolean {
  // Major coastal and archipelago regions (approximate bounding boxes)
  const coastalRegions = [
    // Southeast Asia (Mangroves, Seagrass)
    { name: 'Southeast Asia', minLat: -10, maxLat: 20, minLng: 95, maxLng: 145 },
    
    // Amazon Delta & Atlantic Coast
    { name: 'Amazon Delta', minLat: -5, maxLat: 2, minLng: -60, maxLng: -50 },
    
    // Sundarbans & Bay of Bengal
    { name: 'Bay of Bengal', minLat: 15, maxLat: 28, minLng: 86, maxLng: 98 },
    
    // Gulf of Guinea
    { name: 'Gulf of Guinea', minLat: -2, maxLat: 10, minLng: -10, maxLng: 5 },
    
    // Mediterranean
    { name: 'Mediterranean', minLat: 30, maxLat: 46, minLng: -6, maxLng: 42 },
    
    // East Africa Coast
    { name: 'East Africa', minLat: -12, maxLat: 5, minLng: 35, maxLng: 52 },
    
    // Australia & Pacific
    { name: 'Pacific/Australia', minLat: -22, maxLat: -5, minLng: 110, maxLng: 155 },
    
    // Central America & Caribbean
    { name: 'Caribbean', minLat: 8, maxLat: 22, minLng: -90, maxLng: -60 },
    
    // West Africa
    { name: 'West Africa', minLat: 2, maxLat: 15, minLng: -20, maxLng: 0 },
  ]

  return coastalRegions.some(region => 
    lat >= region.minLat && lat <= region.maxLat &&
    lng >= region.minLng && lng <= region.maxLng
  )
}

/**
 * Detect archipelago patterns (scattered island-like coordinates)
 */
function detectArchipelagoPattern(coordinates: Array<[number, number]>): boolean {
  if (coordinates.length < 8) return false

  // Calculate distances between consecutive points
  const distances: number[] = []
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lng1] = coordinates[i]
    const [lat2, lng2] = coordinates[i + 1]
    const distance = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2)
    distances.push(distance)
  }

  // Archipelago patterns have variable distances (some large gaps between islands)
  if (distances.length === 0) return false

  const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length
  const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length
  const stdDev = Math.sqrt(variance)

  // High variance in distances indicates scattered pattern (archipelago-like)
  return stdDev > avgDistance * 0.7
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
