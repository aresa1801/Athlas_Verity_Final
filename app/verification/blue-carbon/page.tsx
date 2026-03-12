"use client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, Waves, MapPin, Gauge, Check } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { MapInterface } from "@/components/satellite/map-interface"

export default function BlueCarbonPage() {
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [location, setLocation] = useState({ latitude: "1.35", longitude: "103.8", radius: "5" })
  const [showMap, setShowMap] = useState(false)
  const steps = [
    {
      number: 1,
      title: "Ecosystem Identification",
      description: "Detect mangroves, seagrass, and salt marshes",
      icon: MapPin,
    },
    {
      number: 2,
      title: "Sediment Analysis",
      description: "Quantify soil organic carbon in coastal areas",
      icon: Gauge,
    },
    {
      number: 3,
      title: "Carbon Sequestration",
      description: "Calculate long-term carbon storage potential",
      icon: Waves,
    },
  ]

  const features = [
    {
      title: "Coastal Ecosystem Detection",
      description: "Automated satellite-based identification of mangroves, seagrass beds, and salt marshes",
    },
    {
      title: "Sediment Carbon Modeling",
      description: "Depth-weighted carbon fraction analysis with geological validation",
    },
    {
      title: "Blue Carbon Ruleset",
      description: "Compliance with international blue carbon standards and protocols",
    },
    {
      title: "Integrity Score",
      description: "Multi-criteria assessment of ecosystem health and carbon persistence",
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
            <span className="text-foreground font-medium">Blue Carbon Verification</span>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="border-b border-border/30 px-6 py-12 bg-gradient-to-b from-background via-blue-500/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Waves className="w-6 h-6 text-blue-600" />
            </div>
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Blue Carbon</Badge>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Coastal & Marine Carbon Verification</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Verify coastal ecosystem carbon credits including mangroves, seagrass, and salt marshes.
            Unlock the potential of blue carbon through advanced sediment analysis and satellite monitoring.
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
                  <Card className="flex-1 border-border/50 bg-gradient-to-br from-card to-card/50 p-6 hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center font-bold text-blue-600">
                        {step.number}
                      </div>
                      <Icon className="w-5 h-5 text-blue-600" />
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
              <p className="text-muted-foreground mt-1">Map your coastal ecosystem and verify blue carbon potential</p>
            </div>
            {!showMap && (
              <div className="flex gap-2">
                <Button onClick={() => setShowMap(true)} size="lg" className="gap-2" variant="outline">
                  <MapPin className="w-4 h-4" />
                  Open Map
                </Button>
                <Link href="/satellite/blue-carbon-analysis">
                  <Button size="lg" className="gap-2">
                    <Gauge className="w-4 h-4" />
                    Satellite Analysis
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {showMap && (
            <Card className="border-border/50 bg-card/50 p-6 overflow-hidden">
              <MapInterface
                polygon={polygon}
                setPolygon={setPolygon}
                location={location}
              />
              <div className="mt-6 flex gap-4 justify-between">
                <Button variant="outline" onClick={() => setShowMap(false)}>
                  Close Map
                </Button>
                <Link href="/verification/blue-carbon/create">
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
          <div className="rounded-lg border border-border/50 bg-gradient-to-r from-blue-500/5 to-blue-500/10 p-8 text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">Ready to Verify Your Coastal Project?</h3>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Start your blue carbon verification today. Leverage the full potential of coastal ecosystem carbon.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/verification/blue-carbon/create">
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
