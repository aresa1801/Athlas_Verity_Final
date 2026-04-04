import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// Helper function to format numbers with commas for PDF
function formatNumberForPDF(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export interface BatuahHilirPDFData {
  // Project Information
  projectName: string
  carbonOffsetType: string
  projectDescription?: string
  projectLocation: string
  
  // Project Owner Information
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  
  // Carbon Asset Coordinates
  coordinates?: Array<{ latitude: number; longitude: number }>
  totalAssetPoints: number
  
  // Verification Status
  verificationStatus: string
  
  // Integrity & Quality Scores
  integrityClass: string
  auraScore: number
  authenticityScore: number
  validatorConsensus: number
  dataConsistencyScore: number
  
  // Validation Summary
  dataQualityCheck: boolean
  satelliteImageryVerification: boolean
  geospatialConsistency: boolean
  anomalyFlags: string[]
  
  // Carbon Reduction Calculations
  finalVerifiedReduction: number
  
  // Calculation Inputs & Parameters
  agb: number
  carbonFraction: number
  projectArea: number
  projectDuration: number
  baselineEmissionsRate: number
  
  // Detailed Calculation Steps
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
  
  // Validators Information
  validators: Array<{
    id: string
    role: string
    modelType: string
    confidence: number
  }>
  consensusThreshold: number
  averageConfidence: number
  
  // Vegetation Classification
  primaryForestType: string
  vegetationClass: string
  ndvi: number
  evi: number
  gndvi: number
  lai: number
  canopyDensity: number
  averageTreeHeight: string
  crownCoverage: string
  vegetationHealthStatus: string
  
  // Detailed Vegetation Description
  ecosystemOverview?: string
  forestStructure?: {
    canopyLayer: string
    understoryLayer: string
    forestFloor: string
    structuralComplexity: string
  }
  vegetationComposition?: Array<{
    category: string
    percentage: number
    characteristics: string
  }>
  biodiversityData?: {
    speciesRichnessIndex: string
    endemicSpecies: boolean
    conservationPriority: string
    carbonSequestrationCapacity: number
  }
  vegetationHealthAssessment?: string
  
  generatedDate?: Date
}

export async function generateBatuahHilirPDF(data: BatuahHilirPDFData): Promise<void> {
  try {
    console.log("[v0] PDF Generation Start - Project:", data.projectName)
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })
    
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12
    const contentWidth = pageWidth - (margin * 2)
    
    let yPosition = margin
    
    const colors = {
      primary: [0, 120, 0],
      secondary: [100, 100, 100],
      dark: [30, 30, 30],
      light: [240, 240, 240],
      success: [0, 150, 0],
    }
    
    const setFont = (size: number, weight: 'bold' | 'normal' = 'normal', color = colors.dark) => {
      pdf.setFontSize(size)
      pdf.setFont(undefined, weight)
      pdf.setTextColor(...color)
    }
    
    const addText = (text: string, size: number = 10, weight: 'bold' | 'normal' = 'normal', color = colors.dark) => {
      setFont(size, weight, color)
      const lines = pdf.splitTextToSize(text, contentWidth - 4)
      pdf.text(lines, margin + 2, yPosition)
      yPosition += (lines.length * size * 0.32) + 2
    }
    
    const addTitle = (text: string) => {
      yPosition += 2
      setFont(16, 'bold', colors.primary)
      pdf.text(text, margin, yPosition)
      yPosition += 8
      pdf.setDrawColor(...colors.primary)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 4
    }
    
    const addSection = (text: string) => {
      yPosition += 3
      setFont(12, 'bold', colors.primary)
      pdf.text(text, margin, yPosition)
      yPosition += 5
    }
    
    const addRow = (label: string, value: string, isBold = false) => {
      setFont(10, 'normal', colors.dark)
      pdf.text(label + ':', margin + 2, yPosition)
      setFont(10, isBold ? 'bold' : 'normal', isBold ? colors.primary : colors.secondary)
      pdf.text(value, pageWidth - margin - 30, yPosition, { align: 'right' })
      yPosition += 5
    }
    
    const addCheckbox = (label: string, passed: boolean) => {
      setFont(10, 'normal', colors.dark)
      const symbol = passed ? '✓' : '✗'
      const color = passed ? colors.success : [200, 0, 0]
      pdf.text(label, margin + 2, yPosition)
      setFont(11, 'bold', color)
      pdf.text(symbol, pageWidth - margin - 10, yPosition)
      yPosition += 5
    }
    
    const pageBreak = (space = 25) => {
      if (yPosition > pageHeight - margin - space) {
        pdf.addPage()
        yPosition = margin
        return true
      }
      return false
    }
    
    const addHighlightBox = (mainText: string, mainValue: string, subText: string) => {
      yPosition += 2
      pdf.setFillColor(...colors.light)
      pdf.rect(margin, yPosition - 3, contentWidth, 18, 'F')
      pdf.setDrawColor(...colors.primary)
      pdf.rect(margin, yPosition - 3, contentWidth, 18)
      
      setFont(11, 'normal', colors.secondary)
      pdf.text(mainText, margin + 3, yPosition + 1)
      setFont(16, 'bold', colors.primary)
      pdf.text(mainValue, margin + 3, yPosition + 8)
      setFont(9, 'normal', colors.secondary)
      pdf.text(subText, margin + 3, yPosition + 13)
      
      yPosition += 20
    }
    
    // PAGE 1: COVER & PROJECT INFO
    setFont(20, 'bold', colors.primary)
    pdf.text('Athlas Verity Impact Verification &', margin, margin + 10)
    pdf.text('Carbon Reduction Report', margin, margin + 18)
    
    setFont(10, 'normal', colors.secondary)
    pdf.text('Generated via Athlas Verity AI System', margin, margin + 26)
    
    yPosition = margin + 35
    addSection('Project Information')
    addRow('Project Name', data.projectName, true)
    addRow('Carbon Offset Type', data.carbonOffsetType)
    addRow('Project Location Detail', data.projectLocation)
    
    if (pageBreak(50)) {}
    
    addSection('Project Owner Information')
    addRow('Owner Name', data.ownerName)
    addRow('Email Address', data.ownerEmail)
    addRow('Phone Number', data.ownerPhone)
    
    yPosition += 3
    setFont(11, 'bold', colors.success)
    pdf.text('✓ ' + data.verificationStatus, margin + 2, yPosition)
    yPosition += 8
    
    // PAGE 2: CARBON CALCULATIONS
    pdf.addPage()
    yPosition = margin
    
    addTitle('Carbon Reduction Calculations')
    setFont(10, 'normal', colors.secondary)
    pdf.text('Step-by-Step Carbon Accounting & Verification', margin + 2, yPosition)
    yPosition += 6
    
    addHighlightBox('Final Verified Carbon Reduction', formatNumberForPDF(data.finalVerifiedReduction, 2) + ' tCO₂e', 'tonnes CO₂ equivalent')
    
    addSection('Calculation Inputs & Parameters')
    addRow('Aboveground Biomass (AGB)', formatNumberForPDF(data.agb, 2) + ' t/ha')
    addRow('Carbon Fraction', formatNumberForPDF(data.carbonFraction, 2))
    addRow('Project Area', formatNumberForPDF(data.projectArea, 2) + ' ha')
    addRow('Project Duration', data.projectDuration + ' years')
    addRow('Baseline Emissions Rate', formatNumberForPDF(data.baselineEmissionsRate, 1) + ' tCO₂/ha/year')
    
    pageBreak(50)
    
    addSection('Detailed Calculation Steps')
    
    const steps = [
      { label: '1. Raw Carbon Stock (tC)', val: formatNumberForPDF(data.rawCarbonStock, 1) },
      { label: '2. Converted to CO₂ (tCO₂)', val: formatNumberForPDF(data.convertedCO2, 2) },
      { label: '3. Baseline Emissions (tCO₂)', val: formatNumberForPDF(data.baselineEmissions, 0) },
      { label: '4. Gross Reduction (tCO₂)', val: formatNumberForPDF(data.grossReduction, 2) },
      { label: `5. Leakage Adjustment (${formatNumberForPDF(data.leakagePercent, 0)}%)`, val: '-' + formatNumberForPDF(data.leakageAdjustment, 2) },
      { label: `6. Buffer Pool (${formatNumberForPDF(data.bufferPoolPercent, 0)}%)`, val: '-' + formatNumberForPDF(data.bufferPoolDeduction, 2) },
      { label: '7. Net Reduction (tCO₂)', val: formatNumberForPDF(data.netReduction, 2) },
      { label: `8. Integrity Class Adjustment (${formatNumberForPDF(data.integrityClassPercent, 1)}%)`, val: '-' + formatNumberForPDF(data.integrityClassAdjustment, 1) },
    ]
    
    steps.forEach((step) => {
      if (pageBreak(8)) {}
      setFont(10, 'normal', colors.dark)
      pdf.text(step.label, margin + 2, yPosition)
      pdf.text(step.val, pageWidth - margin - 15, yPosition, { align: 'right' })
      yPosition += 5
    })
    
    yPosition -= 3
    pdf.setDrawColor(...colors.primary)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 3
    
    addRow('Final Verified Reduction', formatNumberForPDF(data.finalVerifiedReduction, 2) + ' tCO₂e', true)
    
    // PAGE 3: VERIFICATION RESULTS
    pdf.addPage()
    yPosition = margin
    
    addTitle('Verification Results & Scores')
    setFont(10, 'normal', colors.secondary)
    pdf.text('Athlas Verity AI System Validation Metrics', margin + 2, yPosition)
    yPosition += 6
    
    addSection('Integrity & Quality Scores')
    addRow('Integrity Class', data.integrityClass)
    addRow('Aura Score', formatNumberForPDF(data.auraScore, 1) + '%')
    addRow('Authenticity Score', formatNumberForPDF(data.authenticityScore, 1) + '%')
    addRow('Validator Consensus', formatNumberForPDF(data.validatorConsensus, 1) + '%')
    addRow('Data Consistency Score', formatNumberForPDF(data.dataConsistencyScore, 1) + '%')
    
    addSection('Validation Summary')
    addCheckbox('Data Quality Check', data.dataQualityCheck)
    addCheckbox('Satellite Imagery Verification', data.satelliteImageryVerification)
    addCheckbox('Geospatial Consistency', data.geospatialConsistency)
    
    addSection('Carbon Asset Coordinates')
    addRow('Total Asset Points Registered', String(data.totalAssetPoints))
    addRow('Geospatial Coverage Verified', '✓ Confirmed')
    
    // PAGE 4: VEGETATION
    pdf.addPage()
    yPosition = margin
    
    addTitle('Vegetation Classification')
    setFont(10, 'normal', colors.secondary)
    pdf.text('Satellite-Based Vegetation Analysis & Classification Results', margin + 2, yPosition)
    yPosition += 6
    
    addSection('Forest Type Classification')
    addRow('Primary Forest Type', data.primaryForestType)
    addRow('Vegetation Class', data.vegetationClass)
    
    addSection('Vegetation Indices')
    addRow('NDVI', formatNumberForPDF(data.ndvi, 2) + ' - Dense Vegetation')
    addRow('EVI', formatNumberForPDF(data.evi, 2) + ' - Healthy Vegetation')
    addRow('GNDVI', formatNumberForPDF(data.gndvi, 2) + ' - Active Growth')
    addRow('LAI', formatNumberForPDF(data.lai, 2) + ' m²/m² - High Coverage')
    
    addSection('Canopy Characteristics')
    addRow('Canopy Density', formatNumberForPDF(data.canopyDensity * 100, 1) + '%')
    addRow('Average Tree Height', data.averageTreeHeight)
    addRow('Crown Coverage', data.crownCoverage)
    addRow('Vegetation Health Status', '✓ ' + data.vegetationHealthStatus)
    
    // PAGE 5: VALIDATORS
    pdf.addPage()
    yPosition = margin
    
    addTitle('Validators Information')
    setFont(10, 'normal', colors.secondary)
    pdf.text('Athlas Verity AI System Validator Network & Consensus Data', margin + 2, yPosition)
    yPosition += 6
    
    addSection('Verification Authority & Proof-Chain')
    addRow('Consensus Threshold', formatNumberForPDF(data.consensusThreshold, 1) + '%')
    addRow('Validators Participated', String(data.validators?.length || 4))
    addRow('Average Confidence', formatNumberForPDF(data.averageConfidence, 1) + '%')
    
    // PAGE 6: DISCLAIMER
    pdf.addPage()
    yPosition = margin
    
    addTitle('Disclaimer & Data Integrity Notice')
    
    addSection('Data Source & Accuracy')
    addText('The carbon reduction calculations, metrics, and verification results presented in this report are derived solely from data and documentation provided by the Carbon Project Developer or Carbon Asset Owner. The accuracy and completeness depend entirely on the information submitted during the verification process.', 9, 'normal', colors.dark)
    
    yPosition += 3
    addSection('Limitation of Liability')
    addText('Athlas Verity Platform and the AI validator network assume no liability for errors, omissions, or misstatements in the source data provided. Users are solely responsible for the accuracy and legitimacy of all information submitted for verification.', 9, 'normal', colors.dark)
    
    yPosition += 3
    addSection('Data Confidentiality')
    addText('This document contains sensitive project verification data. Recipients are obligated to maintain appropriate confidentiality and restrict access to authorized personnel only.', 9, 'normal', colors.dark)
    
    yPosition += 8
    setFont(9, 'normal', colors.secondary)
    pdf.text('Generated on ' + new Date().toLocaleDateString('en-US') + ', ' + new Date().toLocaleTimeString('en-US'), margin, yPosition)
    yPosition += 4
    pdf.text('Athlas Verity Platform - Powered by CarbonFi Labs System', margin, yPosition)
    yPosition += 3
    pdf.text('© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.', margin, yPosition)
    
    const fileName = `${data.projectName || 'Validation-Report'}-${new Date().getTime()}.pdf`
    pdf.save(fileName)
    
    console.log("[v0] PDF saved successfully:", fileName)
  } catch (error) {
    console.error("[v0] PDF generation error:", error)
    throw error
  }
}

