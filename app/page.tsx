import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Satellite, Leaf, Lock, Zap, CheckCircle, Globe, TrendingUp, Shield, FileText, Gauge, BarChart3, Wind, Droplets } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { VisitorAnalyticsCards } from "@/components/visitor-analytics-cards"

export default function Home() {
  return (
    <div className="bg-background text-foreground flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Hero Section with Background */}
        <section className="relative px-6 pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <Image
              src="/hero-carbon-forest.jpg"
              alt="Carbon verification hero"
              fill
              className="object-cover opacity-30"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Announcement Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-block px-4 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-full backdrop-blur-sm">
                <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Institutional-Grade Carbon Verification
                </span>
              </div>
            </div>

            {/* Main Heading */}
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-bold mb-8 text-balance leading-tight">
                Carbon Credit <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-blue-400 to-emerald-400">Verification Platform</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-12 text-balance max-w-3xl mx-auto leading-relaxed">
                Institutional-grade verification engine for carbon credits. AI-powered satellite analysis, AURA consensus scoring, and audit-ready reports for Green Carbon, Blue Carbon, and Renewable Energy projects.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50">
                    Access Dashboard
                  </Button>
                </Link>
                <Link href="/verification/green-carbon" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/60 bg-transparent transition-all duration-300"
                  >
                    <Leaf className="w-5 h-5 mr-2" />
                    Start Verification
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visitor Analytics */}
            <VisitorAnalyticsCards />
          </div>
        </section>

        {/* Three Carbon Types Section */}
        <section className="relative px-6 py-20 bg-gradient-to-b from-background via-card/20 to-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Comprehensive Carbon Verification</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Support for all major carbon credit types with methodology-specific calculation engines
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Green Carbon */}
              <Link href="/verification/green-carbon/create" className="group">
                <Card className="relative bg-card/40 border border-border/30 p-8 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-emerald-500/20 h-full cursor-pointer">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-emerald-500/0 via-transparent to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:via-transparent group-hover:to-emerald-500/5 transition-all duration-500" />
                  <div className="relative">
                    <div className="w-14 h-14 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Leaf className="w-7 h-7 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-emerald-300">Green Carbon</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Forest and land-based carbon sequestration with satellite vegetation analysis and biomass estimation
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-emerald-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        AGB estimation with uncertainty
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-emerald-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        Baseline & additionality logic
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-emerald-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        9-step IPCC methodology
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Blue Carbon */}
              <Link href="/verification/blue-carbon/create" className="group">
                <Card className="relative bg-card/40 border border-border/30 p-8 hover:border-blue-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-blue-500/20 h-full cursor-pointer">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/0 group-hover:from-blue-500/5 group-hover:via-transparent group-hover:to-blue-500/5 transition-all duration-500" />
                  <div className="relative">
                    <div className="w-14 h-14 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Droplets className="w-7 h-7 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-blue-300">Blue Carbon</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Coastal ecosystem carbon with mangrove, seagrass, and sediment carbon components
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Belowground biomass analysis
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        Sediment carbon modeling
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-blue-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                        ≥20% uncertainty floor
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* Renewable Energy */}
              <Link href="/verification/renewable-energy/create" className="group">
                <Card className="relative bg-card/40 border border-border/30 p-8 hover:border-amber-500/50 transition-all duration-500 hover:shadow-lg hover:shadow-amber-500/20 h-full cursor-pointer">
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-amber-500/0 via-transparent to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-transparent group-hover:to-amber-500/5 transition-all duration-500" />
                  <div className="relative">
                    <div className="w-14 h-14 bg-amber-500/20 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Zap className="w-7 h-7 text-amber-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-amber-300">Renewable Energy</h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Clean energy projects with grid factor validation and additionality confidence scoring
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-amber-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        MWh generation validation
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-amber-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        Grid emission factor check
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground group-hover:text-amber-400 transition-colors">
                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                        Additionality assessment
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </div>
        </section>

        {/* Core Features Section */}
        <section className="relative px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Platform Capabilities</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Complete toolkit for professional carbon credit verification
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature Cards */}
              {[
                {
                  icon: Satellite,
                  title: "Satellite Intelligence",
                  description: "Real-time satellite imagery analysis with automated vegetation classification and carbon stock estimation",
                  color: "emerald"
                },
                {
                  icon: Shield,
                  title: "AI Verification",
                  description: "Multi-model AI consensus using DeepSeek and Gemini for plausibility checks and integrity scoring",
                  color: "blue"
                },
                {
                  icon: FileText,
                  title: "Audit Reports",
                  description: "Institutional-grade PDF reports with complete methodology documentation and verification hash",
                  color: "amber"
                },
                {
                  icon: Gauge,
                  title: "Uncertainty Quantification",
                  description: "Quantile regression with conservative P10 selection and enforced uncertainty floors",
                  color: "emerald"
                },
                {
                  icon: TrendingUp,
                  title: "Baseline Analysis",
                  description: "Comprehensive baseline scenario modeling and avoided emission calculations",
                  color: "blue"
                },
                {
                  icon: BarChart3,
                  title: "AURA Consensus",
                  description: "Advanced plausibility scoring with model agreement analysis and integrity classification",
                  color: "amber"
                },
              ].map((feature, idx) => (
                <div key={idx} className="group">
                  <Card className={`relative bg-card/40 border border-border/30 p-6 h-full transition-all duration-500 hover:border-${feature.color}-500/50 hover:shadow-lg hover:shadow-${feature.color}-500/20 cursor-pointer`}>
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-br from-${feature.color}-500/0 via-transparent to-${feature.color}-500/0 group-hover:from-${feature.color}-500/5 group-hover:via-transparent group-hover:to-${feature.color}-500/5 transition-all duration-500`} />
                    <div className="relative">
                      <div className={`w-12 h-12 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Complete Workflow Section */}
        <section className="relative px-6 py-20 bg-gradient-to-b from-background via-card/20 to-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Complete Verification Workflow</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                From project data submission to institutional-grade report export
              </p>
            </div>

            <div className="relative">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { step: "1", title: "Upload Project Data", desc: "Submit satellite imagery, field surveys, and project specifications" },
                  { step: "2", title: "Satellite Analysis", desc: "Automated vegetation classification and carbon stock estimation" },
                  { step: "3", title: "AI Verification", desc: "Multi-model consensus scoring and integrity assessment" },
                  { step: "4", title: "Report Export", desc: "Institutional-grade PDF with complete audit trail" },
                ].map((item, idx) => (
                  <div key={idx} className="relative group">
                    <div className={`absolute -top-12 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300`}>
                      {item.step}
                    </div>
                    {idx < 3 && (
                      <div className="absolute top-0 left-full w-full h-1 bg-gradient-to-r from-emerald-500/50 via-blue-500/50 to-transparent group-hover:from-emerald-500 group-hover:via-blue-500 transition-all duration-300 -ml-8" />
                    )}
                    <Card className="relative bg-card/50 border border-border/30 p-6 pt-12 text-center group-hover:border-emerald-500/50 transition-all duration-300 h-full">
                      <h4 className="font-semibold mb-2">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to Verify Your Carbon Credits?</h2>
            <p className="text-lg text-muted-foreground mb-12">
              Access institutional-grade verification tools now and get audit-ready reports in minutes
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg hover:shadow-emerald-500/50 transition-all duration-300">
                  Start Now
                </Button>
              </Link>
              <Link href="/documentation">
                <Button size="lg" variant="outline" className="border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10 bg-transparent">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-12 mt-auto bg-gradient-to-b from-background via-card/10 to-background">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Athlas Verity</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Institutional-grade carbon credit verification platform powered by AI and satellite intelligence
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Platform</h4>
              <ul className="text-xs text-muted-foreground space-y-3">
                <li>
                  <Link href="/dashboard" className="hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/history" className="hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    History
                  </Link>
                </li>
                <li>
                  <Link href="/satellite" className="hover:text-emerald-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-emerald-400 rounded-full" />
                    Satellite
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Resources</h4>
              <ul className="text-xs text-muted-foreground space-y-3">
                <li>
                  <Link href="/documentation" className="hover:text-blue-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full" />
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="hover:text-blue-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/verification/green-carbon/create" className="hover:text-blue-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-blue-400 rounded-full" />
                    Verify Carbon
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="text-xs text-muted-foreground space-y-3">
                <li>
                  <Link href="/privacy" className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-amber-400 transition-colors duration-300 flex items-center gap-2">
                    <span className="w-1 h-1 bg-amber-400 rounded-full" />
                    Terms & Conditions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/30 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-muted-foreground">
            <p>© 2025 Athlas Verity. Institutional-grade carbon verification. Powered by CarbonFi Labs.</p>
            <div className="flex gap-6 mt-6 md:mt-0">
              <span>All rights reserved</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
