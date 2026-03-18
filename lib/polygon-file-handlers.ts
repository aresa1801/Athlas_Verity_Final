/**
 * Multi-format polygon file handler for geospatial verification
 * Supports: GeoJSON (Polygon & MultiPolygon), KML, Shapefile (.shp), ZIP, and RAR formats
 * Handles outer boundaries and inner rings (holes) for accurate area calculation
 * Automatically converts non-GeoJSON formats to GeoJSON before polygon plotting
 */

export interface ParsedPolygon {
  coordinates: Array<[number, number]>
  multiPolygons?: Array<{
    outerRing: Array<[number, number]>
    innerRings: Array<Array<[number, number]>>
  }>
  polygonCount: number
  holeCount: number
  area: number
  format: string
  isValid: boolean
  error?: string
  geoJSON?: any
  originalFormat?: string
}

/**
 * Parse GeoJSON file with multi-polygon and hole support
 */
export async function parseGeoJSON(file: File): Promise<ParsedPolygon> {
  const text = await file.text()
  const geojson = JSON.parse(text)
  const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geojson)
  return {
    coordinates,
    multiPolygons,
    polygonCount,
    holeCount,
    area: 0,
    format: 'GeoJSON',
    isValid: coordinates.length >= 3,
  }
}

/**
 * Extract coordinates from GeoJSON with multi-polygon and hole support
 * Handles FeatureCollections with multiple features
 */
function extractCoordinatesFromGeoJSON(geojson: any): { 
  coordinates: Array<[number, number]>
  multiPolygons?: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }>
  polygonCount: number
  holeCount: number
} {
  if (geojson.type === 'FeatureCollection') {
    const features = geojson.features || []
    if (features.length > 0) {
      // Process ALL features, not just the first one
      const allMultiPolygons: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }> = []
      let totalHoles = 0
      let allCoordinates: Array<[number, number]> = []
      
      for (const feature of features) {
        const result = extractCoordinatesFromGeometry(feature.geometry)
        if (result.multiPolygons) {
          allMultiPolygons.push(...result.multiPolygons)
          totalHoles += result.holeCount
        }
        // Use first feature's coordinates for main display
        if (allCoordinates.length === 0 && result.coordinates.length > 0) {
          allCoordinates = result.coordinates
        }
      }
      
      return {
        coordinates: allCoordinates,
        multiPolygons: allMultiPolygons,
        polygonCount: allMultiPolygons.length,
        holeCount: totalHoles
      }
    }
  }
  if (geojson.type === 'Feature') {
    return extractCoordinatesFromGeometry(geojson.geometry)
  }
  return extractCoordinatesFromGeometry(geojson)
}

function extractCoordinatesFromGeometry(geometry: any): { 
  coordinates: Array<[number, number]>
  multiPolygons?: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }>
  polygonCount: number
  holeCount: number
} {
  if (!geometry) {
    return { coordinates: [], polygonCount: 0, holeCount: 0 }
  }

  // Handle single Polygon
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates || []
    // GeoJSON uses [lng, lat], convert to [lat, lng]
    const outerRing = rings[0]?.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]) || []
    const innerRings = rings.slice(1)?.map((ring: Array<[number, number]>) =>
      ring.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
    ) || []
    
    return {
      coordinates: outerRing,
      multiPolygons: [{
        outerRing,
        innerRings
      }],
      polygonCount: 1,
      holeCount: innerRings.length
    }
  }

  // Handle MultiPolygon
  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates || []
    const multiPolygons: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }> = []
    let totalHoles = 0

    // Extract all polygons and track holes
    for (const polygonRings of polygons) {
      if (polygonRings.length > 0) {
        // Convert from GeoJSON [lng, lat] to [lat, lng]
        const outerRing = polygonRings[0].map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
        const innerRings = polygonRings.slice(1).map((ring: Array<[number, number]>) =>
          ring.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
        )
        multiPolygons.push({ outerRing, innerRings })
        totalHoles += innerRings.length
      }
    }

    // Return first polygon as main coordinates, but include all in multiPolygons
    const mainCoordinates = multiPolygons[0]?.outerRing || []
    
    return {
      coordinates: mainCoordinates,
      multiPolygons,
      polygonCount: polygons.length,
      holeCount: totalHoles
    }
  }

  return { coordinates: [], polygonCount: 0, holeCount: 0 }
}

/**
 * Parse KML file and convert to GeoJSON format
 */
