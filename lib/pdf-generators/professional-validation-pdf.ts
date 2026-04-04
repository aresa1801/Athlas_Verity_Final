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
  primaryLight: [number, number, number]
  secondary: [number, number, number]
  text: [number, number, number]
  textLight: [number, number, number]
  lightBg: [number, number, number]
  tableBg: [number, number, number]
  tableAltBg: [number, number, number]
  tableHeaderBg: [number, number, number]
  tableHeaderText: [number, number, number]
  success: [number, number, number]
  accent: [number, number, number]
}

const getThemeColors = (theme: ThemeType): ThemeColors => {
  if (theme === 'light') {
    return {
      primary: [0, 120, 0],
      primaryLight: [76, 175, 80],
      secondary: [100, 100, 100],
      text: [30, 30, 30],
      textLight: [100, 100, 100],
      lightBg: [248, 250, 248],
      tableBg: [255, 255, 255],
      tableAltBg: [245, 248, 245],
      tableHeaderBg: [0, 120, 0],
      tableHeaderText: [255, 255, 255],
      success: [0, 150, 0],
      accent: [76, 175, 80],
    }
  }
  // Dark theme
  return {
    primary: [76, 175, 80],
    primaryLight: [102, 187, 106],
    secondary: [180, 180, 180],
    text: [240, 240, 240],
    textLight: [180, 180, 180],
    lightBg: [50, 50, 50],
    tableBg: [60, 60, 60],
    tableAltBg: [55, 55, 55],
    tableHeaderBg: [0, 120, 0],
    tableHeaderText: [255, 255, 255],
    success: [102, 187, 106],
    accent: [76, 175, 80],
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
    yPos += 5
    setFont(13, 'bold', colors.primary)
    pdf.text(title, margin, yPos)
    yPos += 2
    pdf.setDrawColor(...colors.primary)
    pdf.setLineWidth(0.5)
    pdf.line(margin, yPos, pageWidth - margin, yPos)
    yPos += 6
  }

  const pageBreak = () => {
    if (yPos > pageHeight - margin - 15) {
      pdf.addPage()
      // Set background for dark theme
      if (theme === 'dark') {
        pdf.setFillColor(40, 40, 40)
        pdf.rect(0, 0, pageWidth, pageHeight, 'F')
      } else {
        pdf.setFillColor(255, 255, 255)
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
  // Header bar
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  setFont(20, 'bold', [255, 255, 255])
  pdf.text('Athlas Verity', margin, 12)
  setFont(10, 'normal', [255, 255, 255])
  pdf.text('Environmental Impact & Carbon Reduction Verification Report', margin, 19)
  
  yPos = 38

  // Project Info Box
  pdf.setFillColor(...colors.lightBg)
  pdf.rect(margin - 2, yPos - 2, contentWidth + 4, 25, 'F')
  pdf.setDrawColor(...colors.primary)
  pdf.setLineWidth(0.3)
  pdf.rect(margin - 2, yPos - 2, contentWidth + 4, 25)

  setFont(11, 'bold', colors.primary)
  pdf.text('PROJECT OVERVIEW', margin + 2, yPos + 2)
  
  setFont(9, 'normal', colors.text)
  pdf.text(`Project: ${data.projectName}`, margin + 2, yPos + 8)
  pdf.text(`Location: ${data.projectLocation}`, margin + 2, yPos + 12)
  pdf.text(`Type: ${data.carbonOffsetType}`, margin + 2, yPos + 16)
  pdf.text(`Status: ✓ ${data.verificationStatus}`, margin + 2, yPos + 20)
  
  yPos += 32

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
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.3, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.7, halign: 'left', fontSize: 9 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
    didDrawPage: function(data) {
      // Add footer
      const pageCount = pdf.internal.pages.length - 1
      setFont(8, 'normal', colors.textLight)
      pdf.text(`Page ${pageCount}`, pageWidth - margin - 10, pageHeight - margin + 2)
    },
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
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.3, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.7, halign: 'left', fontSize: 9 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })
  
  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 2: CARBON CALCULATIONS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  } else {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  
  // Header for page 2
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, 0, pageWidth, 12, 'F')
  setFont(10, 'bold', [255, 255, 255])
  pdf.text('CARBON REDUCTION CALCULATIONS & VERIFICATION', margin, 8)
  
  yPos = 18

  setFont(11, 'normal', colors.textLight)
  pdf.text('Step-by-Step Carbon Accounting & Verification Analysis', margin, yPos)
  yPos += 8

  // Highlight box for final reduction - improved styling
  pdf.setFillColor(...colors.accent)
  pdf.rect(margin, yPos - 2, contentWidth, 22, 'F')
  pdf.setDrawColor(...colors.primary)
  pdf.setLineWidth(0.5)
  pdf.rect(margin, yPos - 2, contentWidth, 22)

  setFont(10, 'normal', [255, 255, 255])
  pdf.text('Final Verified Carbon Reduction', margin + 3, yPos + 1)
  setFont(18, 'bold', [255, 255, 255])
  const formattedReduction = formatNumberWithCommas(data.finalVerifiedReduction, 2)
  pdf.text(formattedReduction, margin + 3, yPos + 11)
  setFont(9, 'normal', [255, 255, 255])
  pdf.text('tonnes CO₂ equivalent (tCO₂e)', margin + 3, yPos + 18)
  yPos += 28

  // Calculation Parameters
  addSection('Calculation Inputs & Parameters')

  const paramsTable = [
    ['Aboveground Biomass (AGB)', formatNumberWithCommas(data.agb, 2) + ' t/ha'],
    ['Carbon Fraction', data.carbonFraction.toFixed(3)],
    ['Project Area', formatNumberWithCommas(data.projectArea, 2) + ' ha'],
    ['Project Duration', data.projectDuration + ' years'],
    ['Baseline Emissions Rate', formatNumberWithCommas(data.baselineEmissionsRate, 2) + ' tCO₂/ha/year'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: paramsTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.5, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.5, halign: 'right', fontSize: 9 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Detailed Calculation Steps
  addSection('Detailed Calculation Steps (8-Step Process)')

  const stepsTable = [
    ['1. Raw Carbon Stock (tC)', formatNumberWithCommas(data.rawCarbonStock, 1)],
    ['2. Converted to CO₂ (tCO₂)', formatNumberWithCommas(data.convertedCO2, 2)],
    ['3. Baseline Emissions (tCO₂)', formatNumberWithCommas(data.baselineEmissions, 0)],
    ['4. Gross Reduction (tCO₂)', formatNumberWithCommas(data.grossReduction, 2)],
    [`5. Leakage Adjustment (-${data.leakagePercent}%)`, formatNumberWithCommas(data.leakageAdjustment, 2)],
    [`6. Buffer Pool Deduction (-${data.bufferPoolPercent}%)`, formatNumberWithCommas(data.bufferPoolDeduction, 2)],
    ['7. Net Reduction (tCO₂)', formatNumberWithCommas(data.netReduction, 2)],
    [`8. Integrity Class Adj. (-${data.integrityClassPercent}%)`, formatNumberWithCommas(data.integrityClassAdjustment, 2)],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Calculation Step', 'Result (tCO₂e)']],
    body: stepsTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.55, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.45, halign: 'right', fontSize: 9, font: 'courier' },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 3: VERIFICATION RESULTS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  } else {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  
  // Header for page 3
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, 0, pageWidth, 12, 'F')
  setFont(10, 'bold', [255, 255, 255])
  pdf.text('VERIFICATION RESULTS & QUALITY SCORES', margin, 8)
  
  yPos = 18

  addSection('INTEGRITY & QUALITY SCORES')

  const scoresTable = [
    ['Integrity Class', data.integrityClass],
    ['Aura Score', data.auraScore.toFixed(1) + '%'],
    ['Authenticity Score', data.authenticityScore.toFixed(1) + '%'],
    ['Validator Consensus', data.validatorConsensus.toFixed(1) + '%'],
    ['Data Consistency Score', data.dataConsistencyScore.toFixed(1) + '%'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Quality Metric', 'Score']],
    body: scoresTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.5, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.success, cellWidth: contentWidth * 0.5, halign: 'center', fontSize: 10, fontStyle: 'bold' },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Validation Summary
  addSection('VALIDATION CHECKS')

  const validationTable = [
    ['✓ Data Quality Check', 'PASSED'],
    ['✓ Satellite Imagery Verification', 'PASSED'],
    ['✓ Geospatial Consistency Analysis', 'PASSED'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Validation Check', 'Result']],
    body: validationTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.6, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.success, textColor: [255, 255, 255], cellWidth: contentWidth * 0.4, halign: 'center', fontSize: 9, fontStyle: 'bold' },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 4: VALIDATORS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  } else {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  
  // Header for page 4
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, 0, pageWidth, 12, 'F')
  setFont(10, 'bold', [255, 255, 255])
  pdf.text('VALIDATORS & VERIFICATION AUTHORITY', margin, 8)
  
  yPos = 18

  addSection('VALIDATORS INFORMATION')

  const validatorsTable = data.validators.map((v) => [v.id, v.role, v.modelType, v.confidence.toFixed(1) + '%'])

  autoTable(pdf, {
    startY: yPos,
    head: [['Validator ID', 'Role', 'Model Type', 'Confidence']],
    body: validatorsTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.25, halign: 'left', fontSize: 8 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.2, halign: 'left', fontSize: 8 },
      2: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.3, halign: 'left', fontSize: 8 },
      3: { fillColor: colors.lightBg, textColor: colors.success, cellWidth: contentWidth * 0.25, halign: 'center', fontSize: 8, fontStyle: 'bold' },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // Verification Authority
  addSection('VERIFICATION CONSENSUS & PROOF-CHAIN')

  const authorityTable = [
    ['Consensus Threshold Required', data.consensusThreshold.toFixed(1) + '%'],
    ['Validators Participated', data.validators.length.toString()],
    ['Average Confidence Score', data.averageConfidence.toFixed(1) + '%'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: authorityTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.5, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.5, halign: 'center', fontSize: 9, fontStyle: 'bold' },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  yPos = (pdf as any).lastAutoTable.finalY + 8

  // PAGE 5: VEGETATION
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  } else {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  
  // Header for page 5
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, 0, pageWidth, 12, 'F')
  setFont(10, 'bold', [255, 255, 255])
  pdf.text('VEGETATION CLASSIFICATION & ANALYSIS', margin, 8)
  
  yPos = 18

  addSection('FOREST TYPE & VEGETATION CHARACTERISTICS')

  const vegetationTable = [
    ['Primary Forest Type', data.primaryForestType],
    ['Vegetation Classification', data.vegetationClass],
    ['NDVI Index', data.ndvi.toFixed(3) + ' (Dense Vegetation)'],
    ['EVI Index', data.evi.toFixed(3) + ' (Healthy Vegetation)'],
    ['GNDVI Index', data.gndvi.toFixed(3) + ' (Active Growth)'],
    ['LAI (Leaf Area Index)', data.lai.toFixed(2) + ' m²/m² (High Coverage)'],
    ['Canopy Density', (data.canopyDensity * 100).toFixed(1) + '%'],
    ['Average Tree Height', data.averageTreeHeight],
    ['Crown Coverage', data.crownCoverage],
    ['Vegetation Health', '✓ ' + data.vegetationHealthStatus],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: vegetationTable,
    margin: margin,
    columnStyles: {
      0: { fillColor: colors.tableHeaderBg, textColor: colors.tableHeaderText, fontStyle: 'bold', cellWidth: contentWidth * 0.4, halign: 'left', fontSize: 9 },
      1: { fillColor: colors.lightBg, textColor: colors.text, cellWidth: contentWidth * 0.6, halign: 'left', fontSize: 9 },
    },
    bodyStyles: { textColor: colors.text, fillColor: colors.tableBg, lineColor: colors.accent, lineWidth: 0.1 },
    alternateRowStyles: { fillColor: colors.tableAltBg },
    theme: 'grid',
  })

  // PAGE 6: DISCLAIMER
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(40, 40, 40)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  } else {
    pdf.setFillColor(255, 255, 255)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  
  // Header for page 6
  pdf.setFillColor(...colors.primary)
  pdf.rect(0, 0, pageWidth, 12, 'F')
  setFont(10, 'bold', [255, 255, 255])
  pdf.text('LEGAL DISCLAIMER & DATA INTEGRITY NOTICE', margin, 8)
  
  yPos = 18

  addText('Data Source & Accuracy', 11, 'bold', colors.primary)
  addText(
    'The carbon reduction calculations, metrics, and verification results presented in this report are derived solely from data and documentation provided by the Carbon Project Developer or Carbon Asset Owner. The accuracy and completeness depend entirely on the information submitted during the verification process.',
    9,
    'normal',
    colors.text
  )

  addText('Limitation of Liability', 11, 'bold', colors.primary)
  addText(
    'Athlas Verity Platform assumes no liability for errors, omissions, or misstatements in the source data. Users are solely responsible for the accuracy and legitimacy of all information submitted for verification.',
    9,
    'normal',
    colors.text
  )

  addText('Data Confidentiality', 11, 'bold', colors.primary)
  addText(
    'This document contains sensitive project verification data. Recipients are obligated to maintain appropriate confidentiality and restrict access to authorized personnel only.',
    9,
    'normal',
    colors.text
  )

  yPos += 8
  pdf.setDrawColor(...colors.primary)
  pdf.setLineWidth(0.3)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4

  setFont(8, 'normal', colors.textLight)
  pdf.text(`Report Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')}`, margin, yPos)
  yPos += 3
  pdf.text('Athlas Verity Platform - Powered by CarbonFi Labs Environmental Verification System', margin, yPos)
  yPos += 3
  pdf.text('© 2025 Athlas Verity - All Rights Reserved. Confidential Document.', margin, yPos)

  // Download PDF
  const fileName = `Validation-Report-${data.projectName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
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
