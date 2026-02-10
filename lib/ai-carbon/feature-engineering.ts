// Feature Engineering Module for Vegetation & Structural Analysis
// Extracts vegetation indices and structural signals from satellite data

export interface VegetationIndices {
  NDVI: number // Normalized Difference Vegetation Index
  EVI: number // Enhanced Vegetation Index
  NBR: number // Normalized Burn Ratio
  SAVI: number // Soil Adjusted Vegetation Index
  NDMI: number // Normalized Difference Moisture Index
}

export interface StructuralSignals {
  canopy_height_mean: number // meters
  canopy_height_p10: number // 10th percentile
  canopy_height_p90: number // 90th percentile
  texture_variance: number // GLCM variance
  temporal_ndvi_variance: number // Temporal stability
}

export interface EnvironmentalModifiers {
  elevation: number // meters
  slope: number // degrees
  aspect: number // degrees
  precipitation_annual: number // mm/year (optional)
}

export interface FeatureCube {
  vegetation: VegetationIndices
  structure: StructuralSignals
  environment: EnvironmentalModifiers
  metadata: {
    timestamp: string
    epsg: number
    resolution_m: number
  }
}

/**
 * Calculate NDVI from Red and NIR bands
 * NDVI = (NIR - Red) / (NIR + Red)
 */
export function calculateNDVI(nir: number, red: number): number {
  if (nir + red === 0) return 0
  return (nir - red) / (nir + red)
}

/**
 * Calculate EVI (Enhanced Vegetation Index)
 * EVI = 2.5 * ((NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1))
 */
export function calculateEVI(nir: number, red: number, blue: number): number {
  const denominator = nir + 6 * red - 7.5 * blue + 1
  if (denominator === 0) return 0
  return 2.5 * ((nir - red) / denominator)
}

/**
 * Calculate NBR (Normalized Burn Ratio)
 * NBR = (NIR - SWIR) / (NIR + SWIR)
 */
export function calculateNBR(nir: number, swir: number): number {
  if (nir + swir === 0) return 0
  return (nir - swir) / (nir + swir)
}

/**
 * Calculate SAVI (Soil Adjusted Vegetation Index)
 * SAVI = ((NIR - Red) / (NIR + Red + L)) * (1 + L)
 * where L = 0.5 (soil brightness correction factor)
 */
export function calculateSAVI(nir: number, red: number, L = 0.5): number {
  const denominator = nir + red + L
  if (denominator === 0) return 0
  return ((nir - red) / denominator) * (1 + L)
}

/**
 * Calculate NDMI (Normalized Difference Moisture Index)
 * NDMI = (NIR - SWIR) / (NIR + SWIR)
 */
export function calculateNDMI(nir: number, swir: number): number {
  if (nir + swir === 0) return 0
  return (nir - swir) / (nir + swir)
}

/**
 * Extract all vegetation indices from satellite bands
 */
export function extractVegetationIndices(bands: {
  B02: number // Blue
  B03: number // Green
  B04: number // Red
  B08: number // NIR
  B11?: number // SWIR1
  B12?: number // SWIR2
}): VegetationIndices {
  const ndvi = calculateNDVI(bands.B08, bands.B04)
  const evi = calculateEVI(bands.B08, bands.B04, bands.B02)
  const nbr = bands.B11 ? calculateNBR(bands.B08, bands.B11) : 0
  const savi = calculateSAVI(bands.B08, bands.B04)
  const ndmi = bands.B11 ? calculateNDMI(bands.B08, bands.B11) : 0

  return {
    NDVI: Math.round(ndvi * 1000) / 1000,
    EVI: Math.round(evi * 1000) / 1000,
    NBR: Math.round(nbr * 1000) / 1000,
    SAVI: Math.round(savi * 1000) / 1000,
    NDMI: Math.round(ndmi * 1000) / 1000,
  }
}

/**
 * Generate mock structural signals from GEDI LiDAR data
 * In production, this would query actual GEDI Level 4A AGB data
 */
export function extractStructuralSignals(vegetation: VegetationIndices, area_ha: number): StructuralSignals {
  // Empirical relationships between NDVI and canopy height
  // These are simplified models; production would use actual GEDI data
  const baseHeight = Math.max(0, vegetation.NDVI * 25 + Math.random() * 5)

  return {
    canopy_height_mean: Math.round(baseHeight * 100) / 100,
    canopy_height_p10: Math.round(baseHeight * 0.6 * 100) / 100,
    canopy_height_p90: Math.round(baseHeight * 1.4 * 100) / 100,
    texture_variance: Math.round((0.1 + Math.random() * 0.3) * 100) / 100,
    temporal_ndvi_variance: Math.round((0.02 + Math.random() * 0.08) * 1000) / 1000,
  }
}

/**
 * Extract environmental modifiers from DEM data
 * In production, this would query actual elevation/slope data
 */
export function extractEnvironmentalModifiers(location: {
  latitude: number
  longitude: number
}): EnvironmentalModifiers {
  // Mock data based on typical tropical forest conditions
  return {
    elevation: Math.round(50 + Math.random() * 200),
    slope: Math.round(Math.random() * 15 * 100) / 100,
    aspect: Math.round(Math.random() * 360),
    precipitation_annual: Math.round(2000 + Math.random() * 1000),
  }
}

/**
 * Build complete feature cube for AI model input
 */
export function buildFeatureCube(
  bands: any,
  location: { latitude: number; longitude: number },
  area_ha: number,
): FeatureCube {
  const vegetation = extractVegetationIndices(bands)
  const structure = extractStructuralSignals(vegetation, area_ha)
  const environment = extractEnvironmentalModifiers(location)

  return {
    vegetation,
    structure,
    environment,
    metadata: {
      timestamp: new Date().toISOString(),
      epsg: 4326,
      resolution_m: 10,
    },
  }
}
