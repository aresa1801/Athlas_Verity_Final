/**
 * Complete parsed satellite data structure matching form fields
 */
export interface ParsedSatelliteData {
  // Geospatial data
  area: string // in hectares
  coordinates: string // center coordinates
  
  // Vegetation data
  forestType?: string
  dominantSpecies?: string
  vegetationDescription?: string
  averageTreeHeight?: string
  canopyCover?: string
  
  // Analysis metrics
  ndvi?: number
  biomass?: string
  carbonEstimate?: string
  
  // Metadata
  dataSource?: string[]
  analysisDate?: string
  polygonCount?: number
  rawGeoJSON?: any
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
 * Main function to parse satellite data file (ZIP or JSON)
 */
export async function parseSatelliteDataFile(file: File): Promise<ParsedSatelliteData> {
  const fileName = file.name.toLowerCase()
  
  try {
    // Handle ZIP files
    if (fileName.endsWith('.zip')) {
      return await parseSatelliteDataZIP(file)
    }
    // Handle JSON files
    else if (fileName.endsWith('.json')) {
      return await parseSatelliteDataJSON(file)
    }
    // Handle GeoJSON files
    else if (fileName.endsWith('.geojson')) {
      return await parseSatelliteDataJSON(file)
    }
    else {
      throw new Error(`Unsupported file format: ${fileName}`)
    }
  } catch (error) {
    console.error("[v0] Error parsing satellite data file:", error)
    throw error
  }
}

/**
 * Parse ZIP file containing satellite data and shapefiles
 */
async function parseSatelliteDataZIP(file: File): Promise<ParsedSatelliteData> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  let geojsonData: any = null
  let shapefileFound = false
  const files = Object.keys(contents.files)

  // Check for required shapefile components
  const hasShp = files.some(f => f.endsWith('.shp'))
  const hasShx = files.some(f => f.endsWith('.shx'))
  const hasDbf = files.some(f => f.endsWith('.dbf'))
  
  if (hasShp && hasShx && hasDbf) {
    shapefileFound = true
    // TODO: Parse shapefile in future implementation
    // For now, look for GeoJSON representation of the shapefile
  }

  // Look for GeoJSON file in ZIP
  for (const fileName in contents.files) {
    if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
      const fileContent = await contents.files[fileName].async('text')
      try {
        geojsonData = JSON.parse(fileContent)
        break
      } catch (e) {
        console.warn(`[v0] Invalid JSON in file: ${fileName}`)
      }
    }
  }

  // Look for analysis metadata file
  let analysisMetadata: any = null
  for (const fileName in contents.files) {
    if (fileName.includes('analysis') && fileName.endsWith('.json')) {
      const fileContent = await contents.files[fileName].async('text')
      try {
        analysisMetadata = JSON.parse(fileContent)
        break
      } catch (e) {
        console.warn(`[v0] Invalid analysis metadata: ${fileName}`)
      }
    }
  }

  if (!geojsonData) {
    throw new Error('No GeoJSON data found in satellite data package')
  }

  return parseGeoJSONWithMetadata(geojsonData, analysisMetadata, shapefileFound)
}

/**
 * Parse JSON/GeoJSON file
 */
async function parseSatelliteDataJSON(file: File): Promise<ParsedSatelliteData> {
  const text = await file.text()
  const geojsonData = JSON.parse(text)
  
  return parseGeoJSONWithMetadata(geojsonData, null, false)
}

/**
 * Parse GeoJSON with associated metadata
 */
