"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, AlertCircle } from "lucide-react"

export function PortfolioSnapshot() {
  const portfolioMetrics = [
    {
      label: "Total CO₂e Credits",
      value: "0",
      unit: "tCO₂e",
      trend: "—",
      status: "pending",
    },
    {
      label: "Portfolio Value",
      value: "$0",
      unit: "USD",
      trend: "—",
      status: "pending",
    },
    {
      label: "Verification Score",
      value: "—",
      unit: "/100",
      trend: "—",
      status: "pending",
    },
    {
      label: "Active Projects",
      value: "0",
      unit: "projects",
      trend: "—",
      status: "pending",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Portfolio Snapshot</h2>
        <p className="text-sm text-muted-foreground mt-1">Your portfolio is empty. Create your first project to get started.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioMetrics.map((metric, idx) => (
          <Card
            key={idx}
            className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-5 hover:border-accent/50 transition-all opacity-60"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  {metric.label}
                </p>
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-bold text-foreground">{metric.value}</span>
                  <span className="text-xs text-muted-foreground">{metric.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  <TrendingUp className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-500">{metric.trend}</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-slate-500" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
