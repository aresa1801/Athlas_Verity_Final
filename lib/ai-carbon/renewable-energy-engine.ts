import { AuraConsensusScorer } from "./aura-consensus"

export type TechnologyType = "solar" | "wind" | "hydro" | "geothermal"
export type GridEmissionSource = "national_average" | "iec_report" | "operator_specific" | "iea_dataset"

// Grid emission factors by country (tCO2/MWh) - IEA baseline
const GRID_EMISSION_FACTORS: Record<string, number> = {
  "China": 0.57,
  "India": 0.67,
  "United States": 0.41,
  "Germany": 0.38,
  "Brazil": 0.12,
  "Indonesia": 0.71,
  "Mexico": 0.51,
  "Vietnam": 0.59,
  "Australia": 0.82,
  "South Africa": 0.97,
}

// IEA/IPCC acceptable ranges per technology region
const GRID_FACTOR_BOUNDS: Record<string, [number, number]> = {
  "developed": [0.25, 0.65],
  "developing": [0.45, 0.95],
  "transition": [0.35, 0.75],
}

interface RenewableEnergyInput {
  technologyType: TechnologyType
  installedCapacityMW: number
  annualMWhGenerated: number
  gridCountry: string
  gridEmissionFactor: number
  gridEmissionSource: GridEmissionSource
  commissioningDate: string
  irr: number
  regulatorySupport: boolean
  marketPenetration: number
  metersPresent: boolean
  mwhValidated: boolean
  projectArea: number
  dataCompleteness: number
}

interface RenewableEnergyOutput {
  mwh_validated: {
    annual_mwh: number
    capacity_factor: number
    validation_status: "valid" | "flagged" | "invalid"
    plausibility_pct: number
  }
  grid_factor_verified: {
    factor_tco2_mwh: number
    source: string
    confidence: number
    bounds_check: "compliant" | "warning" | "out_of_bounds"
  }
  emission_reduction: {
    base_er_tco2e: number
    annual_er_tco2e: number
    uncertainty_pct: number
  }
  additionality: {
    irr_without_carbon: number
    regulatory_support: boolean
    market_penetration_score: number
    additionality_confidence: number
    risk_of_non_additionality: string
  }
  conservative_adjustment: {
    adjustment_factor: number
    justification: string
  }
  risk_adjustment: {
    data_quality_penalty: number
    technology_penalty: number
    net_adjustment_pct: number
  }
  aura_verification: {
    anomaly_score: number
    mwh_pattern_confidence: number
    plausibility_check: boolean
    integrity_class: "A" | "B" | "C" | "D"
  }
  final_verified_tco2e: number
  audit_trail: string[]
}

export class RenewableEnergyCalculationEngine {
  private auraScorer = new AuraConsensusScorer()

