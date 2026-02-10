"use client"

import { Card } from "@/components/ui/card"
import { TrendingUp, AlertCircle } from "lucide-react"

export function PortfolioSnapshot() {
  const portfolioMetrics = [
    {
      label: "Total CO₂e Credits",
      value: "2,450,000",
      unit: "tCO₂e",
      trend: "+12.5%",
      status: "verified",
    },
    {
      label: "Portfolio Value",
      value: "$61.2M",
      unit: "USD",
      trend: "+8.3%",
      status: "stable",
    },
    {
      label: "Verification Score",
      value: "98.7",
      unit: "/100",
      trend: "+0.2",
      status: "excellent",
    },
    {
      label: "Active Projects",
      value: "24",
      unit: "projects",
      trend: "+3",
      status: "active",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Portfolio Snapshot</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time overview of your carbon credit portfolio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {portfolioMetrics.map((metric, idx) => (
          <Card
            key={idx}
            className="relative overflow-hidden bg-gradient-to-br from-card to-card/50 border-border/50 p-5 hover:border-accent/50 transition-all"
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
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-500">{metric.trend}</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <div className={`w-3 h-3 rounded-full ${metric.status === "verified" ? "bg-emerald-500" : "bg-blue-500"}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
