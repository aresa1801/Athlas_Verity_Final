"use client"

import { Card } from "@/components/ui/card"
import { Leaf, Waves, TrendingUp, Shield, AlertCircle } from "lucide-react"

export interface BlueCarbonDashboardProps {
  ecosystem_type: string
  agb_estimate: {
    agb_mean: number
    agb_p10: number
    agb_tco2e: number
  }
  sediment_carbon: {
    sediment_depth_m: number
    sediment_carbon_tco2e: number
    methodology_note: string
  }
  integrity: {
    integrity_score: number
    integrity_class: string
    net_verified_tco2e: number
    risk_discount_pct: number
    summary: string
  }
  total_area_ha: number
}

export function BlueCarbonDashboard({
  ecosystem_type,
  agb_estimate,
  sediment_carbon,
  integrity,
  total_area_ha,
}: BlueCarbonDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-leaf-green">Blue Carbon Verification Results</h2>
        <p className="text-gray-400 mt-2">Ecosystem: {ecosystem_type}</p>
      </div>

      {/* Primary Output: Final Verified Carbon */}
      <Card className="bg-gray-900 border-leaf-green/30 p-8">
        <div className="text-center">
          <div className="text-6xl font-bold text-leaf-green mb-2">{integrity.net_verified_tco2e.toFixed(0)}</div>
          <p className="text-gray-400">tCO₂e Verified Carbon Credits</p>
          <p className="text-sm text-gray-500 mt-3">
            Integrity Class: <span className="text-leaf-green font-bold">{integrity.integrity_class}</span>
          </p>
          <p className="text-sm text-gray-500">
            Score: {integrity.integrity_score}/100 ({integrity.risk_discount_pct}% conservative discount)
          </p>
        </div>
      </Card>

      {/* Carbon Breakdown: AGB vs Sediment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-900 border-leaf-green/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Leaf className="w-5 h-5 text-leaf-green" />
            <h3 className="font-semibold text-white">Aboveground Biomass (AGB)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Mean Estimate:</span>
              <span className="text-white font-semibold">{agb_estimate.agb_mean} t/ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Conservative (P10):</span>
              <span className="text-leaf-green font-semibold">{agb_estimate.agb_p10} t/ha</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">CO₂ Equivalent:</span>
              <span className="text-white font-semibold">{agb_estimate.agb_tco2e} tCO₂e/ha</span>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-leaf-green/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Waves className="w-5 h-5 text-leaf-green" />
            <h3 className="font-semibold text-white">Sediment Carbon (Belowground)</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Effective Depth:</span>
              <span className="text-white font-semibold">{sediment_carbon.sediment_depth_m} m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Total Sediment C:</span>
              <span className="text-leaf-green font-semibold">{sediment_carbon.sediment_carbon_tco2e} tCO₂e</span>
            </div>
            <div className="mt-3 p-2 bg-gray-800 rounded border border-gray-700">
              <p className="text-xs text-gray-400 italic">{sediment_carbon.methodology_note}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Integrity Score Components */}
      <Card className="bg-gray-900 border-leaf-green/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-leaf-green" />
          <h3 className="font-semibold text-white">Integrity Score Breakdown</h3>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Data Quality (25%)</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-leaf-green" style={{ width: "85%" }}></div>
            </div>
            <span className="text-white text-sm font-semibold">85</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Model Agreement (20%)</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-leaf-green" style={{ width: "78%" }}></div>
            </div>
            <span className="text-white text-sm font-semibold">78</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Conservativeness (20%)</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-leaf-green" style={{ width: "92%" }}></div>
            </div>
            <span className="text-white text-sm font-semibold">92</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Permanence & Risk (20%)</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-leaf-green" style={{ width: "88%" }}></div>
            </div>
            <span className="text-white text-sm font-semibold">88</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Auditability (15%)</span>
            <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-leaf-green" style={{ width: "90%" }}></div>
            </div>
            <span className="text-white text-sm font-semibold">90</span>
          </div>
        </div>
      </Card>

      {/* Verification Summary */}
      <Card className="bg-gray-900 border-leaf-green/20 p-6 flex items-start gap-4">
        <TrendingUp className="w-5 h-5 text-leaf-green mt-1 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-white mb-2">Verification Summary</h3>
          <p className="text-gray-300 text-sm">{integrity.summary}</p>
          <p className="text-gray-400 text-xs mt-2">
            Project Area: {total_area_ha.toFixed(2)} ha | Credit Density:{" "}
            {(integrity.net_verified_tco2e / total_area_ha).toFixed(2)} tCO₂e/ha
          </p>
        </div>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-amber-900/20 border-amber-700/40 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-amber-200 font-semibold">Model-Based Estimate Disclaimer</p>
            <p className="text-amber-100 text-xs mt-1">
              Sediment carbon is estimated using IPCC Wetlands Supplement defaults. This is NOT a direct measurement.
              Actual carbon credits for commercial use require ground truthing, core sampling, and third-party audit per
              VERRA VM0033 standards.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