  async calculateRenewableEnergyCredits(input: RenewableEnergyInput): Promise<RenewableEnergyOutput> {
    const auditTrail: string[] = []

    // STEP 1: Data Validation
    auditTrail.push(`[Step 1] Technology: ${input.technologyType.toUpperCase()}`)
    auditTrail.push(`[Step 1] Capacity: ${input.installedCapacityMW} MW`)
    const mwhValidation = this.validateMWhData(input)
    auditTrail.push(`[Step 1] Annual MWh validated: ${mwhValidation.validation_status}`)
    auditTrail.push(`[Step 1] Plausibility: ${mwhValidation.plausibility_pct.toFixed(1)}%`)

    // STEP 2: Base Emission Reduction Calculation
    const baseER = this.calculateBaseEmissionReduction(input)
    auditTrail.push(`[Step 2] Base ER: ${baseER.base_er_tco2e.toFixed(2)} tCO2e`)
    auditTrail.push(`[Step 2] Annual ER: ${baseER.annual_er_tco2e.toFixed(2)} tCO2e/year`)

    // STEP 3: Baseline Plausibility Check
    const gridFactorVerification = this.verifyGridEmissionFactor(input)
    auditTrail.push(`[Step 3] Grid factor: ${gridFactorVerification.factor_tco2_mwh.toFixed(4)} tCO2/MWh`)
    auditTrail.push(`[Step 3] Grid factor bounds check: ${gridFactorVerification.bounds_check}`)
    auditTrail.push(`[Step 3] Grid factor source: ${gridFactorVerification.source}`)

    // STEP 4: Additionality Confidence Logic
    const additionality = this.assessAdditionality(input)
    auditTrail.push(`[Step 4] IRR without carbon: ${additionality.irr_without_carbon.toFixed(2)}%`)
    auditTrail.push(`[Step 4] Regulatory support: ${additionality.regulatory_support ? "Yes" : "No"}`)
    auditTrail.push(`[Step 4] Market penetration: ${additionality.market_penetration_score.toFixed(1)}%`)
    auditTrail.push(`[Step 4] Additionality confidence: ${additionality.additionality_confidence.toFixed(1)}/100`)

    // STEP 5: Conservative Adjustment
    const conservativeAdj = this.calculateConservativeAdjustment(input, additionality)
    auditTrail.push(`[Step 5] Conservative adjustment factor: ${conservativeAdj.adjustment_factor.toFixed(3)}`)
    auditTrail.push(`[Step 5] Justification: ${conservativeAdj.justification}`)

    // Risk-based adjustments
    const riskAdj = this.calculateRiskAdjustment(input, mwhValidation)
    auditTrail.push(`[Step 5] Data quality penalty: ${riskAdj.data_quality_penalty.toFixed(1)}%`)
    auditTrail.push(`[Step 5] Technology penalty: ${riskAdj.technology_penalty.toFixed(1)}%`)
    auditTrail.push(`[Step 5] Net risk adjustment: ${riskAdj.net_adjustment_pct.toFixed(1)}%`)

    // STEP 6: AURA Subnet Verification
    const auraVerification = await this.performAuraVerification(input, mwhValidation, baseER)
    auditTrail.push(`[Step 6] AURA anomaly score: ${auraVerification.anomaly_score.toFixed(1)}/100`)
    auditTrail.push(`[Step 6] AURA MWh pattern confidence: ${auraVerification.mwh_pattern_confidence.toFixed(1)}/100`)
    auditTrail.push(`[Step 6] AURA plausibility check: ${auraVerification.plausibility_check ? "PASS" : "FAIL"}`)
    auditTrail.push(`[Step 6] AURA integrity class: ${auraVerification.integrity_class}`)

    // Final Calculation
    const adjusFactor = (1 - riskAdj.net_adjustment_pct / 100) * conservativeAdj.adjustment_factor
    const finalVerifiedTCO2e = baseER.annual_er_tco2e * adjusFactor
    auditTrail.push(`[Final] Final verified tCO2e: ${finalVerifiedTCO2e.toFixed(2)} tCO2e/year`)

    return {
      mwh_validated: mwhValidation,
      grid_factor_verified: gridFactorVerification,
      emission_reduction: baseER,
      additionality,
      conservative_adjustment: conservativeAdj,
      risk_adjustment: riskAdj,
      aura_verification: auraVerification,
      final_verified_tco2e: finalVerifiedTCO2e,
      audit_trail: auditTrail,
    }
  }

  private validateMWhData(input: RenewableEnergyInput): {
    annual_mwh: number
    capacity_factor: number
    validation_status: "valid" | "flagged" | "invalid"
    plausibility_pct: number
  } {
    const hoursPerYear = 8760
    const theoreticalMax = input.installedCapacityMW * hoursPerYear
    const actualCapacityFactor = input.annualMWhGenerated / theoreticalMax

    // Typical capacity factors by technology
    const typicalCF: Record<TechnologyType, [number, number]> = {
      solar: [0.15, 0.25],
      wind: [0.25, 0.45],
      hydro: [0.4, 0.6],
      geothermal: [0.7, 0.95],
    }
    const [minCF, maxCF] = typicalCF[input.technologyType]

    let validationStatus: "valid" | "flagged" | "invalid" = "valid"
    let plausibility = 100

    if (actualCapacityFactor < minCF || actualCapacityFactor > maxCF) {
      validationStatus = "flagged"
      plausibility = 70
    }

    if (!input.mwhValidated || !input.metersPresent) {
      validationStatus = "flagged"
      plausibility = Math.max(plausibility - 20, 50)
    }

    return {
      annual_mwh: input.annualMWhGenerated,
      capacity_factor: actualCapacityFactor,
      validation_status: validationStatus,
      plausibility_pct: plausibility,
    }
  }

  private calculateBaseEmissionReduction(input: RenewableEnergyInput): {
    base_er_tco2e: number
    annual_er_tco2e: number
    uncertainty_pct: number
  } {
    const baseER = input.annualMWhGenerated * input.gridEmissionFactor
    return {
      base_er_tco2e: baseER,
      annual_er_tco2e: baseER,
      uncertainty_pct: 8,
    }
  }

