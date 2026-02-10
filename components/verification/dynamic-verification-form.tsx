"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertCircle, Info, ChevronRight, ChevronLeft, Save } from "lucide-react"
import { EnhancedMapInterface } from "@/components/geospatial/enhanced-map-interface"

type CarbonType = "green-carbon" | "blue-carbon" | "renewable-energy"

interface FormField {
  id: string
  label: string
  type: "text" | "number" | "select" | "textarea" | "file" | "date"
  required: boolean
  tooltip?: string
  options?: { value: string; label: string }[]
  placeholder?: string
  validation?: (value: any) => boolean | string
}

interface FormSection {
  id: string
  title: string
  description: string
  fields: FormField[]
}

const CARBON_TYPE_CONFIGS: Record<CarbonType, { sections: FormSection[]; color: string; icon: string }> = {
  "green-carbon": {
    color: "emerald",
    icon: "🌳",
    sections: [
      {
        id: "project-identity",
        title: "Project Identity",
        description: "Core project information and methodology",
        fields: [
          {
            id: "projectName",
            label: "Project Name",
            type: "text",
            required: true,
            placeholder: "e.g., Amazon Forest Carbon Project",
            tooltip: "Required for project identification and tracking",
          },
          {
            id: "country",
            label: "Country",
            type: "select",
            required: true,
            tooltip: "Affects baseline emissions and IPCC default values",
            options: [
              { value: "BR", label: "Brazil" },
              { value: "ID", label: "Indonesia" },
              { value: "CD", label: "Democratic Republic of Congo" },
              { value: "IN", label: "India" },
              { value: "CN", label: "China" },
              { value: "US", label: "United States" },
            ],
          },
          {
            id: "baselineYear",
            label: "Baseline Year",
            type: "number",
            required: true,
            tooltip: "Year for establishing carbon baseline",
            validation: (v) => v >= 1990 && v <= new Date().getFullYear(),
          },
          {
            id: "methodology",
            label: "Methodology Reference",
            type: "select",
            required: true,
            tooltip: "Determines verification standards and requirements",
            options: [
              { value: "verra", label: "Verra VCS" },
              { value: "gs", label: "Gold Standard" },
              { value: "cdm", label: "CDM (UNFCCC)" },
              { value: "acr", label: "ACR" },
            ],
          },
        ],
      },
      {
        id: "geospatial-data",
        title: "Geospatial Data",
        description: "Project boundary and location",
        fields: [
          {
            id: "polygon",
            label: "Draw Project Boundary",
            type: "text",
            required: true,
            tooltip: "Required for area calculation and satellite analysis. Use map interface.",
          },
          {
            id: "forestType",
            label: "Forest Type",
            type: "select",
            required: true,
            tooltip: "Affects biomass estimation model selection",
            options: [
              { value: "tropical", label: "Tropical" },
              { value: "subtropical", label: "Subtropical" },
              { value: "temperate", label: "Temperate" },
              { value: "boreal", label: "Boreal" },
              { value: "dry", label: "Dry" },
            ],
          },
          {
            id: "protectionType",
            label: "Protection/Restoration Type",
            type: "select",
            required: true,
            tooltip: "Determines additionality assessment",
            options: [
              { value: "protection", label: "Forest Protection" },
              { value: "restoration", label: "Reforestation/Restoration" },
              { value: "agroforestry", label: "Agroforestry" },
            ],
          },
        ],
      },
      {
        id: "ecological-data",
        title: "Ecological Data",
        description: "Key for biomass model calibration",
        fields: [
          {
            id: "dominantSpecies",
            label: "Dominant Tree Species",
            type: "textarea",
            required: false,
            placeholder: "e.g., Açaí (Euterpe oleracea), Rubber Tree (Hevea brasiliensis)",
            tooltip: "Used for species-specific allometric equations",
          },
          {
            id: "avgTreeHeight",
            label: "Average Tree Height (meters)",
            type: "number",
            required: false,
            tooltip: "Improves biomass estimation accuracy",
          },
          {
            id: "fieldPlotData",
            label: "Field Plot Data (CSV)",
            type: "file",
            required: false,
            tooltip: "DBH, height measurements from ground surveys",
          },
        ],
      },
      {
        id: "risk-additionality",
        title: "Risk & Additionality",
        description: "Verification integrity factors",
        fields: [
          {
            id: "deforestationRisk",
            label: "Deforestation Risk Level",
            type: "select",
            required: true,
            tooltip: "Baseline development depends on this assessment",
            options: [
              { value: "high", label: "High Risk" },
              { value: "medium", label: "Medium Risk" },
              { value: "low", label: "Low Risk" },
            ],
          },
          {
            id: "legalStatus",
            label: "Legal Protection Status",
            type: "select",
            required: true,
            tooltip: "Required for additionality verification",
            options: [
              { value: "protected", label: "Protected Area" },
              { value: "private", label: "Private Land" },
              { value: "communal", label: "Communal Land" },
              { value: "disputed", label: "Land Use Disputed" },
            ],
          },
          {
            id: "ownershipProof",
            label: "Land Ownership Documentation",
            type: "file",
            required: true,
            tooltip: "Essential for legal verification",
          },
        ],
      },
    ],
  },
  "blue-carbon": {
    color: "blue",
    icon: "🌊",
    sections: [
      {
        id: "project-identity",
        title: "Project Identity",
        description: "Core project information",
        fields: [
          {
            id: "projectName",
            label: "Project Name",
            type: "text",
            required: true,
            placeholder: "e.g., Coastal Mangrove Conservation",
            tooltip: "Required for project identification",
          },
          {
            id: "country",
            label: "Country",
            type: "select",
            required: true,
            tooltip: "Affects coastal baselines",
            options: [
              { value: "ID", label: "Indonesia" },
              { value: "PH", label: "Philippines" },
              { value: "TH", label: "Thailand" },
              { value: "MY", label: "Malaysia" },
              { value: "VN", label: "Vietnam" },
            ],
          },
          {
            id: "methodology",
            label: "Blue Carbon Methodology",
            type: "select",
            required: true,
            tooltip: "Determines verification standards",
            options: [
              { value: "verra-wcp", label: "Verra Wetland and Peatland" },
              { value: "gs-coastal", label: "Gold Standard Coastal" },
            ],
          },
        ],
      },
      {
        id: "coastal-geospatial",
        title: "Coastal Geospatial Data",
        description: "Ecosystem boundary and type",
        fields: [
          {
            id: "polygon",
            label: "Draw Coastal Project Area",
            type: "text",
            required: true,
            tooltip: "Use map to define ecosystem boundary",
          },
          {
            id: "tidalZoneType",
            label: "Tidal Zone Type",
            type: "select",
            required: true,
            tooltip: "Affects carbon stock estimation",
            options: [
              { value: "mangrove", label: "Mangrove Forest" },
              { value: "seagrass", label: "Seagrass Meadow" },
              { value: "marsh", label: "Salt Marsh" },
              { value: "mixed", label: "Mixed Ecosystem" },
            ],
          },
          {
            id: "ecosystemType",
            label: "Primary Ecosystem",
            type: "select",
            required: true,
            tooltip: "Determines sediment carbon model",
            options: [
              { value: "rhizophora", label: "Rhizophora (Red) Mangrove" },
              { value: "avicennia", label: "Avicennia (Grey) Mangrove" },
              { value: "seagrass-haliodule", label: "Haliodule (Shoalweed)" },
              { value: "seagrass-thalassia", label: "Thalassia (Turtle Grass)" },
            ],
          },
        ],
      },
      {
        id: "sediment-ecology",
        title: "Sediment & Ecology",
        description: "Critical for blue carbon quantification",
        fields: [
          {
            id: "sedimentDepth",
            label: "Sediment Depth Estimate (meters)",
            type: "number",
            required: true,
            tooltip: "Used for carbon stock calculation - critical parameter",
            validation: (v) => v > 0 && v <= 10,
          },
          {
            id: "soilType",
            label: "Soil/Sediment Type",
            type: "select",
            required: true,
            tooltip: "Affects carbon density estimates",
            options: [
              { value: "sandy", label: "Sandy" },
              { value: "clayey", label: "Clayey" },
              { value: "peaty", label: "Peaty" },
              { value: "mixed", label: "Mixed" },
            ],
          },
          {
            id: "salinityType",
            label: "Salinity Type",
            type: "select",
            required: true,
            tooltip: "Influences decomposition and carbon storage",
            options: [
              { value: "marine", label: "Marine (>30 ppt)" },
              { value: "brackish", label: "Brackish (15-30 ppt)" },
              { value: "freshwater", label: "Freshwater (<15 ppt)" },
            ],
          },
        ],
      },
      {
        id: "protection-status",
        title: "Protection Status",
        description: "Legal and management factors",
        fields: [
          {
            id: "protectionStatus",
            label: "Coastal Protection Status",
            type: "select",
            required: true,
            tooltip: "Affects baseline development",
            options: [
              { value: "protected", label: "Protected Area" },
              { value: "unprotected", label: "Unprotected" },
              { value: "community-managed", label: "Community Managed" },
            ],
          },
          {
            id: "disturbanceLevel",
            label: "Human Disturbance Level",
            type: "select",
            required: true,
            tooltip: "Used for additionality assessment",
            options: [
              { value: "minimal", label: "Minimal" },
              { value: "moderate", label: "Moderate" },
              { value: "high", label: "High" },
            ],
          },
        ],
      },
    ],
  },
  "renewable-energy": {
    color: "amber",
    icon: "⚡",
    sections: [
      {
        id: "project-identity",
        title: "Project Identity",
        description: "Core project information",
        fields: [
          {
            id: "projectName",
            label: "Project Name",
            type: "text",
            required: true,
            placeholder: "e.g., Solar Farm Alpha",
            tooltip: "Required for project identification",
          },
          {
            id: "country",
            label: "Country",
            type: "select",
            required: true,
            tooltip: "Determines grid baseline emissions",
            options: [
              { value: "US", label: "United States" },
              { value: "IN", label: "India" },
              { value: "CN", label: "China" },
              { value: "BR", label: "Brazil" },
              { value: "EU", label: "European Union" },
            ],
          },
          {
            id: "commissioningDate",
            label: "Project Commissioning Date",
            type: "date",
            required: true,
            tooltip: "Start date for baseline period",
          },
          {
            id: "methodology",
            label: "RE Methodology",
            type: "select",
            required: true,
            tooltip: "Determines calculation methodology",
            options: [
              { value: "cdm", label: "CDM (UNFCCC)" },
              { value: "verra", label: "Verra (VCS)" },
              { value: "gs", label: "Gold Standard" },
            ],
          },
        ],
      },
      {
        id: "technical-specs",
        title: "Technical Specifications",
        description: "Technology and capacity",
        fields: [
          {
            id: "technologyType",
            label: "Technology Type",
            type: "select",
            required: true,
            tooltip: "Determines efficiency defaults",
            options: [
              { value: "solar-pv", label: "Solar Photovoltaic" },
              { value: "wind", label: "Wind Turbine" },
              { value: "hydro", label: "Hydroelectric" },
              { value: "geothermal", label: "Geothermal" },
              { value: "biomass", label: "Biomass" },
            ],
          },
          {
            id: "installedCapacity",
            label: "Installed Capacity (MW)",
            type: "number",
            required: true,
            tooltip: "Used for energy generation baseline",
            validation: (v) => v > 0,
          },
        ],
      },
      {
        id: "energy-data",
        title: "Energy Generation Data",
        description: "Critical for emissions avoidance calculation",
        fields: [
          {
            id: "annualMwh",
            label: "Annual Energy Generated (MWh)",
            type: "number",
            required: true,
            tooltip: "Basis for emissions avoidance calculation",
            validation: (v) => v > 0,
          },
          {
            id: "meteringReport",
            label: "Metering Report (PDF/XLS)",
            type: "file",
            required: true,
            tooltip: "Official generation records required for verification",
          },
          {
            id: "scadaData",
            label: "SCADA Data (Optional)",
            type: "file",
            required: false,
            tooltip: "SCADA logs improve verification confidence",
          },
        ],
      },
      {
        id: "baseline-data",
        title: "Baseline Data",
        description: "Grid baseline for emissions calculation",
        fields: [
          {
            id: "gridEmissionFactor",
            label: "Grid Emission Factor (tCO₂/MWh)",
            type: "number",
            required: true,
            tooltip: "Critical for emissions avoidance quantification",
            validation: (v) => v > 0 && v < 1.5,
          },
          {
            id: "emissionFactorSource",
            label: "Emission Factor Source",
            type: "select",
            required: true,
            tooltip: "Determines baseline methodology compliance",
            options: [
              { value: "national", label: "National Grid Authority" },
              { value: "iea", label: "IEA Database" },
              { value: "ipcc", label: "IPCC Guidelines" },
              { value: "cdr", label: "Carbon Data Repository" },
            ],
          },
        ],
      },
      {
        id: "additionality",
        title: "Additionality Inputs",
        description: "Financial additionality verification",
        fields: [
          {
            id: "capex",
            label: "Capital Expenditure (USD million)",
            type: "number",
            required: true,
            tooltip: "Used for IRR calculation",
            validation: (v) => v > 0,
          },
          {
            id: "expectedIrr",
            label: "Expected IRR Without Carbon (%)",
            type: "number",
            required: true,
            tooltip: "Used to demonstrate financial need for carbon income",
            validation: (v) => v >= 0 && v <= 50,
          },
          {
            id: "regulatorySupportPresent",
            label: "Regulatory Support Present?",
            type: "select",
            required: true,
            tooltip: "Affects additionality determination",
            options: [
              { value: "yes", label: "Yes - Mandatory/Subsidized" },
              { value: "no", label: "No - Market-driven" },
            ],
          },
        ],
      },
    ],
  },
}

