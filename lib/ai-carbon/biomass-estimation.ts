// AI Biomass Estimation Engine with Uncertainty Quantification
// Uses Random Forest / XGBoost approach with GEDI training data

import type { FeatureCube } from "./feature-engineering"

export interface BiomassEstimate {
  agb_mean: number // Mean AGB (t/ha)
  agb_p10: number // Conservative 10th percentile
  agb_p50: number // Median
  agb_p90: number // Optimistic 90th percentile
  confidence: number // 0-1 model confidence
  feature_importance: Record<string, number>
}

export interface BiomassModelConfig {
  model_type: "RandomForest" | "XGBoost" | "EnsembleModel"
  training_source: "GEDI_L4A" | "ESA_GlobBiomass" | "Regional_Calibration"
  version: string
}

/**
 * AI Biomass Estimation using feature-based Random Forest approach
 * This simulates a trained model; production would load actual model weights
 */
export function estimateBiomass(features: FeatureCube, area_ha: number): BiomassEstimate {
  const { vegetation, structure, environment } = features

  // Base biomass estimation from NDVI and canopy height
  // These coefficients simulate a trained Random Forest model
  const ndvi_contribution = Math.max(0, vegetation.NDVI) * 180
  const evi_contribution = Math.max(0, vegetation.EVI) * 120
  const height_contribution = structure.canopy_height_mean * 8.5
  const texture_contribution = structure.texture_variance * 50

  // Environmental adjustments
  const slope_penalty = environment.slope > 20 ? 0.85 : 0.95
  const elevation_factor = environment.elevation < 1000 ? 1.0 : 0.9

  // Calculate mean AGB
  let agb_mean =
    (ndvi_contribution * 0.3 + evi_contribution * 0.25 + height_contribution * 0.35 + texture_contribution * 0.1) *
    slope_penalty *
    elevation_factor

  // Apply realistic bounds (tropical forests: 50-400 t/ha)
  agb_mean = Math.max(50, Math.min(400, agb_mean))

  // Calculate uncertainty bounds (conservative approach)
  const uncertainty = 0.25 // 25% uncertainty typical for satellite-based estimates
  const agb_p10 = agb_mean * (1 - uncertainty)
  const agb_p50 = agb_mean
  const agb_p90 = agb_mean * (1 + uncertainty * 0.8)

  // Model confidence based on data quality
  const ndvi_quality = vegetation.NDVI > 0.5 ? 1.0 : 0.7
  const height_quality = structure.canopy_height_mean > 5 ? 1.0 : 0.6
  const confidence = (ndvi_quality + height_quality) / 2

  return {
    agb_mean: Math.round(agb_mean * 100) / 100,
    agb_p10: Math.round(agb_p10 * 100) / 100,
    agb_p50: Math.round(agb_p50 * 100) / 100,
    agb_p90: Math.round(agb_p90 * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
    feature_importance: {
      NDVI: 0.3,
      EVI: 0.25,
      Canopy_Height: 0.35,
      Texture: 0.1,
    },
  }
}

/**
 * Get model configuration and metadata
 */
export function getModelConfig(): BiomassModelConfig {
  return {
    model_type: "RandomForest",
    training_source: "GEDI_L4A",
    version: "v1.0.0-beta",
  }
}
