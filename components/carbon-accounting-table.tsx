"use client"

import { Card } from "@/components/ui/card"
import type { CarbonCalculationResult } from "@/lib/carbon-calculator"

interface CarbonAccountingTableProps {
  calculation: CarbonCalculationResult
}

export default function CarbonAccountingTable({ calculation }: CarbonAccountingTableProps) {
  const safeNumber = (value: number | null | undefined, decimals = 2): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "N/A"
    }
    return value.toFixed(decimals)
  }

  const safeLocaleString = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return "N/A"
    }
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 })
  }

  const metrics = [
    { label: "AGB (t/ha)", value: safeNumber(calculation.agb_per_ha) },
    { label: "Carbon Fraction", value: safeNumber(calculation.carbon_fraction) },
    { label: "Project Area (ha)", value: safeNumber(calculation.area_ha) },
    {
      label: "Raw Carbon Stock (tC)",
      value: safeLocaleString(calculation.raw_carbon_stock_tc),
    },
    {
      label: "Converted CO₂ (tCO₂)",
      value: safeLocaleString(calculation.converted_co2_tco2),
    },
    {
      label: "Baseline Emissions (tCO₂)",
      value: safeLocaleString(calculation.baseline_emissions_total_tco2),
    },
    {
      label: "Gross Reduction (tCO₂)",
      value: safeLocaleString(calculation.gross_reduction_tco2),
    },
    { label: "Leakage Adjustment (%)", value: `${calculation.leakage_adjustment_percent}%` },
    { label: "Buffer Pool (%)", value: `${calculation.buffer_pool_percent}%` },
    {
      label: "Net Reduction (tCO₂)",
      value: safeLocaleString(calculation.net_reduction_tco2),
    },
    {
      label: "Integrity Class Adjustment",
      value: calculation.integrity_class_factor ? `${(calculation.integrity_class_factor * 100).toFixed(1)}%` : "N/A",
    },
    {
      label: "Final Verified Reduction (tCO₂)",
      value: safeLocaleString(calculation.final_verified_reduction_tco2),
      highlight: true,
    },
  ]

  return (
    <Card className="bg-card border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Carbon Accounting Calculations</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Metric</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Value</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index} className={`border-b border-border/50 ${metric.highlight ? "bg-accent/5" : ""}`}>
                <td className="py-3 px-4 text-foreground">{metric.label}</td>
                <td className={`text-right py-3 px-4 font-medium ${metric.highlight ? "text-accent text-base" : ""}`}>
                  {metric.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
