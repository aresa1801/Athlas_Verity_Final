/**
 * Verification Integration - Connects form data to result generation
 * This module bridges the gap between the form submission and verification result generation
 */

import { generateVerificationResult } from '@/lib/verification-result-generator'
import { VerificationFormData, ProjectVerificationResult } from '@/lib/schemas/verification-result'

/**
 * Process form submission for verification
 */
export async function processVerificationSubmission(
  formData: any,
  satelliteGeoJSON: any
): Promise<ProjectVerificationResult> {
  try {
    // Transform form data to verification form data structure
    const verificationFormData: VerificationFormData = {
      projectName: formData.projectName,
      projectDescription: `Satellite-verified carbon project with polygon boundary. Area: ${formData.dataLuasan}. Date range: ${formData.dateRange?.start || '2020-01-01'} to ${formData.dateRange?.end || new Date().toISOString().split('T')[0]}.`,
      projectArea: parseFloat(formData.dataLuasan) || 0,
      dateRange: formData.dateRange || {
        start: '2020-01-01',
        end: new Date().toISOString().split('T')[0],
      },
      carbonOffsetType: 'Forest Conservation',
      
      ownerName: formData.ownerName || 'Project Owner',
      ownerEmail: formData.ownerEmail || '',
      ownerPhone: formData.ownerPhone || '',
      
      agb: parseFloat(formData.agb) || 124.93,
      carbonFraction: parseFloat(formData.carbonFraction) || 0.47,
      projectDuration: parseInt(formData.projectDuration) || 10,
      baselineEmissionsRate: parseFloat(formData.baselineEmissionsRate) || 1.8,
      
      // Vegetation data from satellite analysis
      vegetationClassifications: formData.vegetationClassifications || [],
      vegetationDescription: formData.vegetationDescription || '',
      ndvi: parseFloat(formData.ndviValue) || 0.65,
      
      // Raw data
      satelliteDataFile: formData.satelliteDataFile,
      rawGeoJSON: satelliteGeoJSON,
    }

    // Generate comprehensive verification result
    const result = generateVerificationResult(
      verificationFormData,
      {
        dataQuality: 0.89,
        areaMatching: 1.0,
      }
    )

    console.log('[v0] Verification result generated:', {
      reportId: result.reportId,
      projectName: result.projectName,
      carbonReduction: result.carbonReductionResult.finalVerifiedReduction,
      verificationStatus: result.verificationStatus,
    })

    return result
  } catch (error) {
    console.error('[v0] Error processing verification:', error)
    throw new Error(`Verification processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Export verification result as JSON
 */
export function exportVerificationResultAsJSON(result: ProjectVerificationResult): string {
  return JSON.stringify(result, null, 2)
}

/**
 * Export verification result as CSV for tabular data
 */
export function exportVerificationResultAsCSV(result: ProjectVerificationResult): string {
  const lines: string[] = []
  
  // Header
  lines.push('Field,Value')
  
  // Project Info
  lines.push(`Project Name,"${result.projectName}"`)
  lines.push(`Project Area (ha),${result.projectArea}`)
  lines.push(`Verification Status,${result.verificationStatus}`)
  lines.push(`Owner Name,"${result.ownerName}"`)
  
  // Verification Scores
  lines.push('') // Blank line
  lines.push('Verification Scores')
  lines.push(`Integrity Class,${result.scores.integrityClass}`)
  lines.push(`Aura Score,${result.scores.auraScore}%`)
  lines.push(`Authenticity Score,${result.scores.authenticitySCore}%`)
  lines.push(`Validator Consensus,${result.scores.validatorConsensus}%`)
  
  // Carbon Results
  lines.push('') // Blank line
  lines.push('Carbon Reduction Results (tCO2e)')
  lines.push(`Gross Reduction,${result.carbonReductionResult.grossReduction}`)
  lines.push(`Leakage Adjustment,${result.carbonReductionResult.leakageAdjustment}`)
  lines.push(`Buffer Pool Deduction,${result.carbonReductionResult.bufferPoolDeduction}`)
  lines.push(`Final Verified Reduction,${result.carbonReductionResult.finalVerifiedReduction}`)
  
  // Vegetation Cover
  lines.push('') // Blank line
  lines.push('Vegetation Cover Distribution')
  for (const vc of result.vegetationCover) {
    lines.push(`"${vc.classification}",${vc.areaHa},${vc.percentage}%`)
  }
  
  return lines.join('\n')
}

/**
 * Generate summary statistics for verification result
 */
export function getVerificationSummary(result: ProjectVerificationResult): {
  projectName: string
  area: string
  status: string
  auraScore: number
  carbonReduction: number
  topVegetation: string
  verificationId: string
} {
  const topVegetation = result.vegetationCover.length > 0
    ? result.vegetationCover.reduce((max, vc) => vc.areaHa > max.areaHa ? vc : max)
    : { classification: 'Mixed' }

  return {
    projectName: result.projectName,
    area: `${result.projectArea.toLocaleString()} ha`,
    status: result.verificationStatus,
    auraScore: result.scores.auraScore,
    carbonReduction: Math.round(result.carbonReductionResult.finalVerifiedReduction),
    topVegetation: topVegetation.classification,
    verificationId: result.reportId,
  }
}
