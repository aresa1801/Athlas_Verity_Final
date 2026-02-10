"use client"

import React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, HelpCircle, Upload } from "lucide-react"

interface RenewableEnergyFormData {
  // Section A
  projectName: string
  country: string
  commissioningDate: string
  methodologyRef: string

  // Section B
  technologyType: string
  installedCapacity: string

  // Section C
  annualMwhGenerated: string
  meteringReport: File | null

  // Section D
  gridEmissionFactor: string
  emissionFactorSource: string

  // Section E
  capex: string
  expectedIrrWithoutCarbon: string
  regulatorySupportPresent: string
}

const FIELD_TOOLTIPS = {
  projectName: "Name of your renewable energy project",
  country: "Country where the project is located",
  commissioningDate: "Date when the project became operational",
  methodologyRef: "Renewable energy methodology (ACM/AMS standards)",
  technologyType: "Primary renewable technology (solar/wind/hydro/geothermal/biomass)",
  installedCapacity: "Total installed capacity in megawatts (MW) - determines baseline emissions",
  annualMwhGenerated: "Annual electricity generation in MWh - critical for emissions avoidance calculation",
  meteringReport: "Verified meter readings proving actual generation - required for accuracy",
  gridEmissionFactor: "Grid emission intensity (tCO₂/MWh) - used to calculate avoided emissions",
  emissionFactorSource: "Source of emission factor (national/IEA/IPCC) - affects credibility",
  capex: "Capital expenditure in USD - supports additionality assessment",
  expectedIrrWithoutCarbon: "Expected IRR without carbon revenue (%) - proves financial additionality",
  regulatorySupportPresent: "Whether project receives mandatory renewable subsidies",
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

export function RenewableEnergyForm() {
  const [formData, setFormData] = useState<RenewableEnergyFormData>({
    projectName: "",
    country: "",
    commissioningDate: "",
    methodologyRef: "acm",
    technologyType: "",
    installedCapacity: "",
    annualMwhGenerated: "",
    meteringReport: null,
    gridEmissionFactor: "",
    emissionFactorSource: "iea",
    capex: "",
    expectedIrrWithoutCarbon: "",
    regulatorySupportPresent: "",
  })

  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const requiredFields = [
    "projectName",
    "country",
    "commissioningDate",
    "methodologyRef",
    "technologyType",
    "installedCapacity",
    "annualMwhGenerated",
    "meteringReport",
    "gridEmissionFactor",
    "emissionFactorSource",
    "capex",
    "expectedIrrWithoutCarbon",
    "regulatorySupportPresent",
  ]

  const checkCompleteness = useCallback(() => {
    const errors: string[] = []

    if (!formData.projectName.trim()) errors.push("Project name is required")
    if (!formData.country) errors.push("Country is required")
    if (!formData.commissioningDate) errors.push("Commissioning date is required")
    if (!formData.methodologyRef) errors.push("Methodology reference is required")
    if (!formData.technologyType) errors.push("Technology type is required")
    if (!formData.installedCapacity || parseFloat(formData.installedCapacity) <= 0)
      errors.push("Valid installed capacity is required")
    if (!formData.annualMwhGenerated || parseFloat(formData.annualMwhGenerated) <= 0)
      errors.push("Valid annual MWh generation is required")
    if (!formData.meteringReport) errors.push("Metering report upload is required")
    if (!formData.gridEmissionFactor || parseFloat(formData.gridEmissionFactor) < 0)
      errors.push("Valid grid emission factor is required")
    if (!formData.emissionFactorSource) errors.push("Emission factor source is required")
    if (!formData.capex || parseFloat(formData.capex) <= 0) errors.push("Valid CAPEX is required")
    if (!formData.expectedIrrWithoutCarbon || parseFloat(formData.expectedIrrWithoutCarbon) < -100)
      errors.push("Valid expected IRR is required")
    if (!formData.regulatorySupportPresent) errors.push("Regulatory support status is required")

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  const isComplete = requiredFields.every((field) => {
    if (field === "meteringReport") return formData.meteringReport !== null
    if (field === "installedCapacity" || field === "annualMwhGenerated" || field === "gridEmissionFactor" || field === "capex" || field === "expectedIrrWithoutCarbon") {
      const value = formData[field as keyof RenewableEnergyFormData]
      return value && parseFloat(String(value)) > (field === "gridEmissionFactor" ? -1 : 0)
    }
    const value = formData[field as keyof RenewableEnergyFormData]
    return value && String(value).trim() !== ""
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"].includes(file.type)) {
        alert("Metering report must be PDF or Excel file")
        return
      }
      setFormData((prev) => ({ ...prev, meteringReport: file }))
    }
  }

  const handleRunVerification = async () => {
    if (!checkCompleteness()) {
      return
    }
    console.log("[v0] Running Renewable Energy verification with data:", formData)
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
              placeholder="e.g., Sahara Solar Farm 100 MW"
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
              <option value="EG">Egypt</option>
              <option value="IN">India</option>
              <option value="BR">Brazil</option>
              <option value="MX">Mexico</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Commissioning Date
              <Tooltip text={FIELD_TOOLTIPS.commissioningDate} />
            </label>
            <input
              type="date"
              value={formData.commissioningDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, commissioningDate: e.target.value }))}
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
              <option value="acm">ACM0002</option>
              <option value="ams">AMS-I.D</option>
              <option value="ams-wind">AMS-I.A (Wind)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section B: Technical Specs */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section B: Technical Specifications</h2>
          <Badge variant="outline" className="ml-auto">2/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Technology Type
              <Tooltip text={FIELD_TOOLTIPS.technologyType} />
            </label>
            <select
              value={formData.technologyType}
              onChange={(e) => setFormData((prev) => ({ ...prev, technologyType: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select technology</option>
              <option value="solar-pv">Solar PV</option>
              <option value="wind-onshore">Wind Onshore</option>
              <option value="wind-offshore">Wind Offshore</option>
              <option value="hydro">Hydroelectric</option>
              <option value="geothermal">Geothermal</option>
              <option value="biomass">Biomass</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Installed Capacity (MW)
              <Tooltip text={FIELD_TOOLTIPS.installedCapacity} />
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.installedCapacity}
              onChange={(e) => setFormData((prev) => ({ ...prev, installedCapacity: e.target.value }))}
              placeholder="e.g., 100"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>
      </section>

      {/* Section C: Energy Data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section C: Energy Data</h2>
          <Badge variant="outline" className="ml-auto">3/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Annual MWh Generated
              <Tooltip text={FIELD_TOOLTIPS.annualMwhGenerated} />
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              value={formData.annualMwhGenerated}
              onChange={(e) => setFormData((prev) => ({ ...prev, annualMwhGenerated: e.target.value }))}
              placeholder="e.g., 180000"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center text-sm font-medium mb-2">
            Metering Report (PDF/Excel)
            <Tooltip text={FIELD_TOOLTIPS.meteringReport} />
          </label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".pdf,.xls,.xlsx"
              onChange={handleFileUpload}
              className="hidden"
              id="metering-report"
            />
            <label htmlFor="metering-report" className="flex-1">
              <Button variant="outline" className="w-full gap-2 cursor-pointer bg-transparent" asChild>
                <span>
                  <Upload className="w-4 h-4" />
                  {formData.meteringReport ? formData.meteringReport.name : "Upload Report"}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </section>

      {/* Section D: Baseline Data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section D: Baseline Data</h2>
          <Badge variant="outline" className="ml-auto">4/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Grid Emission Factor (tCO₂/MWh)
              <Tooltip text={FIELD_TOOLTIPS.gridEmissionFactor} />
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.gridEmissionFactor}
              onChange={(e) => setFormData((prev) => ({ ...prev, gridEmissionFactor: e.target.value }))}
              placeholder="e.g., 0.65"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Emission Factor Source
              <Tooltip text={FIELD_TOOLTIPS.emissionFactorSource} />
            </label>
            <select
              value={formData.emissionFactorSource}
              onChange={(e) => setFormData((prev) => ({ ...prev, emissionFactorSource: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="national">National Registry</option>
              <option value="iea">IEA Database</option>
              <option value="ipcc">IPCC Defaults</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section E: Additionality */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section E: Additionality Inputs</h2>
          <Badge variant="outline" className="ml-auto">5/5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              CAPEX (USD)
              <Tooltip text={FIELD_TOOLTIPS.capex} />
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.capex}
              onChange={(e) => setFormData((prev) => ({ ...prev, capex: e.target.value }))}
              placeholder="e.g., 50000000"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Expected IRR Without Carbon (%)
              <Tooltip text={FIELD_TOOLTIPS.expectedIrrWithoutCarbon} />
            </label>
            <input
              type="number"
              step="0.1"
              min="-100"
              max="100"
              value={formData.expectedIrrWithoutCarbon}
              onChange={(e) => setFormData((prev) => ({ ...prev, expectedIrrWithoutCarbon: e.target.value }))}
              placeholder="e.g., 6.5"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center text-sm font-medium mb-2">
              Regulatory Support Present?
              <Tooltip text={FIELD_TOOLTIPS.regulatorySupportPresent} />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setFormData((prev) => ({ ...prev, regulatorySupportPresent: "yes" }))}
                variant={formData.regulatorySupportPresent === "yes" ? "default" : "outline"}
                className="w-full"
              >
                Yes
              </Button>
              <Button
                onClick={() => setFormData((prev) => ({ ...prev, regulatorySupportPresent: "no" }))}
                variant={formData.regulatorySupportPresent === "no" ? "default" : "outline"}
                className="w-full"
              >
                No
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Completeness Indicator */}
      <Card className={`p-6 ${isComplete ? "bg-amber-500/5 border-amber-500/30" : "bg-amber-500/5 border-amber-500/30"}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${isComplete ? "text-amber-900 dark:text-amber-400" : "text-amber-900 dark:text-amber-400"}`}>
              Form Completeness
            </h3>
            <p className={`text-sm ${isComplete ? "text-amber-800 dark:text-amber-300" : "text-amber-800 dark:text-amber-300"}`}>
              {isComplete ? "All required fields completed" : `${validationErrors.length} fields missing`}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(
              (requiredFields.filter((field) => {
                if (field === "meteringReport") return formData.meteringReport !== null
                if (field === "installedCapacity" || field === "annualMwhGenerated" || field === "gridEmissionFactor" || field === "capex" || field === "expectedIrrWithoutCarbon") {
                  const value = formData[field as keyof RenewableEnergyFormData]
                  return value && parseFloat(String(value)) > (field === "gridEmissionFactor" ? -1 : 0)
                }
                const value = formData[field as keyof RenewableEnergyFormData]
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
