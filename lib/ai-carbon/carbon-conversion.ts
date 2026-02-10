// IPCC-Aligned Carbon Conversion Engine with Integrity Discounts

import type { BiomassEstimate } from "./biomass-estimation"

export interface CarbonConversionInputs {
  biomass: BiomassEstimate
  area_ha: number
  project_duration_years: number
  baseline_agb_per_ha: number // Baseline scenario AGB
  leakage_percent: number // 0-100
  buffer_pool_percent: number // 0-100
  integrity_class: "IC-A" | "IC-B" | "IC-C" | "IC-F"
}

export interface CarbonCreditOutput {
  // Biomass to Carbon
  carbon_stock_tc: number // Total carbon in tonnes
  carbon_stock_tc_conservative: number // Using P10 estimate

  // Carbon to CO2
  co2_equivalent_tco2: number
  co2_conservative_tco2: number

  // Baseline adjustments
  baseline_carbon_tc: number
  baseline_co2_tco2: number
  gross_reduction_tco2: number

  // Deductions
  leakage_deduction_tco2: number
  buffer_pool_deduction_tco2: number
  net_after_deductions_tco2: number

  // Integrity discount
  integrity_discount_percent: number
  integrity_deduction_tco2: number

  // Final output
  final_verified_co2_tco2: number
  conservative_verified_co2_tco2: number // Using P10

  // Uncertainty range
  uncertainty_range: {
    min_tco2: number // P10
    median_tco2: number // P50
    max_tco2: number // P90
  }
}

/**
 * Convert biomass to carbon using IPCC carbon fraction (0.47)
 */
export function biomassToCarbon(agb_per_ha: number, area_ha: number): number {
  const CARBON_FRACTION = 0.47
  return agb_per_ha * CARBON_FRACTION * area_ha
}

/**
 * Convert carbon to CO2 equivalent using molecular weight ratio (44/12)
 */
export function carbonToCO2(carbon_tc: number): number {
  const CO2_CONVERSION_RATIO = 44 / 12
  return carbon_tc * CO2_CONVERSION_RATIO
}

export function convertCarbonToCO2(carbon_tc: number): number {
  return carbonToCO2(carbon_tc)
}

/**
 * Get integrity class discount factor
 */
export function getIntegrityDiscount(integrity_class: string): number {
  const discounts: Record<string, number> = {
    "IC-A": 5, // 5% discount
    "IC-B": 10, // 10% discount
    "IC-C": 20, // 20% discount
    "IC-F": 100, // 100% discount (failed)
  }
  return discounts[integrity_class] || 10
}

export function applyIntegrityDiscount(tco2_value: number, aura_score: number, integrity_class: string): number {
  const discount_percent = getIntegrityDiscount(integrity_class)
  const discount_amount = (tco2_value * discount_percent) / 100
  return Math.max(0, tco2_value - discount_amount)
}

/**
 * Complete carbon conversion with IPCC methodology
 */
export function convertTocarbonCredit(inputs: CarbonConversionInputs): CarbonCreditOutput {
  const { biomass, area_ha, baseline_agb_per_ha, leakage_percent, buffer_pool_percent, integrity_class } = inputs

  // Step 1: Biomass → Carbon (using mean and P10 for conservative)
  const carbon_stock_tc = biomassToCarbon(biomass.agb_mean, area_ha)
  const carbon_stock_tc_conservative = biomassToCarbon(biomass.agb_p10, area_ha)

  // Step 2: Carbon → CO2
  const co2_equivalent_tco2 = carbonToCO2(carbon_stock_tc)
  const co2_conservative_tco2 = carbonToCO2(carbon_stock_tc_conservative)

  // Step 3: Baseline scenario
  const baseline_carbon_tc = biomassToCarbon(baseline_agb_per_ha, area_ha)
  const baseline_co2_tco2 = carbonToCO2(baseline_carbon_tc)

  // Step 4: Gross reduction (use conservative P10)
  let gross_reduction_tco2 = co2_conservative_tco2 - baseline_co2_tco2
  if (gross_reduction_tco2 < 0) gross_reduction_tco2 = 0

  // Step 5: Leakage deduction
  const leakage_deduction_tco2 = (gross_reduction_tco2 * leakage_percent) / 100
  const after_leakage = gross_reduction_tco2 - leakage_deduction_tco2

  // Step 6: Buffer pool deduction
  const buffer_pool_deduction_tco2 = (after_leakage * buffer_pool_percent) / 100
  const net_after_deductions_tco2 = after_leakage - buffer_pool_deduction_tco2

  // Step 7: Integrity class discount
  const integrity_discount_percent = getIntegrityDiscount(integrity_class)
  const integrity_deduction_tco2 = (net_after_deductions_tco2 * integrity_discount_percent) / 100
  const final_verified_co2_tco2 = Math.max(0, net_after_deductions_tco2 - integrity_deduction_tco2)

  // Conservative estimate using P10
  const conservative_verified_co2_tco2 = final_verified_co2_tco2

  // Uncertainty range
  const co2_p10 = carbonToCO2(biomassToCarbon(biomass.agb_p10, area_ha))
  const co2_p50 = carbonToCO2(biomassToCarbon(biomass.agb_p50, area_ha))
  const co2_p90 = carbonToCO2(biomassToCarbon(biomass.agb_p90, area_ha))

  return {
    carbon_stock_tc: Math.round(carbon_stock_tc * 100) / 100,
    carbon_stock_tc_conservative: Math.round(carbon_stock_tc_conservative * 100) / 100,
    co2_equivalent_tco2: Math.round(co2_equivalent_tco2 * 100) / 100,
    co2_conservative_tco2: Math.round(co2_conservative_tco2 * 100) / 100,
    baseline_carbon_tc: Math.round(baseline_carbon_tc * 100) / 100,
    baseline_co2_tco2: Math.round(baseline_co2_tco2 * 100) / 100,
    gross_reduction_tco2: Math.round(gross_reduction_tco2 * 100) / 100,
    leakage_deduction_tco2: Math.round(leakage_deduction_tco2 * 100) / 100,
    buffer_pool_deduction_tco2: Math.round(buffer_pool_deduction_tco2 * 100) / 100,
    net_after_deductions_tco2: Math.round(net_after_deductions_tco2 * 100) / 100,
    integrity_discount_percent,
    integrity_deduction_tco2: Math.round(integrity_deduction_tco2 * 100) / 100,
    final_verified_co2_tco2: Math.round(final_verified_co2_tco2 * 100) / 100,
    conservative_verified_co2_tco2: Math.round(conservative_verified_co2_tco2 * 100) / 100,
    uncertainty_range: {
      min_tco2: Math.round((co2_p10 - baseline_co2_tco2) * 100) / 100,
      median_tco2: Math.round((co2_p50 - baseline_co2_tco2) * 100) / 100,
      max_tco2: Math.round((co2_p90 - baseline_co2_tco2) * 100) / 100,
    },
  }
}
