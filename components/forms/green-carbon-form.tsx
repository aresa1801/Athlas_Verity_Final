"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, AlertCircle, CheckCircle2, HelpCircle, MapPin } from "lucide-react"
import { EnhancedMapInterface } from "@/components/geospatial/enhanced-map-interface"
import { GeospatialAnalysisSection } from "@/components/verification/geospatial-analysis-section"

interface GreenCarbonFormData {
  // Section A
  projectName: string
  country: string
  baselineYear: string
  methodologyRef: string

  // Section B
  polygon: Array<[number, number]>
  totalArea: number
  forestType: string
  protectionRestorationType: string

  // Section C
  dominantSpecies: string
  averageTreeHeight: string
  fieldPlotData: File | null

  // Section E
  deforestationRiskLevel: string
  legalProtectionStatus: string
  landOwnershipProof: File | null
}

const FIELD_TOOLTIPS = {
  projectName: "Name of your carbon offset project for identification in the verification system",
  country: "Country where the project is located - used for baseline and regulatory context",
  baselineYear: "Reference year for deforestation baseline - critical for additionality calculations",
  methodologyRef: "Carbon accounting methodology (Verra/Gold Standard) - determines validation rules",
  polygon: "Define project boundaries via geospatial polygon - required for area calculation and satellite analysis",
  forestType: "Forest classification (tropical/temperate/boreal) - affects biomass regression models",
  dominantSpecies: "Primary tree species for AGB allometric equation selection",
  averageTreeHeight: "Average canopy height - improves biomass model accuracy",
  deforestationRiskLevel: "Project area deforestation pressure - used for additionality risk scoring",
  legalProtectionStatus: "Land legal status (protected/private/community) - affects integrity scoring",
  landOwnershipProof: "Documentation proving project proponent control - required for verification",
}

type TooltipKey = keyof typeof FIELD_TOOLTIPS

const Tooltip = ({ text }: { text: string }) => (
  <div className="relative group inline-block ml-2">
    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-accent cursor-help" />
    <div className="absolute z-50 w-48 p-2 bg-card border border-border rounded-lg shadow-lg text-xs text-muted-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bottom-full right-0 mb-2">
      {text}
    </div>
  </div>
)