  private verifyGridEmissionFactor(input: RenewableEnergyInput): {
    factor_tco2_mwh: number
    source: string
    confidence: number
    bounds_check: "compliant" | "warning" | "out_of_bounds"
  } {
    const countryFactor = GRID_EMISSION_FACTORS[input.gridCountry] || input.gridEmissionFactor
    const regionalClassification = this.classifyRegion(input.gridCountry)
    const bounds = GRID_FACTOR_BOUNDS[regionalClassification]

    let boundsCheck: "compliant" | "warning" | "out_of_bounds" = "compliant"
    let confidence = 90

    if (input.gridEmissionFactor < bounds[0] || input.gridEmissionFactor > bounds[1]) {
      boundsCheck = "out_of_bounds"
      confidence = 50
    }

    // Source credibility
    if (input.gridEmissionSource === "national_average") confidence += 10
    else if (input.gridEmissionSource === "iec_report") confidence += 5
    else confidence -= 5

    return {
      factor_tco2_mwh: countryFactor,
      source: input.gridEmissionSource,
      confidence: Math.min(confidence, 100),
      bounds_check: boundsCheck,
    }
  }

  private assessAdditionality(input: RenewableEnergyInput): {
    irr_without_carbon: number
    regulatory_support: boolean
    market_penetration_score: number
    additionality_confidence: number
    risk_of_non_additionality: string
  } {
    const irrWithoutCarbon = input.irr - 2 // Estimate: 2% reduction without carbon credits
    let addConfidence = 50

    if (irrWithoutCarbon < 8) addConfidence += 30
    else if (irrWithoutCarbon < 12) addConfidence += 15
    else addConfidence -= 10

    if (input.regulatorySupport) addConfidence += 20
    if (input.marketPenetration < 20) addConfidence += 15
    else if (input.marketPenetration > 50) addConfidence -= 15

    const riskLevel =
      addConfidence > 80
        ? "Low - Project is clearly additional"
        : addConfidence > 60
          ? "Moderate - Project is likely additional"
          : "High - Additionality may be questionable"

    return {
      irr_without_carbon: irrWithoutCarbon,
      regulatory_support: input.regulatorySupport,
      market_penetration_score: input.marketPenetration,
      additionality_confidence: Math.min(addConfidence, 100),
      risk_of_non_additionality: riskLevel,
    }
  }

  private calculateConservativeAdjustment(input: RenewableEnergyInput, additionality: any): {
    adjustment_factor: number
    justification: string
  } {
    let adjustment = 0.95 // Base 5% deduction

    if (additionality.additionality_confidence < 70) adjustment -= 0.05
    if (!input.regulatorySupport) adjustment -= 0.03
    if (input.marketPenetration > 50) adjustment -= 0.02

    const adjustmentPct = (1 - adjustment) * 100
    return {
      adjustment_factor: adjustment,
      justification: `Conservative ${adjustmentPct.toFixed(1)}% deduction applied based on additionality and market conditions`,
    }
  }

  private calculateRiskAdjustment(input: RenewableEnergyInput, mwhValidation: any): {
    data_quality_penalty: number
    technology_penalty: number
    net_adjustment_pct: number
  } {
    const dataQualityPenalty = (1 - input.dataCompleteness / 100) * 10
    const validationPenalty = mwhValidation.validation_status === "invalid" ? 10 : 0

    const techPenalties: Record<TechnologyType, number> = {
      solar: 2,
      wind: 3,
      hydro: 1,
      geothermal: 1,
    }
    const techPenalty = techPenalties[input.technologyType]

    const netAdjustment = dataQualityPenalty + validationPenalty + techPenalty
    return {
      data_quality_penalty: dataQualityPenalty,
      technology_penalty: techPenalty,
      net_adjustment_pct: Math.min(netAdjustment, 15),
    }
  }

  private async performAuraVerification(
    input: RenewableEnergyInput,
    mwhValidation: any,
    baseER: any,
  ): Promise<{
    anomaly_score: number
    mwh_pattern_confidence: number
    plausibility_check: boolean
    integrity_class: "A" | "B" | "C" | "D"
  }> {
    // Anomaly detection on MWh generation patterns
    const anomalyScore = Math.max(0, 100 - Math.abs(mwhValidation.capacity_factor - 0.35) * 100)
    const mwhConfidence = mwhValidation.plausibility_pct
    const plausibilityPass = anomalyScore > 70 && mwhConfidence > 75

    let integrityClass: "A" | "B" | "C" | "D" = "C"
    if (anomalyScore > 90 && mwhConfidence > 90) integrityClass = "A"
    else if (anomalyScore > 80 && mwhConfidence > 80) integrityClass = "B"
    else if (anomalyScore > 60 && mwhConfidence > 60) integrityClass = "C"
    else integrityClass = "D"

    return {
      anomaly_score: anomalyScore,
      mwh_pattern_confidence: mwhConfidence,
      plausibility_check: plausibilityPass,
      integrity_class: integrityClass,
    }
  }

  private classifyRegion(country: string): string {
    const developed = ["Germany", "United States", "Australia"]
    const transition = ["China", "Mexico", "Brazil"]
    return developed.includes(country) ? "developed" : transition.includes(country) ? "transition" : "developing"
  }
}
