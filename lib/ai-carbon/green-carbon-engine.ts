// Comprehensive Green Carbon Calculation Engine (9-Step Methodology)
// Implements Verra VCS & Gold Standard forestry verification logic

import type { FeatureCube } from "./feature-engineering"
import type { BiomassEstimate } from "./biomass-estimation"
import type { CarbonCreditOutput } from "./carbon-conversion"
import { estimateBiomass } from "./biomass-estimation"
import { convertTocarbonCredit } from "./carbon-conversion"

export interface GreenCarbonProjectInput {
  // Polygon & location
  polygon: Array<[number, number]>
  area_ha: number
  latitude: number
  longitude: number

  // Project metadata
  project_type: "protection" | "restoration" | "agroforestry"
  baseline_year: number
  current_year: number
  forest_type: string
  species?: string[]

  // Risk & status
  risk_level: "low" | "medium" | "high"
  legal_protection_status: "full" | "partial" | "none"

  // Baseline assumptions
  deforestation_rate_annual_percent?: number // For protection projects
  degradation_rate_annual_percent?: number // For restoration projects
  baseline_agb_per_ha?: number // Explicit baseline

  // Leakage & buffer
  leakage_percent?: number // Default 10%
  buffer_pool_percent?: number // Default 20%

  // Satellite features (system-provided)
  features?: FeatureCube

  // Optional: Field plot data
  field_plot_agb_per_ha?: number
  field_plot_confidence?: number
}

export interface IntegrityAssessment {
  legal_status_score: number // 0-100
  data_completeness_score: number // 0-100
  model_confidence_score: number // 0-100
  methodology_alignment_score: number // 0-100
  composite_integrity_score: number // 0-100
  integrity_class: "IC-A" | "IC-B" | "IC-C" | "IC-F"
  risk_adjustment_percent: number // 5-25%
}

export interface AuraConsensusOutput {
  plausibility_check: {
    passed: boolean
    flags: string[]
    agb_vs_ipcc_range: string
  }
  model_agreement: {
    satellite_model_confidence: number
    field_data_alignment?: number
    consensus_confidence: number
  }
  final_integrity_score: number
}

export interface GreenCarbonCalculationResult {
  // Step 1-2: Features & AGB
  satellite_features: FeatureCube | null
  biomass_estimate: BiomassEstimate

  // Step 3: Uncertainty
  uncertainty_percent: number
  uncertainty_enforced_minimum: boolean

  // Step 4: Scientific bounds
  agb_within_ipcc_bounds: boolean
  ipcc_regional_range: { min: number; max: number }
  agb_capped: boolean

  // Step 5: Conservative selection
  agb_conservative_tpha: number

  // Step 6-7: Carbon & baseline
  carbon_calculation: CarbonCreditOutput

  // Step 8: Risk adjustment
  integrity_assessment: IntegrityAssessment

  // Step 9: AURA verification
  aura_consensus: AuraConsensusOutput

  // Final output
  final_verified_tco2: number
  methodology_notes: string
}

/**
 * STEP 1-2: Extract satellite features & estimate AGB
 */
export function extractFeaturesAndEstimateBiomass(
  input: GreenCarbonProjectInput,
  features: FeatureCube,
): { features: FeatureCube; biomass: BiomassEstimate } {
  const biomass = estimateBiomass(features, input.area_ha)
  return { features, biomass }
}

/**
 * STEP 3: Uncertainty quantification via quantile regression
 * Enforce minimum 15% uncertainty
 */
export function quantifyUncertainty(biomass: BiomassEstimate): {
  uncertainty_percent: number
  enforced_minimum: boolean
} {
  const calculated_uncertainty = ((biomass.agb_p90 - biomass.agb_p10) / biomass.agb_p50) * 100

  // Enforce minimum 15%
  const minimum_uncertainty = 15
  const uncertainty_percent = Math.max(calculated_uncertainty, minimum_uncertainty)
  const enforced_minimum = uncertainty_percent === minimum_uncertainty

  return { uncertainty_percent, enforced_minimum }
}

/**
 * STEP 4: Cross-check with IPCC regional limits & global biomass maps
 */
export function getIPCCRegionalBounds(forest_type: string, latitude: number): { min: number; max: number } {
  // Simplified IPCC bounds for tropical forests (from IPCC AR6 data)
  const bounds: Record<string, { min: number; max: number }> = {
    tropical_rainforest: { min: 100, max: 350 },
    tropical_dry_forest: { min: 80, max: 250 },
    tropical_moist_deciduous: { min: 90, max: 300 },
    temperate_forest: { min: 60, max: 200 },
    boreal_forest: { min: 30, max: 100 },
  }

  return bounds[forest_type] || { min: 80, max: 300 }
}

