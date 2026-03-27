"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, TrendingDown, AlertCircle } from "lucide-react"
import type { BlueCarbonResult } from "@/lib/blue-carbon-calculator"

interface BlueCarbonResultsDisplayProps {
  data: BlueCarbonResult
  projectArea: number
  projectDuration?: number
}

export function BlueCarbonResultsDisplay({ data, projectArea, projectDuration = 10 }: BlueCarbonResultsDisplayProps) {
  // Validate input data
  if (!data || Object.keys(data).length === 0) {
    return (
      <Card className="border-border/50 bg-card/30 p-6">
        <p className="text-muted-foreground text-center">No blue carbon data available</p>
      </Card>
    )
  }

  const totalCarbonStock = data.total_carbon_stock_tc || 0
  const netCredits = data.net_verified_credits_tco2 || 0

  return (
    <div className="space-y-6">
      {/* Executive Summary */}
      <Card className="border-border/50 bg-gradient-to-br from-card/80 to-background/50 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Net Verified Credits</p>
            <p className="text-4xl font-bold text-emerald-600">{Math.round(netCredits).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">tCO₂e over {projectDuration} years</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Carbon Stock</p>
            <p className="text-3xl font-bold text-blue-600">{Math.round(totalCarbonStock).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">tC (all pools)</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Project Area</p>
            <p className="text-3xl font-bold text-cyan-600">{(projectArea || 0).toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">hectares</p>
          </div>
        </div>
      </Card>

      {/* Biomass Pool Breakdown */}
      <Card className="border-border/50 bg-card/30 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          Biomass Pool Breakdown (tC/ha)
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* AGB */}
            <div className="border border-border/30 rounded-lg p-4 bg-background/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Aboveground Biomass (AGB)</p>
                  <p className="text-xs text-muted-foreground">Vegetation & tree stems</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-blue-600">{data.agb_tc_ha.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">tC/ha</p>
            </div>

            {/* BGB */}
            <div className="border border-border/30 rounded-lg p-4 bg-background/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Belowground Biomass (BGB)</p>
                  <p className="text-xs text-muted-foreground">Roots & subsurface</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-cyan-600">{data.bgb_tc_ha.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">tC/ha</p>
            </div>

            {/* Dead Wood */}
            <div className="border border-border/30 rounded-lg p-4 bg-background/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Dead Wood</p>
                  <p className="text-xs text-muted-foreground">Decomposing biomass</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-orange-600">{data.dead_wood_tc_ha.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">tC/ha</p>
            </div>

            {/* Litter */}
            <div className="border border-border/30 rounded-lg p-4 bg-background/20">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Litter</p>
                  <p className="text-xs text-muted-foreground">Surface organic matter</p>
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600">{data.litter_tc_ha.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">tC/ha</p>
            </div>

            {/* SOC */}
            <div className="border border-green-500/30 rounded-lg p-4 bg-green-500/5 sm:col-span-2 lg:col-span-1">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Soil Organic Carbon (SOC)</p>
                  <p className="text-xs text-muted-foreground">Top 1m of soil - critical for blue carbon</p>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-600">{data.soc_tc_ha.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-2">tC/ha</p>
            </div>
          </div>

          {/* Total Biomass */}
          <div className="border-t border-border/30 pt-4 mt-4 col-span-1 sm:col-span-2 lg:col-span-3">
            <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <p className="text-sm font-medium text-foreground">Total Biomass Carbon</p>
                <p className="text-2xl sm:text-3xl font-bold text-emerald-600">{data.total_biomass_tc_ha.toFixed(2)} tC/ha</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sequestration & Baseline */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-blue-600" />
          Carbon Sequestration & Baseline Avoidance
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Annual Sequestration Rate</p>
              <p className="text-2xl font-bold text-blue-600">{data.annual_sequestration_rate_tco2_ha.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">tCO₂/ha/year</p>
            </div>

            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Total Project Sequestration</p>
              <p className="text-2xl font-bold text-emerald-600">{Math.round(data.total_project_sequestration_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂ (over {projectDuration} years)</p>
            </div>

            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Baseline Emissions</p>
              <p className="text-2xl font-bold text-red-600">{Math.round(data.baseline_emissions_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂ (reference scenario)</p>
            </div>

            <div className="border border-border/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Gross Removals</p>
              <p className="text-2xl font-bold text-cyan-600">{Math.round(data.gross_removals_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂ (after baseline)</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Adjustments & Verification */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          Adjustments & Verification Deductions
        </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Leakage Adjustment</p>
              <p className="text-xl font-bold text-red-600">-{Math.round(data.leakage_adjustment_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-orange-500/30 bg-orange-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Buffer Pool Deduction</p>
              <p className="text-xl font-bold text-orange-600">-{Math.round(data.buffer_pool_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Uncertainty Discount</p>
              <p className="text-xl font-bold text-amber-600">-{Math.round(data.uncertainty_discount_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Net Verified Credits</p>
              <p className="text-xl font-bold text-emerald-600">{Math.round(netCredits).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂e (final)</p>
            </div>

            <div className="border border-orange-500/30 bg-orange-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Buffer Pool Deduction</p>
              <p className="text-xl font-bold text-orange-600">-{data.buffer_pool_tco2.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Uncertainty Discount</p>
              <p className="text-xl font-bold text-amber-600">-{data.uncertainty_discount_tco2.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Net Verified Credits</p>
              <p className="text-xl font-bold text-emerald-600">{Math.round(netCredits).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂e (net)</p>
            </div>
          </div>

          {/* Summary of Deductions */}
          <div className="border-t border-border/30 pt-4 mt-4">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border/30">
                  <td className="py-2 text-muted-foreground">Gross Removals</td>
                  <td className="py-2 text-right font-medium">{Math.round(data.gross_removals_tco2).toLocaleString()} tCO₂</td>
                </tr>
                <tr className="border-b border-border/30 text-red-600">
                  <td className="py-2">Leakage ({Math.abs(((data.leakage_adjustment_tco2 / data.gross_removals_tco2) * 100)).toFixed(1)}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(data.leakage_adjustment_tco2).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 text-orange-600">
                  <td className="py-2">Buffer Pool ({Math.abs(((data.buffer_pool_tco2 / data.gross_removals_tco2) * 100)).toFixed(1)}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(data.buffer_pool_tco2).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 text-amber-600">
                  <td className="py-2">Uncertainty ({Math.abs(((data.uncertainty_discount_tco2 / data.gross_removals_tco2) * 100)).toFixed(1)}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(data.uncertainty_discount_tco2).toLocaleString()}</td>
                </tr>
                <tr className="bg-emerald-500/10">
                  <td className="py-3 font-bold text-foreground">Final Verified Credits</td>
                  <td className="py-3 text-right font-bold text-emerald-600 text-lg">{Math.round(netCredits).toLocaleString()} tCO₂e</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Co-benefits */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Blue Carbon Co-benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-border/30 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Coastal Protection Value
            </p>
            <p className="text-sm text-muted-foreground">{data.coastal_protection_value}</p>
          </div>
          <div className="border border-border/30 rounded-lg p-4">
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Biodiversity Benefit
            </p>
            <p className="text-sm text-muted-foreground">{data.biodiversity_benefit}</p>
          </div>
        </div>
      </Card>

      {/* Methodology Reference */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Methodology & Standards Compliance</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• <span className="font-medium text-foreground">Standards:</span> IPCC AR6, Verra VCS, IUCN Blue Carbon Guidelines</p>
          <p>• <span className="font-medium text-foreground">AGB Calculation:</span> Satellite-derived Above Ground Biomass using IPCC methods</p>
          <p>• <span className="font-medium text-foreground">BGB Estimation:</span> Ecosystem-specific BGB/AGB ratios (0.45 for mangroves, 0.6 for seagrass)</p>
          <p>• <span className="font-medium text-foreground">SOC Assessment:</span> Soil Organic Carbon quantified to 1m depth using bulk density and organic matter percentage</p>
          <p>• <span className="font-medium text-foreground">Integrity Class:</span> IC-A (highest confidence - 95-100% accuracy)</p>
        </div>
      </Card>
    </div>
  )
}