export function GreenCarbonForm() {
  const [formData, setFormData] = useState<GreenCarbonFormData>({
    projectName: "",
    country: "",
    baselineYear: "",
    methodologyRef: "verra",
    polygon: [],
    totalArea: 0,
    forestType: "",
    protectionRestorationType: "",
    dominantSpecies: "",
    averageTreeHeight: "",
    fieldPlotData: null,
    deforestationRiskLevel: "",
    legalProtectionStatus: "",
    landOwnershipProof: null,
  })

  const [showMap, setShowMap] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const requiredFields = [
    "projectName",
    "country",
    "baselineYear",
    "methodologyRef",
    "polygon",
    "forestType",
    "deforestationRiskLevel",
    "legalProtectionStatus",
    "landOwnershipProof",
  ]

  const checkCompleteness = useCallback(() => {
    const errors: string[] = []

    if (!formData.projectName.trim()) errors.push("Project name is required")
    if (!formData.country) errors.push("Country is required")
    if (!formData.baselineYear) errors.push("Baseline year is required")
    if (!formData.methodologyRef) errors.push("Methodology reference is required")
    if (formData.polygon.length < 3) errors.push("Polygon must have at least 3 points")
    if (!formData.forestType) errors.push("Forest type is required")
    if (!formData.deforestationRiskLevel) errors.push("Deforestation risk level is required")
    if (!formData.legalProtectionStatus) errors.push("Legal protection status is required")
    if (!formData.landOwnershipProof) errors.push("Land ownership proof is required")

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  const isComplete = requiredFields.every((field) => {
    if (field === "polygon") return formData.polygon.length >= 3
    if (field === "landOwnershipProof") return formData.landOwnershipProof !== null
    const value = formData[field as keyof GreenCarbonFormData]
    return value && String(value).trim() !== ""
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "fieldPlotData" | "landOwnershipProof") => {
    const file = e.target.files?.[0]
    if (file) {
      if (field === "landOwnershipProof" && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
        alert("Land ownership proof must be PDF or image")
        return
      }
      if (field === "fieldPlotData" && !["text/csv", "application/vnd.ms-excel"].includes(file.type)) {
        alert("Field plot data must be CSV")
        return
      }
      setFormData((prev) => ({ ...prev, [field]: file }))
    }
  }

  const handleRunVerification = async () => {
    if (!checkCompleteness()) {
      return
    }

    console.log("[v0] Running Green Carbon verification with data:", formData)
    // Submit to verification API
  }

  return (
    <div className="space-y-8">
      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-400 mb-2">Missing Required Data</h3>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Section A: Project Identity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section A: Project Identity</h2>
          <Badge variant="outline" className="ml-auto">1/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Project Name
              <Tooltip text={FIELD_TOOLTIPS.projectName} />
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
              placeholder="e.g., Amazon Forest Conservation Project"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Country
              <Tooltip text={FIELD_TOOLTIPS.country} />
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select country</option>
              <option value="BR">Brazil</option>
              <option value="ID">Indonesia</option>
              <option value="CD">DRC</option>
              <option value="PG">Papua New Guinea</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Baseline Year
              <Tooltip text={FIELD_TOOLTIPS.baselineYear} />
            </label>
            <input
              type="number"
              min="1990"
              max={new Date().getFullYear()}
              value={formData.baselineYear}
              onChange={(e) => setFormData((prev) => ({ ...prev, baselineYear: e.target.value }))}
              placeholder="e.g., 2010"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Methodology Reference
              <Tooltip text={FIELD_TOOLTIPS.methodologyRef} />
            </label>
            <select
              value={formData.methodologyRef}
              onChange={(e) => setFormData((prev) => ({ ...prev, methodologyRef: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="verra">Verra VCS</option>
              <option value="gs">Gold Standard</option>
              <option value="ipcc">IPCC AR6</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section B: Geospatial Data with Satellite Analysis */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section B: Geospatial Data & Satellite Analysis</h2>
          <Badge variant="outline" className="ml-auto">2/5</Badge>
        </div>

        <GeospatialAnalysisSection
          onDataUpdate={(data) => {
            setFormData((prev) => ({
              ...prev,
              polygon: data.polygon,
              totalArea: data.area,
              forestType: data.forestType,
              protectionRestorationType: data.protectionType,
            }))
          }}
        />

        {/* Forest Type and Protection Type Details */}
        <Card className="border-border/50 bg-card/50 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Additional Geospatial Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Dominant Tree Species
                <Tooltip text={FIELD_TOOLTIPS.dominantSpecies} />
              </label>
              <input
                type="text"
                value={formData.dominantSpecies}
                onChange={(e) => setFormData((prev) => ({ ...prev, dominantSpecies: e.target.value }))}
                placeholder="e.g., Shorea spp., Dipterocarpus spp."
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Average Tree Height (m)
                <Tooltip text={FIELD_TOOLTIPS.averageTreeHeight} />
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.averageTreeHeight}
                onChange={(e) => setFormData((prev) => ({ ...prev, averageTreeHeight: e.target.value }))}
                placeholder="e.g., 35"
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Field Plot Data (CSV)
                <Tooltip text="Vegetation inventory data from ground surveys" />
              </label>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={(e) => handleFileUpload(e, "fieldPlotData")}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              />
              {formData.fieldPlotData && <p className="text-xs text-emerald-600 mt-1">{formData.fieldPlotData.name}</p>}
            </div>
          </div>
        </Card>
        
        {formData.polygon.length >= 3 && (
          <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-600">Geospatial Data Complete</p>
              <p className="text-xs text-emerald-600/80">Polygon defined with {formData.polygon.length} points, ready for analysis</p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Forest Type
              <Tooltip text={FIELD_TOOLTIPS.forestType} />
            </label>
            <select
              value={formData.forestType}
              onChange={(e) => setFormData((prev) => ({ ...prev, forestType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select forest type</option>
              <option value="tropical">Tropical</option>
              <option value="temperate">Temperate</option>
              <option value="boreal">Boreal</option>
              <option value="mangrove">Mangrove</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Protection / Restoration Type
              <Tooltip text="Project activity type" />
            </label>
            <select
              value={formData.protectionRestorationType}
              onChange={(e) => setFormData((prev) => ({ ...prev, protectionRestorationType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select type</option>
              <option value="protection">Forest Protection</option>
              <option value="restoration">Forest Restoration</option>
              <option value="sustainable-mgmt">Sustainable Management</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section C: Ecological Data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section C: Ecological Data</h2>
          <Badge variant="outline" className="ml-auto">3/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Dominant Species
              <Tooltip text={FIELD_TOOLTIPS.dominantSpecies} />
            </label>
            <input
              type="text"
              value={formData.dominantSpecies}
              onChange={(e) => setFormData((prev) => ({ ...prev, dominantSpecies: e.target.value }))}
              placeholder="e.g., Hevea brasiliensis"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Average Tree Height (m)
              <Tooltip text={FIELD_TOOLTIPS.averageTreeHeight} />
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={formData.averageTreeHeight}
              onChange={(e) => setFormData((prev) => ({ ...prev, averageTreeHeight: e.target.value }))}
              placeholder="e.g., 25.5"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium mb-2">
            Field Plot Data (CSV - Optional)
            <Tooltip text="CSV with tree measurements improves biomass accuracy" />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, "fieldPlotData")}
              className="hidden"
              id="field-plot"
            />
            <label htmlFor="field-plot" className="flex-1">
              <Button variant="outline" className="w-full gap-2 cursor-pointer bg-transparent" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  {formData.fieldPlotData ? formData.fieldPlotData.name : "Upload CSV"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </section>

      {/* Section E: Risk & Additionality */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section E: Risk & Additionality</h2>
          <Badge variant="outline" className="ml-auto">4/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Deforestation Risk Level
              <Tooltip text={FIELD_TOOLTIPS.deforestationRiskLevel} />
            </label>
            <select
              value={formData.deforestationRiskLevel}
              onChange={(e) => setFormData((prev) => ({ ...prev, deforestationRiskLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select risk level</option>
              <option value="very-low">Very Low</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Legal Protection Status
              <Tooltip text={FIELD_TOOLTIPS.legalProtectionStatus} />
            </label>
            <select
              value={formData.legalProtectionStatus}
              onChange={(e) => setFormData((prev) => ({ ...prev, legalProtectionStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select status</option>
              <option value="protected-area">Protected Area</option>
              <option value="private">Private Land</option>
              <option value="community">Community Land</option>
              <option value="unprotected">Unprotected</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium mb-2">
            Land Ownership Proof (PDF/Image)
            <Tooltip text={FIELD_TOOLTIPS.landOwnershipProof} />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => handleFileUpload(e, "landOwnershipProof")}
              className="hidden"
              id="ownership-proof"
            />
            <label htmlFor="ownership-proof" className="flex-1">
              <Button variant="outline" className="w-full gap-2 cursor-pointer bg-transparent" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  {formData.landOwnershipProof ? formData.landOwnershipProof.name : "Upload Proof"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </section>

      {/* Completeness Indicator */}
      <Card className={`p-6 ${isComplete ? "bg-emerald-500/5 border-emerald-500/30" : "bg-amber-500/5 border-amber-500/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isComplete ? "text-emerald-900 dark:text-emerald-400" : "text-amber-900 dark:text-amber-400"}`}>
              Form Completeness
            </h3>
            <p className={`text-sm ${isComplete ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}>
              {isComplete ? "All required fields completed" : `${validationErrors.length} fields missing`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round((requiredFields.filter((field) => {
              if (field === "polygon") return formData.polygon.length >= 3
              if (field === "landOwnershipProof") return formData.landOwnershipProof !== null
              const value = formData[field as keyof GreenCarbonFormData]
              return value && String(value).trim() !== ""
            }).length / requiredFields.length) * 100)}%</div>
          </div>
        </div>
      </Card>

      {/* Run Verification Button */}
      <Button
        onClick={handleRunVerification}
        disabled={!isComplete}
        size="lg"
        className="w-full"
      >
        Run Verification
      </Button>
    </div>
  )
}
