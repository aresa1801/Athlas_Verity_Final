'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Download, ArrowLeft, Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatNumberWithCommas } from '@/lib/format-utils'
import { PDFDownloadConfirm } from '@/components/verification/pdf-download-confirm'
import { generateProfessionalPDF, type ValidationReportData } from '@/lib/pdf-generators/professional-validation-pdf'



export default function ValidationReportPreviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [reportData, setReportData] = useState<ValidationReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  useEffect(() => {
    try {
      // Try to get data from sessionStorage first
      if (typeof window !== 'undefined') {
        const dataStr = sessionStorage.getItem('validationReportData')
        if (dataStr) {
          const data = JSON.parse(dataStr)
          setReportData(data)
          // Clear after reading to prevent stale data
          sessionStorage.removeItem('validationReportData')
        } else {
          // Fallback to URL parameter (for direct navigation)
          const urlData = searchParams.get('data')
          if (urlData) {
            const data = JSON.parse(decodeURIComponent(urlData))
            setReportData(data)
          }
        }
      }
    } catch (error) {
      console.error('[v0] Error parsing report data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchParams])

  const handleDownloadPDF = async (theme: 'light' | 'dark') => {
    if (!reportData) return

    try {
      setIsGeneratingPDF(true)
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500))
      generateProfessionalPDF(reportData, theme)
      setShowDownloadConfirm(false)
    } catch (error) {
      console.error('[v0] PDF generation error:', error)
      alert('Error generating PDF')
    } finally {
      setIsGeneratingPDF(false)
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
          <Button onClick={() => setShowDownloadConfirm(true)} className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold gap-3 rounded-lg">
            <Download className="w-5 h-5" />
            Download PDF Report
          </Button>
        </div>

        {/* PDF Download Confirmation Modal */}
        <PDFDownloadConfirm
          isOpen={showDownloadConfirm}
          onClose={() => setShowDownloadConfirm(false)}
          onDownload={handleDownloadPDF}
          projectName={reportData.projectName}
          isLoading={isGeneratingPDF}
        />
      </div>
    </div>
  )
}
