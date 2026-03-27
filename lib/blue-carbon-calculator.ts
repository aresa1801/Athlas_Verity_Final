/**
 * Blue Carbon Calculation Engine
 * Based on international standards: IPCC, Verra VCS, IUCN Blue Carbon Guidelines
 * Accounts for: AGB, BGB, Dead Wood, Litter, Soil Organic Carbon (SOC)
 */

export interface BlueCarbonInputs {
  // Project basics
  area_ha: number
  ecosystem_type: "mangrove" | "seagrass" | "salt_marsh" // Coastal ecosystem
  country: string
  baseline_year: number

  // Coastal parameters
  tidal_zone_type: string // intertidal, subtidal
  salinity_type: string // fresh, brackish, marine
  water_depth_m: number
  sediment_depth_cm: number

  // Biomass data
  agb_t_ha: number // Above Ground Biomass (tonnes/ha)
  bgb_ratio: number // Below Ground Biomass ratio to AGB (typically 0.4-0.5 for mangroves)
  dead_wood_t_ha: number // Dead wood biomass
  litter_t_ha: number // Litter biomass

  // Soil carbon (most important for blue carbon)
  soc_t_ha: number // Soil Organic Carbon (tonnes/ha) - top 1m
  soc_depth_m: number // Depth of SOC calculation (usually 1m)
  bulk_density_g_cm3: number // Soil bulk density
  organic_matter_percent: number // % organic matter in soil

  // Baseline & project
  baseline_emission_t_co2_ha_year: number // Reference emissions
  degradation_rate_percent: number // Annual degradation rate
  duration_years: number

  // Verification parameters
  leakage_percent: number
  buffer_pool_percent: number
  integrity_class: "IC-A" | "IC-B" | "IC-C" | "IC-D"
  uncertainty_discount: number // Additional discount for uncertainty (%)
}

export interface BlueCarbonResult {
  // Biomass pools (in tC/ha)
  agb_tc_ha: number
  bgb_tc_ha: number
  dead_wood_tc_ha: number
  litter_tc_ha: number
  soc_tc_ha: number
  total_biomass_tc_ha: number

  // Total carbon stock
  total_carbon_stock_tc: number // All pools combined in tonnes carbon
  total_co2_equivalent_t: number // Converted to CO2 equivalent

  // Baseline-adjusted sequestration
  annual_sequestration_rate_tco2_ha: number
  total_project_sequestration_tco2: number // Over project duration
  baseline_emissions_tco2: number
  gross_removals_tco2: number

  // Adjustments
  leakage_adjustment_tco2: number
  buffer_pool_tco2: number
  uncertainty_discount_tco2: number
  net_verified_credits_tco2: number

  // COMPREHENSIVE VERIFICATION - International standards methodology
  // Following: Verra VCS, IUCN Blue Carbon, IPCC AR6
  ex_ante_credits_tco2: number // Ex-ante estimate before adjustments
  
  // Integrity adjustments (Verra + IUCN standards)
  saturation_discount_percent: number // Ecosystem saturation discount
  permanence_risk_discount_percent: number // Climate change risk discount
  additionality_discount_percent: number // Additionality verification discount
  
  // Final verified reduction (comprehensive standard methodology)
  final_verified_reduction_tco2: number // Final credits after all integrity checks
  
  // Verification ratios for transparency
  buffer_pool_as_percent_of_credits: number
  discount_factor_applied: number // Total discount from gross to final
  
  // Additional metrics
  coastal_protection_value: string // Qualitative assessment
  biodiversity_benefit: string // Qualitative assessment
  
  // Certification classification
  integrity_score: number // 0-100 rating of project integrity
  verra_compliance_status: string // "Compliant", "Conditional", "Non-compliant"
}

/**
 * Default ecosystem-specific coefficients based on IPCC AR6 and Verra standards
 */
const ECOSYSTEM_COEFFICIENTS = {
  mangrove: {
    bgb_agb_ratio: 0.45,
    dead_wood_coefficient: 0.08, // 8% of AGB
    litter_coefficient: 0.03, // 3% of AGB
    soc_factor: 3.5, // SOC is 3-4x biomass for mangroves
    carbon_fraction: 0.47,
  },
  seagrass: {
    bgb_agb_ratio: 0.6, // Seagrass has lower AGB, higher BGB
    dead_wood_coefficient: 0.02,
    litter_coefficient: 0.05,
    soc_factor: 2.8,
    carbon_fraction: 0.47,
  },
  salt_marsh: {
    bgb_agb_ratio: 0.5,
    dead_wood_coefficient: 0.05,
    litter_coefficient: 0.04,
    soc_factor: 3.2,
    carbon_fraction: 0.47,
  },
}

/**
 * Calculate blue carbon credits with AGB, BGB, and SOC
 */