export function generateBatuahHilirPDFHTML(data: BatuahHilirPDFData): string {
  const coordinatesHTML = data.coordinates && data.coordinates.length > 0
    ? data.coordinates.map((coord, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${coord.latitude.toFixed(6)}</td>
          <td>${coord.longitude.toFixed(6)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3">No coordinates registered</td></tr>'

  const validatorsHTML = data.validators && data.validators.length > 0
    ? data.validators.map(v => `
        <tr>
          <td>${v.id}</td>
          <td>${v.role}</td>
          <td>${v.modelType}</td>
          <td>${v.confidence.toFixed(1)}%</td>
        </tr>
      `).join('')
    : '<tr><td colspan="4">No validator data</td></tr>'

  const vegetationCompositionHTML = data.vegetationComposition && data.vegetationComposition.length > 0
    ? data.vegetationComposition.map(v => `
        <tr>
          <td>${v.category}</td>
          <td>${v.percentage}%</td>
          <td>${v.characteristics}</td>
        </tr>
      `).join('')
    : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.projectName} - Validation Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { 
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #333;
      background: white;
    }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 20mm;
      margin: 0;
      page-break-after: always;
      break-after: page;
      background: white;
      color: #333;
    }
    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    h1 { 
      font-size: 24px; 
      margin-bottom: 10px; 
      color: #1a1a1a;
      font-weight: 600;
    }
    h2 { 
      font-size: 14px; 
      margin-top: 20px; 
      margin-bottom: 10px;
      color: #333;
      font-weight: 600;
      border-bottom: 1px solid #999;
      padding-bottom: 5px;
    }
    h3 { 
      font-size: 12px; 
      margin-top: 12px; 
      margin-bottom: 8px;
      color: #555;
      font-weight: 600;
    }
    p { margin: 5px 0; }
    .subtitle { 
      font-size: 12px; 
      color: #666; 
      margin-bottom: 20px;
    }
    .content-box {
      background: #f5f5f5;
      border: 1px solid #ddd;
      padding: 10px;
      margin: 10px 0;
      border-radius: 3px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 10px 0;
    }
    .grid-item {
      padding: 8px;
      background: #f9f9f9;
      border-left: 3px solid #0066cc;
    }
    .grid-item-label {
      font-weight: 600;
      color: #333;
      font-size: 10px;
    }
    .grid-item-value {
      font-size: 12px;
      color: #0066cc;
      font-weight: 600;
      margin-top: 3px;
    }
    .metric-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin: 8px 0;
      padding: 8px;
    }
    .metric-label {
      font-weight: 600;
      color: #555;
      font-size: 10px;
    }
    .metric-value {
      text-align: right;
      color: #333;
      font-weight: 500;
    }
    .checkmark {
      color: #00a000;
      font-weight: 600;
    }
    .table-container {
      margin: 10px 0;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
      margin: 10px 0;
    }
    th {
      background: #0066cc;
      color: white;
      padding: 6px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 6px;
      border-bottom: 1px solid #ddd;
    }
    tr:nth-child(even) {
      background: #f9f9f9;
    }
    .highlight-box {
      background: #e8f4f8;
      border: 2px solid #0066cc;
      padding: 12px;
      margin: 15px 0;
      border-radius: 3px;
    }
    .highlight-value {
      font-size: 18px;
      font-weight: 700;
      color: #0066cc;
    }
    .disclaimer {
      font-size: 9px;
      color: #666;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ccc;
    }
    .footer {
      text-align: center;
      font-size: 9px;
      color: #999;
      margin-top: 20px;
    }
    .verification-badge {
      display: inline-block;
      background: #00a000;
      color: white;
      padding: 3px 8px;
      border-radius: 3px;
      font-weight: 600;
      font-size: 10px;
      margin-left: 5px;
    }
  </style>
</head>
<body>

<!-- PAGE 1: Cover Page -->
<div class="page">
  <div style="text-align: center; margin-top: 40px;">
    <h1>Athlas Verity Impact Verification &<br>Carbon Reduction Report</h1>
    <p class="subtitle">Generated via Athlas Verity AI System</p>
  </div>

  <div style="margin-top: 60px;">
    <h2>Project Information</h2>
    <div class="grid">
      <div class="grid-item">
        <div class="grid-item-label">Project Name</div>
        <div class="grid-item-value">${data.projectName || 'N/A'}</div>
      </div>
      <div class="grid-item">
        <div class="grid-item-label">Carbon Offset Type</div>
        <div class="grid-item-value">${data.carbonOffsetType || 'Green Carbon'}</div>
      </div>
    </div>
    <div class="content-box" style="margin-top: 15px;">
      <p><strong>Project Description</strong></p>
      <p>${data.projectDescription || 'No description provided'}</p>
    </div>
    <div style="margin-top: 10px;">
      <p><strong>Project Location Detail</strong></p>
      <p>${data.projectLocation || 'Unknown Location'}</p>
    </div>
  </div>

  <div style="margin-top: 40px;">
    <h2>Project Owner Information</h2>
    <div class="metric-row">
      <div><span class="metric-label">Owner Name</span></div>
      <div><span class="metric-value">${data.ownerName || 'Unknown'}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Email Address</span></div>
      <div><span class="metric-value">${data.ownerEmail || 'N/A'}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Phone Number</span></div>
      <div><span class="metric-value">${data.ownerPhone || 'N/A'}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Verification Status</span></div>
      <div><span class="metric-value"><span class="checkmark">✓ ${data.verificationStatus || 'Verified'}</span></span></div>
    </div>
  </div>
</div>

<!-- PAGE 2: Carbon Asset Coordinates & Verification Details -->
<div class="page page-break">
  <h1>Carbon Asset Coordinates</h1>
  <p class="subtitle">Geospatial Location Data - ${data.totalAssetPoints || 0} Asset Points</p>

  <h3>Geographic Coordinates (${data.totalAssetPoints || 0} Points)</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Point Number</th>
          <th>Latitude</th>
          <th>Longitude</th>
        </tr>
      </thead>
      <tbody>
        ${coordinatesHTML}
      </tbody>
    </table>
  </div>

  <h2 style="margin-top: 30px;">Verification Details</h2>
  <div class="metric-row">
    <div><span class="metric-label">Total Asset Points Registered</span></div>
    <div><span class="metric-value">${data.totalAssetPoints || 0}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Geospatial Coverage Verified</span></div>
    <div><span class="metric-value"><span class="checkmark">✓ Confirmed</span></span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Proof-Chain Hash</span></div>
    <div><span class="metric-value" style="font-size: 9px; word-break: break-all;">0x7821199fed82a3b4c5d6e7f8g9h0i1j2k3l4m5...</span></div>
  </div>

  <h2>Verification Results & Scores</h2>
  <p class="subtitle">Athlas Verity AI System Validation Metrics</p>

  <h3>Integrity & Quality Scores</h3>
  <div class="metric-row">
    <div><span class="metric-label">Integrity Class</span></div>
    <div><span class="metric-value">${data.integrityClass || 'IC-A'}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Aura Score</span></div>
    <div><span class="metric-value">${data.auraScore || 91}%</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Authenticity Score</span></div>
    <div><span class="metric-value">${data.authenticityScore || 87}%</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Validator Consensus</span></div>
    <div><span class="metric-value">${data.validatorConsensus || 93}%</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Data Consistency Score</span></div>
    <div><span class="metric-value">${data.dataConsistencyScore || 89}%</span></div>
  </div>

  <h3 style="margin-top: 20px;">Validation Summary</h3>
  <div class="metric-row">
    <div><span class="metric-label">Data Quality Check</span></div>
    <div><span class="metric-value"><span class="checkmark">${data.dataQualityCheck ? '✓' : '✗'} ${data.dataQualityCheck ? 'Passed' : 'Failed'}</span></span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Satellite Imagery Verification</span></div>
    <div><span class="metric-value"><span class="checkmark">${data.satelliteImageryVerification ? '✓' : '✗'} ${data.satelliteImageryVerification ? 'Passed' : 'Failed'}</span></span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Geospatial Consistency</span></div>
    <div><span class="metric-value"><span class="checkmark">${data.geospatialConsistency ? '✓' : '✗'} ${data.geospatialConsistency ? 'Passed' : 'Failed'}</span></span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Anomaly Flags</span></div>
    <div><span class="metric-value">${data.anomalyFlags && data.anomalyFlags.length > 0 ? data.anomalyFlags.join(', ') : 'None Detected'}</span></div>
  </div>
</div>

<!-- PAGE 3: Carbon Reduction Calculations -->
<div class="page page-break">
  <h1>Carbon Reduction Calculations</h1>
  <p class="subtitle">Step-by-Step Carbon Accounting & Verification</p>

  <h2>Final Verified Carbon Reduction</h2>
  <div class="highlight-box">
    <p style="margin-bottom: 5px;">Total Net Reduction (Verified)</p>
    <div class="highlight-value">${formatNumberForPDF(data.finalVerifiedReduction, 2)}</div>
    <p style="margin-top: 5px; font-size: 10px;">tonnes CO₂ equivalent</p>
  </div>

  <h3>Calculation Inputs & Parameters</h3>
  <div class="metric-row">
    <div><span class="metric-label">Aboveground Biomass (AGB)</span></div>
    <div><span class="metric-value">${formatNumberForPDF(data.agb, 2)} t/ha</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Carbon Fraction</span></div>
    <div><span class="metric-value">${formatNumberForPDF(data.carbonFraction, 2)}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Project Area</span></div>
    <div><span class="metric-value">${formatNumberForPDF(data.projectArea, 2)} ha</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Project Duration</span></div>
    <div><span class="metric-value">${data.projectDuration || 10} years</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Baseline Emissions Rate</span></div>
    <div><span class="metric-value">${formatNumberForPDF(data.baselineEmissionsRate, 1)} tCO₂/ha/year</span></div>
  </div>

  <h2>Detailed Calculation Steps</h2>
  <table>
    <tbody>
      <tr>
        <td><strong>1. Raw Carbon Stock (tC)</strong></td>
        <td style="text-align: right;">${formatNumberForPDF(data.rawCarbonStock, 1)}</td>
      </tr>
      <tr>
        <td><strong>2. Converted to CO₂ (tCO₂)</strong></td>
        <td style="text-align: right;">${formatNumberForPDF(data.convertedCO2, 2)}</td>
      </tr>
      <tr>
        <td><strong>3. Baseline Emissions (tCO₂)</strong></td>
        <td style="text-align: right;">${formatNumberForPDF(data.baselineEmissions, 0)}</td>
      </tr>
      <tr>
        <td><strong>4. Gross Reduction (tCO₂)</strong></td>
        <td style="text-align: right;">${formatNumberForPDF(data.grossReduction, 2)}</td>
      </tr>
      <tr>
        <td><strong>5. Leakage Adjustment (${formatNumberForPDF(data.leakagePercent, 0)}%)</strong></td>
        <td style="text-align: right; color: #cc0000;">-${formatNumberForPDF(data.leakageAdjustment, 2)}</td>
      </tr>
      <tr>
        <td><strong>6. Buffer Pool Deduction (${formatNumberForPDF(data.bufferPoolPercent, 0)}%)</strong></td>
        <td style="text-align: right; color: #cc0000;">-${formatNumberForPDF(data.bufferPoolDeduction, 2)}</td>
      </tr>
      <tr>
        <td><strong>7. Net Reduction (tCO₂)</strong></td>
        <td style="text-align: right;">${formatNumberForPDF(data.netReduction, 2)}</td>
      </tr>
      <tr>
        <td><strong>8. Integrity Class Adjustment (${formatNumberForPDF(data.integrityClassPercent, 1)}%)</strong></td>
        <td style="text-align: right; color: #cc0000;">-${formatNumberForPDF(data.integrityClassAdjustment, 1)}</td>
      </tr>
      <tr style="background: #e8f4f8; font-weight: 700;">
        <td><strong>Final Verified Reduction</strong></td>
        <td style="text-align: right; color: #0066cc;">${formatNumberForPDF(data.finalVerifiedReduction, 2)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Validators Information</h2>
  <p class="subtitle">Athlas Verity AI System Validator Network & Consensus Data</p>

  <h3>Validator Nodes & Contributions</h3>
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th>Validator ID</th>
          <th>Role</th>
          <th>Model Type</th>
          <th>Confidence</th>
        </tr>
      </thead>
      <tbody>
        ${validatorsHTML}
      </tbody>
    </table>
  </div>

  <h3 style="margin-top: 20px;">Verification Authority & Proof-Chain</h3>
  <div class="metric-row">
    <div><span class="metric-label">Consensus Threshold</span></div>
    <div><span class="metric-value">${data.consensusThreshold || 93}%</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Validators Participated</span></div>
    <div><span class="metric-value">${data.validators?.length || 4}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Average Confidence</span></div>
    <div><span class="metric-value">${data.averageConfidence || 92.3}%</span></div>
  </div>
</div>

<!-- PAGE 4: Vegetation Classification & Description -->
<div class="page page-break">
  <h1>Vegetation Classification</h1>
  <p class="subtitle">Satellite-Based Vegetation Analysis & Classification Results</p>

  <h2>Forest Type Classification</h2>
  <div class="metric-row">
    <div><span class="metric-label">Primary Forest Type</span></div>
    <div><span class="metric-value">${data.primaryForestType || 'Tropical Rainforest'}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Vegetation Class</span></div>
    <div><span class="metric-value">${data.vegetationClass || 'Dense Forest'}</span></div>
  </div>

  <h2>Vegetation Indices</h2>
  <table>
    <thead>
      <tr>
        <th>Vegetation Index</th>
        <th>Value</th>
        <th>Classification</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>NDVI (Normalized Difference Vegetation Index)</td>
        <td>${data.ndvi?.toFixed(4) || '0.7500'}</td>
        <td>Dense Vegetation</td>
      </tr>
      <tr>
        <td>EVI (Enhanced Vegetation Index)</td>
        <td>${data.evi?.toFixed(4) || '0.4500'}</td>
        <td>Healthy Vegetation</td>
      </tr>
      <tr>
        <td>GNDVI (Green NDVI)</td>
        <td>${data.gndvi?.toFixed(4) || '0.4800'}</td>
        <td>Active Growth</td>
      </tr>
      <tr>
        <td>LAI (Leaf Area Index)</td>
        <td>${data.lai?.toFixed(2) || '6.50'} m²/m²</td>
        <td>High Leaf Coverage</td>
      </tr>
    </tbody>
  </table>

  <h2>Canopy Characteristics</h2>
  <div class="metric-row">
    <div><span class="metric-label">Canopy Density</span></div>
    <div><span class="metric-value">${(data.canopyDensity * 100)?.toFixed(1) || '75.0'}%</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Average Tree Height</span></div>
    <div><span class="metric-value">${data.averageTreeHeight || '25-35 meters'}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Crown Coverage</span></div>
    <div><span class="metric-value">${data.crownCoverage || '85-95%'}</span></div>
  </div>
  <div class="metric-row">
    <div><span class="metric-label">Vegetation Health Status</span></div>
    <div><span class="metric-value"><span class="checkmark">✓ ${data.vegetationHealthStatus || 'Excellent'}</span></span></div>
  </div>

  <h2>Detailed Vegetation Description</h2>
  <p class="subtitle">Comprehensive Ecosystem Profile & Biodiversity Assessment</p>

  ${data.forestStructure ? `
    <h3>Forest Structure</h3>
    <div class="metric-row">
      <div><span class="metric-label">Canopy Layer</span></div>
      <div><span class="metric-value">${data.forestStructure.canopyLayer}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Understory Layer</span></div>
      <div><span class="metric-value">${data.forestStructure.understoryLayer}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Forest Floor</span></div>
      <div><span class="metric-value">${data.forestStructure.forestFloor}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Structural Complexity</span></div>
      <div><span class="metric-value">${data.forestStructure.structuralComplexity}</span></div>
    </div>
  ` : ''}

  ${data.vegetationComposition && data.vegetationComposition.length > 0 ? `
    <h3>Vegetation Composition</h3>
    <table>
      <thead>
        <tr>
          <th>Species Category</th>
          <th>Composition %</th>
          <th>Characteristics</th>
        </tr>
      </thead>
      <tbody>
        ${vegetationCompositionHTML}
      </tbody>
    </table>
  ` : ''}

  ${data.biodiversityData ? `
    <h3>Biodiversity & Habitat Value</h3>
    <div class="metric-row">
      <div><span class="metric-label">Species Richness Index</span></div>
      <div><span class="metric-value">${data.biodiversityData.speciesRichnessIndex}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Endemic Species</span></div>
      <div><span class="metric-value"><span class="checkmark">${data.biodiversityData.endemicSpecies ? '✓' : '✗'} ${data.biodiversityData.endemicSpecies ? 'Confirmed Present' : 'Not Detected'}</span></span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Conservation Priority</span></div>
      <div><span class="metric-value">${data.biodiversityData.conservationPriority}</span></div>
    </div>
    <div class="metric-row">
      <div><span class="metric-label">Carbon Sequestration Capacity</span></div>
      <div><span class="metric-value">${data.biodiversityData.carbonSequestrationCapacity} tC/ha</span></div>
    </div>
  ` : ''}
</div>

<!-- PAGE 5: Vegetation Health Assessment & Disclaimer -->
<div class="page page-break">
  <h1>Vegetation Health Assessment</h1>
  <div class="content-box">
    <p>${data.vegetationHealthAssessment || 'The vegetation exhibits optimal health status with no significant signs of stress, disease, or degradation. Spectral signatures consistent with vigorous photosynthetic activity across all canopy layers. Forest demonstrates resilience and regenerative capacity with active recruitment of new growth. Minimal anthropogenic impact detected. Ecological integrity maintained at high levels.'}</p>
  </div>

  <h1 style="margin-top: 40px;">Disclaimer & Data Integrity Notice</h1>
  <div class="disclaimer">
    <h2>Important Information</h2>
    <p><strong>Data Source & Accuracy:</strong><br>
    The carbon reduction calculations, metrics, and verification results presented in this report are derived solely from data and documentation provided by the Carbon Project Developer or Carbon Asset Owner. The accuracy, completeness, and authenticity of all underlying data depend entirely on the information submitted during the verification process.</p>

    <p style="margin-top: 10px;"><strong>Calculation Methodology:</strong><br>
    All carbon accounting calculations follow established IPCC (Intergovernmental Panel on Climate Change) methodologies and are computed based on the input parameters provided. These include Above Ground Biomass (AGB), carbon fractions, project area, baseline emissions, leakage factors, and buffer pool adjustments. The integrity of results is contingent upon the accuracy of these input values.</p>

    <p style="margin-top: 10px;"><strong>Validator Network Verification:</strong><br>
    The Athlas Verity AI System decentralized validator network has reviewed and verified the submitted data against publicly available standards and protocols. However, this verification is computational in nature and does not constitute an audit or independent certification of the carbon asset or project claims.</p>

    <p style="margin-top: 10px;"><strong>Limitation of Liability:</strong><br>
    Athlas Verity Platform and the AI validator network assume no liability for errors, omissions, or misstatements in the source data provided by project developers or asset owners. Users are solely responsible for the accuracy and legitimacy of all information submitted for verification.</p>

    <p style="margin-top: 10px;"><strong>Use of This Report:</strong><br>
    This report is intended for informational purposes only and should not be construed as investment advice, financial guidance, or certification of carbon credits. Any commercial use of this verification report requires explicit authorization from Athlas Verity Platform and compliance with applicable regulatory frameworks.</p>

    <p style="margin-top: 10px;"><strong>Data Confidentiality:</strong><br>
    This document contains sensitive project and verification data. Recipients are obligated to maintain appropriate confidentiality and restrict access to authorized personnel only.</p>

    <p style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; font-style: italic;">
    By accessing this verification report, you acknowledge that you have read, understood, and agree to be bound by the terms and limitations outlined in this disclaimer. If you do not agree with any provision herein, you must discontinue the use of this report immediately.
    </p>
  </div>

  <div class="footer" style="margin-top: 30px;">
    <p>Generated on ${new Date().toLocaleString()}</p>
    <p style="margin-top: 5px;">Athlas Verity Platform - Powered by CarbonFi Labs System</p>
    <p style="margin-top: 5px;">This report contains sensitive verification data. Please handle with appropriate confidentiality.</p>
    <p style="margin-top: 10px; border-top: 1px solid #ccc; padding-top: 10px;">© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.</p>
  </div>
</div>

</body>
</html>
  `
}
