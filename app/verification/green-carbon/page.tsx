"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Leaf, MapPin, Gauge, Upload, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function GreenCarbonPage() {
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [location, setLocation] = useState({ latitude: "-2.5", longitude: "118.0", radius: "5" })
  const [showMap, setShowMap] = useState(false)
  
  const steps = [
    {
      number: 1,
      title: "Project Information",
      description: "Basic project details and location",
      icon: MapPin,
    },
    {
      number: 2,
      title: "Satellite Data",
      description: "Upload satellite imagery and geospatial data",
      icon: Gauge,
    },
    {
      number: 3,
      title: "Biomass Estimation",
      description: "AI-powered AGB calculation and verification",
      icon: Leaf,
    },
  ]

  const features = [
    {
      title: "Forest Classification",
      description: "Automated detection of forest types and vegetation density",
    },
    {
      title: "AGB Estimation",
      description: "Derived biomass model with 15%+ uncertainty quantification",
    },
    {
      title: "IPCC Validation",
      description: "Cross-check against IPCC regional defaults and caps",
    },
    {
      title: "Aura Verification",
      description: "Subnet-powered ecological plausibility checks",
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
            <span className="text-foreground font-medium">Green Carbon Verification</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-border/30 px-6 py-12 bg-gradient-to-b from-background via-emerald-500/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Leaf className="w-6 h-6 text-emerald-600" />
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">Green Carbon</Badge>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Terrestrial Carbon Verification</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Verify forest and land-based carbon credits using satellite data and AI-powered biomass estimation.
            Achieve audit-grade verification for your terrestrial carbon projects.
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
                  <Card className="flex-1 border-border/50 bg-gradient-to-br from-card to-card/50 p-6 hover:border-emerald-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-600">
                        {step.number}
                      </div>
                      <Icon className="w-5 h-5 text-emerald-600" />
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

        {/* Map Section */}
        <div className="mb-16 border-t border-border/30 pt-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Geospatial Analysis</h2>
              <p className="text-muted-foreground mt-1">Upload your project location and satellite imagery for verification</p>
            </div>
            {!showMap && (
              <div className="flex gap-2">
                <Button onClick={() => setShowMap(true)} size="lg" className="gap-2" variant="outline">
                  <MapPin className="w-4 h-4" />
                  Open Map
                </Button>
                <Link href="/verification/green-carbon/green-carbon-analysis">
                  <Button size="lg" className="gap-2">
                    <Gauge className="w-4 h-4" />
                    Satellite Analysis
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {showMap && (
            <Card className="border-border/50 bg-card/50 p-6">
              <div className="h-96 rounded-lg bg-muted/50 flex items-center justify-center">
                <p className="text-muted-foreground">Map interface coming soon</p>
              </div>
              <div className="mt-6 flex gap-4 justify-between">
                <Button variant="outline" onClick={() => setShowMap(false)}>
                  Close
                </Button>
                <Link href="/verification/green-carbon/create">
                  <Button className="gap-2">
                    <Check className="w-4 h-4" />
                    Proceed to Verification
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* CTA Section */}
        <div className="border-t border-border/30 pt-12">
          <div className="rounded-lg border border-border/50 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Verify Your Project?</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Start your green carbon verification today. Our audit-grade platform ensures transparency and trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verification/green-carbon/create">
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
