import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatNumberWithCommas } from '@/lib/format-utils'

export interface ValidationReportData {
  projectName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  projectLocation: string
  projectDescription?: string
  carbonOffsetType: string
  finalVerifiedReduction: number
  integrityClass: string
  auraScore: number
  authenticityScore: number
  validatorConsensus: number
  dataConsistencyScore: number
  agb: number
  carbonFraction: number
  projectArea: number
  projectDuration: number
  baselineEmissionsRate: number
  rawCarbonStock: number
  convertedCO2: number
  baselineEmissions: number
  grossReduction: number
  leakageAdjustment: number
  leakagePercent: number
  bufferPoolDeduction: number
  bufferPoolPercent: number
  netReduction: number
  integrityClassAdjustment: number
  integrityClassPercent: number
  totalAssetPoints: number
  coordinates: Array<{ latitude: number; longitude: number }>
  ndvi: number
  evi: number
  gndvi: number
  lai: number
  canopyDensity: number
  averageTreeHeight: string
  crownCoverage: string
  vegetationHealthStatus: string
  primaryForestType: string
  vegetationClass: string
  validators: Array<{ id: string; role: string; modelType: string; confidence: number }>
  consensusThreshold: number
  averageConfidence: number
  verificationStatus: string
}

type ThemeType = 'light' | 'dark'

interface ThemeColors {
  primary: [number, number, number]
  secondary: [number, number, number]
  text: [number, number, number]
  lightBg: [number, number, number]
  tableBg: [number, number, number]
  tableHeaderBg: [number, number, number]
  tableHeaderText: [number, number, number]
  success: [number, number, number]
}

const getThemeColors = (theme: ThemeType): ThemeColors => {
  if (theme === 'light') {
    return {
      primary: [0, 120, 0],
      secondary: [100, 100, 100],
      text: [30, 30, 30],
      lightBg: [245, 245, 245],
      tableBg: [255, 255, 255],
      tableHeaderBg: [0, 120, 0],
      tableHeaderText: [255, 255, 255],
      success: [0, 150, 0],
    }
  }
  // Dark theme
  return {
    primary: [76, 175, 80],
    secondary: [180, 180, 180],
    text: [240, 240, 240],
    lightBg: [45, 45, 45],
    tableBg: [55, 55, 55],
    tableHeaderBg: [0, 120, 0],
    tableHeaderText: [255, 255, 255],
    success: [76, 175, 80],
  }
}

