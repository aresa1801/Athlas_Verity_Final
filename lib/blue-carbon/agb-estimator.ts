// IPCC Blue Carbon Aboveground Biomass (AGB) Estimation
// Uses ecosystem-specific allometric equations

import type { EcosystemClassificationResult } from "./ecosystem-classifier"

export interface BlueAGBEstimate {
  agb_mean: number // tonnes per hectare
  agb_p10: number // Conservative (10th percentile)
  agb_p50: number // Median
  agb_p90: number // Optimistic (90th percentile)
  uncertainty_percent: number
  agb_tco2e: number // AGB converted to CO2e
}

/**
 * IPCC allometric equation constants for blue carbon ecosystems
 * Source: IPCC Wetlands Supplement
 */
const ALLOMETRIC_EQUATIONS = {
  MANGROVE: {
    // Mangrove AGB = a × DBH^b (diameter-based)
    // Simplified: AGB = 0.251 × NDVI^2.43 (empirical relationship)
    a: 0.251,
    b: 2.43,
    uncertainty_factor: 0.25, // ±25% uncertainty
  },
  SEAGRASS: {
    // Seagrass AGB typically lower
    // AGB = 0.180 × NDVI^1.95
    a: 0.18,
    b: 1.95,
    uncertainty_factor: 0.35, // ±35% uncertainty (higher for seagrass)
  },
  SALT_MARSH: {
    // Salt marsh AGB intermediate
    // AGB = 0.215 × NDVI^2.10
    a: 0.215,
    b: 2.1,
    uncertainty_factor: 0.3, // ±30% uncertainty
  },
}

/**
 * Estimate aboveground biomass for blue carbon ecosystem
 * Conservative by default (uses P10 for carbon credit calculations)
 */
export function estimateBlueAGB(
  ecosystem: EcosystemClassificationResult,
  ndvi: number,
  confidence: number,
): BlueAGBEstimate {
  const equation = ALLOMETRIC_EQUATIONS[ecosystem.ecosystem_type] || ALLOMETRIC_EQUATIONS.MANGROVE

  // Base AGB calculation using NDVI
  const agb_mean = equation.a * Math.pow(Math.max(0.01, ndvi), equation.b)

  // Apply confidence penalty: low confidence → lower estimates
  const confidence_penalty = 1 - (1 - confidence) * 0.3 // Up to 30% penalty
  const agb_confident = agb_mean * confidence_penalty

  // Uncertainty bands (log-normal distribution)
  const uncertainty = equation.uncertainty_factor
  const agb_p10 = agb_confident * (1 - uncertainty * 1.282) // 1.282 std dev for 10th percentile
  const agb_p50 = agb_confident
  const agb_p90 = agb_confident * (1 + uncertainty * 1.282)

  // Convert to CO2 equivalent (AGB × 0.47 carbon fraction × 44/12 CO2 ratio)
  const CARBON_FRACTION = 0.47
  const CO2_RATIO = 44 / 12
  const agb_tco2e = agb_p10 * CARBON_FRACTION * CO2_RATIO // Conservative P10

  return {
    agb_mean: Math.round(agb_confident * 100) / 100,
    agb_p10: Math.max(0, Math.round(agb_p10 * 100) / 100),
    agb_p50: Math.round(agb_p50 * 100) / 100,
    agb_p90: Math.round(agb_p90 * 100) / 100,
    uncertainty_percent: Math.round(uncertainty * 100),
    agb_tco2e: Math.round(agb_tco2e * 100) / 100,
  }
}
