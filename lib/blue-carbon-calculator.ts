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

  // Additional metrics
  coastal_protection_value: string // Qualitative assessment
  biodiversity_benefit: string // Qualitative assessment
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
  const bgb_t_ha = inputs.bgb_ratio > 0 ? inputs.bgb_ratio * agb_t_ha : coeffs.bgb_agb_ratio * agb_t_ha
  const bgb_tc_ha = bgb_t_ha * coeffs.carbon_fraction
  console.log(`[v0] BGB: ${bgb_t_ha.toFixed(2)}t/ha × ${coeffs.carbon_fraction} = ${bgb_tc_ha.toFixed(2)} tC/ha`)

  // Dead Wood & Litter
  const dead_wood_t_ha = inputs.dead_wood_t_ha || agb_t_ha * coeffs.dead_wood_coefficient
  const dead_wood_tc_ha = dead_wood_t_ha * coeffs.carbon_fraction
  console.log(`[v0] Dead Wood: ${dead_wood_t_ha.toFixed(2)}t/ha × ${coeffs.carbon_fraction} = ${dead_wood_tc_ha.toFixed(2)} tC/ha`)

  const litter_t_ha = inputs.litter_t_ha || agb_t_ha * coeffs.litter_coefficient
  const litter_tc_ha = litter_t_ha * coeffs.carbon_fraction
  console.log(`[v0] Litter: ${litter_t_ha.toFixed(2)}t/ha × ${coeffs.carbon_fraction} = ${litter_tc_ha.toFixed(2)} tC/ha`)

  // SOC - Soil Organic Carbon (the most critical for blue carbon)
  // Can be provided directly or calculated from bulk density and organic matter
  let soc_tc_ha = inputs.soc_t_ha
  if (soc_tc_ha === 0 && inputs.bulk_density_g_cm3 > 0 && inputs.organic_matter_percent > 0) {
    // Calculate SOC from bulk density and organic matter percentage
    // SOC (t/ha) = bulk_density (g/cm³) × soil_depth (cm) × organic_matter (%) × 10
    soc_tc_ha = (inputs.bulk_density_g_cm3 * inputs.sediment_depth_cm * (inputs.organic_matter_percent / 100) * 10) / 100
  }
  console.log(`[v0] SOC (${inputs.soc_depth_m}m): ${soc_tc_ha.toFixed(2)} tC/ha`)

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

  // ===== STEP 9: Final verified credits =====
  const net_verified_credits = after_uncertainty
  console.log(`[v0] Final Verified Credits: ${net_verified_credits.toFixed(2)} tCO2`)

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
    net_verified_credits_tco2: Math.round(net_verified_credits * 100) / 100,
    coastal_protection_value,
    biodiversity_benefit,
  }
}