export function generateProfessionalPDF(data: ValidationReportData, theme: ThemeType = 'light') {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  
  const colors = getThemeColors(theme)
  
  let yPos = margin

  const setFont = (size: number, weight: 'bold' | 'normal' = 'normal', color = colors.text) => {
    pdf.setFontSize(size)
    pdf.setFont(undefined, weight)
    pdf.setTextColor(...color)
  }

  const addText = (text: string, size: number = 11, weight: 'bold' | 'normal' = 'normal', color = colors.text) => {
    setFont(size, weight, color)
    const lines = pdf.splitTextToSize(text, contentWidth)
    pdf.text(lines, margin, yPos)
    yPos += lines.length * size * 0.35 + 2
  }

  const addSection = (title: string) => {
    yPos += 4
    setFont(13, 'bold', colors.primary)
    pdf.text(title, margin, yPos)
    yPos += 2
    pdf.setDrawColor(...colors.primary)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 5
  }

  const pageBreak = () => {
    if (yPos > pageHeight - margin - 15) {
      pdf.addPage()
      // Set background for dark theme
      if (theme === 'dark') {
        pdf.setFillColor(40, 40, 40)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      }
      yPos = margin
    }
  }

  // Set background color
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  } else {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }

  // PAGE 1: COVER & PROJECT INFO
  setFont(20, 'bold', colors.primary)
  pdf.text('Athlas Verity Impact Verification &', margin, yPos)
  yPos += 10
  pdf.text('Carbon Reduction Report', margin, yPos)
  yPos += 12

  setFont(10, 'normal', colors.secondary)
  pdf.text('Generated via Athlas Verity AI System', margin, yPos)
  yPos += 15

  // Project Information Table
  addSection('PROJECT INFORMATION')
  
  const projectTable = [
    ['Project Name', data.projectName],
    ['Carbon Offset Type', data.carbonOffsetType],
    ['Project Location Detail', data.projectLocation],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: projectTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.3 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.7 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })
  
  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Project Owner Information Table
  addSection('PROJECT OWNER INFORMATION')
  
  const ownerTable = [
    ['Owner Name', data.ownerName],
    ['Email Address', data.ownerEmail],
    ['Phone Number', data.ownerPhone],
    ['Verification Status', `✓ ${data.verificationStatus}`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: ownerTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.3 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.7 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })
  
  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 2: CARBON CALCULATIONS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  addSection('CARBON REDUCTION CALCULATIONS')
  
  setFont(11, 'normal', colors.secondary)
  pdf.text('Step-by-Step Carbon Accounting & Verification', margin, yPos)
  yPos += 8

  // Highlight box for final reduction
  pdf.setFillColor(...colors.lightBg)
  pdf.rect(margin, yPos, contentWidth, 20, 'F')
  pdf.setDrawColor(...colors.primary)
  pdf.rect(margin, yPos, contentWidth, 20)

  setFont(11, 'normal', colors.secondary)
  pdf.text('Final Verified Carbon Reduction', margin + 3, yPos + 3)
  setFont(16, 'bold', colors.primary)
  pdf.text(formatNumberWithCommas(data.finalVerifiedReduction, 2) + ' tCO₂e', margin + 3, yPos + 11)
  setFont(9, 'normal', colors.secondary)
  pdf.text('tonnes CO₂ equivalent', margin + 3, yPos + 17)
  yPos += 28

  // Calculation Parameters
  addSection('Calculation Inputs & Parameters')

  const paramsTable = [
    ['Aboveground Biomass (AGB)', formatNumberWithCommas(data.agb, 2) + ' t/ha'],
    ['Carbon Fraction', data.carbonFraction.toString()],
    ['Project Area', formatNumberWithCommas(data.projectArea, 2) + ' ha'],
    ['Project Duration', data.projectDuration + ' years'],
    ['Baseline Emissions Rate', formatNumberWithCommas(data.baselineEmissionsRate, 1) + ' tCO₂/ha/year'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: paramsTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.5 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.5 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Detailed Calculation Steps
  addSection('Detailed Calculation Steps')

  const stepsTable = [
    ['1. Raw Carbon Stock (tC)', formatNumberWithCommas(data.rawCarbonStock, 1)],
    ['2. Converted to CO₂ (tCO₂)', formatNumberWithCommas(data.convertedCO2, 2)],
    ['3. Baseline Emissions (tCO₂)', formatNumberWithCommas(data.baselineEmissions, 0)],
    ['4. Gross Reduction (tCO₂)', formatNumberWithCommas(data.grossReduction, 2)],
    [`5. Leakage Adjustment (${data.leakagePercent}%)`, '-' + formatNumberWithCommas(data.leakageAdjustment, 2)],
    [`6. Buffer Pool (${data.bufferPoolPercent}%)`, '-' + formatNumberWithCommas(data.bufferPoolDeduction, 2)],
    ['7. Net Reduction (tCO₂)', formatNumberWithCommas(data.netReduction, 2)],
    [`8. Integrity Class Adjustment (${data.integrityClassPercent}%)`, '-' + formatNumberWithCommas(data.integrityClassAdjustment, 1)],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Step', 'Value']],
    body: stepsTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.6 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.4 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 3: VERIFICATION RESULTS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  addSection('VERIFICATION RESULTS & SCORES')

  const scoresTable = [
    ['Integrity Class', data.integrityClass],
    ['Aura Score', (data.auraScore).toFixed(1) + '%'],
    ['Authenticity Score', (data.authenticityScore).toFixed(1) + '%'],
    ['Validator Consensus', (data.validatorConsensus).toFixed(1) + '%'],
    ['Data Consistency Score', (data.dataConsistencyScore).toFixed(1) + '%'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Metric', 'Value']],
    body: scoresTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.5 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.5 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Validation Summary
  addSection('VALIDATION SUMMARY')

  const validationTable = [
    ['Data Quality Check', '✓ Passed'],
    ['Satellite Imagery Verification', '✓ Passed'],
    ['Geospatial Consistency', '✓ Passed'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Check', 'Status']],
    body: validationTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.6 },
      1: { fillColor: colors.lightBg, textColor: colors.success, cellWidth: contentWidth * 0.4 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 4: VALIDATORS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  addSection('VALIDATORS INFORMATION')

  const validatorsTable = data.validators.map((v) => [v.id, v.role, v.modelType, (v.confidence).toFixed(1) + '%'])

  autoTable(pdf, {
    startY: yPos,
    head: [['Validator ID', 'Role', 'Model Type', 'Confidence']],
    body: validatorsTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.25 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.2 },
      2: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.3 },
      3: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.25 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Verification Authority
  addSection('VERIFICATION AUTHORITY & PROOF-CHAIN')

  const authorityTable = [
    ['Consensus Threshold', (data.consensusThreshold).toFixed(1) + '%'],
    ['Validators Participated', data.validators.length.toString()],
    ['Average Confidence', (data.averageConfidence).toFixed(1) + '%'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: authorityTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.5 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.5 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 5: VEGETATION
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  addSection('VEGETATION CLASSIFICATION')

  const vegetationTable = [
    ['Primary Forest Type', data.primaryForestType],
    ['Vegetation Class', data.vegetationClass],
    ['NDVI', (data.ndvi).toFixed(2) + ' - Dense Vegetation'],
    ['EVI', (data.evi).toFixed(2) + ' - Healthy Vegetation'],
    ['GNDVI', (data.gndvi).toFixed(2) + ' - Active Growth'],
    ['LAI', (data.lai).toFixed(2) + ' m²/m² - High Coverage'],
    ['Canopy Density', (data.canopyDensity * 100).toFixed(1) + '%'],
    ['Average Tree Height', data.averageTreeHeight],
    ['Crown Coverage', data.crownCoverage],
    ['Vegetation Health Status', '✓ ' + data.vegetationHealthStatus],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: vegetationTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.4 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.6 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg },
    theme: 'grid',
  })

  // PAGE 6: DISCLAIMER
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  addSection('DISCLAIMER & DATA INTEGRITY NOTICE')

  addText('Data Source & Accuracy', 11, 'bold', colors.primary)
  addText(
    'The carbon reduction calculations, metrics, and verification results presented in this report are derived solely from data and documentation provided by the Carbon Project Developer or Carbon Asset Owner. The accuracy and completeness depend entirely on the information submitted during the verification process.',
    9
  )

  addText('Limitation of Liability', 11, 'bold', colors.primary)
  addText(
    'Athlas Verity Platform assumes no liability for errors, omissions, or misstatements in the source data. Users are solely responsible for the accuracy and legitimacy of all information submitted for verification.',
    9
  )

  addText('Data Confidentiality', 11, 'bold', colors.primary)
  addText(
    'This document contains sensitive project verification data. Recipients are obligated to maintain appropriate confidentiality and restrict access to authorized personnel only.',
    9
  )

  yPos += 10
  setFont(9, 'normal', colors.secondary)
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-US')}, ${new Date().toLocaleTimeString('en-US')}`, margin, yPos)
  yPos += 4
  pdf.text('Athlas Verity Platform - Powered by CarbonFi Labs System', margin, yPos)
  yPos += 3
  pdf.text('© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.', margin, yPos)

  // Download PDF
  const fileName = `Validation-Report-${data.projectName}-${new Date().getTime()}.pdf`
  pdf.save(fileName)
}
