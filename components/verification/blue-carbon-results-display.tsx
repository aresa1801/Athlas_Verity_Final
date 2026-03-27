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
      {/* Executive Summary - FINAL VERIFIED REDUCTION */}
      <Card className="border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-background/50 p-6 border-2">
        <h2 className="text-xl font-bold text-emerald-600 mb-4">International Verification Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Final Verified Reduction */}
          <div className="space-y-2 p-4 rounded-lg border border-emerald-500/50 bg-emerald-500/20">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Final Verified Reduction</p>
            <p className="text-3xl lg:text-4xl font-bold text-emerald-600">{Math.round(data.final_verified_reduction_tco2 || netCredits).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">tCO₂e (Verra/IUCN standards)</p>
            {data.integrity_score !== undefined && (
              <div className="mt-2 pt-2 border-t border-emerald-500/30">
                <p className="text-xs font-medium text-muted-foreground">Integrity Score: <span className="text-emerald-600 font-bold">{data.integrity_score}/100</span></p>
              </div>
            )}
          </div>

          {/* Verra Compliance & Ex-ante */}
          <div className="space-y-2 p-4 rounded-lg border border-blue-500/30 bg-blue-500/10">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ex-ante Credits</p>
            <p className="text-2xl font-bold text-blue-600">{Math.round(data.ex_ante_credits_tco2 || netCredits).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Before adjustments</p>
            {data.verra_compliance_status && (
              <div className="mt-2 pt-2 border-t border-blue-500/30">
                <p className={`text-xs font-bold px-2 py-1 rounded text-center ${
                  data.verra_compliance_status === 'Compliant' ? 'bg-green-500/20 text-green-700' :
                  data.verra_compliance_status === 'Conditional' ? 'bg-amber-500/20 text-amber-700' :
                  'bg-red-500/20 text-red-700'
                }`}>
                  {data.verra_compliance_status}
                </p>
              </div>
            )}
          </div>

          {/* Total Carbon Stock */}
          <div className="space-y-2 p-4 rounded-lg border border-cyan-500/30 bg-cyan-500/10">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Carbon Stock</p>
            <p className="text-3xl font-bold text-cyan-600">{Math.round(totalCarbonStock).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">tC (all pools)</p>
          </div>

          {/* Project Area */}
          <div className="space-y-2 p-4 rounded-lg border border-purple-500/30 bg-purple-500/10">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Project Area</p>
            <p className="text-3xl font-bold text-purple-600">{(projectArea || 0).toFixed(1)}</p>
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

      {/* Comprehensive Integrity Verification (International Standards) */}
      <Card className="border-border/50 bg-card/30 p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Comprehensive Integrity Verification (Verra/IUCN Standards)
        </h3>
        
        {/* Three-tier discount system */}
        <div className="space-y-3 mb-6">
          <div className="text-sm text-muted-foreground mb-4">
            Final Verified Reduction applies three international verification discounts to ensure permanence and environmental integrity:
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Saturation Discount */}
            <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Saturation Discount</p>
              <p className="text-2xl font-bold text-blue-600">{data.saturation_discount_percent || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Ecosystem carbon saturation limit</p>
              {data.saturation_discount_percent && (
                <p className="text-xs mt-2 pt-2 border-t border-blue-500/30 text-muted-foreground">
                  -${Math.round(((data.ex_ante_credits_tco2 || 0) * (data.saturation_discount_percent / 100))).toLocaleString()} tCO₂
                </p>
              )}
            </div>

            {/* Permanence Risk Discount */}
            <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Permanence Risk Discount</p>
              <p className="text-2xl font-bold text-amber-600">{data.permanence_risk_discount_percent || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Climate change & sea-level rise impact</p>
              {data.permanence_risk_discount_percent && (
                <p className="text-xs mt-2 pt-2 border-t border-amber-500/30 text-muted-foreground">
                  -{Math.round(((data.ex_ante_credits_tco2 || 0) * (data.permanence_risk_discount_percent / 100))).toLocaleString()} tCO₂
                </p>
              )}
            </div>

            {/* Additionality Discount */}
            <div className="border border-purple-500/30 bg-purple-500/10 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Additionality Discount</p>
              <p className="text-2xl font-bold text-purple-600">{data.additionality_discount_percent || 0}%</p>
              <p className="text-xs text-muted-foreground mt-1">Project necessity verification</p>
              {data.additionality_discount_percent && (
                <p className="text-xs mt-2 pt-2 border-t border-purple-500/30 text-muted-foreground">
                  -{Math.round(((data.ex_ante_credits_tco2 || 0) * (data.additionality_discount_percent / 100))).toLocaleString()} tCO₂
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Standard Adjustments */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-foreground mb-3">Standard VCS/Verra Adjustments:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Leakage Adjustment</p>
              <p className="text-xl font-bold text-red-600">-{Math.round(data.leakage_adjustment_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-orange-500/30 bg-orange-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Buffer Pool Deduction</p>
              <p className="text-xl font-bold text-orange-600">-{Math.round(data.buffer_pool_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂ ({data.buffer_pool_as_percent_of_credits || 0}% of credits)</p>
            </div>

            <div className="border border-amber-500/30 bg-amber-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Measurement Uncertainty</p>
              <p className="text-xl font-bold text-amber-600">-{Math.round(data.uncertainty_discount_tco2).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂</p>
            </div>

            <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Net Verified (Before Final)</p>
              <p className="text-xl font-bold text-green-600">{Math.round(netCredits).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">tCO₂e</p>
            </div>
          </div>
        </div>

          {/* Comprehensive Verification Flow */}
          <div className="border-t border-border/30 pt-4 mt-6">
            <h4 className="text-sm font-bold text-foreground mb-3">Verification Calculation Flow (International Standards)</h4>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-border/30 bg-blue-500/5">
                  <td className="py-2 text-muted-foreground">1. Gross Removals</td>
                  <td className="py-2 text-right font-medium">{Math.round(data.gross_removals_tco2).toLocaleString()} tCO₂</td>
                </tr>
                <tr className="border-b border-border/30 text-red-600">
                  <td className="py-2 text-muted-foreground">2. Less: Leakage ({Math.abs(((data.leakage_adjustment_tco2 / data.gross_removals_tco2) * 100)).toFixed(1)}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(data.leakage_adjustment_tco2).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 text-orange-600">
                  <td className="py-2 text-muted-foreground">3. Less: Uncertainty ({Math.abs(((data.uncertainty_discount_tco2 / data.gross_removals_tco2) * 100)).toFixed(1)}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(data.uncertainty_discount_tco2).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 text-amber-600">
                  <td className="py-2 text-muted-foreground">4. Less: Buffer Pool ({data.buffer_pool_as_percent_of_credits || 0}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(data.buffer_pool_tco2).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 bg-emerald-500/5">
                  <td className="py-2 font-bold text-foreground">= Net Verified Credits</td>
                  <td className="py-2 text-right font-bold text-emerald-600">{Math.round(netCredits).toLocaleString()} tCO₂e</td>
                </tr>
                <tr className="border-b border-border/30 text-blue-600">
                  <td className="py-2 text-muted-foreground">5. Less: Saturation Discount ({data.saturation_discount_percent || 0}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(((netCredits * (data.saturation_discount_percent || 0)) / 100)).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 text-amber-600">
                  <td className="py-2 text-muted-foreground">6. Less: Permanence Risk ({data.permanence_risk_discount_percent || 0}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(((netCredits * (data.permanence_risk_discount_percent || 0)) / 100)).toLocaleString()}</td>
                </tr>
                <tr className="border-b border-border/30 text-purple-600">
                  <td className="py-2 text-muted-foreground">7. Less: Additionality ({data.additionality_discount_percent || 0}%)</td>
                  <td className="py-2 text-right font-medium">-{Math.round(((netCredits * (data.additionality_discount_percent || 0)) / 100)).toLocaleString()}</td>
                </tr>
                <tr className="bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/50">
                  <td className="py-3 font-bold text-foreground text-base">FINAL VERIFIED REDUCTION</td>
                  <td className="py-3 text-right font-bold text-emerald-600 text-lg">{Math.round(data.final_verified_reduction_tco2 || netCredits).toLocaleString()} tCO₂e</td>
                </tr>
                {data.discount_factor_applied !== undefined && (
                  <tr className="border-t border-border/30 bg-muted/30">
                    <td className="py-2 text-muted-foreground text-xs">Total Discount Applied</td>
                    <td className="py-2 text-right font-medium text-xs">{((1 - (data.discount_factor_applied || 1)) * 100).toFixed(1)}% | Discount Factor: {data.discount_factor_applied?.toFixed(3)}</td>
                  </tr>
                )}
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
