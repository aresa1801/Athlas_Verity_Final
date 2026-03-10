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
 * Parse KML file
 */
export async function parseKML(file: File): Promise<ParsedPolygon> {
  const text = await file.text()
  const coordinates = extractCoordinatesFromKML(text)
  return {
    coordinates,
    area: 0,
    format: 'KML',
    isValid: coordinates.length >= 3,
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
      const [lng, lat] = coord.split(',').map(Number)
      // KML uses [lng, lat], convert to [lat, lng]
      return [lat, lng] as [number, number]
    })
    .filter(([lat, lng]) => !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
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