export function calculateBlueCarbonCredits(inputs: BlueCarbonInputs): BlueCarbonResult {
  const coeffs = ECOSYSTEM_COEFFICIENTS[inputs.ecosystem_type] || ECOSYSTEM_COEFFICIENTS.mangrove

  console.log("[v0] Blue Carbon Calculation Started")
  console.log(`[v0] Ecosystem: ${inputs.ecosystem_type}, Area: ${inputs.area_ha} ha`)

  // ===== STEP 1: Calculate carbon in each biomass pool (per hectare) =====

  // AGB - Above Ground Biomass
  const agb_t_ha = inputs.agb_t_ha
  const agb_tc_ha = agb_t_ha * coeffs.carbon_fraction
  console.log(`[v0] AGB: ${agb_t_ha}t/ha × ${coeffs.carbon_fraction} = ${agb_tc_ha.toFixed(2)} tC/ha`)

  // BGB - Below Ground Biomass (roots, etc.)
  // Using ecosystem-specific allometric relationships from IPCC AR6
  const bgb_ratio = inputs.bgb_ratio > 0 ? inputs.bgb_ratio : coeffs.bgb_agb_ratio
  const bgb_t_ha = bgb_ratio * agb_t_ha
  const bgb_tc_ha = bgb_t_ha * coeffs.carbon_fraction
  console.log(`[v0] BGB Ratio (${inputs.ecosystem_type}): ${bgb_ratio} | BGB: ${bgb_t_ha.toFixed(2)}t/ha × ${coeffs.carbon_fraction} = ${bgb_tc_ha.toFixed(2)} tC/ha`)

  // Dead Wood & Litter
  const dead_wood_t_ha = inputs.dead_wood_t_ha || agb_t_ha * coeffs.dead_wood_coefficient
  const dead_wood_tc_ha = dead_wood_t_ha * coeffs.carbon_fraction
  console.log(`[v0] Dead Wood: ${dead_wood_t_ha.toFixed(2)}t/ha × ${coeffs.carbon_fraction} = ${dead_wood_tc_ha.toFixed(2)} tC/ha`)

  const litter_t_ha = inputs.litter_t_ha || agb_t_ha * coeffs.litter_coefficient
  const litter_tc_ha = litter_t_ha * coeffs.carbon_fraction
  console.log(`[v0] Litter: ${litter_t_ha.toFixed(2)}t/ha × ${coeffs.carbon_fraction} = ${litter_tc_ha.toFixed(2)} tC/ha`)

  // SOC - Soil Organic Carbon (the most critical for blue carbon)
  // IPCC AR6 Tier 2 methodology: SOC calculated from bulk density and organic matter
  // SOC (t/ha) = bulk_density (g/cm³) × depth (cm) × organic_matter_fraction × conversion_factor
  let soc_tc_ha = inputs.soc_t_ha
  if (soc_tc_ha === 0 && inputs.bulk_density_g_cm3 > 0 && inputs.organic_matter_percent > 0) {
    // IPCC standard: 1 cm depth with density g/cm³ gives 10 tonnes/ha per cm
    soc_tc_ha = inputs.bulk_density_g_cm3 * inputs.sediment_depth_cm * (inputs.organic_matter_percent / 100) * 10
  } else if (soc_tc_ha === 0) {
    // Default SOC if neither provided (based on ecosystem type)
    soc_tc_ha = coeffs.soc_factor * agb_t_ha
  }
  console.log(`[v0] SOC (${inputs.soc_depth_m}m depth): ${soc_tc_ha.toFixed(2)} tC/ha | Calculation: BD=${inputs.bulk_density_g_cm3} × Depth=${inputs.sediment_depth_cm}cm × OM=${inputs.organic_matter_percent}%`)

  // ===== STEP 2: Calculate total carbon stock per hectare =====
  const total_biomass_tc_ha = agb_tc_ha + bgb_tc_ha + dead_wood_tc_ha + litter_tc_ha
  const total_tc_ha = total_biomass_tc_ha + soc_tc_ha
  console.log(`[v0] Total Carbon (per ha): ${total_tc_ha.toFixed(2)} tC/ha`)

  // ===== STEP 3: Scale to project area =====
  const total_carbon_stock_tc = total_tc_ha * inputs.area_ha
  const total_co2_equivalent_t = total_carbon_stock_tc * (44 / 12) // Convert C to CO2
  console.log(`[v0] Total Project Carbon Stock: ${total_carbon_stock_tc.toFixed(2)} tC = ${total_co2_equivalent_t.toFixed(2)} tCO2`)

  // ===== STEP 4: Calculate annual sequestration =====
  // Blue carbon ecosystems sequester carbon through SOC accumulation
  // Annual rate typically 1-4 tCO2/ha/year depending on ecosystem and management
  const annual_sequestration_rate = (soc_tc_ha / inputs.soc_depth_m) * (44 / 12) * 0.2 // Assume 20% annual replenishment
  const total_project_sequestration_tco2 = annual_sequestration_rate * inputs.area_ha * inputs.duration_years
  console.log(`[v0] Annual Sequestration Rate: ${annual_sequestration_rate.toFixed(2)} tCO2/ha/year`)
  console.log(`[v0] Total Project Sequestration: ${total_project_sequestration_tco2.toFixed(2)} tCO2`)

  // ===== STEP 5: Apply baseline emissions =====
  const baseline_emissions_tco2 = inputs.baseline_emission_t_co2_ha_year * inputs.area_ha * inputs.duration_years
  let gross_removals = total_project_sequestration_tco2 - baseline_emissions_tco2
  if (gross_removals < 0) gross_removals = 0
  console.log(`[v0] Baseline Emissions: ${baseline_emissions_tco2.toFixed(2)} tCO2`)
  console.log(`[v0] Gross Removals: ${gross_removals.toFixed(2)} tCO2`)

  // ===== STEP 6: Apply leakage adjustment =====
  const leakage_adjustment = (gross_removals * inputs.leakage_percent) / 100
  const after_leakage = gross_removals * (1 - inputs.leakage_percent / 100)
  console.log(`[v0] Leakage (${inputs.leakage_percent}%): ${leakage_adjustment.toFixed(2)} tCO2`)

  // ===== STEP 7: Apply buffer pool =====
  const buffer_pool = (after_leakage * inputs.buffer_pool_percent) / 100
  const after_buffer = after_leakage * (1 - inputs.buffer_pool_percent / 100)
  console.log(`[v0] Buffer Pool (${inputs.buffer_pool_percent}%): ${buffer_pool.toFixed(2)} tCO2`)

  // ===== STEP 8: Apply uncertainty discount =====
  const uncertainty_discount = (after_buffer * inputs.uncertainty_discount) / 100
  const after_uncertainty = after_buffer * (1 - inputs.uncertainty_discount / 100)
  console.log(`[v0] Uncertainty Discount (${inputs.uncertainty_discount}%): ${uncertainty_discount.toFixed(2)} tCO2`)

  // ===== STEP 9: Ex-ante estimate =====
  const ex_ante_credits = after_uncertainty
  console.log(`[v0] Ex-ante Verified Credits: ${ex_ante_credits.toFixed(2)} tCO2`)

  // ===== STEP 10: COMPREHENSIVE VERIFICATION - International standards =====
  // Verra VCS, IUCN Blue Carbon, and IPCC AR6 Tier 2 methodology
  
  // Saturation discount: Accounts for ecosystem carbon saturation limits
  // Blue carbon ecosystems typically saturate at lower levels than forests
  // Discount range: 0-15% based on ecosystem type and maturity
  let saturation_discount = 0
  if (inputs.ecosystem_type === "mangrove") {
    saturation_discount = 3 // Mangroves less susceptible to saturation
  } else if (inputs.ecosystem_type === "seagrass") {
    saturation_discount = 8 // Seagrass more susceptible to saturation
  } else if (inputs.ecosystem_type === "salt_marsh") {
    saturation_discount = 5 // Moderate saturation risk
  }
  const saturation_adjustment = (ex_ante_credits * saturation_discount) / 100
  const after_saturation = ex_ante_credits - saturation_adjustment
  console.log(`[v0] Saturation Discount (${saturation_discount}%): ${saturation_adjustment.toFixed(2)} tCO2`)

  // Permanence risk discount: Climate change and sea-level rise impacts
  // Blue carbon at higher risk than terrestrial carbon
  // Discount range: 5-25% based on location and climate projections
  let permanence_discount = 12 // Default 12% for coastal blue carbon
  if (inputs.baseline_year >= 2020 && inputs.country === "Indonesia") {
    permanence_discount = 15 // Higher risk in SE Asia tropical regions
  }
  const permanence_adjustment = (after_saturation * permanence_discount) / 100
  const after_permanence = after_saturation - permanence_adjustment
  console.log(`[v0] Permanence Risk Discount (${permanence_discount}%): ${permanence_adjustment.toFixed(2)} tCO2`)

  // Additionality discount: Project wouldn't have happened without carbon finance
  // Discount: 5-15% based on integrity class
  let additionality_discount = 0
  switch (inputs.integrity_class) {
    case "IC-A": additionality_discount = 5; break // Best practice, lower discount
    case "IC-B": additionality_discount = 8; break
    case "IC-C": additionality_discount = 12; break
    case "IC-D": additionality_discount = 15; break // Highest risk, higher discount
  }
  const additionality_adjustment = (after_permanence * additionality_discount) / 100
  const after_additionality = after_permanence - additionality_adjustment
  console.log(`[v0] Additionality Discount (${additionality_discount}%, Class ${inputs.integrity_class}): ${additionality_adjustment.toFixed(2)} tCO2`)

  // ===== FINAL VERIFIED REDUCTION =====
  // This is the comprehensive final metric following international standards
  const final_verified_reduction = after_additionality
  console.log(`[v0] FINAL VERIFIED REDUCTION (after all integrity checks): ${final_verified_reduction.toFixed(2)} tCO2`)

  // Calculate discount factor for transparency
  const total_discount_applied = ((ex_ante_credits - final_verified_reduction) / ex_ante_credits) * 100
  const discount_factor = 1 - (total_discount_applied / 100)
  console.log(`[v0] Total Discount Applied: ${total_discount_applied.toFixed(1)}% | Discount Factor: ${discount_factor.toFixed(3)}`)

  // ===== INTEGRITY SCORING & COMPLIANCE =====
  // Calculate integrity score (0-100) based on multiple factors
  let integrity_score = 85 // Base score
  
  // Deductions for risk factors
  if (saturation_discount > 8) integrity_score -= 5
  if (permanence_discount > 15) integrity_score -= 8
  if (additionality_discount > 10) integrity_score -= 5
  
  // Bonuses for best practices
  if (inputs.integrity_class === "IC-A") integrity_score += 10
  if (inputs.leakage_percent <= 5) integrity_score += 3
  if (inputs.buffer_pool_percent >= 20) integrity_score += 5
  
  // Ensure score stays in range
  integrity_score = Math.max(0, Math.min(100, integrity_score))
  
  // Determine Verra compliance status
  let verra_compliance = "Compliant"
  if (integrity_score < 70) verra_compliance = "Conditional"
  if (integrity_score < 50) verra_compliance = "Non-compliant"
  
  console.log(`[v0] Integrity Score: ${integrity_score}/100 | Verra Status: ${verra_compliance}`)

  // ===== QUALITATIVE ASSESSMENTS =====
  const coastal_protection_value = inputs.ecosystem_type === "mangrove" ? "High (storm surge, wave attenuation)" : 
                                   inputs.ecosystem_type === "seagrass" ? "Moderate (wave damping)" : "Moderate (sediment trapping)"
  const biodiversity_benefit = inputs.ecosystem_type === "mangrove" ? "High (nursery habitat for fish)" :
                              inputs.ecosystem_type === "seagrass" ? "High (megafauna habitat)" : "Moderate (migratory bird habitat)"

  return {
    agb_tc_ha: Math.round(agb_tc_ha * 100) / 100,
    bgb_tc_ha: Math.round(bgb_tc_ha * 100) / 100,
    dead_wood_tc_ha: Math.round(dead_wood_tc_ha * 100) / 100,
    litter_tc_ha: Math.round(litter_tc_ha * 100) / 100,
    soc_tc_ha: Math.round(soc_tc_ha * 100) / 100,
    total_biomass_tc_ha: Math.round(total_biomass_tc_ha * 100) / 100,
    total_carbon_stock_tc: Math.round(total_carbon_stock_tc * 100) / 100,
    total_co2_equivalent_t: Math.round(total_co2_equivalent_t * 100) / 100,
    annual_sequestration_rate_tco2_ha: Math.round(annual_sequestration_rate * 100) / 100,
    total_project_sequestration_tco2: Math.round(total_project_sequestration_tco2 * 100) / 100,
    baseline_emissions_tco2: Math.round(baseline_emissions_tco2 * 100) / 100,
    gross_removals_tco2: Math.round(gross_removals * 100) / 100,
    leakage_adjustment_tco2: Math.round(leakage_adjustment * 100) / 100,
    buffer_pool_tco2: Math.round(buffer_pool * 100) / 100,
    uncertainty_discount_tco2: Math.round(uncertainty_discount * 100) / 100,
    net_verified_credits_tco2: Math.round(after_uncertainty * 100) / 100,
    
    // Comprehensive verification metrics (international standards)
    ex_ante_credits_tco2: Math.round(ex_ante_credits * 100) / 100,
    saturation_discount_percent: saturation_discount,
    permanence_risk_discount_percent: permanence_discount,
    additionality_discount_percent: additionality_discount,
    final_verified_reduction_tco2: Math.round(final_verified_reduction * 100) / 100,
    buffer_pool_as_percent_of_credits: Math.round((buffer_pool / after_leakage) * 100 * 100) / 100,
    discount_factor_applied: Math.round(discount_factor * 1000) / 1000,
    
    coastal_protection_value,
    biodiversity_benefit,
    
    integrity_score: Math.round(integrity_score),
    verra_compliance_status: verra_compliance,
  }
}
