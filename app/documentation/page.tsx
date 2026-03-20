"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"

export default function Documentation() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <section className="px-6 py-16 md:py-24 max-w-4xl mx-auto w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Platform Documentation</h1>
          <p className="text-lg text-muted-foreground mb-12">Complete guide to using Athlas Verity for institutional-grade carbon credit verification.</p>

          <div className="space-y-8 text-muted-foreground">
            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Getting Started</h2>
              <p className="leading-relaxed mb-4">
                Athlas Verity provides institutional-grade carbon credit verification for three primary carbon types:
              </p>
              <ul className="space-y-2 leading-relaxed ml-4">
                <li><strong className="text-foreground">Green Carbon:</strong> Terrestrial forests and land-based carbon sequestration</li>
                <li><strong className="text-foreground">Blue Carbon:</strong> Coastal ecosystems including mangroves, seagrass, and salt marshes</li>
                <li><strong className="text-foreground">Renewable Energy:</strong> Clean energy displacement verification across multiple technologies</li>
              </ul>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Dashboard Overview</h2>
              <div className="space-y-3 leading-relaxed">
                <p>
                  The <strong className="text-foreground">Portfolio Dashboard</strong> provides a complete overview of your carbon verification projects:
                </p>
                <ul className="space-y-2 ml-4">
                  <li>• <strong>Portfolio Snapshot:</strong> Real-time metrics on total credits, portfolio value, and verification scores</li>
                  <li>• <strong>Active Projects:</strong> Track all projects with status filters and verification progress</li>
                  <li>• <strong>Alerts:</strong> Receive notifications on verification milestones and completions</li>
                  <li>• <strong>Trading:</strong> List verified credits on connected carbon exchanges</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Carbon Type Workflows</h2>
              <div className="space-y-4 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Green Carbon Verification</h3>
                  <p className="text-sm">Uses satellite-derived features, machine learning biomass models, and IPCC validation. Includes AGB estimation with uncertainty quantification and Aura Subnet verification.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Blue Carbon Verification</h3>
                  <p className="text-sm">Identifies coastal ecosystems (mangroves, seagrass, salt marshes), quantifies sediment carbon, and validates against international blue carbon standards and integrity scores.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Renewable Energy Verification</h3>
                  <p className="text-sm">Supports solar PV, wind, hydro, geothermal, and biomass technologies. Calculates emissions avoidance based on regional grid baselines and actual energy generation.</p>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Project Creation Process</h2>
              <div className="space-y-4 leading-relaxed">
                <p>
                  <strong className="text-foreground">Step 1: Select Carbon Type</strong>
                  <br />
                  Choose from Green Carbon, Blue Carbon, or Renewable Energy verification workflows.
                </p>
                <p>
                  <strong className="text-foreground">Step 2: Geospatial Mapping</strong>
                  <br />
                  Use our interactive map interface to define project boundaries and location using satellite imagery.
                </p>
                <p>
                  <strong className="text-foreground">Step 3: Project Details</strong>
                  <br />
                  Complete the 4-step wizard: Project Info → Location → Timeline → Contact information.
                </p>
                <p>
                  <strong className="text-foreground">Step 4: Verification</strong>
                  <br />
                  Our AI system performs comprehensive analysis including satellite data processing, biomass/energy estimation, and integrity scoring.
                </p>
                <p>
                  <strong className="text-foreground">Step 5: Results & Trading</strong>
                  <br />
                  Receive audit-ready results with complete verification trail, then list credits on carbon exchanges.
                </p>
              </div>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Requirements</h2>
              <div className="space-y-3 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">All Project Types</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Project location coordinates (latitude/longitude)</li>
                    <li>Project start and end dates</li>
                    <li>Contact information and ownership documentation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Green & Blue Carbon</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>High-resolution satellite imagery (Sentinel-2 or Landsat)</li>
                    <li>Vegetation/ecosystem classification data</li>
                    <li>Ground truth field measurements or survey reports</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Renewable Energy</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Technology type and installed capacity</li>
                    <li>Historical energy generation data</li>
                    <li>Regional grid baseline emissions factors</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Verification & Audit Trail</h2>
              <p className="leading-relaxed mb-4">
                Every project verification generates a complete audit trail with timestamps, methodology references, and independent verification checkpoints.
              </p>
              <ul className="space-y-2 text-sm ml-4">
                <li>• <strong>Verification Timeline:</strong> Visual progress showing all stages from submission to completion</li>
                <li>• <strong>Technical Validation:</strong> Checklist of all scientific checks passed (IPCC compliance, uncertainty validation, etc.)</li>
                <li>• <strong>Scientific References:</strong> Full citation of methodologies and standards used</li>
                <li>• <strong>Export Capabilities:</strong> Download audit reports, share with stakeholders</li>
              </ul>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">API & Integrations</h2>
              <p className="leading-relaxed mb-4">
                For programmatic access to verification services or to integrate with external systems, contact our team at <span className="font-mono text-accent">support@athlasverity.xyz</span> for API documentation and authentication credentials.
              </p>
            </Card>

            <div className="mt-12">
              <Link href="/">
                <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">Back to Home</Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-8 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-5 h-5 text-accent" />
                <span className="font-semibold">Athlas Verity</span>
              </div>
              <p className="text-xs text-muted-foreground">Institutional-grade carbon credit verification</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Platform</h4>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>
                  <Link href="/upload" className="hover:text-accent transition-colors">
                    Verification
                  </Link>
                </li>
                <li>
                  <Link href="/satellite" className="hover:text-accent transition-colors">
                    Satellite Data
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3">Company</h4>
              <ul className="text-xs text-muted-foreground space-y-2">
                <li>
                  <Link href="/about" className="hover:text-accent transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/documentation" className="hover:text-accent transition-colors">
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/30 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
            <p>© 2025 Athlas Verity - Powered by CarbonFi Labs - All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link href="/privacy" className="hover:text-accent transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-accent transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