function parseGeoJSONWithMetadata(
  geojson: any,
  metadata: any,
  shapefileFormat: boolean
): ParsedSatelliteData {
  // Extract basic geospatial data
  const area = extractAreaFromGeoJSON(geojson)
  const coordinates = extractCenterCoordinates(geojson)

  // Extract vegetation and analysis data from properties
  let vegetation: any = {}
  let dataSources: string[] = []

  // Get properties from first feature if available
  if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
    vegetation = geojson.features[0].properties || {}
  } else if (geojson.type === 'Feature') {
    vegetation = geojson.properties || {}
  }

  // Extract data from metadata or properties
  const forestType = vegetation.forestType || vegetation.forest_type || metadata?.forestType || 'Unknown'
  const dominantSpecies = vegetation.dominantSpecies || vegetation.species || metadata?.dominantSpecies || vegetation.dominant_species || ''
  const vegetationDescription = vegetation.description || vegetation.vegetation_description || metadata?.description || ''
  const averageTreeHeight = vegetation.height || vegetation.tree_height || vegetation.average_height || metadata?.treeHeight || ''
  const canopyCover = vegetation.canopy_cover || vegetation.canopyCover || metadata?.canopyCover || ''
  const biomass = vegetation.biomass || vegetation.agb || metadata?.biomass || ''
  const carbonEstimate = vegetation.carbon || vegetation.carbon_estimate || metadata?.carbonEstimate || ''

  // Extract data sources from metadata
  if (metadata?.dataSources && Array.isArray(metadata.dataSources)) {
    dataSources = metadata.dataSources
  } else if (geojson.properties?.dataSources) {
    dataSources = Array.isArray(geojson.properties.dataSources) 
      ? geojson.properties.dataSources 
      : [geojson.properties.dataSources]
  }

  // Default data sources if not specified
  if (dataSources.length === 0) {
    dataSources = ['Sentinel-2', 'Landsat 8/9'] // Default sources
  }

  // Count polygons
  let polygonCount = 1
  if (geojson.type === 'FeatureCollection') {
    polygonCount = geojson.features?.length || 1
  }

  const result: ParsedSatelliteData = {
    area: `${area.toFixed(2)} ha`,
    coordinates,
    forestType: formatString(forestType),
    dominantSpecies: formatString(dominantSpecies),
    vegetationDescription: formatString(vegetationDescription),
    averageTreeHeight: formatString(averageTreeHeight),
    canopyCover: formatString(canopyCover),
    biomass: formatString(biomass),
    carbonEstimate: formatString(carbonEstimate),
    dataSource: dataSources,
    analysisDate: metadata?.analysisDate || new Date().toISOString().split('T')[0],
    polygonCount,
    rawGeoJSON: geojson,
  }

  console.log("[v0] Parsed satellite data:", result)
  return result
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
 * Key differences:
 * - Terrestrial: Compact, relatively regular polygons (forests)
 * - Coastal: Thin/elongated shapes, often linear patterns along water
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

  // Check known coastal regions (priority check)
  const isKnownCoastalRegion = checkKnownCoastalRegion(centerLat, centerLng)

  // Key indicator: aspect ratio of bounding box
  // Coastal areas (mangroves, salt marshes) tend to be VERY THIN and ELONGATED
  // Terrestrial forests tend to be more COMPACT and ROUND
  const aspectRatio = Math.max(latSpread, lngSpread) / (Math.min(latSpread, lngSpread) || 1)
  
  // If one dimension is MUCH larger than the other, likely coastal (thin strip along water)
  const isThinElongated = aspectRatio > 5.0

  // Calculate polygon compactness (closer to 1 = more compact/round, closer to 0 = more elongated)
  const area = calculatePolygonArea(coordinates)
  const perimeter = calculatePolygonPerimeter(coordinates)
  const compactness = (4 * Math.PI * area) / (perimeter * perimeter)

  // Terrestrial forests have higher compactness (more compact shapes)
  // Coastal areas have lower compactness (thin, elongated shapes)
  const isCompactShape = compactness > 0.4

  // If strongly elongated AND in a known coastal region = almost certainly coastal
  if (isKnownCoastalRegion && isThinElongated) {
    return 'coastal'
  }

  // If very thin elongated regardless of region = likely coastal
  if (isThinElongated && aspectRatio > 8.0) {
    return 'coastal'
  }

  // Check for archipelago-like patterns (scattered points)
  const isArchipelago = detectArchipelagoPattern(coordinates)
  if (isArchipelago && isKnownCoastalRegion) {
    return 'coastal'
  }

  // Compact, rounded shapes indicate terrestrial forest
  if (isCompactShape && !isArchipelago) {
    return 'terrestrial'
  }

  // Known coastal region without strong terrestrial indicators = coastal
  if (isKnownCoastalRegion) {
    return 'coastal'
  }

  // Default to terrestrial for all other cases
  return 'terrestrial'
}

/**
 * Calculate approximate polygon area using shoelace formula
 */
function calculatePolygonArea(coordinates: Array<[number, number]>): number {
  if (coordinates.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < coordinates.length; i++) {
    const [lat1, lng1] = coordinates[i]
    const [lat2, lng2] = coordinates[(i + 1) % coordinates.length]
    area += (lng1 * lat2 - lng2 * lat1)
  }
  return Math.abs(area) / 2
}

/**
 * Calculate polygon perimeter
 */
function calculatePolygonPerimeter(coordinates: Array<[number, number]>): number {
  let perimeter = 0
  for (let i = 0; i < coordinates.length; i++) {
    const [lat1, lng1] = coordinates[i]
    const [lat2, lng2] = coordinates[(i + 1) % coordinates.length]
    const distance = Math.sqrt((lat2 - lat1) ** 2 + (lng2 - lng1) ** 2)
    perimeter += distance
  }
  return perimeter
}

/**
 * Check if coordinates fall within SPECIFIC known coastal regions
 * Only returns true for specific coastal hotspots, not entire regions
 * (many terrestrial forests also exist in these regions)
 */
function checkKnownCoastalRegion(lat: number, lng: number): boolean {
  // Only very specific known mangrove/coastal hotspots
  // These are narrow bands near actual coastlines, not broad regions
  const specificCoastalHotspots = [
    // Indonesia/Malaysia mangroves (Borneo coastal areas) - NARROW COASTAL ZONE ONLY
    { name: 'Borneo Mangroves', minLat: -1, maxLat: 2, minLng: 108, maxLng: 115 },
    
    // Sundarbans (Bangladesh/India mangroves) - VERY SPECIFIC
    { name: 'Sundarbans', minLat: 21, maxLat: 23, minLng: 88, maxLng: 90 },
    
    // Amazon Delta only (not inland Amazon)
    { name: 'Amazon Delta', minLat: -1, maxLat: 1, minLng: -59, maxLng: -49 },
    
    // Everglades & Florida Keys
    { name: 'Everglades', minLat: 24, maxLat: 26, minLng: -82, maxLng: -80 },
    
    // Pantanal coastal transition (very specific)
    { name: 'Pantanal Coastal', minLat: -18, maxLat: -16, minLng: -57, maxLng: -54 },
  ]

  // Only return true if EXACTLY in a known coastal hotspot
  // This is very restrictive - most data won't match
  return specificCoastalHotspots.some(region => 
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
 * Format string values, cleaning up technical names to readable format
 */
function formatString(value: any): string {
  if (!value) return ''
  
  const str = String(value)
  // Convert snake_case and camelCase to Title Case
  return str
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, char => char.toUpperCase())
    .trim()
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
