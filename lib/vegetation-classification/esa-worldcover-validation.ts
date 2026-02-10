// ESA WorldCover Cross-Validation Module
// Validates vegetation classifications against ESA WorldCover 10m dataset
// Computes confusion matrix, accuracy metrics, and integrity adjustments

export interface ESAWorldCoverValidation {
  agreement_percentage: number // % pixels matching ESA labels
  confusion_matrix: Record<string, Record<string, number>>
  user_accuracy: Record<string, number>
  producer_accuracy: Record<string, number>
  kappa_statistic: number
  integrity_adjustment_factor: number // 0-1 penalty multiplier
  validation_status: "PASS" | "WARNING" | "FAIL"
  message: string
}

export interface AuraSubnetConsensus {
  miner_votes: Array<{
    miner_id: string
    role: "Feature Extractor" | "Classifier" | "Area Validator" | "ESA Cross-Checker"
    class_prediction: string
    confidence: number
    agreement: boolean
  }>
  consensus_probability: number // 0-1 agreement score
  integrity_class: "IC-A" | "IC-B" | "IC-C"
  integrity_penalty: number // 0-1 discount factor
  validator_summary: string
}

/**
 * Validate against ESA WorldCover labels
 * Simulates comparison with ESA 10m dataset
 */
export function validateAgainstESAWorldCover(classifiedPixels: string[], esaLabels: string[]): ESAWorldCoverValidation {
  if (classifiedPixels.length !== esaLabels.length) {
    throw new Error("Classified pixels and ESA labels must have same length")
  }

  // Simplified confusion matrix (production would use real ESA data)
  const confusionMatrix: Record<string, Record<string, number>> = {}
  let matchCount = 0

  classifiedPixels.forEach((classified, idx) => {
    const esa = esaLabels[idx]

    if (!confusionMatrix[classified]) {
      confusionMatrix[classified] = {}
    }
    if (!confusionMatrix[classified][esa]) {
      confusionMatrix[classified][esa] = 0
    }

    confusionMatrix[classified][esa]++

    if (classified === esa) {
      matchCount++
    }
  })

  const agreementPercentage = (matchCount / classifiedPixels.length) * 100

  // Calculate accuracies
  const userAccuracy: Record<string, number> = {}
  const producerAccuracy: Record<string, number> = {}

  Object.keys(confusionMatrix).forEach((classLabel) => {
    const classTotal = Object.values(confusionMatrix[classLabel]).reduce((a, b) => a + b, 0)
    const correctCount = confusionMatrix[classLabel][classLabel] || 0
    userAccuracy[classLabel] = classTotal > 0 ? (correctCount / classTotal) * 100 : 0

    const columnTotal = Object.keys(confusionMatrix).reduce(
      (sum, row) => sum + (confusionMatrix[row][classLabel] || 0),
      0,
    )
    producerAccuracy[classLabel] = columnTotal > 0 ? (correctCount / columnTotal) * 100 : 0
  })

  // Simplified Kappa statistic (0-1 range)
  const kappaStatistic = agreementPercentage > 80 ? 0.85 : agreementPercentage > 60 ? 0.65 : 0.45

  // Determine integrity adjustment
  let integrityAdjustmentFactor = 1.0
  let status: "PASS" | "WARNING" | "FAIL" = "PASS"
  let message = "Classification agrees with ESA WorldCover baseline"

  if (agreementPercentage < 80) {
    integrityAdjustmentFactor = 0.85
    status = "WARNING"
    message = "Moderate disagreement with ESA (80-95% recommended for carbon claims)"
  }

  if (agreementPercentage < 60) {
    integrityAdjustmentFactor = 0.65
    status = "FAIL"
    message = "Low agreement with ESA WorldCover (<60%). Carbon eligibility significantly reduced."
  }

  return {
    agreement_percentage: agreementPercentage,
    confusion_matrix: confusionMatrix,
    user_accuracy: userAccuracy,
    producer_accuracy: producerAccuracy,
    kappa_statistic: kappaStatistic,
    integrity_adjustment_factor: integrityAdjustmentFactor,
    validation_status: status,
    message,
  }
}

/**
 * Simulate Aura Subnet validator consensus
 * In production, this would call actual subnet miners
 */
export function runAuraSubnetConsensus(
  classifiedPixels: string[],
  classConfidences: number[],
  area_ha: number,
): AuraSubnetConsensus {
  const totalPixels = classifiedPixels.length
  const meanConfidence = classConfidences.reduce((a, b) => a + b, 0) / classConfidences.length

  // Simulate 4 validators with different roles
  const miners = [
    {
      miner_id: "miner_0xa13f...",
      role: "Feature Extractor" as const,
      confidence: 0.92,
    },
    {
      miner_id: "miner_0xb912...",
      role: "Classifier" as const,
      confidence: 0.88,
    },
    {
      miner_id: "miner_0xc456...",
      role: "Area Validator" as const,
      confidence: 0.91,
    },
    {
      miner_id: "miner_0xd789...",
      role: "ESA Cross-Checker" as const,
      confidence: 0.85,
    },
  ]

  const consensusProbability = miners.reduce((sum, m) => sum + m.confidence, 0) / miners.length

  // Determine integrity class
  let integrityClass: "IC-A" | "IC-B" | "IC-C" = "IC-A"
  if (consensusProbability < 0.85) {
    integrityClass = "IC-B"
  }
  if (consensusProbability < 0.75) {
    integrityClass = "IC-C"
  }

  // Integrity penalty (discount factor)
  const integrityPenalty = integrityClass === "IC-A" ? 0.05 : integrityClass === "IC-B" ? 0.15 : 0.35

  return {
    miner_votes: miners.map((m) => ({
      ...m,
      class_prediction: classifiedPixels[0] || "Unknown",
      agreement: true,
    })),
    consensus_probability: Math.round(consensusProbability * 1000) / 1000,
    integrity_class: integrityClass,
    integrity_penalty: integrityPenalty,
    validator_summary: `Aura Subnet consensus (${miners.length} validators): ${(consensusProbability * 100).toFixed(1)}% agreement. Integrity Class ${integrityClass} (${(integrityPenalty * 100).toFixed(0)}% carbon discount applied).`,
  }
}
