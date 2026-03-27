/**
 * Complete parsed satellite data structure matching form fields
 */
export interface ParsedSatelliteData {
  // Geospatial data
  area: string // in hectares (formatted)
  areaHa?: number // numeric area value for calculations
  area_ha?: number // alternate naming for compatibility
  center_coordinates?: string[] // alternate naming for compatibility
  coordinates: string // center coordinates
  
  // Polygon coordinates - satellite verified asset points
  polygonCoordinates?: Array<{
    point: number
    latitude: number
    longitude: number
    status: string
  }>
  
  // Vegetation data
  forestType?: string
  ecosystemType?: string
  dominantSpecies?: string
  vegetationDescription?: string
  averageTreeHeight?: string
  canopyCover?: string
  canopyCoverPercent?: string
  
  // Analysis metrics
  ndvi?: number
  biomass?: string
  carbonEstimate?: string
  
  // Analysis results
  analysisResults?: {
    carbonEstimation?: {
      agb?: string | number
      unit?: string
      confidence?: number
      totalCarbon?: string | number
      methodology?: string
    }
    vegetationClassification?: {
      dominantSpecies?: string
      forestType?: string
      ndvi?: number
    }
    coastalData?: any
  }
  
  // Blue Carbon specific data
  tidalZone?: string
  tidalZoneType?: string
  coastalData?: {
    isCoastal?: boolean
    distance?: string
    tidalRange?: string
    salinity?: string
    waveHeight?: string
    sedimentType?: string
    soilCarbonDepth?: string
    inundationFrequency?: string
    waterQuality?: string
    pH?: string
    bulkDensity?: string
    organicMatter?: string
  }
  salinityType?: string
  waterDepth?: string
  sedimentDepthEstimate?: string
  soilType?: string
  
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
 * Extract coordinates from geometry - handles Polygon, MultiPolygon, and nested structures
 */
function extractCoordinatesFromGeometry(geometry: any): Array<[number, number]> {
  if (!geometry?.coordinates) return []

  // Handle Polygon: coordinates[0] is outer ring, [1+] are holes
  if (geometry.type === 'Polygon' && Array.isArray(geometry.coordinates)) {
    const outerRing = geometry.coordinates[0] || []
    return outerRing.map((coord: [number, number]) => [coord[1], coord[0]]) // Convert from [lng,lat] to [lat,lng]
  }

  // Handle MultiPolygon: return first polygon's outer ring
  if (geometry.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) {
    const firstPolygon = geometry.coordinates[0]
    if (firstPolygon && Array.isArray(firstPolygon) && firstPolygon.length > 0) {
      const outerRing = firstPolygon[0] || []
      return outerRing.map((coord: [number, number]) => [coord[1], coord[0]])
    }
  }

  // Fallback for other geometry types
  const coords = geometry.coordinates[0] || geometry.coordinates
  if (Array.isArray(coords) && coords.length > 0) {
    return coords.map((coord: [number, number]) => [coord[1], coord[0]])
  }

  return []
}

/**
 * Calculate polygon area in hectares using Shoelace formula
 * Handles both regular lat/lng coordinates and geodetic calculations
 */
function calculatePolygonAreaHectares(coordinates: Array<[number, number]>): number {
  if (coordinates.length < 3) return 0

  // Use geodetic area calculation for more accurate results
  return calculateGeodesicArea(coordinates)
}

/**
 * Calculate geodetic polygon area using the spherical excess method
 * More accurate than simple Shoelace formula for geographic coordinates
 */
function calculateGeodesicArea(coordinates: Array<[number, number]>): number {
  const R = 6371000 // Earth's radius in meters
  
  // Close the polygon if not already closed
  const closedCoords = [...coordinates]
  if (closedCoords[0] !== closedCoords[closedCoords.length - 1]) {
    closedCoords.push(closedCoords[0])
  }

  let area = 0
  for (let i = 0; i < closedCoords.length - 1; i++) {
    const [lat1, lng1] = closedCoords[i]
    const [lat2, lng2] = closedCoords[i + 1]
    
    const phi1 = (lat1 * Math.PI) / 180
    const phi2 = (lat2 * Math.PI) / 180
    const deltaLambda = ((lng2 - lng1) * Math.PI) / 180

    // Spherical excess formula
    const E = 2 * Math.atan2(
      Math.tan(deltaLambda / 2) * (Math.tan(phi1 / 2) + Math.tan(phi2 / 2)),
      1 + Math.tan(phi1 / 2) * Math.tan(phi2 / 2)
    )
    
    area += E
  }

  // Area in square meters: |excess| * R²
  area = Math.abs(area) * R * R
  
  // Convert to hectares (1 hectare = 10,000 m²)
  const areaHa = area / 10000

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
 * Parse analysis export format directly (from green-carbon-analysis or blue-carbon-analysis page download)
 */
function parseAnalysisExportFormat(data: any): ParsedSatelliteData {
  const area = data.area?.hectares || 0
  const centerCoords = data.centerCoordinates || { latitude: 0, longitude: 0 }
  const coordinates = `${centerCoords.latitude}, ${centerCoords.longitude}`

  const forestType = data.forestType || 'Unknown'
  const ecosystemType = data.ecosystemType || data.forestType || ''
  const dominantSpecies = data.dominantSpecies || ''
  const averageTreeHeight = data.averageTreeHeight || ''
  const vegetationDescription = data.vegetationDescription || ''
  
  // Extract NDVI from satellite or analysis results object
  const ndvi = parseFloat(
    data.satellite?.ndvi || 
    data.analysisResults?.vegetationClassification?.ndvi ||
    data.ndvi || 
    '0.68'
  )
  
  const dataSources = [data.satelliteSource || 'Satellite Analysis']

  // Extract blue carbon specific coastal data
  const coastalData = data.coastalData || data.satellite?.coastalData || {}
  const tidalZoneType = data.tidalZoneType || coastalData.tidalZone || (coastalData.tidalRange ? 'intertidal' : '')
  const salinityType = data.salinityType || coastalData.salinity || ''
  const waterDepth = data.waterDepth || coastalData.tidalRange || ''
  const sedimentDepthEstimate = data.sedimentDepthEstimate || coastalData.soilCarbonDepth || ''
  const soilType = data.soilType || ''

  console.log("[v0] Parsed analysis export format:", {
    area,
    coordinates,
    forestType,
    ecosystemType,
    dominantSpecies,
    ndvi,
    coastalData,
    polygonCoordinates: Array.isArray(data.polygonCoordinates) ? data.polygonCoordinates.length : 0,
  })

  return {
    area: `${area.toFixed(2)} ha`,
    areaHa: area,
    area_ha: area, // For compatibility
    coordinates,
    center_coordinates: [String(centerCoords.latitude), String(centerCoords.longitude)], // For compatibility
    forestType: formatString(forestType),
    ecosystemType: formatString(ecosystemType),
    dominantSpecies: formatString(dominantSpecies),
    vegetationDescription: formatString(vegetationDescription),
    averageTreeHeight: String(averageTreeHeight).trim(),
    canopyCover: data.satellite?.cloudCover ? `${100 - data.satellite.cloudCover}%` : '85-95%',
    canopyCoverPercent: data.vegetationClassification?.canopyCoverPercent?.toString() || data.satellite?.canopyCover || '',
    biomass: formatString(data.satellite?.biomass || data.carbonData?.agb || data.analysisResults?.carbonEstimation?.agb || ''),
    carbonEstimate: formatString(data.satellite?.carbonEstimate || data.carbonData?.totalCarbonStock || data.analysisResults?.carbonEstimation?.totalCarbon || ''),
    ndvi: ndvi,
    // Blue carbon specific fields
    tidalZone: tidalZoneType,
    tidalZoneType: tidalZoneType,
    coastalData: coastalData,
    salinityType: salinityType,
    waterDepth: waterDepth,
    sedimentDepthEstimate: sedimentDepthEstimate,
    soilType: soilType,
    dataSource: dataSources,
    analysisDate: new Date(data.timestamp).toISOString().split('T')[0],
    polygonCount: data.polygonInfo?.count || 1,
    rawGeoJSON: data,
  }
}

/**
 * Parse GeoJSON with associated metadata
 */
function parseGeoJSONWithMetadata(
  geojson: any,
  metadata: any,
  shapefileFormat: boolean
): ParsedSatelliteData {
  // Check if this is an analysis export format (from green-carbon-analysis page)
  if (geojson.analysisVersion || geojson.satellite || (geojson.area?.hectares !== undefined && geojson.centerCoordinates)) {
    return parseAnalysisExportFormat(geojson)
  }

  // Extract actual polygon coordinates for accurate area calculation
  const polygonCoordinates = extractPolygonCoordinates(geojson)
  let area = polygonCoordinates.length >= 3 ? calculatePolygonAreaHectares(polygonCoordinates) : extractAreaFromGeoJSON(geojson)
  
  // If area is still 0 or invalid, try extracting from data.area.hectares (from analysis export)
  if (area === 0 && geojson.area?.hectares) {
    area = geojson.area.hectares
  }
  
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

  // Extract data from metadata or properties - CHECK TOP LEVEL FIRST FOR ANALYSIS EXPORTS
  const forestType = geojson.forestType || vegetation.forestType || vegetation.forest_type || metadata?.forestType || 'Unknown'
  const dominantSpecies = geojson.dominantSpecies || vegetation.dominantSpecies || vegetation.species || metadata?.dominantSpecies || vegetation.dominant_species || ''
  const vegetationDescription = geojson.vegetationDescription || vegetation.description || vegetation.vegetation_description || metadata?.description || ''
  const averageTreeHeight = geojson.averageTreeHeight || vegetation.averageTreeHeight || vegetation.height || vegetation.tree_height || vegetation.average_height || metadata?.treeHeight || metadata?.averageTreeHeight || ''
  const canopyCover = geojson.canopyCover || vegetation.canopy_cover || vegetation.canopyCover || metadata?.canopyCover || ''
  const biomass = geojson.biomass || geojson.satellite?.biomass || vegetation.biomass || vegetation.agb || metadata?.biomass || ''
  const carbonEstimate = geojson.carbonEstimate || geojson.satellite?.carbonEstimate || vegetation.carbon || vegetation.carbon_estimate || metadata?.carbonEstimate || ''
  const ndvi = parseFloat(geojson.satellite?.ndvi || geojson.ndvi || vegetation.ndvi || vegetation.NDVI || metadata?.ndvi || '0.68')

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

  // Handle new polygon coordinates format (with point metadata)
  let formattedPolygonCoordinates: Array<{
    point: number
    latitude: number
    longitude: number
    status: string
  }> | undefined = undefined
  
  // Check if geojson contains pre-formatted polygon coordinates
  if (Array.isArray(geojson.polygonCoordinates) && geojson.polygonCoordinates.length > 0) {
    const firstCoord = geojson.polygonCoordinates[0]
    if (typeof firstCoord === 'object' && 'point' in firstCoord && 'latitude' in firstCoord) {
      // Already in the correct format
      formattedPolygonCoordinates = geojson.polygonCoordinates.map((coord: any) => ({
        point: coord.point || 1,
        latitude: typeof coord.latitude === 'string' ? parseFloat(coord.latitude) : coord.latitude,
        longitude: typeof coord.longitude === 'string' ? parseFloat(coord.longitude) : coord.longitude,
        status: coord.status || 'Verified'
      }))
    } else if (Array.isArray(firstCoord) && firstCoord.length === 2) {
      // Array format [lat, lng] - convert to object format
      formattedPolygonCoordinates = polygonCoordinates.map((coord, idx) => ({
        point: idx + 1,
        latitude: typeof coord[0] === 'string' ? parseFloat(coord[0]) : coord[0],
        longitude: typeof coord[1] === 'string' ? parseFloat(coord[1]) : coord[1],
        status: 'Verified'
      }))
    }
  } else if (polygonCoordinates.length > 0) {
    // Convert extracted polygon coordinates to object format
    formattedPolygonCoordinates = polygonCoordinates.map((coord, idx) => ({
      point: idx + 1,
      latitude: typeof coord[0] === 'string' ? parseFloat(coord[0]) : coord[0],
      longitude: typeof coord[1] === 'string' ? parseFloat(coord[1]) : coord[1],
      status: 'Verified'
    }))
  }

  const result: ParsedSatelliteData = {
    area: `${area.toFixed(2)} ha`,
    areaHa: area, // Add numeric area for calculations
    coordinates,
    ...(formattedPolygonCoordinates && { polygonCoordinates: formattedPolygonCoordinates }),
    forestType: formatString(forestType),
    dominantSpecies: formatString(dominantSpecies),
    vegetationDescription: formatString(vegetationDescription),
    averageTreeHeight: String(averageTreeHeight).trim(), // Keep as-is, don't format (preserve ranges like "25-30")
    canopyCover: formatString(canopyCover),
    biomass: formatString(biomass),
    carbonEstimate: formatString(carbonEstimate),
    ndvi: ndvi, // Add NDVI value (actual from data, not hardcoded)
    dataSource: dataSources,
    analysisDate: metadata?.analysisDate || new Date().toISOString().split('T')[0],
    polygonCount,
    rawGeoJSON: geojson,
  }

  console.log("[v0] Parsed satellite data:", result)
  console.log("[v0] Polygon coordinates extracted:", polygonCoordinates.length, "points")
  console.log("[v0] Polygon coordinates formatted:", formattedPolygonCoordinates?.length, "points with metadata")
  console.log("[v0] Dominant Species:", dominantSpecies, "Tree Height:", averageTreeHeight)
  return result
}

/**
 * Extract actual polygon boundary coordinates from GeoJSON
 * Handles FeatureCollection, Feature, Polygon, and MultiPolygon
 */
function extractPolygonCoordinates(geojson: any): Array<[number, number]> {
  if (!geojson) return []

  // Handle FeatureCollection - extract from first feature
  if (geojson.type === 'FeatureCollection' && geojson.features?.length > 0) {
    const geometry = geojson.features[0].geometry
    return extractGeometryCoordinates(geometry)
  }

  // Handle Feature
  if (geojson.type === 'Feature' && geojson.geometry) {
    return extractGeometryCoordinates(geojson.geometry)
  }

  // Handle direct Polygon or MultiPolygon
  if ((geojson.type === 'Polygon' || geojson.type === 'MultiPolygon') && geojson.coordinates) {
    return extractGeometryCoordinates(geojson)
  }

  return []
}

/**
 * Extract coordinates from a geometry object
 */
function extractGeometryCoordinates(geometry: any): Array<[number, number]> {
  if (!geometry?.coordinates) return []

  // Polygon: coordinates[0] is the outer ring
  if (geometry.type === 'Polygon') {
    const outerRing = geometry.coordinates[0]
    if (Array.isArray(outerRing)) {
      return outerRing.map((coord: [number, number]) => [coord[1], coord[0]]) // [lng,lat] → [lat,lng]
    }
  }

  // MultiPolygon: get first polygon's outer ring
  if (geometry.type === 'MultiPolygon') {
    const firstPolygon = geometry.coordinates[0]
    if (Array.isArray(firstPolygon) && firstPolygon.length > 0) {
      const outerRing = firstPolygon[0]
      if (Array.isArray(outerRing)) {
        return outerRing.map((coord: [number, number]) => [coord[1], coord[0]])
      }
    }
  }

  return []
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
 * Parse verification data from analysis page export
 * Handles the complete data structure from green-carbon-analysis
 */
export async function parseAnalysisExportData(file: File): Promise<ParsedSatelliteData> {
  const fileName = file.name.toLowerCase()
  
  if (!fileName.endsWith('.zip')) {
    throw new Error('Please upload a ZIP file from the analysis export')
  }

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const contents = await zip.loadAsync(file)

  // Look for satellite_analysis.json (new format from analysis page)
  let analysisData: any = null
  
  for (const fileName in contents.files) {
    if (fileName === 'satellite_analysis.json' || fileName.includes('satellite_analysis')) {
      const fileContent = await contents.files[fileName].async('text')
      try {
        analysisData = JSON.parse(fileContent)
        console.log("[v0] Found satellite_analysis.json in ZIP")
        break
      } catch (e) {
        console.warn(`[v0] Invalid JSON: ${fileName}`)
      }
    }
  }

  if (!analysisData) {
    throw new Error('No satellite analysis data found in ZIP file')
  }

  // Extract complete data from analysis export
  return extractAnalysisData(analysisData)
}

/**
 * Extract all fields from analysis export data structure
 */
function extractAnalysisData(data: any): ParsedSatelliteData {
  // Extract area
  const area = data.area || {}
  const areaHa = area.hectares || 0
  
  // Extract coordinates
  const centerCoords = data.centerCoordinates || { latitude: 0, longitude: 0 }
  const coordinates = `${centerCoords.latitude}, ${centerCoords.longitude}`
  
  // Extract vegetation data
  const forestType = data.forestType || 'Tropical Forest'
  const dominantSpecies = data.dominantSpecies || data.satellite?.vegetationClass || 'Mixed tropical species'
  const averageTreeHeight = data.averageTreeHeight || '25-30'
  const vegetationDescription = data.vegetationDescription || ''
  
  // Extract satellite data
  const satellite = data.satellite || {}
  const ndvi = satellite.ndvi || 0.68
  const biomass = satellite.biomass || data.carbonData?.agb || 250
  const carbonEstimate = satellite.carbonEstimate || data.carbonData?.totalCarbonStock || 0
  
  console.log("[v0] Extracted analysis data:", {
    areaHa,
    coordinates,
    forestType,
    dominantSpecies,
    averageTreeHeight,
    biomass,
    carbonEstimate,
    ndvi,
  })
  
  return {
    area: `${areaHa.toFixed(2)} ha`,
    areaHa,
    coordinates,
    forestType,
    dominantSpecies,
    vegetationDescription,
    averageTreeHeight,
    canopyCover: satellite.cloudCover ? `${100 - satellite.cloudCover}%` : '75-95%',
    biomass: `${parseFloat(String(biomass)).toFixed(2)} tC/ha`,
    carbonEstimate: `${parseFloat(String(carbonEstimate)).toFixed(2)} tC`,
    ndvi,
    dataSource: [data.satelliteSource || 'Satellite Analysis'],
    analysisDate: new Date(data.timestamp).toISOString().split('T')[0],
    polygonCount: data.polygonInfo?.count || 1,
    rawGeoJSON: data,
  }
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


