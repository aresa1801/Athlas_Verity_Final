"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, TrendingUp, Leaf, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { CarbonCreditOutput } from "@/lib/ai-carbon/carbon-conversion"
import type { ConsensusResult } from "@/lib/ai-carbon/aura-consensus"
import type { BiomassEstimate } from "@/lib/ai-carbon/biomass-estimation"

interface CarbonEstimationDashboardProps {
  biomassEstimate: BiomassEstimate
  carbonCredit: CarbonCreditOutput
  consensus: ConsensusResult
  projectInfo: {
    name: string
    area_ha: number
    location: { latitude: number; longitude: number }
  }
  onExportPDF: () => void
}

export function CarbonEstimationDashboard({
  biomassEstimate,
  carbonCredit,
  consensus,
  projectInfo,
  onExportPDF,
}: CarbonEstimationDashboardProps) {
  const getIntegrityClassColor = (ic: string) => {
    switch (ic) {
      case "IC-A":
        return "bg-accent/20 text-accent border-accent"
      case "IC-B":
        return "bg-blue-500/20 text-blue-400 border-blue-500"
      case "IC-C":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500"
      default:
        return "bg-red-500/20 text-red-400 border-red-500"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/30 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-accent mb-2">AI Carbon Intelligence Report</h2>
            <p className="text-muted-foreground">Transparent, conservative, and audit-grade carbon credit estimation</p>
          </div>
          <Button onClick={onExportPDF} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Final Verified CO2 */}
        <Card className="bg-card border-accent/50 p-6 hover:border-accent transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-accent/20">
              <Leaf className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Final Verified Carbon Credits</div>
              <div className="text-3xl font-bold text-accent">{carbonCredit.final_verified_co2_tco2}</div>
              <div className="text-xs text-muted-foreground">tCO₂e</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Conservative P10 estimate with all deductions applied</div>
        </Card>

        {/* Aura Score */}
        <Card className="bg-card border-border p-6 hover:border-accent/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Aura Score</div>
              <div className="text-3xl font-bold">{(consensus.aura_score * 100).toFixed(0)}%</div>
              <div className="text-xs text-muted-foreground">Validator Confidence</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getIntegrityClassColor(consensus.integrity_class)}>{consensus.integrity_class}</Badge>
          </div>
        </Card>

        {/* Uncertainty Range */}
        <Card className="bg-card border-border p-6 hover:border-accent/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-yellow-500/20">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Uncertainty Range</div>
              <div className="text-lg font-bold">
                {carbonCredit.uncertainty_range.min_tco2} - {carbonCredit.uncertainty_range.max_tco2}
              </div>
              <div className="text-xs text-muted-foreground">tCO₂e (P10 - P90)</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            ±{(((biomassEstimate.agb_p90 - biomassEstimate.agb_p10) / biomassEstimate.agb_mean) * 100).toFixed(0)}%
            variance in biomass estimate
          </div>
        </Card>
      </div>

      {/* Biomass Estimation */}
      <Card className="bg-card border-border p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent" />
          Above-Ground Biomass (AGB) Estimation
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-muted-foreground">Conservative (P10)</div>
            <div className="text-2xl font-bold text-yellow-400">{biomassEstimate.agb_p10}</div>
            <div className="text-xs text-muted-foreground">t/ha</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Mean Estimate</div>
            <div className="text-2xl font-bold">{biomassEstimate.agb_mean}</div>
            <div className="text-xs text-muted-foreground">t/ha</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Median (P50)</div>
            <div className="text-2xl font-bold">{biomassEstimate.agb_p50}</div>
            <div className="text-xs text-muted-foreground">t/ha</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Optimistic (P90)</div>
            <div className="text-2xl font-bold text-blue-400">{biomassEstimate.agb_p90}</div>
            <div className="text-xs text-muted-foreground">t/ha</div>
          </div>
        </div>

        {/* Feature Importance */}
        <div className="mt-6 p-4 bg-background/50 rounded-lg">
          <div className="text-sm font-semibold mb-3">Model Feature Importance</div>
          <div className="space-y-2">
            {Object.entries(biomassEstimate.feature_importance).map(([feature, importance]) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="text-xs w-32">{feature}</div>
                <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: `${importance * 100}%` }} />
                </div>
                <div className="text-xs text-muted-foreground w-12 text-right">{(importance * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Carbon Conversion Pipeline */}
      <Card className="bg-card border-border p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-accent" />
          IPCC Carbon Conversion Pipeline
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">Biomass (AGB)</span>
                <span className="font-mono">{biomassEstimate.agb_p10} t/ha</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">Carbon Fraction (IPCC)</span>
                <span className="font-mono">0.47</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">Carbon Stock (tC)</span>
                <span className="font-mono">{carbonCredit.carbon_stock_tc_conservative}</span>
              </div>
              <div className="flex justify-between p-3 bg-accent/10 rounded border border-accent/30">
                <span className="text-sm font-semibold">CO₂ Equivalent (44/12)</span>
                <span className="font-mono font-bold text-accent">{carbonCredit.co2_conservative_tco2} tCO₂</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">Baseline CO₂</span>
                <span className="font-mono">-{carbonCredit.baseline_co2_tco2}</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">
                  Leakage ({(carbonCredit.leakage_deduction_tco2 / carbonCredit.gross_reduction_tco2) * 100 || 0}%)
                </span>
                <span className="font-mono">-{carbonCredit.leakage_deduction_tco2}</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">
                  Buffer Pool (
                  {(carbonCredit.buffer_pool_deduction_tco2 /
                    (carbonCredit.gross_reduction_tco2 - carbonCredit.leakage_deduction_tco2)) *
                    100 || 0}
                  %)
                </span>
                <span className="font-mono">-{carbonCredit.buffer_pool_deduction_tco2}</span>
              </div>
              <div className="flex justify-between p-3 bg-background/50 rounded">
                <span className="text-sm">Integrity Discount ({carbonCredit.integrity_discount_percent}%)</span>
                <span className="font-mono">-{carbonCredit.integrity_deduction_tco2}</span>
              </div>
            </div>
          </div>

          {/* Final Result */}
          <div className="mt-6 p-4 bg-gradient-to-r from-accent/20 to-accent/10 rounded-lg border-2 border-accent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-accent" />
                <div>
                  <div className="text-sm text-muted-foreground">Final Verified Carbon Credits</div>
                  <div className="text-3xl font-bold text-accent">{carbonCredit.final_verified_co2_tco2} tCO₂e</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Per Hectare</div>
                <div className="text-xl font-bold">
                  {(carbonCredit.final_verified_co2_tco2 / projectInfo.area_ha).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">tCO₂e/ha</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Aura Subnet Consensus */}
      <Card className="bg-card border-border p-6">
        <h3 className="text-xl font-bold mb-4">Aura Subnet Validator Consensus</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Model Agreement</div>
            <div className="text-2xl font-bold">{(consensus.consensus_metrics.model_agreement * 100).toFixed(0)}%</div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Spatial Consistency</div>
            <div className="text-2xl font-bold">
              {(consensus.consensus_metrics.spatial_consistency * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Historical Plausibility</div>
            <div className="text-2xl font-bold">
              {(consensus.consensus_metrics.historical_plausibility * 100).toFixed(0)}%
            </div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Data Quality</div>
            <div className="text-2xl font-bold">
              {(consensus.consensus_metrics.data_quality_score * 100).toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Validator Contributors */}
        <div className="space-y-3">
          <div className="text-sm font-semibold mb-2">Validator Contributors</div>
          {consensus.contributors.map((contributor, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <code className="text-xs text-accent">{contributor.miner_id}</code>
                  <Badge variant="outline" className="text-xs">
                    {contributor.role.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">{contributor.reasoning}</div>
              </div>
              <div className="text-right ml-4">
                <div className="text-sm font-bold">{contributor.agb_estimate} t/ha</div>
                <div className="text-xs text-muted-foreground">
                  {(contributor.confidence * 100).toFixed(0)}% confidence
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Proof Chain */}
        <div className="mt-6 p-4 bg-accent/5 rounded-lg border border-accent/30">
          <div className="text-sm font-semibold mb-2">Proof-Chain Hash</div>
          <code className="text-xs text-accent break-all">{consensus.proof_chain_hash}</code>
        </div>
      </Card>

      {/* Methodology Notice */}
      <Card className="bg-background/50 border-border p-6">
        <div className="text-sm space-y-2 text-muted-foreground">
          <p className="font-semibold text-foreground">Methodology:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Biomass estimation: Random Forest model trained on GEDI Level 4A AGB data</li>
            <li>Carbon conversion: IPCC carbon fraction (0.47) and CO₂ molecular ratio (44/12)</li>
            <li>Conservative approach: Using P10 percentile for all credit calculations</li>
            <li>Validator consensus: Multi-miner validation with spatial and temporal consistency checks</li>
            <li>Integrity discount: Applied based on Aura Subnet consensus metrics</li>
          </ul>
          <p className="mt-4 text-xs italic">
            This is a transparent, reproducible, and audit-grade carbon credit estimation aligned with IPCC methodology.
            All calculations are conservative to ensure credibility and avoid over-crediting.
          </p>
        </div>
      </Card>
    </div>
  )
}
