// Blue Carbon Ecosystem Classification Engine
// Detects and classifies mangrove, seagrass, and salt marsh ecosystems

export enum BlueEcosystem {
  MANGROVE = "Mangrove",
  SEAGRASS = "Seagrass",
  SALT_MARSH = "Salt Marsh",
  UNKNOWN = "Unknown",
}

export interface EcosystemClassificationInput {
  NDVI: number
  EVI: number
  NDMI: number
  SAVI: number
  water_index: number // MNDWI or similar
  elevation: number
  distance_to_coast_km: number
  is_intertidal_zone: boolean
  salinity_proxy: number // 0-1, estimated from spectral data
}

export interface EcosystemClassificationResult {
  ecosystem_type: BlueEcosystem
  class_probability: number
  confidence: number
}

/**
 * Classify coastal ecosystem type based on satellite indices
 * Strict geographic constraints: only coastal areas within 2km of shoreline
 */
export function classifyBlueEcosystem(input: EcosystemClassificationInput): EcosystemClassificationResult {
  const { NDVI, NDMI, water_index, distance_to_coast_km, is_intertidal_zone, salinity_proxy } = input

  // STRICT CONSTRAINT: Must be within 2km of coast
  if (distance_to_coast_km > 2) {
    return {
      ecosystem_type: BlueEcosystem.UNKNOWN,
      class_probability: 0,
      confidence: 0,
    }
  }

  // MANGROVE: NDVI 0.5-0.8, high NDMI (0.3+), intertidal, saline
  if (
    NDVI >= 0.5 &&
    NDVI <= 0.8 &&
    NDMI >= 0.3 &&
    is_intertidal_zone &&
    salinity_proxy >= 0.5 &&
    distance_to_coast_km < 1
  ) {
    return {
      ecosystem_type: BlueEcosystem.MANGROVE,
      class_probability: Math.min(0.95, NDVI * 0.6 + NDMI * 0.4),
      confidence: 0.88,
    }
  }

  // SEAGRASS: NDVI 0.3-0.6, high water_index (< -0.2), shallow water signature
  if (NDVI >= 0.3 && NDVI <= 0.6 && water_index < -0.2 && water_index > -0.5 && distance_to_coast_km < 1.5) {
    return {
      ecosystem_type: BlueEcosystem.SEAGRASS,
      class_probability: Math.min(0.92, Math.abs(water_index) * 0.7),
      confidence: 0.82,
    }
  }

  // SALT MARSH: NDVI 0.4-0.7, moderate NDMI, shallow intertidal, halophytic signature
  if (NDVI >= 0.4 && NDVI <= 0.7 && NDMI >= 0.15 && NDMI < 0.4 && is_intertidal_zone && distance_to_coast_km < 2) {
    return {
      ecosystem_type: BlueEcosystem.SALT_MARSH,
      class_probability: Math.min(0.9, NDVI * 0.5 + NDMI * 0.5),
      confidence: 0.8,
    }
  }

  return {
    ecosystem_type: BlueEcosystem.UNKNOWN,
    class_probability: 0,
    confidence: 0,
  }
}
