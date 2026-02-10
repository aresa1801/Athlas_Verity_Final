"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Zap, MapPin, Gauge, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function RenewableEnergyPage() {
  const [selectedTechnology, setSelectedTechnology] = useState<string | null>(null)
  const steps = [
    {
      number: 1,
      title: "Project Details",
      description: "Solar, wind, hydro, or other renewable capacity",
      icon: MapPin,
    },
    {
      number: 2,
      title: "Energy Generation",
      description: "Baseline and expected energy output analysis",
      icon: Gauge,
    },
    {
      number: 3,
      title: "Emissions Avoidance",
      description: "Calculate CO₂ avoided through displacement",
      icon: Zap,
    },
  ]

  const features = [
    {
      title: "Multi-Technology Support",
      description: "Solar PV, wind, hydro, geothermal, biomass, and hybrid systems",
    },
    {
      title: "Grid Displacement Analysis",
      description: "Regional grid baseline emissions and avoided emissions calculation",
    },
    {
      title: "Methodological Compliance",
      description: "Adherence to VCS, Gold Standard, and other internationally recognized standards",
    },
    {
      title: "Performance Monitoring",
      description: "Continuous verification against actual energy generation data",
    },
  ]

  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/30 px-6 py-4 bg-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Renewable Energy Verification</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-border/30 px-6 py-12 bg-gradient-to-b from-background via-amber-500/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20">Renewable Energy</Badge>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Renewable Energy Carbon Credits</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Verify carbon credits from renewable energy projects. Measure emissions avoided through the displacement
            of grid electricity with verified, audit-grade precision.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Verification Process */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Verification Process</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, idx) => {
              const Icon = step.icon
              return (
                <div key={idx} className="flex flex-col gap-4">
                  <Card className="flex-1 border-border/50 bg-gradient-to-br from-card to-card/50 p-6 hover:border-amber-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center font-bold text-amber-600">
                        {step.number}
                      </div>
                      <Icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </Card>
                  {idx < steps.length - 1 && (
                    <div className="hidden md:flex justify-center">
                      <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Technology Selection */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Select Your Technology</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Solar PV", "Wind", "Hydro", "Geothermal", "Biomass", "Hybrid"].map((tech) => (
              <button
                key={tech}
                onClick={() => setSelectedTechnology(tech)}
                className={`p-6 rounded-lg border-2 transition-all text-left group ${
                  selectedTechnology === tech
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-border/30 bg-card/50 hover:border-amber-500/30 hover:bg-amber-500/5"
                }`}
              >
                <div className="font-semibold text-foreground mb-2">{tech}</div>
                <p className="text-sm text-muted-foreground">
                  {tech === "Solar PV" && "Photovoltaic systems"}
                  {tech === "Wind" && "Wind turbine projects"}
                  {tech === "Hydro" && "Hydroelectric plants"}
                  {tech === "Geothermal" && "Geothermal energy"}
                  {tech === "Biomass" && "Sustainable biomass"}
                  {tech === "Hybrid" && "Multi-technology systems"}
                </p>
                {selectedTechnology === tech && (
                  <Check className="w-5 h-5 text-amber-600 mt-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-8">Verification Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="border-t border-border/30 pt-12">
          <div className="rounded-lg border border-border/50 bg-gradient-to-r from-amber-500/5 to-amber-500/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Monetize Your Clean Energy?</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Start your renewable energy verification today. Generate verified carbon credits from your clean energy projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verification/renewable-energy/create">
                <Button size="lg" className="gap-2">
                  Start Verification
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/documentation">
                <Button size="lg" variant="outline">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
