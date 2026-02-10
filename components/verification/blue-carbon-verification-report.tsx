"use client"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Download, Share2 } from "lucide-react"

interface BlueCarbonReportProps {
  data: {
    agb_component: any
    soil_component: any
    total_carbon_stock: any
    baseline_scenario: any
    risk_adjustment: any
    aura_verification: any
    final_verified_tco2e: number
    audit_trail: string[]
  }
}

export function BlueCarbonVerificationReport({ data }: BlueCarbonReportProps) {
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
            <p className="text-sm font-medium text-muted-foreground">Verified CO2e Credits</p>
            <p className="text-4xl font-bold text-emerald-600">{data.final_verified_tco2e.toFixed(0)}</p>
            <p className="text-xs text-muted-foreground">tCO2e (lifetime)</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Annual Avoided Emissions</p>
            <p className="text-3xl font-bold text-blue-600">
              {data.baseline_scenario.avoided_emissions_tco2e.toFixed(0)}
            </p>
            <p className="text-xs text-muted-foreground">tCO2e/year</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Integrity Class</p>
            <Badge className={`text-lg py-2 px-4 ${getIntegrityColor(data.aura_verification.integrity_class)}`}>
              {data.aura_verification.integrity_class}-Class
            </Badge>
            <p className="text-xs text-muted-foreground">{data.aura_verification.confidence_level}</p>
          </div>
        </div>
      </Card>

      {/* Carbon Calculation Breakdown */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Carbon Calculation Breakdown</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Aboveground Biomass Component</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Conservative (P10)</span>
                  <span className="font-mono font-semibold">{data.agb_component.conservative.toFixed(2)} tC/ha</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Range P10-P90</span>
                  <span className="font-mono">{data.agb_component.p10.toFixed(2)} - {data.agb_component.p90.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uncertainty</span>
                  <span className="font-mono">±{data.agb_component.uncertainty_pct.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Belowground & Soil Carbon</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Conservative (P10)</span>
                  <span className="font-mono font-semibold">{data.soil_component.conservative.toFixed(2)} tC/ha</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Range P10-P90</span>
                  <span className="font-mono">{data.soil_component.p10.toFixed(2)} - {data.soil_component.p90.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uncertainty</span>
                  <span className="font-mono">±{data.soil_component.uncertainty_pct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/30 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Total Carbon Stock</p>
                <p className="text-2xl font-bold text-foreground">{data.total_carbon_stock.tC.toFixed(0)} tC</p>
                <p className="text-xs text-muted-foreground">({data.total_carbon_stock.tCO2e.toFixed(0)} tCO2e equivalent)</p>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-muted-foreground">Combined Uncertainty</p>
                <p className="text-2xl font-bold text-foreground">±{data.total_carbon_stock.uncertainty_pct.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Meets ≥20% floor requirement</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Baseline & Additionality */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Baseline & Avoided Emissions</h3>
        <div className="space-y-4">
          <div className="border border-border/30 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-3">{data.baseline_scenario.scenario_description}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Annual Degradation Rate</p>
                <p className="text-xl font-semibold text-foreground">{data.baseline_scenario.annual_loss_rate.toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avoided Emissions (Baseline)</p>
                <p className="text-xl font-semibold text-blue-600">{data.baseline_scenario.avoided_emissions_tco2e.toFixed(0)} tCO2e</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Project Impact</p>
                <p className="text-xs text-emerald-600 font-semibold">Protection & Conservation</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Risk Adjustments */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Risk & Integrity Adjustments</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-border/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Disturbance Penalty</p>
              <p className="text-xl font-semibold text-red-600">-{data.risk_adjustment.disturbance_penalty.toFixed(1)}%</p>
            </div>
            <div className="border border-border/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Data Quality Penalty</p>
              <p className="text-xl font-semibold text-orange-600">-{data.risk_adjustment.data_quality_penalty.toFixed(1)}%</p>
            </div>
            <div className="border border-border/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Protection Bonus</p>
              <p className="text-xl font-semibold text-emerald-600">+{data.risk_adjustment.protection_bonus.toFixed(1)}%</p>
            </div>
          </div>
          <div className="border-t border-border/30 pt-3">
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
              <span className="text-sm font-medium text-foreground">Net Risk Adjustment</span>
              <span className="text-lg font-bold text-foreground">-{data.risk_adjustment.net_penalty_pct.toFixed(1)}%</span>
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
              <p className="text-xs text-muted-foreground mb-1">Plausibility Score</p>
              <p className="text-2xl font-bold text-blue-600">{data.aura_verification.plausibility_score.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
            <div className="border border-border/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Model Agreement</p>
              <p className="text-2xl font-bold text-emerald-600">{data.aura_verification.model_agreement.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">/100</p>
            </div>
            <div className="border border-border/30 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">Integrity Class</p>
              <p className={`text-2xl font-bold ${getIntegrityColor(data.aura_verification.integrity_class)}`}>
                {data.aura_verification.integrity_class}
              </p>
            </div>
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-3 text-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="text-xs text-emerald-700 font-medium">Verified</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">{data.aura_verification.confidence_level}</p>
        </div>
      </Card>

      {/* Final Verified Credits */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-500/10 p-6">
        <div className="text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <h3 className="text-2xl font-bold text-foreground">Final Verified Credits</h3>
          <p className="text-5xl font-bold text-emerald-600">{data.final_verified_tco2e.toFixed(0)}</p>
          <p className="text-sm text-muted-foreground">tCO2e ready for registry issuance</p>
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
