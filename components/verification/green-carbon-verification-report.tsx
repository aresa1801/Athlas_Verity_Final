"use client"
import React from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, TrendingUp, Shield, Database, Zap } from "lucide-react"
import type { GreenCarbonCalculationResult } from "@/lib/ai-carbon/green-carbon-engine"

interface GreenCarbonVerificationReportProps {
  result: GreenCarbonCalculationResult
  projectName?: string
  projectArea?: number
}

export function GreenCarbonVerificationReport({
  result,
  projectName = "Green Carbon Project",
  projectArea = 0,
}: GreenCarbonVerificationReportProps) {
  const getIntegrityColorClass = (integrity_class: string) => {
    switch (integrity_class) {
      case "IC-A":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
      case "IC-B":
        return "bg-blue-500/10 text-blue-700 border-blue-500/30"
      case "IC-C":
        return "bg-amber-500/10 text-amber-700 border-amber-500/30"
      case "IC-F":
        return "bg-red-500/10 text-red-700 border-red-500/30"
      default:
        return "bg-slate-500/10 text-slate-700"
    }
  }

  const getIntegrityLabel = (integrity_class: string) => {
    switch (integrity_class) {
      case "IC-A":
        return "High Integrity (A)"
      case "IC-B":
        return "Good Integrity (B)"
      case "IC-C":
        return "Acceptable Integrity (C)"
      case "IC-F":
        return "Failed (F)"
      default:
        return "Unknown"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-border/50 bg-gradient-to-br from-emerald-500/10 to-blue-500/5 p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{projectName}</h1>
          <p className="text-muted-foreground">
            Green Carbon Verification Report • {new Date().toLocaleDateString()}
          </p>
        </div>
      </Card>

      {/* Executive Summary */}
      <Card className="border-border/50 bg-card/50 p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Executive Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CO2 Credits */}
          <div className="border border-border/30 rounded-lg p-4 bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">Verified CO2 Credits</div>
            <div className="text-3xl font-bold text-emerald-600">{result.final_verified_tco2.toFixed(0)}</div>
            <div className="text-xs text-muted-foreground mt-1">tCO2e (conservative P10)</div>
          </div>

          {/* Integrity Class */}
          <div className="border border-border/30 rounded-lg p-4 bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">Integrity Class</div>
            <Badge className={`text-sm py-1 px-3 ${getIntegrityColorClass(result.integrity_assessment.integrity_class)}`}>
              {getIntegrityLabel(result.integrity_assessment.integrity_class)}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">Score: {result.integrity_assessment.composite_integrity_score}/100</div>
          </div>

          {/* AURA Verification */}
          <div className="border border-border/30 rounded-lg p-4 bg-background/50">
            <div className="text-sm text-muted-foreground mb-1">AURA Consensus</div>
            <div className="flex items-center gap-2">
              {result.aura_consensus.plausibility_check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-semibold">
                {result.aura_consensus.plausibility_check.passed ? "Passed" : "Flagged"}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">{result.aura_consensus.plausibility_check.agb_vs_ipcc_range}</div>
          </div>
        </div>
      </Card>

      {/* Carbon Calculation Breakdown */}
      <Card className="border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-semibold text-foreground">Carbon Calculation Breakdown</h2>
        </div>

        <div className="space-y-3">
          {/* AGB Estimation */}
          <div className="border-l-4 border-emerald-500/50 pl-4 py-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Aboveground Biomass (Conservative P10)</span>
              <span className="font-mono font-semibold text-foreground">{result.agb_conservative_tpha.toFixed(2)} t/ha</span>
            </div>
            <div className="text-xs text-muted-foreground">
              From satellite data (NDVI: {result.satellite_features?.vegetation.NDVI || "N/A"}, Canopy height:{" "}
              {result.satellite_features?.structure.canopy_height_mean || "N/A"}m)
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div className="bg-background/50 p-2 rounded">
                <div className="text-muted-foreground">P10</div>
                <div className="font-semibold">{result.biomass_estimate.agb_p10.toFixed(1)}</div>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <div className="text-muted-foreground">P50</div>
                <div className="font-semibold">{result.biomass_estimate.agb_p50.toFixed(1)}</div>
              </div>
              <div className="bg-background/50 p-2 rounded">
                <div className="text-muted-foreground">P90</div>
                <div className="font-semibold">{result.biomass_estimate.agb_p90.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Uncertainty */}
          <div className="border-l-4 border-blue-500/50 pl-4 py-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Uncertainty Range</span>
              <span className="font-semibold text-foreground">{result.uncertainty_percent.toFixed(1)}%</span>
            </div>
            {result.uncertainty_enforced_minimum && (
              <div className="text-xs text-amber-600">✓ Enforced minimum 15% uncertainty</div>
            )}
          </div>

          {/* Carbon Stock */}
          <div className="border-l-4 border-emerald-600/50 pl-4 py-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">Carbon Stock (Conservative)</span>
              <span className="font-mono font-semibold text-foreground">
                {result.carbon_calculation.carbon_stock_tc_conservative.toFixed(2)} tC
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Using IPCC carbon fraction: 0.47 × {result.agb_conservative_tpha.toFixed(2)} × {projectArea} ha
            </div>
          </div>

          {/* CO2 Equivalent */}
          <div className="border-l-4 border-emerald-500/50 pl-4 py-2">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">CO2 Equivalent</span>
              <span className="font-mono font-semibold text-foreground">
                {result.carbon_calculation.co2_conservative_tco2.toFixed(2)} tCO2e
              </span>
            </div>
            <div className="text-xs text-muted-foreground">Using conversion ratio: 44/12 = 3.67</div>
          </div>
        </div>
      </Card>

      {/* Baseline & Additionality */}
      <Card className="border-border/50 bg-card/50 p-6">
        <h2 className="text-xl font-semibold text-foreground mb-4">Baseline & Emission Reduction</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Baseline CO2 */}
            <div className="border border-border/30 rounded-lg p-4 bg-background/50">
              <div className="text-sm text-muted-foreground mb-2">Baseline CO2 (BaU Scenario)</div>
              <div className="text-2xl font-bold text-amber-600">
                {result.carbon_calculation.baseline_co2_tco2.toFixed(2)} tCO2e
              </div>
            </div>

            {/* Gross Reduction */}
            <div className="border border-border/30 rounded-lg p-4 bg-background/50">
              <div className="text-sm text-muted-foreground mb-2">Gross Emission Reduction</div>
              <div className="text-2xl font-bold text-emerald-600">
                {result.carbon_calculation.gross_reduction_tco2.toFixed(2)} tCO2e
              </div>
            </div>
          </div>

          {/* Deductions */}
          <div className="border border-border/30 rounded-lg p-4 bg-background/50 space-y-2">
            <div className="text-sm font-medium text-foreground mb-3">Deductions Applied</div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Leakage (10%)</span>
              <span className="font-mono">-{result.carbon_calculation.leakage_deduction_tco2.toFixed(2)} tCO2e</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Buffer Pool (20%)</span>
              <span className="font-mono">-{result.carbon_calculation.buffer_pool_deduction_tco2.toFixed(2)} tCO2e</span>
            </div>

            <div className="border-t border-border/30 pt-2 flex justify-between text-sm font-semibold">
              <span>After Deductions</span>
              <span className="font-mono">{result.carbon_calculation.net_after_deductions_tco2.toFixed(2)} tCO2e</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Integrity & Risk Assessment */}
      <Card className="border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-foreground">Integrity & Risk Assessment</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Integrity Components */}
          {[
            { label: "Legal Protection", value: result.integrity_assessment.legal_status_score },
            { label: "Data Completeness", value: result.integrity_assessment.data_completeness_score },
            { label: "Model Confidence", value: result.integrity_assessment.model_confidence_score },
            { label: "Methodology Alignment", value: result.integrity_assessment.methodology_alignment_score },
          ].map((item) => (
            <div key={item.label} className="border border-border/30 rounded-lg p-4 bg-background/50">
              <div className="text-xs text-muted-foreground mb-2">{item.label}</div>
              <div className="w-full bg-background rounded-full h-2 mb-2">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${item.value}%` }}
                />
              </div>
              <div className="text-sm font-semibold">{Math.round(item.value)}/100</div>
            </div>
          ))}
        </div>

        {/* Risk Adjustment */}
        <div className="border-l-4 border-amber-500/50 pl-4 py-3 bg-amber-500/5 rounded">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Risk Adjustment Factor</span>
            <span className="font-semibold text-amber-700">-{result.integrity_assessment.risk_adjustment_percent.toFixed(1)}%</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Conservative penalty based on legal protection, data quality, and model confidence
          </div>
        </div>
      </Card>

      {/* AURA Consensus Details */}
      <Card className="border-border/50 bg-card/50 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-semibold text-foreground">AURA Subnet Verification</h2>
        </div>

        <div className="space-y-4">
          {/* Plausibility Check */}
          <div className="border border-border/30 rounded-lg p-4 bg-background/50">
            <div className="flex items-center gap-2 mb-2">
              {result.aura_consensus.plausibility_check.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-semibold">Plausibility Check</span>
            </div>
            <div className="text-sm text-muted-foreground mb-2">{result.aura_consensus.plausibility_check.agb_vs_ipcc_range}</div>
            {result.aura_consensus.plausibility_check.flags.length > 0 && (
              <div className="space-y-1 mt-2">
                {result.aura_consensus.plausibility_check.flags.map((flag, idx) => (
                  <div key={idx} className="text-xs text-amber-600 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-amber-600" />
                    {flag}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Agreement */}
          <div className="border border-border/30 rounded-lg p-4 bg-background/50">
            <div className="text-sm font-medium text-foreground mb-3">Model Agreement Confidence</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Satellite Model</div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-blue-500 h-full rounded-full"
                    style={{ width: `${result.aura_consensus.model_agreement.satellite_model_confidence}%` }}
                  />
                </div>
                <div className="text-xs font-semibold mt-1">
                  {result.aura_consensus.model_agreement.satellite_model_confidence}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Consensus</div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-full rounded-full"
                    style={{ width: `${result.aura_consensus.model_agreement.consensus_confidence}%` }}
                  />
                </div>
                <div className="text-xs font-semibold mt-1">{result.aura_consensus.model_agreement.consensus_confidence}%</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Final Credits */}
      <Card className="border-border/50 bg-gradient-to-br from-emerald-500/20 to-blue-500/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-emerald-600" />
          <h2 className="text-xl font-semibold text-foreground">Final Verified Credits</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-emerald-500/30 rounded-lg p-4 bg-background/50">
            <div className="text-xs text-muted-foreground mb-2">Before Integrity Discount</div>
            <div className="text-2xl font-bold text-emerald-600">
              {result.carbon_calculation.net_after_deductions_tco2.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">tCO2e</div>
          </div>

          <div className="border border-amber-500/30 rounded-lg p-4 bg-background/50">
            <div className="text-xs text-muted-foreground mb-2">Integrity Discount ({result.integrity_assessment.integrity_class})</div>
            <div className="text-2xl font-bold text-amber-600">
              {result.carbon_calculation.integrity_discount_percent}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {result.carbon_calculation.integrity_deduction_tco2.toFixed(2)} tCO2e
            </div>
          </div>

          <div className="border border-emerald-600/30 rounded-lg p-4 bg-background/50">
            <div className="text-xs text-muted-foreground mb-2">Final Verified Credits</div>
            <div className="text-3xl font-bold text-emerald-600">{result.final_verified_tco2.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground mt-1">tCO2e</div>
          </div>
        </div>
      </Card>

      {/* Methodology Notes */}
      <Card className="border-border/50 bg-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-3">Methodology & Disclaimers</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>{result.methodology_notes}</p>
          <div className="bg-background/50 border border-border/30 rounded-lg p-3 space-y-2 text-xs">
            <p>
              <strong>Uncertainty Quantification:</strong> Values represent P10 (conservative), P50 (median), and P90
              (optimistic) percentiles from quantile regression model.
            </p>
            <p>
              <strong>Scientific Bounds:</strong> AGB estimates are cross-checked against IPCC regional ranges and global
              biomass maps (ESA CCI, GEDI).
            </p>
            <p>
              <strong>Baseline Logic:</strong> Follows Verra VCS & Gold Standard forestry methodologies for protection &
              restoration projects.
            </p>
            <p>
              <strong>Pre-Verification Status:</strong> This is a pre-verification estimate for audit preparation. Final
              credit issuance requires registry validation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
