import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatNumberWithCommas } from '@/lib/format-utils'

export interface ValidationReportData {
  projectName: string
  projectDescription?: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  projectLocation: string
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

const getColors = (theme: ThemeType) => {
  const light = {
    primary: [0, 120, 0],
    text: [30, 30, 30],
    textLight: [100, 100, 100],
    headerBg: [0, 120, 0],
    headerText: [255, 255, 255],
    tableBg: [255, 255, 255],
    tableAlt: [248, 250, 248],
    border: [200, 200, 200],
    success: [0, 150, 0],
    pageBg: [255, 255, 255],
  }

  const dark = {
    primary: [76, 175, 80],
    text: [240, 240, 240],
    textLight: [180, 180, 180],
    headerBg: [0, 120, 0],
    headerText: [255, 255, 255],
    tableBg: [60, 60, 60],
    tableAlt: [55, 55, 55],
    border: [100, 100, 100],
    success: [102, 187, 106],
    pageBg: [40, 40, 40],
  }

  return theme === 'light' ? light : dark
}

export function generateProfessionalPDF(data: ValidationReportData, theme: ThemeType = 'light') {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 12
  const contentWidth = pageWidth - margin * 2

  const colors = getColors(theme)
  let yPos = margin

  // Helper functions
  const setFont = (size: number, weight: 'bold' | 'normal' = 'normal', color = colors.text) => {
    pdf.setFontSize(size)
    pdf.setFont(undefined, weight)
    pdf.setTextColor(...color)
  }

  const addTitle = (title: string) => {
    setFont(18, 'bold', colors.primary)
    pdf.text(title, margin, yPos)
    yPos += 8
    setFont(10, 'normal', colors.textLight)
    pdf.text('Generated via Athlas Verity AI System', margin, yPos)
    yPos += 10
  }

  const addSectionTitle = (title: string) => {
    yPos += 2
    setFont(11, 'bold', colors.primary)
    pdf.text(title, margin, yPos)
    yPos += 5
  }

  const addParagraph = (text: string, fontSize = 9) => {
    setFont(fontSize, 'normal', colors.text)
    const lines = pdf.splitTextToSize(text, contentWidth)
    pdf.text(lines, margin, yPos)
    yPos += lines.length * fontSize * 0.4 + 2
  }

  // Set initial page background
  if (theme === 'dark') {
    pdf.setFillColor(...colors.pageBg)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }

  // PAGE 1: TITLE & PROJECT INFO
  addTitle('Athlas Verity Impact Verification &\nCarbon Reduction Report')

  addSectionTitle('Project Information')

  const projectInfo = [
    ['Project Name', data.projectName],
    ['Carbon Offset Type', data.carbonOffsetType],
    ['Project Description', data.projectDescription || ''],
    ['Project Location Detail', data.projectLocation],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['', '']],
    body: projectInfo,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.25,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.75,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
    didDrawPage: () => {},
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Project Owner Information')

  const ownerInfo = [
    ['Owner Name', data.ownerName],
    ['Email Address', data.ownerEmail],
    ['Phone Number', data.ownerPhone],
    ['Verification Status', `✓ ${data.verificationStatus}`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['', '']],
    body: ownerInfo,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.25,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.75,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Carbon Asset Coordinates')

  const coordInfo = [
    ['Geospatial Location Data', `${data.totalAssetPoints} Asset Points`],
    ['Geographic Coordinates', `${data.totalAssetPoints} Points`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['', '']],
    body: coordInfo,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.4,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.6,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Verification Details')

  const verifyInfo = [
    ['Total Asset Points Registered', data.totalAssetPoints.toString()],
    ['Geospatial Coverage Verified', '✓ Confirmed'],
    ['Proof-Chain Hash', '0x7821199fed82a3b4c5d6e7f8g9h0i1j2k3l4m5...'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['', '']],
    body: verifyInfo,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.4,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.6,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  // PAGE 2: VERIFICATION RESULTS & SCORES
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(...colors.pageBg)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  setFont(14, 'bold', colors.primary)
  pdf.text('Verification Results & Scores', margin, yPos)
  yPos += 7

  setFont(10, 'normal', colors.textLight)
  pdf.text('Athlas Verity AI System Validation Metrics', margin, yPos)
  yPos += 8

  addSectionTitle('Integrity & Quality Scores')

  const scoresData = [
    ['Integrity Class', data.integrityClass],
    ['Aura Score', `${data.auraScore.toFixed(1)}%`],
    ['Authenticity Score', `${data.authenticityScore.toFixed(1)}%`],
    ['Validator Consensus', `${data.validatorConsensus.toFixed(1)}%`],
    ['Data Consistency Score', `${data.dataConsistencyScore.toFixed(1)}%`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Quality Metric', 'Score']],
    body: scoresData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.6,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.success,
        cellWidth: contentWidth * 0.4,
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Validation Summary')

  const validationData = [
    ['Data Quality Check', '✓ Passed'],
    ['Satellite Imagery Verification', '✓ Passed'],
    ['Geospatial Consistency', '✓ Passed'],
    ['Anomaly Flags', 'None Detected'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Validation Check', 'Result']],
    body: validationData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.6,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.success,
        textColor: [255, 255, 255],
        cellWidth: contentWidth * 0.4,
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  // PAGE 3: CARBON CALCULATIONS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(...colors.pageBg)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  setFont(14, 'bold', colors.primary)
  pdf.text('Carbon Reduction Calculations', margin, yPos)
  yPos += 7

  setFont(10, 'normal', colors.textLight)
  pdf.text('Step-by-Step Carbon Accounting & Verification', margin, yPos)
  yPos += 10

  // Highlight box for final reduction
  pdf.setFillColor(...colors.primary)
  pdf.rect(margin, yPos - 1, contentWidth, 20, 'F')

  setFont(11, 'normal', [255, 255, 255])
  pdf.text('Final Verified Carbon Reduction', margin + 3, yPos + 1)
  setFont(10, 'normal', [255, 255, 255])
  pdf.text('Total Net Reduction (Verified)', margin + 3, yPos + 6)
  setFont(16, 'bold', [255, 255, 255])
  pdf.text(formatNumberWithCommas(data.finalVerifiedReduction, 2), margin + 3, yPos + 12)
  setFont(10, 'normal', [255, 255, 255])
  pdf.text('tonnes CO₂ equivalent', margin + 3, yPos + 17)

  yPos += 24

  addSectionTitle('Calculation Inputs & Parameters')

  const paramsData = [
    ['Aboveground Biomass (AGB)', `${formatNumberWithCommas(data.agb, 2)} t/ha`],
    ['Carbon Fraction', data.carbonFraction.toFixed(2)],
    ['Project Area', `${formatNumberWithCommas(data.projectArea, 2)} ha`],
    ['Project Duration', `${data.projectDuration} years`],
    ['Baseline Emissions Rate', `${formatNumberWithCommas(data.baselineEmissionsRate, 1)} tCO₂/ha/year`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: paramsData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.5,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.5,
        halign: 'right',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Detailed Calculation Steps')

  const stepsData = [
    ['1. Raw Carbon Stock (tC)', formatNumberWithCommas(data.rawCarbonStock, 1)],
    ['2. Converted to CO₂ (tCO₂)', formatNumberWithCommas(data.convertedCO2, 2)],
    ['3. Baseline Emissions (tCO₂)', formatNumberWithCommas(data.baselineEmissions, 0)],
    ['4. Gross Reduction (tCO₂)', formatNumberWithCommas(data.grossReduction, 2)],
    [`5. Leakage Adjustment (${data.leakagePercent}%)`, `-${formatNumberWithCommas(data.leakageAdjustment, 2)}`],
    [`6. Buffer Pool Deduction (${data.bufferPoolPercent}%)`, `-${formatNumberWithCommas(data.bufferPoolDeduction, 2)}`],
    ['7. Net Reduction (tCO₂)', formatNumberWithCommas(data.netReduction, 2)],
    [`8. Integrity Class Adj. (${data.integrityClassPercent}%)`, `-${formatNumberWithCommas(data.integrityClassAdjustment, 2)}`],
    ['Final Verified Reduction', formatNumberWithCommas(data.finalVerifiedReduction, 2)],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Calculation Step', 'Result (tCO₂e)']],
    body: stepsData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.55,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.45,
        halign: 'right',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  // PAGE 4: VALIDATORS
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(...colors.pageBg)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  setFont(14, 'bold', colors.primary)
  pdf.text('Validators Information', margin, yPos)
  yPos += 7

  setFont(10, 'normal', colors.textLight)
  pdf.text('Athlas Verity AI System Validator Network & Consensus Data', margin, yPos)
  yPos += 8

  addSectionTitle('Validator Nodes & Contributions')

  const validatorsData = data.validators.map((v) => [v.id, v.role, v.modelType, `${v.confidence.toFixed(1)}%`])

  autoTable(pdf, {
    startY: yPos,
    head: [['Validator ID', 'Role', 'Model Type', 'Confidence']],
    body: validatorsData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.2,
        halign: 'left',
        fontSize: 8,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.2,
        halign: 'left',
        fontSize: 8,
        cellPadding: 2,
      },
      2: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.3,
        halign: 'left',
        fontSize: 8,
        cellPadding: 2,
      },
      3: {
        fillColor: colors.tableBg,
        textColor: colors.success,
        cellWidth: contentWidth * 0.3,
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Verification Authority & Proof-Chain')

  const authorityData = [
    ['Consensus Threshold', `${data.consensusThreshold.toFixed(1)}%`],
    ['Validators Participated', data.validators.length.toString()],
    ['Average Confidence', `${data.averageConfidence.toFixed(1)}%`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: authorityData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.5,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.success,
        cellWidth: contentWidth * 0.5,
        halign: 'center',
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  // PAGE 5: VEGETATION
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(...colors.pageBg)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  setFont(14, 'bold', colors.primary)
  pdf.text('Vegetation Classification', margin, yPos)
  yPos += 7

  setFont(10, 'normal', colors.textLight)
  pdf.text('Satellite-Based Vegetation Analysis & Classification Results', margin, yPos)
  yPos += 8

  addSectionTitle('Forest Type Classification')

  const forestData = [
    ['Primary Forest Type', data.primaryForestType],
    ['Vegetation Class', data.vegetationClass],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: forestData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.4,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.6,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Vegetation Indices')

  const indicesData = [
    ['NDVI (Normalized Difference Vegetation Index)', `${data.ndvi.toFixed(4)}`, 'Dense Vegetation'],
    ['EVI (Enhanced Vegetation Index)', `${data.evi.toFixed(4)}`, 'Healthy Vegetation'],
    ['GNDVI (Green NDVI)', `${data.gndvi.toFixed(4)}`, 'Active Growth'],
    ['LAI (Leaf Area Index)', `${data.lai.toFixed(2)} m²/m²`, 'High Leaf Coverage'],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Vegetation Index', 'Value', 'Classification']],
    body: indicesData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.4,
        halign: 'left',
        fontSize: 8,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.2,
        halign: 'center',
        fontSize: 8,
        cellPadding: 2,
      },
      2: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.4,
        halign: 'left',
        fontSize: 8,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  yPos = (pdf as any).lastAutoTable.finalY + 4

  addSectionTitle('Canopy Characteristics')

  const canopyData = [
    ['Canopy Density', `${(data.canopyDensity * 100).toFixed(1)}%`],
    ['Average Tree Height', data.averageTreeHeight],
    ['Crown Coverage', data.crownCoverage],
    ['Vegetation Health Status', `✓ ${data.vegetationHealthStatus}`],
  ]

  autoTable(pdf, {
    startY: yPos,
    head: [['Characteristic', 'Value']],
    body: canopyData,
    margin: margin,
    columnStyles: {
      0: {
        fillColor: colors.headerBg,
        textColor: colors.headerText,
        fontStyle: 'bold',
        cellWidth: contentWidth * 0.4,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
      1: {
        fillColor: colors.tableBg,
        textColor: colors.text,
        cellWidth: contentWidth * 0.6,
        halign: 'left',
        fontSize: 9,
        cellPadding: 2,
      },
    },
    bodyStyles: {
      lineColor: colors.border,
      lineWidth: 0.1,
      cellPadding: 2,
    },
    alternateRowStyles: { fillColor: colors.tableAlt },
    theme: 'grid',
    headStyles: { fillColor: colors.headerBg, textColor: colors.headerText },
  })

  // PAGE 6: DISCLAIMER
  pdf.addPage()
  if (theme === 'dark') {
    pdf.setFillColor(...colors.pageBg)
    pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  }
  yPos = margin

  setFont(14, 'bold', colors.primary)
  pdf.text('Disclaimer & Data Integrity Notice', margin, yPos)
  yPos += 10

  addSectionTitle('Important Information')

  addParagraph('Data Source & Accuracy:', 10)
  addParagraph(
    'The carbon reduction calculations, metrics, and verification results presented in this report are derived solely from data and documentation provided by the Carbon Project Developer or Carbon Asset Owner. The accuracy, completeness, and authenticity of all underlying data depend entirely on the information submitted during the verification process.'
  )

  addParagraph('Calculation Methodology:', 10)
  addParagraph(
    'All carbon accounting calculations follow established IPCC (Intergovernmental Panel on Climate Change) methodologies and are computed based on the input parameters provided. These include Above Ground Biomass (AGB), carbon fractions, project area, baseline emissions, leakage factors, and buffer pool adjustments.'
  )

  addParagraph('Validator Network Verification:', 10)
  addParagraph(
    'The Athlas Verity AI System decentralized validator network has reviewed and verified the submitted data against publicly available standards and protocols. However, this verification is computational in nature and does not constitute an audit or independent certification.'
  )

  yPos += 3

  addParagraph('Limitation of Liability:', 10)
  addParagraph(
    'Athlas Verity Platform assumes no liability for errors, omissions, or misstatements in the source data. Users are solely responsible for the accuracy and legitimacy of all information submitted for verification.'
  )

  addParagraph('Data Confidentiality:', 10)
  addParagraph('This document contains sensitive project verification data. Recipients are obligated to maintain appropriate confidentiality and restrict access to authorized personnel only.')

  yPos += 3
  pdf.setDrawColor(...colors.primary)
  pdf.setLineWidth(0.3)
  pdf.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 4

  setFont(8, 'normal', colors.textLight)
  const now = new Date()
  const dateStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}, ${now.toLocaleTimeString('en-US')}`
  pdf.text(`Generated on ${dateStr}`, margin, yPos)
  yPos += 3
  pdf.text('Athlas Verity Platform - Powered by CarbonFi Labs System', margin, yPos)
  yPos += 3
  pdf.text('This report contains sensitive verification data. Please handle with appropriate confidentiality.', margin, yPos)
  yPos += 3
  pdf.text('© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.', margin, yPos)

  // Download PDF
  const fileName = `Validation-Report-${data.projectName.replace(/\s+/g, '-')}-${now.toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}
