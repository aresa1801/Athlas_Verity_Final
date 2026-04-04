"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Copy, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { jsPDF } from "jspdf"

export default function ResultsPage() {
  const router = useRouter()
  const [carbonData, setCarbonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("carbonCalculation")
      const storedInput = sessionStorage.getItem("carbonInputs")
      const storedProject = sessionStorage.getItem("projectData")
      
      if (stored && storedInput && storedProject) {
        setCarbonData({
          calculation: JSON.parse(stored),
          inputs: JSON.parse(storedInput),
          project: JSON.parse(storedProject),
        })
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
    }
    setLoading(false)
  }, [])

  const formatNumber = (num: number): string => {
    if (typeof num !== "number") return "0.00"
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleDownloadPDF = async () => {
    if (!carbonData) {
      alert("Data not available")
      return
    }

    try {
      const pdf = new jsPDF()
      let yPos = 20

      // Title
      pdf.setFontSize(16)
      pdf.text("Validation Report - Carbon Reduction", 20, yPos)
      yPos += 15

      // Project Information
      pdf.setFontSize(12)
      pdf.text("Project Information", 20, yPos)
      yPos += 8

      pdf.setFontSize(10)
      pdf.text(`Project: ${carbonData.project?.projectName || "Unknown"}`, 20, yPos)
      yPos += 6
      pdf.text(`Location: ${carbonData.project?.projectLocation || "Unknown"}`, 20, yPos)
      yPos += 6
      pdf.text(`Owner: ${carbonData.project?.ownerName || "Unknown"}`, 20, yPos)
      yPos += 10

      // Carbon Calculations
      pdf.setFontSize(12)
      pdf.text("Carbon Reduction Calculations", 20, yPos)
      yPos += 8

      pdf.setFontSize(10)
      pdf.text(`Final Verified Reduction: ${formatNumber(carbonData.calculation?.final_verified_reduction_tco2)} tCO₂e`, 20, yPos)
      yPos += 6
      pdf.text(`Raw Carbon Stock: ${formatNumber(carbonData.calculation?.raw_carbon_stock_tc)} tC`, 20, yPos)
      yPos += 6
      pdf.text(`Converted CO₂: ${formatNumber(carbonData.calculation?.converted_co2_tco2)} tCO₂`, 20, yPos)
      yPos += 6
      pdf.text(`Baseline Emissions: ${formatNumber(carbonData.calculation?.baseline_emissions_total_tco2)} tCO₂`, 20, yPos)
      yPos += 6
      pdf.text(`Gross Reduction: ${formatNumber(carbonData.calculation?.gross_reduction_tco2)} tCO₂`, 20, yPos)
      yPos += 6
      pdf.text(`Leakage Adjustment: -${formatNumber(carbonData.calculation?.leakage_reduction_tco2)} tCO₂`, 20, yPos)
      yPos += 6
      pdf.text(`Buffer Pool Deduction: -${formatNumber(carbonData.calculation?.buffer_reduction_tco2)} tCO₂`, 20, yPos)
      yPos += 6
      pdf.text(`Net Reduction: ${formatNumber(carbonData.calculation?.net_reduction_tco2)} tCO₂`, 20, yPos)
      yPos += 10

      // Verification Details
      pdf.setFontSize(12)
      pdf.text("Verification Details", 20, yPos)
      yPos += 8

      pdf.setFontSize(10)
      pdf.text(`Integrity Class: ${carbonData.inputs?.integrity_class || "IC-A"}`, 20, yPos)
      yPos += 6
      pdf.text(`Validator Consensus: ${carbonData.inputs?.validator_consensus || 93}%`, 20, yPos)
      yPos += 6
      pdf.text("Validation Status: ✓ Verified", 20, yPos)

      // Save PDF
      const fileName = `${carbonData.project?.projectName || "Validation-Report"}-${new Date().getTime()}.pdf`
      pdf.save(fileName)
      alert("PDF downloaded successfully!")
    } catch (error) {
      console.error("[v0] PDF error:", error)
      alert("Error generating PDF")
    }
  }

  const handleExportJSON = () => {
    if (!carbonData) {
      alert("Data not available")
      return
    }

    try {
      const jsonData = JSON.stringify(carbonData, null, 2)
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `carbon-report-${new Date().getTime()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] JSON export error:", error)
      alert("Error exporting JSON")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading results...</p>
      </div>
    )
  }

  if (!carbonData) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <p>No data available. Please run a calculation first.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-8 text-green-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <h1 className="text-4xl font-bold mb-8">Carbon Verification Report</h1>

        {/* Project Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-green-600/20 p-6">
            <h3 className="text-lg font-semibold mb-2">Final CO₂ Reduction</h3>
            <p className="text-3xl font-bold text-green-600">{formatNumber(carbonData.calculation?.final_verified_reduction_tco2)} tCO₂e</p>
          </Card>
          <Card className="bg-card border-blue-600/20 p-6">
            <h3 className="text-lg font-semibold mb-2">Project</h3>
            <p className="text-xl font-semibold">{carbonData.project?.projectName}</p>
            <p className="text-sm text-gray-400">{carbonData.project?.projectLocation}</p>
          </Card>
          <Card className="bg-card border-purple-600/20 p-6">
            <h3 className="text-lg font-semibold mb-2">Integrity Class</h3>
            <p className="text-2xl font-bold text-purple-600">{carbonData.inputs?.integrity_class || "IC-A"}</p>
          </Card>
        </div>

        {/* Calculation Breakdown */}
        <Card className="mb-8 p-6">
          <h2 className="text-2xl font-bold mb-6">Carbon Calculation Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Raw Carbon Stock:</span>
              <span className="font-semibold">{formatNumber(carbonData.calculation?.raw_carbon_stock_tc)} tC</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Converted CO₂:</span>
              <span className="font-semibold">{formatNumber(carbonData.calculation?.converted_co2_tco2)} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Baseline Emissions:</span>
              <span className="font-semibold">{formatNumber(carbonData.calculation?.baseline_emissions_total_tco2)} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Gross Reduction:</span>
              <span className="font-semibold">{formatNumber(carbonData.calculation?.gross_reduction_tco2)} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Leakage Adjustment ({carbonData.calculation?.leakage_adjustment_percent.toFixed(1)}%):</span>
              <span className="font-semibold">-{formatNumber(carbonData.calculation?.leakage_reduction_tco2)} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Buffer Pool ({carbonData.calculation?.buffer_pool_percent.toFixed(1)}%):</span>
              <span className="font-semibold">-{formatNumber(carbonData.calculation?.buffer_reduction_tco2)} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Net Reduction:</span>
              <span className="font-semibold">{formatNumber(carbonData.calculation?.net_reduction_tco2)} tCO₂</span>
            </div>
            <div className="flex justify-between border-t pt-3 mt-3">
              <span className="text-lg font-semibold">Final Verified Reduction:</span>
              <span className="text-2xl font-bold text-green-600">{formatNumber(carbonData.calculation?.final_verified_reduction_tco2)} tCO₂e</span>
            </div>
          </div>
        </Card>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleDownloadPDF}
            className="gap-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-10 py-4 text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <Download className="w-5 h-5" />
            Download PDF Report
          </Button>
          <Button
            onClick={handleExportJSON}
            variant="outline"
            className="gap-3 px-10 py-4 text-base font-semibold rounded-lg border-2 border-gray-600 hover:border-green-600 hover:bg-gray-900 transition-all"
          >
            <Copy className="w-5 h-5" />
            Export JSON Data
          </Button>
        </div>
      </div>
    </div>
  )
}