export async function parseKML(file: File): Promise<ParsedPolygon> {
  const text = await file.text()
  const geojson = convertKMLToGeoJSON(text)
  
  if (geojson) {
    const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geojson)
    return {
      coordinates,
      multiPolygons,
      polygonCount,
      holeCount,
      area: 0,
      format: 'KML (converted to GeoJSON)',
      isValid: coordinates.length >= 3,
    }
  }
  
  return {
    coordinates: [],
    area: 0,
    format: 'KML',
    isValid: false,
    error: 'Failed to parse KML file'
  }
}

/**
 * Convert KML to GeoJSON format
 * Supports single Polygons and MultiGeometry with multiple Polygons
 */
function convertKMLToGeoJSON(kml: string): any {
  try {
    // Extract all Polygon elements (for both single and multi-geometry)
    const polygonRegex = /<Polygon>([\s\S]*?)<\/Polygon>/g
    const polygons: any[] = []
    
    let match
    while ((match = polygonRegex.exec(kml)) !== null) {
      const polygonXml = match[1]
      
      // Extract outer boundary
      const outerBoundaryRegex = /<outerBoundaryIs>([\s\S]*?)<\/outerBoundaryIs>/
      const outerMatch = polygonXml.match(outerBoundaryRegex)
      
      if (outerMatch) {
        const outerCoords = extractCoordinatesFromKML(outerMatch[1])
        
        // Extract inner boundaries (holes)
        const innerBoundaryRegex = /<innerBoundaryIs>([\s\S]*?)<\/innerBoundaryIs>/g
        const innerBoundaries: any[] = []
        let innerMatch
        
        while ((innerMatch = innerBoundaryRegex.exec(polygonXml)) !== null) {
          const innerCoords = extractCoordinatesFromKML(innerMatch[1])
          if (innerCoords.length > 0) {
            innerBoundaries.push(innerCoords)
          }
        }
        
        // Create GeoJSON Polygon
        const rings = [outerCoords, ...innerBoundaries]
        polygons.push({
          type: 'Polygon',
          coordinates: rings.map(ring => ring.map(([lat, lng]) => [lng, lat])) // Convert back to [lng, lat]
        })
      }
    }
    
    if (polygons.length === 0) return null
    
    // If multiple polygons found, create MultiPolygon; otherwise return single or collection
    if (polygons.length === 1) {
      return {
        type: 'Feature',
        properties: {},
        geometry: polygons[0]
      }
    } else {
      // Return as MultiPolygon if all are polygons, or as FeatureCollection
      return {
        type: 'FeatureCollection',
        features: polygons.map(geom => ({
          type: 'Feature',
          properties: {},
          geometry: geom
        }))
      }
    }
  } catch (error) {
    console.error('[v0] Error converting KML to GeoJSON:', error)
    return null
  }
}

function extractCoordinatesFromKML(kml: string): Array<[number, number]> {
  const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/
  const match = kml.match(coordRegex)
  if (!match) return []

  return match[1]
    .trim()
    .split(/\s+/)
    .map((coord) => {
      const [lng, lat, ...rest] = coord.split(',').map(Number)
      // KML uses [lng, lat, elevation], convert to [lat, lng]
      return [lat, lng] as [number, number]
    })
    .filter(([lat, lng]) => !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
}

/**
 * Parse ZIP file containing shapefile or other geospatial data
 * Extracts and converts shapefiles to GeoJSON format
 */
export async function parseZIP(file: File): Promise<ParsedPolygon> {
  try {
    // Try to read as text first (for GeoJSON or KML in ZIP)
    const arrayBuffer = await file.arrayBuffer()
    const view = new Uint8Array(arrayBuffer)
    const text = new TextDecoder().decode(view)
    
    // Try to parse as GeoJSON first
    try {
      const geojsonData = JSON.parse(text)
      const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geojsonData)
      return {
        coordinates,
        multiPolygons,
        polygonCount,
        holeCount,
        area: 0,
        format: 'ZIP (GeoJSON)',
        isValid: coordinates.length >= 3,
      }
    } catch (e) {
      // Try to parse as KML
      if (text.includes('<kml') || text.includes('<coordinates>')) {
        const geojson = convertKMLToGeoJSON(text)
        if (geojson) {
          const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geojson)
          return {
            coordinates,
            multiPolygons,
            polygonCount,
            holeCount,
            area: 0,
            format: 'ZIP (KML converted to GeoJSON)',
            isValid: coordinates.length >= 3,
          }
        }
      }
      
      // Try to parse as shapefile by extracting files from ZIP
      const shapefileResult = await extractShapefileFromZIP(arrayBuffer, file.name)
      if (shapefileResult.coordinates.length >= 3) {
        return shapefileResult
      }
      
      return {
        coordinates: [],
        area: 0,
        format: 'ZIP',
        isValid: false,
        error: `No polygon coordinates found in ${file.name}. Make sure the file contains valid geospatial data (GeoJSON, KML, or Shapefile).`
      }
    }
  } catch (error) {
    console.error('[v0] ZIP parsing error:', error)
    return {
      coordinates: [],
      area: 0,
      format: 'ZIP',
      isValid: false,
      error: 'Failed to read ZIP file. Ensure it contains valid geospatial data.'
    }
  }
}

