export interface CarbonCalculationInputs {
  agb_per_ha: number // Aboveground biomass (tonnes/hectare)
  carbon_fraction: number // Default: 0.47
  area_ha: number // Project area (hectares)
  baseline_emission: number // Baseline emissions (tCO2/ha/year)
  duration_years: number // Project duration (years)
  leakage: number // Leakage percentage (0-100)
  buffer_pool: number // Buffer pool deduction percentage (0-100)
  integrity_class: string // IC-A, IC-B, IC-C, IC-D
  validator_consensus: number // 0-1
}

export interface CarbonCalculationResult {
  agb_per_ha: number
  carbon_fraction: number
  area_ha: number
  tC_per_ha: number // Added per-hectare carbon value for verification
  tCO2_per_ha: number // Added tCO2/Ha output for verification
  raw_carbon_stock_tc: number
  converted_co2_tco2: number // This should be tCO2_per_ha × area_ha
  baseline_emissions_total_tco2: number
  gross_reduction_tco2: number
  leakage_adjustment_percent: number
  leakage_reduction_tco2: number
  buffer_pool_percent: number
  buffer_reduction_tco2: number
  net_reduction_tco2: number
  integrity_class_factor: number
  integrity_class_adjustment_tco2: number
  final_verified_reduction_tco2: number
}

export function calculateCarbonReduction(inputs: CarbonCalculationInputs): CarbonCalculationResult {
  console.log("[v0] Carbon Calculation Started")
  console.log("[v0] Input - Area: " + inputs.area_ha + " Ha, AGB/Ha: " + inputs.agb_per_ha + " t/ha")

  // Step 1: Calculate carbon stock per hectare then total
  const tC_per_ha = inputs.agb_per_ha * inputs.carbon_fraction
  const tC_total = tC_per_ha * inputs.area_ha
  console.log("[v0] Step 1 - Carbon Stock: AGB/Ha × 0.47 = " + tC_per_ha.toFixed(2) + " tC/ha")
  console.log(
    "[v0] Step 1 - Total Carbon: " +
      tC_per_ha.toFixed(2) +
      " × " +
      inputs.area_ha +
      " = " +
      tC_total.toFixed(2) +
      " tC",
  )

  // Step 2: Convert carbon → CO₂ using IPCC ratio (44/12)
  const tCO2_per_ha = tC_per_ha * (44 / 12)
  const tCO2_total = tCO2_per_ha * inputs.area_ha
  console.log("[v0] Step 2 - CO2/Ha: " + tC_per_ha.toFixed(2) + " × (44/12) = " + tCO2_per_ha.toFixed(2) + " tCO2/ha")
  console.log(
    "[v0] Step 2 - Total CO2: " +
      tCO2_per_ha.toFixed(2) +
      " × " +
      inputs.area_ha +
      " = " +
      tCO2_total.toFixed(2) +
      " tCO2",
  )

  // Step 3: Calculate baseline-adjusted reduction
  const baseline_total_tCO2 = inputs.baseline_emission * inputs.area_ha * inputs.duration_years
  let gross_reduction = tCO2_total - baseline_total_tCO2
  console.log(
    "[v0] Step 3 - Baseline: " +
      inputs.baseline_emission +
      " × " +
      inputs.area_ha +
      " × " +
      inputs.duration_years +
      " = " +
      baseline_total_tCO2.toFixed(2) +
      " tCO2",
  )
  console.log(
    "[v0] Step 3 - Gross Reduction: " +
      tCO2_total.toFixed(2) +
      " - " +
      baseline_total_tCO2.toFixed(2) +
      " = " +
      gross_reduction.toFixed(2) +
      " tCO2",
  )

  // Ensure minimum zero floor
  if (gross_reduction < 0) {
    gross_reduction = 0
  }

  // Step 4: Apply leakage adjustment
  const leakage_reduction = (gross_reduction * inputs.leakage) / 100
  let net_after_leakage = gross_reduction * (1 - inputs.leakage / 100)

  if (net_after_leakage < 0) {
    net_after_leakage = 0
  }

  // Step 5: Apply buffer pool deduction
  const buffer_reduction = (net_after_leakage * inputs.buffer_pool) / 100
  let net_reduction = net_after_leakage * (1 - inputs.buffer_pool / 100)

  if (net_reduction < 0) {
    net_reduction = 0
  }

  // Step 6: Map integrity class to uncertainty adjustment factor
  const integrityClassFactors: Record<string, number> = {
    "IC-A": 0.02, // 2% uncertainty
    "IC-B": 0.05, // 5% uncertainty
    "IC-C": 0.1, // 10% uncertainty
    "IC-D": 0.15, // 15% uncertainty
  }

  const integrity_class_factor = integrityClassFactors[inputs.integrity_class] || 0.05

  // Step 7: Apply integrity class adjustment
  const adjusted_reduction = net_reduction * (1 - integrity_class_factor)
  console.log(
    "[v0] Step 7 - Final: " +
      net_reduction.toFixed(2) +
      " × (1 - " +
      integrity_class_factor +
      ") = " +
      adjusted_reduction.toFixed(2) +
      " tCO2",
  )

  return {
    agb_per_ha: inputs.agb_per_ha,
    carbon_fraction: inputs.carbon_fraction,
    area_ha: inputs.area_ha,
    tC_per_ha: Math.round(tC_per_ha * 100) / 100, // New field
    tCO2_per_ha: Math.round(tCO2_per_ha * 100) / 100, // Corrected per-hectare value
    raw_carbon_stock_tc: Math.round(tC_total * 100) / 100,
    converted_co2_tco2: Math.round(tCO2_total * 100) / 100,
    baseline_emissions_total_tco2: Math.round(baseline_total_tCO2 * 100) / 100,
    gross_reduction_tco2: Math.round(gross_reduction * 100) / 100,
    leakage_adjustment_percent: inputs.leakage,
    leakage_reduction_tco2: Math.round(leakage_reduction * 100) / 100,
    buffer_pool_percent: inputs.buffer_pool,
    buffer_reduction_tco2: Math.round(buffer_reduction * 100) / 100,
    net_reduction_tco2: Math.round(net_reduction * 100) / 100,
    integrity_class_factor: integrity_class_factor,
    integrity_class_adjustment_tco2: Math.round(net_reduction * integrity_class_factor * 100) / 100,
    final_verified_reduction_tco2: Math.round(adjusted_reduction * 100) / 100,
  }
}
