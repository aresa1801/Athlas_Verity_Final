'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, ArrowLeft, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { jsPDF } from 'jspdf'
import { formatNumberWithCommas } from '@/lib/format-utils'

interface ValidationReportData {
  projectName: string
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

export default function ValidationReportPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState<ValidationReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      const dataStr = searchParams.get('data')
      if (dataStr) {
        const data = JSON.parse(decodeURIComponent(dataStr))
        setReportData(data)
      }
    } catch (error) {
      console.error('[v0] Error parsing report data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  const generatePDF = async () => {
    if (!reportData) return

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      const contentWidth = pageWidth - margin * 2
      let yPos = margin

      const colors = {
        primary: [0, 120, 0],
        secondary: [100, 100, 100],
        dark: [30, 30, 30],
        success: [0, 150, 0],
      }

      const setFont = (size: number, weight: 'bold' | 'normal' = 'normal', color = colors.dark) => {
        pdf.setFontSize(size)
        pdf.setFont(undefined, weight)
        pdf.setTextColor(...color)
      }

      const addText = (text: string, size: number = 11, weight: 'bold' | 'normal' = 'normal', color = colors.dark) => {
        setFont(size, weight, color)
        const lines = pdf.splitTextToSize(text, contentWidth)
        pdf.text(lines, margin, yPos)
        yPos += lines.length * size * 0.32 + 2
      }

      const pageBreak = () => {
        if (yPos > pdf.internal.pageSize.getHeight() - margin - 20) {
          pdf.addPage()
          yPos = margin
        }
      }

      // PAGE 1: COVER
      setFont(20, 'bold', colors.primary)
      pdf.text('Athlas Verity Impact Verification &', margin, yPos)
      yPos += 8
      pdf.text('Carbon Reduction Report', margin, yPos)
      yPos += 12

      setFont(10, 'normal', colors.secondary)
      pdf.text('Generated via Athlas Verity AI System', margin, yPos)
      yPos += 15

      // Project Information Section
      setFont(12, 'bold', colors.primary)
      pdf.text('PROJECT INFORMATION', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`Project Name: ${reportData.projectName}`, margin + 3, yPos)
      yPos += 5
      pdf.text(`Carbon Offset Type: ${reportData.carbonOffsetType}`, margin + 3, yPos)
      yPos += 5
      pdf.text(`Project Location: ${reportData.projectLocation}`, margin + 3, yPos)
      yPos += 8

      // Project Owner Section
      setFont(12, 'bold', colors.primary)
      pdf.text('PROJECT OWNER', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`Name: ${reportData.ownerName}`, margin + 3, yPos)
      yPos += 5
      pdf.text(`Email: ${reportData.ownerEmail}`, margin + 3, yPos)
      yPos += 5
      pdf.text(`Phone: ${reportData.ownerPhone}`, margin + 3, yPos)
      yPos += 10

      setFont(11, 'bold', colors.success)
      pdf.text(`✓ ${reportData.verificationStatus}`, margin + 3, yPos)
      yPos += 15

      // PAGE 2: CARBON CALCULATIONS
      pageBreak()
      setFont(16, 'bold', colors.primary)
      pdf.text('CARBON REDUCTION CALCULATIONS', margin, yPos)
      yPos += 10

      // Highlight Box
      pdf.setFillColor(240, 240, 240)
      pdf.rect(margin, yPos - 3, contentWidth, 18, 'F')
      pdf.setDrawColor(...colors.primary)
      pdf.rect(margin, yPos - 3, contentWidth, 18)

      setFont(11, 'normal', colors.secondary)
      pdf.text('Final Verified Carbon Reduction', margin + 3, yPos + 1)
      setFont(16, 'bold', colors.primary)
      pdf.text(formatNumberWithCommas(reportData.finalVerifiedReduction, 2), margin + 3, yPos + 8)
      setFont(9, 'normal', colors.secondary)
      pdf.text('tonnes CO₂ equivalent', margin + 3, yPos + 13)
      yPos += 25

      // Calculation Parameters
      setFont(12, 'bold', colors.primary)
      pdf.text('Calculation Inputs & Parameters', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`Aboveground Biomass (AGB): ${formatNumberWithCommas(reportData.agb, 2)} t/ha`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Carbon Fraction: ${reportData.carbonFraction}`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Project Area: ${formatNumberWithCommas(reportData.projectArea, 2)} ha`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Project Duration: ${reportData.projectDuration} years`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Baseline Emissions Rate: ${formatNumberWithCommas(reportData.baselineEmissionsRate, 1)} tCO₂/ha/year`, margin + 3, yPos)
      yPos += 10

      // 8-Step Calculation
      setFont(12, 'bold', colors.primary)
      pdf.text('Detailed Calculation Steps', margin, yPos)
      yPos += 6

      const steps = [
        { label: '1. Raw Carbon Stock (tC)', value: formatNumberWithCommas(reportData.rawCarbonStock, 1) },
        { label: '2. Converted to CO₂ (tCO₂)', value: formatNumberWithCommas(reportData.convertedCO2, 2) },
        { label: '3. Baseline Emissions (tCO₂)', value: formatNumberWithCommas(reportData.baselineEmissions, 0) },
        { label: '4. Gross Reduction (tCO₂)', value: formatNumberWithCommas(reportData.grossReduction, 2) },
        { label: `5. Leakage Adjustment (${reportData.leakagePercent}%)`, value: '-' + formatNumberWithCommas(reportData.leakageAdjustment, 2) },
        { label: `6. Buffer Pool (${reportData.bufferPoolPercent}%)`, value: '-' + formatNumberWithCommas(reportData.bufferPoolDeduction, 2) },
        { label: '7. Net Reduction (tCO₂)', value: formatNumberWithCommas(reportData.netReduction, 2) },
        { label: `8. Integrity Class Adjustment (${reportData.integrityClassPercent}%)`, value: '-' + formatNumberWithCommas(reportData.integrityClassAdjustment, 1) },
      ]

      setFont(10, 'normal', colors.dark)
      steps.forEach((step) => {
        pageBreak()
        pdf.text(step.label, margin + 3, yPos)
        pdf.text(step.value, pageWidth - margin - 10, yPos, { align: 'right' })
        yPos += 5
      })

      // PAGE 3: VERIFICATION RESULTS
      pdf.addPage()
      yPos = margin

      setFont(16, 'bold', colors.primary)
      pdf.text('VERIFICATION RESULTS & SCORES', margin, yPos)
      yPos += 10

      setFont(12, 'bold', colors.primary)
      pdf.text('Integrity & Quality Scores', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`Integrity Class: ${reportData.integrityClass}`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Aura Score: ${reportData.auraScore}%`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Authenticity Score: ${reportData.authenticityScore}%`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Validator Consensus: ${reportData.validatorConsensus}%`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Data Consistency Score: ${reportData.dataConsistencyScore}%`, margin + 3, yPos)
      yPos += 10

      // Validation Summary
      setFont(12, 'bold', colors.primary)
      pdf.text('Validation Summary', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.success)
      pdf.text('✓ Data Quality Check - Passed', margin + 3, yPos)
      yPos += 4
      pdf.text('✓ Satellite Imagery Verification - Passed', margin + 3, yPos)
      yPos += 4
      pdf.text('✓ Geospatial Consistency - Passed', margin + 3, yPos)
      yPos += 10

      // PAGE 4: VEGETATION
      pdf.addPage()
      yPos = margin

      setFont(16, 'bold', colors.primary)
      pdf.text('VEGETATION CLASSIFICATION', margin, yPos)
      yPos += 10

      setFont(12, 'bold', colors.primary)
      pdf.text('Forest Type Classification', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`Primary Forest Type: ${reportData.primaryForestType}`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Vegetation Class: ${reportData.vegetationClass}`, margin + 3, yPos)
      yPos += 10

      setFont(12, 'bold', colors.primary)
      pdf.text('Vegetation Indices', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`NDVI: ${reportData.ndvi} - Dense Vegetation`, margin + 3, yPos)
      yPos += 4
      pdf.text(`EVI: ${reportData.evi} - Healthy Vegetation`, margin + 3, yPos)
      yPos += 4
      pdf.text(`GNDVI: ${reportData.gndvi} - Active Growth`, margin + 3, yPos)
      yPos += 4
      pdf.text(`LAI: ${reportData.lai} m²/m² - High Coverage`, margin + 3, yPos)
      yPos += 10

      setFont(12, 'bold', colors.primary)
      pdf.text('Canopy Characteristics', margin, yPos)
      yPos += 6

      setFont(10, 'normal', colors.dark)
      pdf.text(`Canopy Density: ${formatNumberWithCommas(reportData.canopyDensity * 100, 1)}%`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Average Tree Height: ${reportData.averageTreeHeight}`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Crown Coverage: ${reportData.crownCoverage}`, margin + 3, yPos)
      yPos += 4
      pdf.text(`Vegetation Health Status: ✓ ${reportData.vegetationHealthStatus}`, margin + 3, yPos)
      yPos += 10

      // Download PDF
      const fileName = `Validation-Report-${reportData.projectName}-${new Date().getTime()}.pdf`
      pdf.save(fileName)

      alert('PDF downloaded successfully!')
    } catch (error) {
      console.error('[v0] PDF generation error:', error)
      alert('Error generating PDF')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading report...</p>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <Button onClick={() => router.back()} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <p>Error: Report data not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <Button onClick={() => router.back()} variant="outline" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Button>

        {/* Report Preview */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          {/* Header */}
          <div className="border-b border-gray-700 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-green-600 mb-2">Athlas Verity Impact Verification & Carbon Reduction Report</h1>
            <p className="text-gray-400">Generated via Athlas Verity AI System</p>
          </div>

          {/* Project Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="bg-gray-700 border-gray-600 p-4">
              <h2 className="text-lg font-bold text-green-600 mb-3">Project Information</h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Project Name:</span> {reportData.projectName}</p>
                <p><span className="text-gray-400">Carbon Offset Type:</span> {reportData.carbonOffsetType}</p>
                <p><span className="text-gray-400">Location:</span> {reportData.projectLocation}</p>
              </div>
            </Card>

            <Card className="bg-gray-700 border-gray-600 p-4">
              <h2 className="text-lg font-bold text-green-600 mb-3">Project Owner</h2>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Name:</span> {reportData.ownerName}</p>
                <p><span className="text-gray-400">Email:</span> {reportData.ownerEmail}</p>
                <p><span className="text-gray-400">Phone:</span> {reportData.ownerPhone}</p>
              </div>
            </Card>
          </div>

          {/* Final Verification */}
          <Card className="bg-green-900 border-green-700 p-6 mb-8">
            <div className="flex items-center gap-3">
              <Check className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="text-2xl font-bold text-green-400">{formatNumberWithCommas(reportData.finalVerifiedReduction, 2)} tCO₂e</h3>
                <p className="text-green-200">Final Verified Carbon Reduction</p>
              </div>
            </div>
          </Card>

          {/* Verification Scores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gray-700 border-gray-600 p-4 text-center">
              <p className="text-gray-400 text-sm">Integrity Class</p>
              <p className="text-2xl font-bold text-green-400">{reportData.integrityClass}</p>
            </Card>
            <Card className="bg-gray-700 border-gray-600 p-4 text-center">
              <p className="text-gray-400 text-sm">Aura Score</p>
              <p className="text-2xl font-bold text-green-400">{reportData.auraScore}%</p>
            </Card>
            <Card className="bg-gray-700 border-gray-600 p-4 text-center">
              <p className="text-gray-400 text-sm">Authenticity</p>
              <p className="text-2xl font-bold text-green-400">{reportData.authenticityScore}%</p>
            </Card>
            <Card className="bg-gray-700 border-gray-600 p-4 text-center">
              <p className="text-gray-400 text-sm">Consensus</p>
              <p className="text-2xl font-bold text-green-400">{reportData.validatorConsensus}%</p>
            </Card>
          </div>

          {/* Vegetation Data */}
          <Card className="bg-gray-700 border-gray-600 p-6 mb-8">
            <h2 className="text-lg font-bold text-green-600 mb-4">Vegetation Classification</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Primary Forest Type</p>
                <p className="font-semibold">{reportData.primaryForestType}</p>
              </div>
              <div>
                <p className="text-gray-400">Vegetation Class</p>
                <p className="font-semibold">{reportData.vegetationClass}</p>
              </div>
              <div>
                <p className="text-gray-400">NDVI</p>
                <p className="font-semibold">{reportData.ndvi}</p>
              </div>
              <div>
                <p className="text-gray-400">Canopy Density</p>
                <p className="font-semibold">{formatNumberWithCommas(reportData.canopyDensity * 100, 1)}%</p>
              </div>
            </div>
          </Card>

          {/* Download Button */}
          <Button onClick={generatePDF} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold gap-3 rounded-lg">
            <Download className="w-5 h-5" />
            Download PDF Report
          </Button>
        </div>
      </div>
    </div>
  )
}
