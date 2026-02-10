"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { CheckCircle2, AlertCircle, TrendingUp } from "lucide-react"

export function VerificationResults() {
  const verificationData = {
    projectName: "Amazon Reforestation Initiative",
    carbonType: "Green Carbon",
    status: "verified",
    verificationScore: 98.5,
    credits: "2,100,000",
    unit: "tCO₂e",
    agb: 185.4,
    uncertainty: 18.5,
  }

  const dataBreakdown = [
    {
      name: "Jan",
      verified: 85,
      pending: 15,
    },
    {
      name: "Feb",
      verified: 88,
      pending: 12,
    },
    {
      name: "Mar",
      verified: 92,
      pending: 8,
    },
    {
      name: "Apr",
      verified: 95,
      pending: 5,
    },
    {
      name: "May",
      verified: 98,
      pending: 2,
    },
  ]

  const agbData = [
    { range: "130-140", count: 2 },
    { range: "140-150", count: 5 },
    { range: "150-160", count: 8 },
    { range: "160-170", count: 12 },
    { range: "170-180", count: 18 },
    { range: "180-190", count: 25 },
    { range: "190-200", count: 20 },
  ]

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{verificationData.projectName}</h1>
            <p className="text-muted-foreground mt-1">{verificationData.carbonType}</p>
          </div>
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 mr-1" />
            Verified
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Verification Score</p>
            <p className="text-3xl font-bold text-foreground mt-2">{verificationData.verificationScore}</p>
            <p className="text-xs text-emerald-600 font-medium mt-2">Excellent</p>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Carbon Credits</p>
            <p className="text-2xl font-bold text-foreground mt-2">{verificationData.credits}</p>
            <p className="text-xs text-muted-foreground mt-2">{verificationData.unit}</p>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">AGB Estimate</p>
            <p className="text-2xl font-bold text-foreground mt-2">{verificationData.agb}</p>
            <p className="text-xs text-muted-foreground mt-2">tDM/ha</p>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Uncertainty</p>
            <p className="text-2xl font-bold text-foreground mt-2">{verificationData.uncertainty}</p>
            <p className="text-xs text-muted-foreground mt-2">±%</p>
          </Card>
        </div>
      </div>

      {/* Verification Timeline */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Verification Progress</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dataBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="verified"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: "#10b981", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="pending"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: "#f59e0b", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* AGB Distribution */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">AGB Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={agbData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="range" stroke="rgba(255,255,255,0.6)" />
            <YAxis stroke="rgba(255,255,255,0.6)" />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Verification Checks Passed
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Satellite data quality</span>
              <span className="font-medium text-emerald-600">✓ Passed</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Forest classification</span>
              <span className="font-medium text-emerald-600">✓ Passed</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">AGB estimation</span>
              <span className="font-medium text-emerald-600">✓ Passed</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">IPCC compliance</span>
              <span className="font-medium text-emerald-600">✓ Passed</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Aura verification</span>
              <span className="font-medium text-emerald-600">✓ Passed</span>
            </div>
          </div>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Technical Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground">Baseline Model</p>
              <p className="font-medium text-foreground">Derived Biomass ML Model (Gradient Boosting)</p>
            </div>
            <div>
              <p className="text-muted-foreground">Data Sources</p>
              <p className="font-medium text-foreground">Sentinel-2, GEDI L4A, ESA CCI</p>
            </div>
            <div>
              <p className="text-muted-foreground">Validation Framework</p>
              <p className="font-medium text-foreground">IPCC Guidelines 2019 (Tier 2)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* References */}
      <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
        <h3 className="font-semibold text-foreground mb-4">Scientific References</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>• Chave et al. (2014) - Improved allometric models to estimate the aboveground biomass of tropical trees</p>
          <p>• IPCC Guidelines 2019 - Methodologies for estimating CO₂ emissions from forestry</p>
          <p>• FAO Forestry Papers - Guidelines for sustainable forest management</p>
          <p>• ESA CCI Biomass - Satellite-derived global biomass maps</p>
        </div>
      </Card>
    </div>
  )
}
