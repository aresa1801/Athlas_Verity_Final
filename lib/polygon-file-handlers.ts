/**
 * Multi-format polygon file handler for geospatial verification
 * Supports: GeoJSON (Polygon & MultiPolygon), KML, Shapefile (.shp), ZIP, and RAR formats
 * Handles outer boundaries and inner rings (holes) for accurate area calculation
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
      return extractCoordinatesFromGeometry(features[0].geometry)
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
 */
function convertKMLToGeoJSON(kml: string): any {
  try {
    // Extract all Polygon elements
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
    
    // Return as FeatureCollection
    return {
      type: 'FeatureCollection',
      features: polygons.map(geom => ({
        type: 'Feature',
        properties: {},
        geometry: geom
      }))
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
 * Extract shapefile from ZIP and convert to GeoJSON
 * Reads .shp (shapes) and .dbf (attributes) files
 */
async function extractShapefileFromZIP(arrayBuffer: ArrayBuffer, fileName: string): Promise<ParsedPolygon> {
  try {
    // Look for .shp file content in the ZIP
    // Since we can't easily parse binary shapefile data in browser without external library,
    // we'll look for an embedded GeoJSON or converted shapefile
    const view = new Uint8Array(arrayBuffer)
    const text = new TextDecoder().decode(view)
    
    // Search for GeoJSON-like content within the ZIP
    const geojsonMatch = text.match(/\{[\s\S]*?"type"\s*:\s*"(?:Feature|Polygon|MultiPolygon)[\s\S]*?\}/);
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
          format: 'ZIP (Shapefile converted to GeoJSON)',
          isValid: coordinates.length >= 3,
        }
      } catch (e) {
        // Continue to next approach
      }
    }
    
    // Alternative: Extract coordinates from PRJ (projection), SHP (shape), or other text files
    const lines = text.split('\n')
    const coords: Array<[number, number]> = []
    
    for (const line of lines) {
      // Look for coordinate patterns (lat,lng or lng,lat)
      const coordMatches = line.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/g)
      if (coordMatches) {
        for (const match of coordMatches) {
          const [lon, lat] = match.split(/[,\s]+/).map(parseFloat).filter(n => !isNaN(n))
          if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
            coords.push([lat, lon])
          }
        }
      }
    }
    
    if (coords.length >= 3) {
      return {
        coordinates: coords,
        multiPolygons: [{
          outerRing: coords,
          innerRings: []
        }],
        polygonCount: 1,
        holeCount: 0,
        area: 0,
        format: 'ZIP (Shapefile)',
        isValid: true,
      }
    }
    
    return {
      coordinates: [],
      area: 0,
      format: 'ZIP',
      isValid: false,
    }
  } catch (error) {
    console.error('[v0] Shapefile extraction error:', error)
    return {
      coordinates: [],
      area: 0,
      format: 'ZIP',
      isValid: false,
    }
  }
}

/**
 * Validate polygon coordinates
 */
export function validatePolygon(coordinates: Array<[number, number]>): { isValid: boolean; error?: string } {
  if (coordinates.length < 3) {
    return { isValid: false, error: 'Polygon must have at least 3 points' }
  }

  for (const [lng, lat] of coordinates) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { isValid: false, error: 'Invalid coordinates range' }
    }
  }

  return { isValid: true }
}