interface VerificationFormProps {
  carbonType: CarbonType
  onSubmit?: (formData: any) => void
}

export function DynamicVerificationForm({ carbonType, onSubmit }: VerificationFormProps) {
  const config = CARBON_TYPE_CONFIGS[carbonType]
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [savedDrafts, setSavedDrafts] = useState<number>(0)

  const currentSection = config.sections[currentStep]
  const totalSteps = config.sections.length

  const fieldValues = useMemo(() => {
    return currentSection.fields.reduce((acc, field) => {
      acc[field.id] = formData[field.id] ?? ""
      return acc
    }, {} as Record<string, any>)
  }, [currentSection.fields, formData])

  const completionStatus = useMemo(() => {
    let completed = 0
    let total = 0

    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required) {
          total++
          if (formData[field.id]) {
            completed++
          }
        }
      })
    })

    return { completed, total }
  }, [config.sections, formData])

  const canProceed = useMemo(() => {
    return currentSection.fields
      .filter((f) => f.required)
      .every((f) => {
        const value = formData[f.id]
        if (f.validation) {
          const result = f.validation(value)
          return result === true
        }
        return value && value !== ""
      })
  }, [currentSection.fields, formData])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps - 1 && canProceed) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveDraft = () => {
    const draft = {
      carbonType,
      step: currentStep,
      data: formData,
      polygon,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(`draft-${carbonType}`, JSON.stringify(draft))
    setSavedDrafts(savedDrafts + 1)
  }

  const handleSubmit = async () => {
    if (completionStatus.completed < completionStatus.total) {
      alert("Please complete all required fields")
      return
    }

    const completeFormData = {
      carbonType,
      sections: config.sections.map((section) => ({
        id: section.id,
        title: section.title,
        data: section.fields.reduce((acc, field) => {
          acc[field.id] = formData[field.id]
          return acc
        }, {} as Record<string, any>),
      })),
      polygon,
      submittedAt: new Date().toISOString(),
    }

    onSubmit?.(completeFormData)

    // Clear draft
    localStorage.removeItem(`draft-${carbonType}`)
    setSavedDrafts(0)
  }

  const handleRunVerification = () => {
    const validationErrors: string[] = []

    // Check required fields
    config.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.required && !formData[field.id]) {
          validationErrors.push(`${section.title}: ${field.label} is required`)
        }
      })
    })

    if (validationErrors.length > 0) {
      alert("Cannot run verification:\n" + validationErrors.join("\n"))
      return
    }

    handleSubmit()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-border/50 bg-gradient-to-r from-card to-card/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{config.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{currentSection.title}</h1>
              <p className="text-sm text-muted-foreground">{currentSection.description}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg">
            {currentStep + 1} of {totalSteps}
          </Badge>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Overall Completion</span>
            <span className="font-semibold">
              {completionStatus.completed} of {completionStatus.total} required fields
            </span>
          </div>
          <Progress
            value={(completionStatus.completed / completionStatus.total) * 100}
            className="h-2"
          />
        </div>
      </Card>

      {/* Form Content */}
      <Card className="border-border/50 bg-card/50 p-6 space-y-6">
        {currentSection.fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-start justify-between">
              <Label htmlFor={field.id} className="flex items-center gap-2">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
                {field.tooltip && (
                  <div className="group relative">
                    <Info className="w-4 h-4 text-muted-foreground hover:text-foreground cursor-help" />
                    <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-48 bg-slate-900 text-white text-xs rounded p-2 z-10 border border-border">
                      {field.tooltip}
                    </div>
                  </div>
                )}
              </Label>
              {fieldValues[field.id] && field.required && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            {field.type === "select" && (
              <Select value={fieldValues[field.id]} onValueChange={(v) => handleFieldChange(field.id, v)}>
                <SelectTrigger id={field.id}>
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === "text" && (
              <Input
                id={field.id}
                placeholder={field.placeholder}
                value={fieldValues[field.id]}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                disabled={field.id === "polygon"}
              />
            )}

            {field.type === "number" && (
              <Input
                id={field.id}
                type="number"
                placeholder={field.placeholder}
                value={fieldValues[field.id]}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === "date" && (
              <Input
                id={field.id}
                type="date"
                value={fieldValues[field.id]}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
              />
            )}

            {field.type === "textarea" && (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                value={fieldValues[field.id]}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="min-h-24"
              />
            )}

            {field.type === "file" && (
              <label className="block">
                <Input
                  id={field.id}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFieldChange(field.id, file.name)
                    }
                  }}
                />
              </label>
            )}
          </div>
        ))}

        {/* Map Section for Geospatial Fields */}
        {currentSection.id.includes("geospatial") && (
          <div className="space-y-4 pt-6 border-t border-border/30">
            <EnhancedMapInterface
              polygon={polygon}
              setPolygon={setPolygon}
              location={{ latitude: "-2.5", longitude: "118.0", radius: "5" }}
              onAreaCalculated={(area) => {
                handleFieldChange("area", area?.areaHa.toString() || "")
              }}
            />
          </div>
        )}
      </Card>

      {/* Validation Alert */}
      {!canProceed && currentSection.fields.some((f) => f.required) && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            Complete all required fields to proceed to the next section. This ensures the AI/ML verification engine receives sufficient, methodology-compliant data.
          </AlertDescription>
        </Alert>
      )}

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          onClick={handlePrev}
          disabled={currentStep === 0}
          variant="outline"
          className="gap-2 bg-transparent"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          <Button
            onClick={handleSaveDraft}
            variant="outline"
            className="gap-2 bg-transparent"
          >
            <Save className="w-4 h-4" />
            Save Draft {savedDrafts > 0 && `(${savedDrafts})`}
          </Button>

          {currentStep < totalSteps - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleRunVerification}
              disabled={completionStatus.completed < completionStatus.total}
              className={`gap-2 ${
                completionStatus.completed === completionStatus.total
                  ? `bg-${config.color}-600 hover:bg-${config.color}-700`
                  : ""
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Run Verification
            </Button>
          )}
        </div>
      </div>

      {/* Completion Status */}
      <Card className="border-border/50 bg-card/30 p-4">
        <div className="text-sm text-muted-foreground">
          <div className="font-semibold text-foreground mb-2">✓ Verification Ready Status</div>
          <div className="space-y-1">
            {completionStatus.completed === completionStatus.total ? (
              <div className="text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                All required data complete. Ready for verification.
              </div>
            ) : (
              <div className="text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {completionStatus.total - completionStatus.completed} required field(s) remaining
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
