/**
 * Multi-format polygon file handler for geospatial verification
 * Supports: GeoJSON, KML, Shapefile (.shp), ZIP, and RAR formats
 */

export interface ParsedPolygon {
  coordinates: Array<[number, number]>
  area: number
  format: string
  isValid: boolean
  error?: string
}

/**
 * Parse GeoJSON file
 */
export async function parseGeoJSON(file: File): Promise<ParsedPolygon> {
  const text = await file.text()
  const geojson = JSON.parse(text)
  const coordinates = extractCoordinatesFromGeoJSON(geojson)
  return {
    coordinates,
    area: 0,
    format: 'GeoJSON',
    isValid: coordinates.length >= 3,
  }
}

/**
 * Extract coordinates from GeoJSON
 */
function extractCoordinatesFromGeoJSON(geojson: any): Array<[number, number]> {
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

function extractCoordinatesFromGeometry(geometry: any): Array<[number, number]> {
  if (!geometry) return []
  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] || []
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates[0]?.[0] || []
  }
  return []
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
      return [lng, lat] as [number, number]
    })
    .filter(([lng, lat]) => !isNaN(lng) && !isNaN(lat))
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