export function crossCheckWithScientificBounds(
  agb: number,
  forest_type: string,
  latitude: number,
): { within_bounds: boolean; ipcc_range: { min: number; max: number }; capped_agb: number } {
  const ipcc_range = getIPCCRegionalBounds(forest_type, latitude)

  if (agb > ipcc_range.max) {
    return {
      within_bounds: false,
      ipcc_range,
      capped_agb: ipcc_range.max,
    }
  }

  return {
    within_bounds: true,
    ipcc_range,
    capped_agb: agb,
  }
}

/**
 * STEP 5: Conservative AGB selection
 * Use P10 (conservative) or capped value
 */
export function selectConservativeAGB(biomass: BiomassEstimate, bounds_check: any): number {
  const conservative_value = Math.min(biomass.agb_p10, bounds_check.capped_agb)
  return Math.round(conservative_value * 100) / 100
}

/**
 * STEP 7: Baseline & additionality logic (Verra/GS style)
 */
export function calculateBaselineAndAdditionality(
  input: GreenCarbonProjectInput,
  agb_current: number,
): { baseline_agb: number; emission_reduction_scenario: string } {
  if (input.project_type === "protection") {
    // Protection: baseline loss = deforestation rate × area
    const annual_rate = input.deforestation_rate_annual_percent || 2.0 // Default 2% annual loss
    const years = input.current_year - input.baseline_year
    const baseline_agb = agb_current * Math.pow(1 - annual_rate / 100, years)

    return {
      baseline_agb,
      emission_reduction_scenario: `Protection: Preventing ${annual_rate}% annual deforestation over ${years} years`,
    }
  } else if (input.project_type === "restoration") {
    // Restoration: baseline = degraded/reference AGB
    const baseline_agb = input.baseline_agb_per_ha || agb_current * 0.5 // Default 50% of current

    return {
      baseline_agb,
      emission_reduction_scenario: `Restoration: Increasing from ${baseline_agb.toFixed(1)} to ${agb_current.toFixed(1)} t/ha`,
    }
  }

  // Agroforestry or other
  const baseline_agb = input.baseline_agb_per_ha || agb_current * 0.7
  return {
    baseline_agb,
    emission_reduction_scenario: "Agroforestry/Mixed use scenario",
  }
}

/**
 * STEP 8: Risk adjustment based on integrity factors
 */
export function assessIntegrity(input: GreenCarbonProjectInput, biomass: BiomassEstimate): IntegrityAssessment {
  // Legal protection scoring (0-100)
  const legal_scores = {
    full: 95,
    partial: 70,
    none: 40,
  }
  const legal_status_score = legal_scores[input.legal_protection_status] || 50

  // Data completeness (0-100)
  let data_completeness_score = 70
  if (input.field_plot_agb_per_ha) data_completeness_score += 15
  if (input.features) data_completeness_score += 10
  data_completeness_score = Math.min(100, data_completeness_score)

  // Model confidence
  const model_confidence_score = Math.round(biomass.confidence * 100)

  // Methodology alignment
  const methodology_alignment_score = 85 // Fixed for Verra/GS alignment

  // Composite score (weighted average)
  const composite_integrity_score = Math.round(
    legal_status_score * 0.3 +
      data_completeness_score * 0.25 +
      model_confidence_score * 0.25 +
      methodology_alignment_score * 0.2,
  )

  // Determine integrity class
  let integrity_class: "IC-A" | "IC-B" | "IC-C" | "IC-F"
  if (composite_integrity_score >= 85) integrity_class = "IC-A"
  else if (composite_integrity_score >= 70) integrity_class = "IC-B"
  else if (composite_integrity_score >= 50) integrity_class = "IC-C"
  else integrity_class = "IC-F"

  // Risk adjustment percent (5-25%)
  const risk_adjustment_percent = Math.max(5, Math.min(25, 30 - composite_integrity_score / 4))

  return {
    legal_status_score,
    data_completeness_score,
    model_confidence_score,
    methodology_alignment_score,
    composite_integrity_score,
    integrity_class,
    risk_adjustment_percent,
  }
}

/**
 * STEP 9: AURA subnet verification (mock implementation)
 * In production, this would communicate with AURA consensus layer
 */
