"use client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Download, Share2, Zap } from "lucide-react"

interface RenewableEnergyReportProps {
  data: {
    mwh_validated: any
    grid_factor_verified: any
    emission_reduction: any
    additionality: any
    conservative_adjustment: any
    risk_adjustment: any
    aura_verification: any
    final_verified_tco2e: number
    audit_trail: string[]
  }
}

export function RenewableEnergyVerificationReport({ data }: RenewableEnergyReportProps) {
  const getIntegrityColor = (integrityClass: string) => {
    switch (integrityClass) {
      case "A":
        return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
      case "B":
        return "bg-blue-500/15 text-blue-700 border-blue-500/30"
      case "C":
        return "bg-amber-500/15 text-amber-700 border-amber-500/30"
      case "D":
        return "bg-red-500/15 text-red-700 border-red-500/30"
      default:
        return "bg-slate-500/15 text-slate-700 border-slate-500/30"
    }
  }

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-border/50 bg-gradient-to-br from-card/80 to-background/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Annual CO2e Reduction</p>
            <p className="text-4xl font-bold text-emerald-600">{data.final_verified_tco2e.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">tCO2e/year</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Validated Generation</p>
            <p className="text-3xl font-bold text-blue-600">{data.mwh_validated.annual_mwh.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">MWh/year</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Integrity Class</p>
            <Badge className={`text-lg py-2 px-4 ${getIntegrityColor(data.aura_verification.integrity_class)}`}>
              {data.aura_verification.integrity_class}-Class
            </Badge>
            <p className="text-xs text-muted-foreground">{data.mwh_validated.validation_status.toUpperCase()}</p>
          </div>
        </div>
      </Card>

      {/* MWh Validation */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">MWh Generation Validation</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Annual Generation</p>
              <p className="text-2xl font-bold text-foreground">{data.mwh_validated.annual_mwh.toFixed(0)} MWh</p>
              <p className="text-xs text-muted-foreground mt-2">Capacity Factor: {(data.mwh_validated.capacity_factor * 100).toFixed(1)}%</p>
            </div>
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Validation Status</p>
              <Badge className="bg-emerald-500/15 text-emerald-700 border border-emerald-500/30">
                {data.mwh_validated.validation_status.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">Plausibility: {data.mwh_validated.plausibility_pct.toFixed(0)}%</p>
            </div>
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Metering Data</p>
              <p className="text-lg font-semibold text-foreground">Present & Verified</p>
              <p className="text-xs text-muted-foreground mt-2">ISO 17025 compliant</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid Factor Verification */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Grid Emission Factor Verification</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Verified Grid Factor</p>
              <p className="text-3xl font-bold text-foreground">{data.grid_factor_verified.factor_tco2_mwh.toFixed(4)}</p>
              <p className="text-xs text-muted-foreground">tCO2/MWh</p>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Source: {data.grid_factor_verified.source}</p>
                <p className="text-xs text-muted-foreground">Confidence: {data.grid_factor_verified.confidence.toFixed(0)}%</p>
              </div>
            </div>
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Bounds Check</p>
              <Badge
                className={
                  data.grid_factor_verified.bounds_check === "compliant"
                    ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-700 border-amber-500/30"
                }
              >
                {data.grid_factor_verified.bounds_check.toUpperCase()}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">IPCC & IEA ranges verified</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Emission Reduction */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Base Emission Reduction</h3>
        <div className="space-y-3">
          <div className="border border-border/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-medium text-foreground">Annual ER (Before Adjustments)</p>
              <p className="text-2xl font-bold text-blue-600">{data.emission_reduction.annual_er_tco2e.toFixed(0)} tCO2e</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Calculation: {data.mwh_validated.annual_mwh.toFixed(0)} MWh × {data.grid_factor_verified.factor_tco2_mwh.toFixed(4)} tCO2/MWh
            </p>
            <p className="text-xs text-muted-foreground mt-2">Uncertainty: ±{data.emission_reduction.uncertainty_pct}%</p>
          </div>
        </div>
      </Card>

      {/* Additionality Assessment */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Additionality Confidence Analysis</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">IRR Without Carbon Credits</p>
              <p className="text-2xl font-bold text-foreground">{data.additionality.irr_without_carbon.toFixed(2)}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {data.additionality.irr_without_carbon < 8 ? "Below typical WACC - High additionality" : "Market competitive - Lower additionality"}
              </p>
            </div>
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Market Penetration</p>
              <p className="text-2xl font-bold text-foreground">{data.additionality.market_penetration_score.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground mt-2">
                {data.additionality.market_penetration_score < 20 ? "Emerging technology - High additionality" : "Mature market - Standard baseline"}
              </p>
            </div>
          </div>
          <div className="border-t border-border/30 pt-4">
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg mb-3">
              <span className="text-sm font-medium text-foreground">Additionality Confidence</span>
              <span className="text-lg font-bold text-foreground">{data.additionality.additionality_confidence.toFixed(0)}/100</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border/30">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-foreground">{data.additionality.risk_of_non_additionality}</p>
            </div>
            <div className="flex items-center gap-2 mt-2 p-3 rounded-lg border border-border/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-foreground">Regulatory Support: {data.additionality.regulatory_support ? "Yes" : "No"}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Conservative Adjustment & Risk */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Conservative Adjustments & Risk</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Conservative Adjustment</p>
              <p className="text-xl font-semibold text-red-600">× {data.conservative_adjustment.adjustment_factor.toFixed(3)}</p>
              <p className="text-xs text-muted-foreground mt-2">{data.conservative_adjustment.justification}</p>
            </div>
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Data Quality Penalty</p>
              <p className="text-xl font-semibold text-orange-600">-{data.risk_adjustment.data_quality_penalty.toFixed(1)}%</p>
            </div>
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Technology Penalty</p>
              <p className="text-xl font-semibold text-orange-600">-{data.risk_adjustment.technology_penalty.toFixed(1)}%</p>
            </div>
          </div>
          <div className="border-t border-border/30 pt-4">
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium text-foreground">Net Risk Adjustment</span>
              <span className="text-lg font-bold text-foreground">-{data.risk_adjustment.net_adjustment_pct.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* AURA Verification */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">AURA Subnet Verification</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border border-border/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Anomaly Score</p>
              <p className="text-2xl font-bold text-blue-600">{data.aura_verification.anomaly_score.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
            <div className="border border-border/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Pattern Confidence</p>
              <p className="text-2xl font-bold text-emerald-600">{data.aura_verification.mwh_pattern_confidence.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
            <div className="border border-border/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Plausibility</p>
              <p className="text-lg font-bold">{data.aura_verification.plausibility_check ? "✓ PASS" : "✗ FAIL"}</p>
              <p className="text-xs text-muted-foreground">Check</p>
            </div>
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-emerald-700 font-medium">{data.aura_verification.integrity_class}-Class</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Final Verified Credits */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 p-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-2 items-center">
            <Zap className="w-8 h-8 text-emerald-600" />
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">Final Verified Credits</h3>
          <p className="text-5xl font-bold text-emerald-600">{data.final_verified_tco2e.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">tCO2e/year ready for registry issuance</p>
          <div className="flex gap-3 justify-center pt-4">
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4" />
              Download Report
            </Button>
            <Button variant="outline" className="gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>
      </Card>

      {/* Audit Trail */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Audit Trail</h3>
        <div className="space-y-1 font-mono text-xs max-h-64 overflow-y-auto bg-background/50 p-3 rounded-lg text-muted-foreground">
          {data.audit_trail.map((entry, idx) => (
            <div key={idx} className="py-1">
              {entry}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
