"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, Leaf } from "lucide-react"
import type { CarbonCalculationResult } from "@/lib/carbon-calculator"

interface CarbonReductionSummaryCardProps {
  calculation: CarbonCalculationResult
  integrityClass: string
}

export default function CarbonReductionSummaryCard({ calculation, integrityClass }: CarbonReductionSummaryCardProps) {
  return (
    <Card className="bg-card border-border p-6 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Leaf className="w-5 h-5 text-accent" />
            Carbon Reduction Summary
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Verified CO₂ Equivalent Reduction</p>
        </div>
        <TrendingUp className="w-6 h-6 text-accent opacity-60" />
      </div>

      <div className="space-y-3">
        {/* Main metric: Final Verified Reduction */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-1">Final Verified Reduction</p>
          <p className="text-3xl font-bold text-accent">{calculation.final_verified_reduction_tco2.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">tonnes CO₂ equivalent</p>
        </div>

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-background/50 p-3 rounded border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Raw Carbon Stock</p>
            <p className="font-semibold">{calculation.raw_carbon_stock_tc.toLocaleString()} tC</p>
          </div>
          <div className="bg-background/50 p-3 rounded border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Converted CO₂</p>
            <p className="font-semibold">{calculation.converted_co2_tco2.toLocaleString()} tCO₂</p>
          </div>
          <div className="bg-background/50 p-3 rounded border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Baseline Emissions</p>
            <p className="font-semibold">{calculation.baseline_emissions_total_tco2.toLocaleString()} tCO₂</p>
          </div>
          <div className="bg-background/50 p-3 rounded border border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Gross Reduction</p>
            <p className="font-semibold">{calculation.gross_reduction_tco2.toLocaleString()} tCO₂</p>
          </div>
        </div>

        {/* Deductions */}
        <div className="border-t border-border pt-3 mt-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Applied Adjustments</p>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Leakage ({calculation.leakage_adjustment_percent}%)</span>
              <span className="text-destructive">-{calculation.leakage_reduction_tco2.toLocaleString()} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span>Buffer Pool ({calculation.buffer_pool_percent}%)</span>
              <span className="text-destructive">-{calculation.buffer_reduction_tco2.toLocaleString()} tCO₂</span>
            </div>
            <div className="flex justify-between">
              <span>Integrity Class ({integrityClass})</span>
              <span className="text-destructive">
                -{calculation.integrity_class_adjustment_tco2.toLocaleString()} tCO₂
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