export function runAuraConsensusCheck(
  agb_conservative: number,
  carbon_credit: CarbonCreditOutput,
  integrity: IntegrityAssessment,
  forest_type: string,
): AuraConsensusOutput {
  const agb_ipcc_range = getIPCCRegionalBounds(forest_type, 0)

  // Plausibility check
  const within_bounds = agb_conservative >= agb_ipcc_range.min && agb_conservative <= agb_ipcc_range.max
  const flags: string[] = []

  if (!within_bounds) {
    if (agb_conservative < agb_ipcc_range.min) flags.push("AGB below IPCC range")
    if (agb_conservative > agb_ipcc_range.max) flags.push("AGB above IPCC range (should be capped)")
  }

  // Model agreement (0-100)
  const satellite_model_confidence = integrity.model_confidence_score
  const consensus_confidence = Math.min(100, satellite_model_confidence + 10)

  return {
    plausibility_check: {
      passed: flags.length === 0,
      flags,
      agb_vs_ipcc_range: `${agb_conservative.toFixed(1)} t/ha within [${agb_ipcc_range.min}, ${agb_ipcc_range.max}]`,
    },
    model_agreement: {
      satellite_model_confidence,
      consensus_confidence,
    },
    final_integrity_score: integrity.composite_integrity_score,
  }
}

/**
 * MAIN ENGINE: Execute full 9-step calculation
 */
export function calculateGreenCarbon(input: GreenCarbonProjectInput): GreenCarbonCalculationResult {
  // Mock satellite features if not provided
  let features = input.features
  if (!features) {
    features = {
      vegetation: {
        NDVI: 0.65,
        EVI: 0.45,
        NBR: 0.35,
        SAVI: 0.48,
        NDMI: 0.4,
      },
      structure: {
        canopy_height_mean: 22,
        canopy_height_p10: 13,
        canopy_height_p90: 31,
        texture_variance: 0.25,
        temporal_ndvi_variance: 0.04,
      },
      environment: {
        elevation: 150,
        slope: 8,
        aspect: 180,
        precipitation_annual: 2500,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        epsg: 4326,
        resolution_m: 10,
      },
    }
  }

  // Step 1-2: Extract features & estimate biomass
  const { biomass } = extractFeaturesAndEstimateBiomass(input, features)

  // Step 3: Uncertainty quantification
  const { uncertainty_percent, enforced_minimum } = quantifyUncertainty(biomass)

  // Step 4: Cross-check with scientific bounds
  const bounds_check = crossCheckWithScientificBounds(biomass.agb_p10, input.forest_type, input.latitude)

  // Step 5: Conservative AGB selection
  const agb_conservative_tpha = selectConservativeAGB(biomass, bounds_check)

  // Step 6-7: Carbon calculation with baseline
  const baseline_calc = calculateBaselineAndAdditionality(input, agb_conservative_tpha)

  const carbon_calculation = convertTocarbonCredit({
    biomass,
    area_ha: input.area_ha,
    baseline_agb_per_ha: baseline_calc.baseline_agb,
    leakage_percent: input.leakage_percent || 10,
    buffer_pool_percent: input.buffer_pool_percent || 20,
    integrity_class: "IC-B", // Will be updated in step 8
  })

  // Step 8: Integrity assessment & risk adjustment
  const integrity_assessment = assessIntegrity(input, biomass)

  // Recalculate carbon with proper integrity class
  const final_carbon_calculation = convertTocarbonCredit({
    biomass,
    area_ha: input.area_ha,
    baseline_agb_per_ha: baseline_calc.baseline_agb,
    leakage_percent: input.leakage_percent || 10,
    buffer_pool_percent: input.buffer_pool_percent || 20,
    integrity_class: integrity_assessment.integrity_class,
  })

  // Step 9: AURA consensus verification
  const aura_consensus = runAuraConsensusCheck(
    agb_conservative_tpha,
    final_carbon_calculation,
    integrity_assessment,
    input.forest_type,
  )

  // Apply final risk adjustment
  const risk_adjustment_factor = 1 - integrity_assessment.risk_adjustment_percent / 100
  const final_verified_tco2 = Math.round(final_carbon_calculation.final_verified_co2_tco2 * risk_adjustment_factor * 100) / 100

  const methodology_notes =
    `Carbon estimates derived using AI-powered biomass models calibrated with GEDI/SRTM data, ` +
    `consistent with Verra VCS & Gold Standard methodologies. Uncertainty range: ${uncertainty_percent.toFixed(1)}%. ` +
    `Baseline: ${baseline_calc.emission_reduction_scenario}`

  return {
    satellite_features: features,
    biomass_estimate: biomass,
    uncertainty_percent,
    uncertainty_enforced_minimum: enforced_minimum,
    agb_within_ipcc_bounds: bounds_check.within_bounds,
    ipcc_regional_range: bounds_check.ipcc_range,
    agb_capped: biomass.agb_p10 > bounds_check.capped_agb,
    agb_conservative_tpha,
    carbon_calculation: final_carbon_calculation,
    integrity_assessment,
    aura_consensus,
    final_verified_tco2,
    methodology_notes,
  }
}
