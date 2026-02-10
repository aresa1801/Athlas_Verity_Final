// Rule-Based Blue Carbon Integrity Verification
// Deterministic rules applied AFTER model estimation

import type { BlueAGBEstimate } from "./agb-estimator"
import type { SedimentCarbonEstimate } from "./sediment-carbon-model"

export interface RulesetResult {
  rules_passed: number
  rules_total: number
  rules_failed: string[]
  flags: string[]
  conservative_discount_pct: number
  ruleset_approved: boolean
}

const IPCC_REGIONAL_MAX = {
  MANGROVE: 200, // Max AGB t/ha
  SEAGRASS: 15, // Max AGB t/ha
  SALT_MARSH: 80, // Max AGB t/ha
}

/**
 * Apply deterministic rule-based verification to blue carbon estimates
 * Conservative bias: penalizes anomalies, high uncertainty, lack of evidence
 */
export function applyBlueCarbonRuleset(
  ecosystem_type: string,
  agb: BlueAGBEstimate,
  sediment: SedimentCarbonEstimate,
  area_ha: number,
  time_series_data?: boolean,
): RulesetResult {
  const flags: string[] = []
  let rules_passed = 0
  const rules_total = 7

  // Rule 1: AGB within IPCC regional maximum
  const max_agb = IPCC_REGIONAL_MAX[ecosystem_type] || 150
  if (agb.agb_p90 <= max_agb) {
    rules_passed++
  } else {
    flags.push("AGB exceeds IPCC regional maximum")
  }

  // Rule 2: Sediment depth within reasonable bounds
  if (sediment.sediment_depth_m > 0 && sediment.sediment_depth_m <= 2) {
    rules_passed++
  } else {
    flags.push("Sediment depth unreasonable")
  }

  // Rule 3: AGB >> Sediment carbon check (prevent unrealistic ratios)
  const agb_co2 = agb.agb_tco2e * area_ha
  const ratio = agb_co2 / (sediment.sediment_carbon_tco2e + 0.001)
  if (ratio > 0.05 && ratio < 20) {
    // Reasonable AGB:sediment ratio
    rules_passed++
  } else {
    flags.push(`Anomalous AGB:Sediment ratio (${ratio.toFixed(2)})`)
  }

  // Rule 4: Uncertainty not excessive
  if (agb.uncertainty_percent <= 35 && sediment.uncertainty_percent <= 45) {
    rules_passed++
  } else {
    flags.push("High uncertainty in estimates")
  }

  // Rule 5: Area reasonable (> 0.1 ha min, < 100,000 ha max for credibility)
  if (area_ha >= 0.1 && area_ha <= 100000) {
    rules_passed++
  } else {
    flags.push("Project area outside credible bounds")
  }

  // Rule 6: Time series / permanence evidence (optional but preferred)
  if (time_series_data) {
    rules_passed++
  } else {
    flags.push("No time-series permanence evidence")
  }

  // Rule 7: Sediment depth has supporting bathymetry / core data expectation
  // Penalize if sediment estimate lacks confidence
  if (sediment.sediment_depth_m >= 0.5) {
    rules_passed++
  } else {
    flags.push("Shallow sediment - may lack confidence")
  }

  // Calculate conservative discount based on rules passed
  const discount_pct = ((rules_total - rules_passed) / rules_total) * 50 // Up to 50% discount

  return {
    rules_passed,
    rules_total,
    rules_failed: flags,
    flags,
    conservative_discount_pct: Math.round(discount_pct),
    ruleset_approved: rules_passed >= 5, // At least 5/7 rules must pass
  }
}