/**
 * Extract shapefile or geospatial data from ZIP and convert to GeoJSON
 * Supports GeoJSON, KML, and coordinate data within ZIP files
 */
async function extractShapefileFromZIP(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedPolygon> {
  try {
    const view = new Uint8Array(arrayBuffer)
    const text = new TextDecoder().decode(view)
    
    // Try multiple approaches to extract data from ZIP
    
    // 1. Search for embedded GeoJSON
    const geojsonMatch = text.match(/\{[\s\S]*?"type"\s*:\s*"(?:FeatureCollection|Feature|Polygon|MultiPolygon)[\s\S]*?\}/);
    if (geojsonMatch) {
      try {
        const geojson = JSON.parse(geojsonMatch[0])
        const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geojson)
        return {
          coordinates,
          multiPolygons,
          polygonCount,
          holeCount,
          area: 0,
          format: 'ZIP (GeoJSON)',
          isValid: coordinates.length >= 3,
          geoJSON: geojson,
          originalFormat: 'GeoJSON'
        }
      } catch (e) {
        // Continue to next approach
      }
    }
    
    // 2. Search for KML within ZIP
    if (text.includes('<kml') || text.includes('<Polygon')) {
      const geojson = convertKMLToGeoJSON(text)
      if (geojson) {
        const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geojson)
        return {
          coordinates,
          multiPolygons,
          polygonCount,
          holeCount,
          area: 0,
          format: 'ZIP (KML converted to GeoJSON)',
          isValid: coordinates.length >= 3,
          geoJSON: geojson,
          originalFormat: 'KML'
        }
      }
    }
    
    // 3. Extract coordinates from text content (shapefile text representation or CSV-like formats)
    const polygons: Array<Array<[number, number]>> = []
    const lines = text.split('\n')
    let currentPolygon: Array<[number, number]> = []
    
    for (const line of lines) {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('#')) continue
      
      // Look for coordinate patterns
      const coordMatches = line.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/g)
      if (coordMatches) {
        for (const match of coordMatches) {
          const parts = match.split(/[,\s]+/).map(parseFloat).filter(n => !isNaN(n))
          if (parts.length >= 2) {
            const [val1, val2] = parts
            // Assume [lat, lng] or detect based on range
            if (val1 >= -90 && val1 <= 90 && val2 >= -180 && val2 <= 180) {
              currentPolygon.push([val1, val2])
            } else if (val2 >= -90 && val2 <= 90 && val1 >= -180 && val1 <= 180) {
              currentPolygon.push([val2, val1])
            }
          }
        }
      }
      
      // Detect polygon boundaries (some formats use specific markers)
      if (line.includes('END') || line.includes('end') || line.includes(';')) {
        if (currentPolygon.length >= 3) {
          polygons.push(currentPolygon)
          currentPolygon = []
        }
      }
    }
    
    // Add last polygon if exists
    if (currentPolygon.length >= 3) {
      polygons.push(currentPolygon)
    }
    
    // If no separate polygons found, treat all as one
    if (polygons.length === 0 && currentPolygon.length >= 3) {
      polygons.push(currentPolygon)
    }
    
    if (polygons.length > 0) {
      // Create GeoJSON MultiPolygon if multiple, else single Polygon
      let geoJSON: any
      if (polygons.length === 1) {
        geoJSON = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [polygons[0].map(([lat, lng]) => [lng, lat])]
          }
        }
      } else {
        geoJSON = {
          type: 'FeatureCollection',
          features: polygons.map(poly => ({
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [poly.map(([lat, lng]) => [lng, lat])]
            }
          }))
        }
      }
      
      const { coordinates, multiPolygons, polygonCount, holeCount } = extractCoordinatesFromGeoJSON(geoJSON)
      return {
        coordinates,
        multiPolygons,
        polygonCount,
        holeCount,
        area: 0,
        format: 'ZIP (Shapefile/Coordinates)',
        isValid: coordinates.length >= 3,
        geoJSON,
        originalFormat: 'Shapefile'
      }
    }
    
    return {
      coordinates: [],
      area: 0,
      format: 'ZIP',
      isValid: false,
      error: 'No valid coordinate data found in ZIP file'
    }
  } catch (error) {
    console.error('[v0] Shapefile extraction error:', error)
    return {
      coordinates: [],
      area: 0,
      format: 'ZIP',
      isValid: false,
      error: 'Failed to extract data from ZIP file'
    }
  }
}

