// IPCC Blue Carbon Sediment & Belowground Carbon Model
// Model-based estimation, NEVER direct measurement

import type { BlueAGBEstimate } from "./agb-estimator"

export interface SedimentCarbonEstimate {
  sediment_depth_m: number // Effective carbon-rich depth
  bulk_density_g_cm3: number
  organic_carbon_fraction: number // 0-1
  sediment_carbon_tco2e: number // Total sediment carbon in CO2e
  uncertainty_percent: number
  methodology_note: string // Always explains it's model-based
}

/**
 * Estimate sediment carbon using IPCC Wetlands Supplement methodology
 * CONSERVATIVE: Uses low-end (P10) estimates, never direct measurement
 */
export function estimateSedimentCarbon(
  ecosystem_type: string,
  area_ha: number,
  agb_estimate: BlueAGBEstimate,
): SedimentCarbonEstimate {
  // IPCC Regional defaults for sediment carbon stocks
  // Source: IPCC Wetlands Supplement Table 4.7
  const SEDIMENT_DEFAULTS = {
    MANGROVE: {
      depth_m_p10: 0.8,
      depth_m_p50: 1.2,
      depth_m_p90: 1.6,
      bulk_density: 1.0, // g/cm³
      organic_carbon_fraction: 0.08, // 8%
    },
    SEAGRASS: {
      depth_m_p10: 0.5,
      depth_m_p50: 0.8,
      depth_m_p90: 1.1,
      bulk_density: 0.9,
      organic_carbon_fraction: 0.06, // 6%
    },
    SALT_MARSH: {
      depth_m_p10: 0.6,
      depth_m_p50: 1.0,
      depth_m_p90: 1.4,
      bulk_density: 1.1,
      organic_carbon_fraction: 0.07, // 7%
    },
  }

  const defaults = SEDIMENT_DEFAULTS[ecosystem_type] || SEDIMENT_DEFAULTS.MANGROVE

  // Conservative estimate: use P10 (lower bound)
  const sediment_depth_m = defaults.depth_m_p10

  // Sediment Carbon Stock Formula (IPCC)
  // C_stock = Area × Depth × Bulk_Density × OC_Fraction
  // Result in tC per hectare
  const c_per_ha = sediment_depth_m * defaults.bulk_density * 1000 * defaults.organic_carbon_fraction

  // Convert tC to tCO2e (tC × 44/12)
  const sediment_carbon_tco2e = c_per_ha * (44 / 12) * area_ha

  // Uncertainty: higher for sediment (±40%) vs AGB (±25%)
  const uncertainty_percent = 40

  return {
    sediment_depth_m,
    bulk_density_g_cm3: defaults.bulk_density,
    organic_carbon_fraction: defaults.organic_carbon_fraction,
    sediment_carbon_tco2e: Math.round(sediment_carbon_tco2e * 100) / 100,
    uncertainty_percent,
    methodology_note:
      "Sediment carbon estimated using IPCC Wetlands Supplement defaults. This is a MODEL-BASED ESTIMATE, not direct measurement. Actual sediment carbon requires core sampling and laboratory analysis.",
  }
}
