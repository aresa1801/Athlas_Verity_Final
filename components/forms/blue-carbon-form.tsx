"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, HelpCircle, MapPin } from "lucide-react"
import { EnhancedMapInterface } from "@/components/geospatial/enhanced-map-interface"

interface BlueCarbonFormData {
  // Section A
  projectName: string
  country: string
  baselineYear: string
  methodologyRef: string

  // Section B
  polygon: Array<[number, number]>
  tidalZoneType: string
  ecosystemType: string

  // Section C
  sedimentDepthEstimate: string
  soilType: string
  salinityType: string

  // Section E
  coastalProtectionStatus: string
  humanDisturbanceLevel: string
}

const FIELD_TOOLTIPS = {
  projectName: "Name of your blue carbon project for identification",
  country: "Country where the coastal ecosystem is located",
  baselineYear: "Reference year for ecosystem condition baseline",
  methodologyRef: "Blue carbon methodology (Verra/IPCC guidelines)",
  polygon: "Define coastal ecosystem boundaries - critical for area and carbon stock calculation",
  tidalZoneType: "Tidal zone classification (intertidal/subtidal) - affects sediment carbon modeling",
  ecosystemType: "Ecosystem type (mangrove/seagrass/salt-marsh) - determines carbon storage potential",
  sedimentDepthEstimate: "Estimated active sediment depth - required for SOC (Soil Organic Carbon) calculation",
  soilType: "Soil classification - affects carbon storage coefficient",
  salinityType: "Salinity level (fresh/brackish/marine) - influences carbon cycling",
  coastalProtectionStatus: "Whether ecosystem provides coastal protection benefits",
  humanDisturbanceLevel: "Level of human impacts (fishing, pollution) - affects integrity scoring",
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
  const [formData, setFormData] = useState<BlueCarbonFormData>({
    projectName: "",
    country: "",
    baselineYear: "",
    methodologyRef: "verra",
    polygon: [],
    tidalZoneType: "",
    ecosystemType: "",
    sedimentDepthEstimate: "",
    soilType: "",
    salinityType: "",
    coastalProtectionStatus: "",
    humanDisturbanceLevel: "",
  })

  const [showMap, setShowMap] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const requiredFields = [
    "projectName",
    "country",
    "baselineYear",
    "methodologyRef",
    "polygon",
    "tidalZoneType",
    "ecosystemType",
    "sedimentDepthEstimate",
    "soilType",
    "salinityType",
    "coastalProtectionStatus",
    "humanDisturbanceLevel",
  ]

  const checkCompleteness = useCallback(() => {
    const errors: string[] = []

    if (!formData.projectName.trim()) errors.push("Project name is required")
    if (!formData.country) errors.push("Country is required")
    if (!formData.baselineYear) errors.push("Baseline year is required")
    if (!formData.methodologyRef) errors.push("Methodology reference is required")
    if (formData.polygon.length < 3) errors.push("Polygon must have at least 3 points")
    if (!formData.tidalZoneType) errors.push("Tidal zone type is required")
    if (!formData.ecosystemType) errors.push("Ecosystem type is required")
    if (!formData.sedimentDepthEstimate || parseFloat(formData.sedimentDepthEstimate) <= 0)
      errors.push("Valid sediment depth is required")
    if (!formData.soilType) errors.push("Soil type is required")
    if (!formData.salinityType) errors.push("Salinity type is required")
    if (!formData.coastalProtectionStatus) errors.push("Coastal protection status is required")
    if (!formData.humanDisturbanceLevel) errors.push("Human disturbance level is required")

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  const isComplete = requiredFields.every((field) => {
    if (field === "polygon") return formData.polygon.length >= 3
    if (field === "sedimentDepthEstimate")
      return formData.sedimentDepthEstimate && parseFloat(formData.sedimentDepthEstimate) > 0
    const value = formData[field as keyof BlueCarbonFormData]
    return value && String(value).trim() !== ""
  })

  const handleRunVerification = async () => {
    if (!checkCompleteness()) {
      return
    }
    console.log("[v0] Running Blue Carbon verification with data:", formData)
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
              placeholder="e.g., Mangrove Restoration - Southeast Asia"
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
              <option value="ID">Indonesia</option>
              <option value="MY">Malaysia</option>
              <option value="TH">Thailand</option>
              <option value="PH">Philippines</option>
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
              placeholder="e.g., 2015"
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
              <option value="verra">Verra VCS Blue Carbon</option>
              <option value="ipcc">IPCC 2019 Guidelines</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section B: Coastal Geospatial */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section B: Coastal Geospatial</h2>
          <Badge variant="outline" className="ml-auto">2/5</Badge>
        </div>

        {!showMap ? (
          <Button onClick={() => setShowMap(true)} className="w-full gap-2" variant="outline">
            <MapPin className="w-4 h-4" />
            Draw Coastal Boundary
          </Button>
        ) : (
          <Card className="border-border/50 bg-card/50 p-6 overflow-hidden">
            <EnhancedMapInterface
              polygon={formData.polygon}
              setPolygon={(poly) => setFormData((prev) => ({ ...prev, polygon: poly }))}
              location={{ latitude: "1.35", longitude: "103.8", radius: "5" }}
            />
            <Button onClick={() => setShowMap(false)} variant="outline" className="mt-4 w-full">
              Close Map
            </Button>
          </Card>
        )}

        {formData.polygon.length >= 3 && (
          <div className="p-4 bg-blue-500/5 border border-blue-500/30 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Polygon valid ({formData.polygon.length} points)</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Tidal Zone Type
              <Tooltip text={FIELD_TOOLTIPS.tidalZoneType} />
            </label>
            <select
              value={formData.tidalZoneType}
              onChange={(e) => setFormData((prev) => ({ ...prev, tidalZoneType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select zone type</option>
              <option value="intertidal">Intertidal</option>
              <option value="subtidal">Subtidal</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Ecosystem Type
              <Tooltip text={FIELD_TOOLTIPS.ecosystemType} />
            </label>
            <select
              value={formData.ecosystemType}
              onChange={(e) => setFormData((prev) => ({ ...prev, ecosystemType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select ecosystem</option>
              <option value="mangrove">Mangrove</option>
              <option value="seagrass">Seagrass</option>
              <option value="marsh">Salt Marsh</option>
              <option value="kelp">Kelp Forest</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section C: Sediment & Ecology */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section C: Sediment & Ecology</h2>
          <Badge variant="outline" className="ml-auto">3/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Sediment Depth Estimate (m)
              <Tooltip text={FIELD_TOOLTIPS.sedimentDepthEstimate} />
            </label>
            <input
              type="number"
              min="0"
              max="50"
              step="0.1"
              value={formData.sedimentDepthEstimate}
              onChange={(e) => setFormData((prev) => ({ ...prev, sedimentDepthEstimate: e.target.value }))}
              placeholder="e.g., 2.5"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Soil Type
              <Tooltip text={FIELD_TOOLTIPS.soilType} />
            </label>
            <select
              value={formData.soilType}
              onChange={(e) => setFormData((prev) => ({ ...prev, soilType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select soil type</option>
              <option value="peat">Peat</option>
              <option value="mud">Mud</option>
              <option value="sand">Sand</option>
              <option value="clay">Clay</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Salinity Type
              <Tooltip text={FIELD_TOOLTIPS.salinityType} />
            </label>
            <select
              value={formData.salinityType}
              onChange={(e) => setFormData((prev) => ({ ...prev, salinityType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select salinity</option>
              <option value="fresh">Freshwater</option>
              <option value="brackish">Brackish</option>
              <option value="marine">Marine</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section E: Protection Status */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section E: Protection Status</h2>
          <Badge variant="outline" className="ml-auto">4/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Coastal Protection Status
              <Tooltip text={FIELD_TOOLTIPS.coastalProtectionStatus} />
            </label>
            <select
              value={formData.coastalProtectionStatus}
              onChange={(e) => setFormData((prev) => ({ ...prev, coastalProtectionStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select status</option>
              <option value="protected">Provides Protection</option>
              <option value="not-protected">No Protection Benefit</option>
              <option value="partially">Partial Protection</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Human Disturbance Level
              <Tooltip text={FIELD_TOOLTIPS.humanDisturbanceLevel} />
            </label>
            <select
              value={formData.humanDisturbanceLevel}
              onChange={(e) => setFormData((prev) => ({ ...prev, humanDisturbanceLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select disturbance level</option>
              <option value="none">None</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </section>

      {/* Completeness Indicator */}
      <Card className={`p-6 ${isComplete ? "bg-blue-500/5 border-blue-500/30" : "bg-amber-500/5 border-amber-500/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isComplete ? "text-blue-900 dark:text-blue-400" : "text-amber-900 dark:text-amber-400"}`}>
              Form Completeness
            </h3>
            <p className={`text-sm ${isComplete ? "text-blue-800 dark:text-blue-300" : "text-amber-800 dark:text-amber-300"}`}>
              {isComplete ? "All required fields completed" : `${validationErrors.length} fields missing`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(
              (requiredFields.filter((field) => {
                if (field === "polygon") return formData.polygon.length >= 3
                if (field === "sedimentDepthEstimate")
                  return formData.sedimentDepthEstimate && parseFloat(formData.sedimentDepthEstimate) > 0
                const value = formData[field as keyof BlueCarbonFormData]
                return value && String(value).trim() !== ""
              }).length / requiredFields.length) * 100
            )}%</div>
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
