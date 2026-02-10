// GeoTIFF Processing Utility for Extracting Band Data
export interface GeoTIFFMetadata {
  width: number
  height: number
  crs: string
  transform: [number, number, number, number, number, number]
}

export interface BandData {
  B02: number // Blue
  B03: number // Green
  B04: number // Red
  B08: number // NIR
  B11?: number // SWIR1
  B12?: number // SWIR2
}

/**
 * Calculate polygon area in hectares using lat/lon coordinates
 * Updated to use UTM-based calculation for accurate Indonesia measurements
 */
export function calculatePolygonAreaHectares(
  coordinates: Array<{ latitude: number | string; longitude: number | string }>,
): number {
  const { calculatePolygonAreaHectares: calculateUTMArea } = require("./polygon-area-calculator")

  const validCoords = coordinates.map((c) => ({
    latitude: typeof c.latitude === "string" ? Number.parseFloat(c.latitude) : c.latitude,
    longitude: typeof c.longitude === "string" ? Number.parseFloat(c.longitude) : c.longitude,
  }))

  return calculateUTMArea(validCoords)
}

/**
 * Extract band values from raster data
 * For actual GeoTIFF files, this would use a GeoTIFF library
 * Here we return calculated values based on vegetation patterns
 */
export function extractBandValues(coordinates: Array<{ latitude: number; longitude: number }>): BandData {
  // Calculate center point
  const centerLat = coordinates.reduce((sum, c) => sum + Number.parseFloat(c.latitude || "0"), 0) / coordinates.length
  const centerLng = coordinates.reduce((sum, c) => sum + Number.parseFloat(c.longitude || "0"), 0) / coordinates.length

  // Simulate band values based on location (higher values = denser vegetation)
  // In production, these would be actual pixel values from GeoTIFF files
  const vegetationStrength = 0.6 + Math.random() * 0.3

  return {
    B02: 0.08 + Math.random() * 0.02, // Blue
    B03: 0.12 + Math.random() * 0.03, // Green
    B04: 0.05 + vegetationStrength * 0.05, // Red
    B08: 0.25 + vegetationStrength * 0.15, // NIR (strongest in forests)
    B11: 0.12 + Math.random() * 0.05, // SWIR1
    B12: 0.1 + Math.random() * 0.05, // SWIR2
  }
}
