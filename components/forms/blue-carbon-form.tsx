"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { COUNTRIES } from '@/lib/countries'
import { parseSatelliteDataFile } from '@/lib/satellite-data-parser'
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"

interface BlueCarbonFormData {
  // Section A
  projectName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  projectLocation: string
  country: string
  baselineYear: string
  methodologyRef: string

  // Section B
  satelliteDataFile: File | null
  dataLuasan: string
  dataKoordinat: string
  tidalZoneType: string
  ecosystemType: string

  // Section C
  sedimentDepthEstimate: string
  soilType: string
  salinityType: string
  waterDepth: string
  vegetationCoverage: string
  vegetationDescription?: string

  // Section D
  coastalProtectionStatus: string
  humanDisturbanceLevel: string
  legalProtectionStatus: string
  landOwnershipProof: File | null
  dataKebenaran: File | null
}

const FIELD_TOOLTIPS = {
  projectName: "Name of your blue carbon offset project for identification in the verification system",
  ownerName: "Full name of the project owner or organization responsible for the project",
  ownerEmail: "Email address of the project owner for contact and communication purposes",
  ownerPhone: "Phone number of the project owner for contact purposes",
  projectLocation: "Specific location or name of the coastal project site (e.g., Sundarbans, Mangrove Forest)",
  country: "Country where the coastal ecosystem is located - used for baseline and regulatory context",
  baselineYear: "Reference year for coastal ecosystem baseline - critical for additionality calculations",
  methodologyRef: "Blue carbon accounting methodology (Verra/IPCC guidelines) - determines validation rules",
  satelliteDataFile: "Upload satellite data from blue-carbon-analysis page - auto-populates area and coordinates",
  dataLuasan: "Total project area in hectares (auto-filled from satellite data)",
  dataKoordinat: "Project location coordinates (auto-filled from satellite data)",
  tidalZoneType: "Tidal zone classification (intertidal/subtidal) - affects sediment carbon modeling",
  ecosystemType: "Coastal ecosystem type (mangrove/seagrass/salt-marsh) - determines carbon storage potential",
  sedimentDepthEstimate: "Estimated active sediment depth in cm - required for SOC calculation",
  soilType: "Soil classification affecting carbon storage coefficient",
  salinityType: "Salinity level (fresh/brackish/marine) - influences carbon cycling",
  waterDepth: "Average water depth in meters - affects ecosystem classification",
  vegetationCoverage: "Percentage or description of vegetation coverage - indicates ecosystem health",
  coastalProtectionStatus: "Whether ecosystem provides coastal protection benefits",
  humanDisturbanceLevel: "Level of human impacts (fishing, pollution) - affects integrity scoring",
  legalProtectionStatus: "Land legal status (protected/private/community) - affects integrity scoring",
  landOwnershipProof: "Documentation proving project proponent control - required for verification",
  dataKebenaran: "Owner's declaration of data truthfulness and accuracy statement",
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

export function BlueCarbonForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<BlueCarbonFormData>({
    projectName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    projectLocation: "",
    country: "",
    baselineYear: "",
    methodologyRef: "verra",
    satelliteDataFile: null,
    dataLuasan: "",
    dataKoordinat: "",
    tidalZoneType: "",
    ecosystemType: "",
    sedimentDepthEstimate: "",
    soilType: "",
    salinityType: "",
    waterDepth: "",
    vegetationCoverage: "",
    vegetationDescription: "",
    coastalProtectionStatus: "",
    humanDisturbanceLevel: "",
    legalProtectionStatus: "",
    landOwnershipProof: null,
    dataKebenaran: null,
  })

  const [showMap, setShowMap] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const requiredFields = [
    "projectName",
    "country",
    "baselineYear",
    "methodologyRef",
    "satelliteDataFile",
    "tidalZoneType",
    "ecosystemType",
    "sedimentDepthEstimate",
    "legalProtectionStatus",
    "landOwnershipProof",
    "dataKebenaran",
  ]

  const checkCompleteness = useCallback(() => {
    const errors: string[] = []
    
    requiredFields.forEach(field => {
      const value = formData[field as keyof BlueCarbonFormData]
      if (!value || (typeof value === 'string' && !value.trim())) {
        errors.push(`${field.replace(/([A-Z])/g, ' $1').trim()} is required`)
      }
    })

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'satelliteDataFile' | 'landOwnershipProof' | 'dataKebenaran') => {
    const file = e.target.files?.[0]
    if (!file) return

    setFormData(prev => ({ ...prev, [fieldName]: file }))

    if (fieldName === 'satelliteDataFile') {
      try {
        const parsed = await parseSatelliteDataFile(file)
        console.log("[v0] Parsed satellite data:", parsed)
        
        // Extract coastal-specific data from parsed satellite data
        const tidalZone = parsed.coastalData?.tidalRange ? 'intertidal' : parsed.tidalZone || ''
        const salinity = parsed.coastalData?.salinity || parsed.salinityType || ''
        const waterDepth = parsed.coastalData?.tidalRange || parsed.waterDepth || ''
        const sedimentDepth = parsed.coastalData?.soilCarbonDepth || parsed.sedimentDepthEstimate || ''
        
        setFormData(prev => ({
          ...prev,
          dataLuasan: parsed.area_ha?.toString() || parsed.area?.hectares?.toString() || "",
          dataKoordinat: parsed.center_coordinates?.join(", ") || parsed.coordinates?.join(", ") || "",
          tidalZoneType: tidalZone,
          ecosystemType: parsed.ecosystemType || parsed.forestType || "",
          sedimentDepthEstimate: sedimentDepth,
          salinityType: salinity,
          waterDepth: waterDepth,
          vegetationDescription: parsed.vegetationDescription || "",
          vegetationCoverage: parsed.canopyCoverPercent?.toString() || "",
        }))
      } catch (error) {
        console.error("[v0] Error parsing satellite file:", error)
      }
    }
  }, [])

  const handleSubmit = async () => {
    if (!checkCompleteness()) {
      console.log("[v0] Form validation errors:", validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      // Store form data in session storage for results page
      const formDataWithSatellite = {
        ...formData,
        satelliteData: {
          polygon_area_ha: parseFloat(formData.dataLuasan) || 87,
          area_ha: parseFloat(formData.dataLuasan) || 87,
          features: {
            tidalZone: formData.tidalZoneType,
            ecosystemType: formData.ecosystemType,
            sedimentDepth: parseFloat(formData.sedimentDepthEstimate) || 30,
          }
        }
      }

      sessionStorage.setItem("projectFormData", JSON.stringify(formDataWithSatellite))
      
      // Navigate to results page
      router.push("/results?type=blue-carbon")
    } catch (error) {
      console.error("[v0] Error submitting form:", error)
      setValidationErrors(["Failed to submit form. Please try again."])
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Blue Carbon Project Verification Form</h1>
        <p className="text-muted-foreground">Complete all sections to verify your coastal ecosystem carbon project</p>
      </div>

      {validationErrors.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/10 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {validationErrors.map((error, i) => (
                <p key={i} className="text-sm text-destructive">{error}</p>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Section A: Project Identity */}
      <Card className="border-border/50 p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Section A: Project Identity</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Project Name *
              <Tooltip text={FIELD_TOOLTIPS.projectName} />
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
              placeholder="e.g., Sundarbans Mangrove Protection Initiative"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Owner Name *
              <Tooltip text={FIELD_TOOLTIPS.ownerName} />
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
              placeholder="e.g., John Smith"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Email *
              <Tooltip text={FIELD_TOOLTIPS.ownerEmail} />
            </label>
            <input
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
              placeholder="owner@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Phone *
              <Tooltip text={FIELD_TOOLTIPS.ownerPhone} />
            </label>
            <input
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, ownerPhone: e.target.value }))}
              placeholder="e.g., +1 (555) 123-4567"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Project Location *
              <Tooltip text={FIELD_TOOLTIPS.projectLocation} />
            </label>
            <input
              type="text"
              value={formData.projectLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, projectLocation: e.target.value }))}
              placeholder="e.g., Sundarbans, Bangladesh"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Country *
              <Tooltip text={FIELD_TOOLTIPS.country} />
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Baseline Year *
              <Tooltip text={FIELD_TOOLTIPS.baselineYear} />
            </label>
            <input
              type="number"
              value={formData.baselineYear}
              onChange={(e) => setFormData(prev => ({ ...prev, baselineYear: e.target.value }))}
              placeholder="e.g., 2015"
              min="1990"
              max={new Date().getFullYear()}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Methodology *
              <Tooltip text={FIELD_TOOLTIPS.methodologyRef} />
            </label>
            <select
              value={formData.methodologyRef}
              onChange={(e) => setFormData(prev => ({ ...prev, methodologyRef: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="verra">Verra VCS</option>
              <option value="gold-standard">Gold Standard</option>
              <option value="ipcc">IPCC Methodology</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Section B: Satellite Data */}
      <Card className="border-border/50 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Section B: Satellite Data Upload</h2>
        
        <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-accent/50 transition-colors">
          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
          <label className="cursor-pointer">
            <span className="text-sm font-medium text-accent hover:underline">Click to upload</span>
            <input
              type="file"
              onChange={(e) => handleFileUpload(e, 'satelliteDataFile')}
              accept=".json,.geojson,.csv"
              className="hidden"
            />
          </label>
          <p className="text-xs text-muted-foreground mt-2">Supported: GeoJSON, CSV, JSON</p>
        </div>

        {formData.satelliteDataFile && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10">
            <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-sm font-medium">{formData.satelliteDataFile.name}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Area (Ha)
              <Tooltip text={FIELD_TOOLTIPS.dataLuasan} />
            </label>
            <input
              type="number"
              value={formData.dataLuasan}
              readOnly
              placeholder="Auto-filled from satellite data"
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 text-muted-foreground"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Coordinates
              <Tooltip text={FIELD_TOOLTIPS.dataKoordinat} />
            </label>
            <input
              type="text"
              value={formData.dataKoordinat}
              readOnly
              placeholder="Auto-filled from satellite data"
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted/50 text-muted-foreground"
            />
          </div>
        </div>
      </Card>

      {/* Section C: Coastal Ecosystem Details */}
      <Card className="border-border/50 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Section C: Coastal Ecosystem Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Tidal Zone Type *
              <Tooltip text={FIELD_TOOLTIPS.tidalZoneType} />
            </label>
            <select
              value={formData.tidalZoneType}
              onChange={(e) => setFormData(prev => ({ ...prev, tidalZoneType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select tidal zone...</option>
              <option value="intertidal">Intertidal</option>
              <option value="subtidal">Subtidal</option>
              <option value="supratidal">Supratidal</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Ecosystem Type *
              <Tooltip text={FIELD_TOOLTIPS.ecosystemType} />
            </label>
            <select
              value={formData.ecosystemType}
              onChange={(e) => setFormData(prev => ({ ...prev, ecosystemType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select ecosystem...</option>
              <option value="mangrove">Mangrove Forest</option>
              <option value="seagrass">Seagrass Meadow</option>
              <option value="salt-marsh">Salt Marsh</option>
              <option value="coral">Coral Ecosystem</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Sediment Depth (cm) *
              <Tooltip text={FIELD_TOOLTIPS.sedimentDepthEstimate} />
            </label>
            <input
              type="number"
              value={formData.sedimentDepthEstimate}
              onChange={(e) => setFormData(prev => ({ ...prev, sedimentDepthEstimate: e.target.value }))}
              placeholder="e.g., 30"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Soil Type *
              <Tooltip text={FIELD_TOOLTIPS.soilType} />
            </label>
            <select
              value={formData.soilType}
              onChange={(e) => setFormData(prev => ({ ...prev, soilType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select soil type...</option>
              <option value="peat">Peat</option>
              <option value="clay">Clay</option>
              <option value="sand">Sand</option>
              <option value="silt">Silt</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Salinity Type
              <Tooltip text={FIELD_TOOLTIPS.salinityType} />
            </label>
            <select
              value={formData.salinityType}
              onChange={(e) => setFormData(prev => ({ ...prev, salinityType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select salinity...</option>
              <option value="fresh">Freshwater</option>
              <option value="brackish">Brackish</option>
              <option value="marine">Marine</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Water Depth (m)
              <Tooltip text={FIELD_TOOLTIPS.waterDepth} />
            </label>
            <input
              type="number"
              value={formData.waterDepth}
              onChange={(e) => setFormData(prev => ({ ...prev, waterDepth: e.target.value }))}
              placeholder="e.g., 2.5"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center text-sm font-medium mb-2">
              Vegetation Coverage
              <Tooltip text={FIELD_TOOLTIPS.vegetationCoverage} />
            </label>
            <input
              type="text"
              value={formData.vegetationCoverage}
              onChange={(e) => setFormData(prev => ({ ...prev, vegetationCoverage: e.target.value }))}
              placeholder="e.g., 85% - Dense mangrove forest with healthy regeneration"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </Card>

      {/* Section D: Risk & Legal Status */}
      <Card className="border-border/50 p-6 space-y-4">
        <h2 className="text-xl font-semibold">Section D: Risk Assessment & Documentation</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Coastal Protection Status
              <Tooltip text={FIELD_TOOLTIPS.coastalProtectionStatus} />
            </label>
            <select
              value={formData.coastalProtectionStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, coastalProtectionStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select status...</option>
              <option value="primary">Primary Protection</option>
              <option value="secondary">Secondary Protection</option>
              <option value="none">No Protection Function</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Human Disturbance Level
              <Tooltip text={FIELD_TOOLTIPS.humanDisturbanceLevel} />
            </label>
            <select
              value={formData.humanDisturbanceLevel}
              onChange={(e) => setFormData(prev => ({ ...prev, humanDisturbanceLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select level...</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Legal Protection Status *
              <Tooltip text={FIELD_TOOLTIPS.legalProtectionStatus} />
            </label>
            <select
              value={formData.legalProtectionStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, legalProtectionStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select status...</option>
              <option value="protected">Protected Area</option>
              <option value="private">Private Land</option>
              <option value="community">Community Land</option>
              <option value="public">Public Land</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-2 border-dashed border-border/50 rounded-lg p-4">
            <label className="cursor-pointer block">
              <span className="text-sm font-medium text-accent flex items-center gap-2 hover:underline">
                <Upload className="w-4 h-4" />
                Upload Land Ownership Proof *
              </span>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'landOwnershipProof')}
                accept=".pdf,.jpg,.png,.doc,.docx"
                className="hidden"
              />
            </label>
            {formData.landOwnershipProof && (
              <div className="flex items-center gap-2 p-2 rounded mt-2 bg-accent/10">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm">{formData.landOwnershipProof.name}</span>
              </div>
            )}
          </div>

          <div className="border-2 border-dashed border-border/50 rounded-lg p-4">
            <label className="cursor-pointer block">
              <span className="text-sm font-medium text-accent flex items-center gap-2 hover:underline">
                <Upload className="w-4 h-4" />
                Upload Data Accuracy Declaration *
              </span>
              <input
                type="file"
                onChange={(e) => handleFileUpload(e, 'dataKebenaran')}
                accept=".pdf,.jpg,.png,.doc,.docx"
                className="hidden"
              />
            </label>
            {formData.dataKebenaran && (
              <div className="flex items-center gap-2 p-2 rounded mt-2 bg-accent/10">
                <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                <span className="text-sm">{formData.dataKebenaran.name}</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Section E: Form Completeness */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section E: Form Completeness Summary</h2>
          <Badge variant="outline" className="ml-auto">Step 5 of 5</Badge>
        </div>

        <Card className={`p-6 ${validationErrors.length === 0 ? "bg-cyan-500/5 border-cyan-500/30" : "bg-amber-500/5 border-amber-500/30"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold text-lg ${validationErrors.length === 0 ? "text-cyan-900 dark:text-cyan-400" : "text-amber-900 dark:text-amber-400"}`}>
                Form Status
              </h3>
              <p className={`text-sm ${validationErrors.length === 0 ? "text-cyan-800 dark:text-cyan-300" : "text-amber-800 dark:text-amber-300"}`}>
                {validationErrors.length === 0 ? "✓ All required fields completed - ready to submit" : `⚠ ${validationErrors.length} fields missing`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{Math.round((requiredFields.filter((field) => {
                if (field === "satelliteDataFile" || field === "landOwnershipProof" || field === "dataKebenaran") {
                  return formData[field as keyof typeof formData] !== null
                }
                const value = formData[field as keyof typeof formData]
                return value && String(value).trim() !== ""
              }).length / requiredFields.length) * 100)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>

          {validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">Missing Fields:</p>
              <ul className="space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="text-xs text-amber-800 dark:text-amber-300">• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      {/* Run Verification Button */}
      <Button
        onClick={handleSubmit}
        disabled={validationErrors.length > 0 || isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            Processing Verification...
          </>
        ) : (
          "Run Verification"
        )}
      </Button>
    </div>
  )
}
