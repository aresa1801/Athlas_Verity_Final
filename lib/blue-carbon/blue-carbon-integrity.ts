// Blue Carbon Integrity Score Calculator
// Produces audit-ready classification for VERRA VM0033

import type { BlueAGBEstimate } from "./agb-estimator"
import type { SedimentCarbonEstimate } from "./sediment-carbon-model"
import type { RulesetResult } from "./blue-carbon-ruleset"
import type { BlueCarbonIntegrityScore } from "./blue-carbon-integrity-score" // Assuming this is the correct import

export type BlueIntegrityClass = "A-Blue" | "B-Blue" | "C-Blue" | "Rejected"

/**
 * Calculate Blue Carbon Integrity Score (0-100)
 * Weighted components ensure conservative bias
 */
export function calculateBlueCarbonIntegrity(
  agb: BlueAGBEstimate,
  sediment: SedimentCarbonEstimate,
  ruleset: RulesetResult,
  area_ha: number,
  total_blue_carbon_tco2e: number,
): BlueCarbonIntegrityScore {
  // Component scores (0-100)

  // 1. Data Quality Score (25%): based on uncertainty
  const data_quality_score = Math.max(0, 100 - ((agb.uncertainty_percent + sediment.uncertainty_percent) / 2) * 1.5)

  // 2. Model Agreement Score (20%): how many rules passed
  const model_agreement_score = (ruleset.rules_passed / ruleset.rules_total) * 100

  // 3. Conservativeness Score (20%): prefer P10 estimates, penalize high variance
  const variance_penalty = (Math.abs(agb.agb_p90 - agb.agb_p10) / agb.agb_p50) * 20
  const conservativeness_score = Math.max(0, 100 - variance_penalty)

  // 4. Permanence & Risk Score (20%): based on ruleset flags
  const permanence_score = ruleset.flags.length === 0 ? 90 : Math.max(0, 90 - ruleset.flags.length * 15)

  // 5. Auditability Score (15%): transparency of methodology
  const auditability_score = 85 // Blue carbon has explicit IPCC methodology

  // Weighted final score
  const integrity_score =
    data_quality_score * 0.25 +
    model_agreement_score * 0.2 +
    conservativeness_score * 0.2 +
    permanence_score * 0.2 +
    auditability_score * 0.15

  // Assign Integrity Class
  let integrity_class: BlueIntegrityClass = "Rejected"
  if (integrity_score >= 80) integrity_class = "A-Blue"
  else if (integrity_score >= 65) integrity_class = "B-Blue"
  else if (integrity_score >= 50) integrity_class = "C-Blue"

  // Calculate risk discount
  const risk_discount_pct = ruleset.conservative_discount_pct + (100 - integrity_score) * 0.2

  // Net verified carbon (after discount)
  const net_verified_tco2e = total_blue_carbon_tco2e * (1 - risk_discount_pct / 100)

  return {
    integrity_score: Math.round(integrity_score),
    integrity_class,
    data_quality_score: Math.round(data_quality_score),
    model_agreement_score: Math.round(model_agreement_score),
    conservativeness_score: Math.round(conservativeness_score),
    permanence_risk_score: Math.round(permanence_score),
    auditability_score: Math.round(auditability_score),
    net_verified_tco2e: Math.round(net_verified_tco2e * 100) / 100,
    risk_discount_pct: Math.round(risk_discount_pct),
    summary: `Blue Carbon Integrity Class ${integrity_class}: ${net_verified_tco2e.toFixed(0)} tCO2e verified with ${risk_discount_pct}% conservative discount`,
  }
}