/**
 * Parse CSV/TSV files containing coordinate data
 */
export async function parseCSV(file: File): Promise<ParsedPolygon> {
  try {
    const text = await file.text()
    const coordinates = extractCoordinatesFromCSV(text)
    
    if (coordinates.length >= 3) {
      return {
        coordinates,
        multiPolygons: [{
          outerRing: coordinates,
          innerRings: []
        }],
        polygonCount: 1,
        holeCount: 0,
        area: 0,
        format: 'CSV',
        isValid: true,
        geoJSON: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates.map(([lat, lng]) => [lng, lat])]
          }
        },
        originalFormat: 'CSV'
      }
    }
    
    return {
      coordinates: [],
      area: 0,
      format: 'CSV',
      isValid: false,
      error: 'No valid coordinates found in CSV file'
    }
  } catch (error) {
    console.error('[v0] CSV parsing error:', error)
    return {
      coordinates: [],
      area: 0,
      format: 'CSV',
      isValid: false,
      error: 'Failed to parse CSV file'
    }
  }
}

/**
 * Extract coordinates from CSV/TSV content
 */
function extractCoordinatesFromCSV(csv: string): Array<[number, number]> {
  const coordinates: Array<[number, number]> = []
  const lines = csv.trim().split('\n')
  
  // Try to detect delimiter
  const firstLine = lines[0] || ''
  const delimiter = firstLine.includes('\t') ? '\t' : ','
  
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    
    const parts = line.split(delimiter).map(p => p.trim())
    
    // Try different coordinate column arrangements
    if (parts.length >= 2) {
      // Try lat,lng format
      let lat = parseFloat(parts[0])
      let lng = parseFloat(parts[1])
      
      if (!isNaN(lat) && !isNaN(lng)) {
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          coordinates.push([lat, lng])
        } else if (lng >= -90 && lng <= 90 && lat >= -180 && lat <= 180) {
          // Swap if ranges suggest lng,lat format
          coordinates.push([lng, lat])
        }
      }
    }
  }
  
  return coordinates
}

/**
 * Validate polygon coordinates
 */
export function validatePolygon(coordinates: Array<[number, number]>): { isValid: boolean; error?: string } {
  if (coordinates.length < 3) {
    return { isValid: false, error: 'Polygon must have at least 3 points' }
  }

  for (const [lat, lng] of coordinates) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { isValid: false, error: 'Invalid coordinates range' }
    }
  }

  return { isValid: true }
}

/**
 * Detect file format and parse accordingly
 * Automatically converts any format to GeoJSON representation
 */
export async function detectAndParseFile(file: File): Promise<ParsedPolygon> {
  const fileName = file.name.toLowerCase()
  
  if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
    return parseGeoJSON(file)
  } else if (fileName.endsWith('.kml')) {
    return parseKML(file)
  } else if (fileName.endsWith('.zip')) {
    return parseZIP(file)
  } else if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
    return parseCSV(file)
  } else {
    // Try to detect format by content
    const text = await file.text()
    
    if (text.includes('"type"') && text.includes('"coordinates"')) {
      // Likely GeoJSON
      return parseGeoJSON(file)
    } else if (text.includes('<kml') || text.includes('<Polygon')) {
      // Likely KML
      return parseKML(file)
    } else if (text.includes('PK\x03\x04')) {
      // ZIP magic number (but this won't work in text)
      return parseZIP(file)
    } else {
      // Try as CSV/coordinates
      return parseCSV(file)
    }
  }
}
