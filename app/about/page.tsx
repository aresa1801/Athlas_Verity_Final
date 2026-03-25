"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <section className="px-6 py-16 md:py-24 max-w-4xl mx-auto w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Athlas Verity</h1>

          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p className="text-lg leading-relaxed">
              Athlas Verity is a cutting-edge platform for institutional-grade carbon credit verification powered by
              artificial intelligence. We combine satellite imagery analysis with advanced AI reasoning to provide
              transparent, auditable verification reports.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-12">Our Mission</h2>
            <p className="leading-relaxed">
              To accelerate the transition to net-zero emissions by providing reliable, transparent carbon credit
              verification that builds trust between project developers, investors, and regulators.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-12">Technology Stack</h2>
            <p className="leading-relaxed">
              We leverage satellite imagery analysis combined with DeepSeek and Gemini AI for multi-model consensus
              verification. Our platform provides complete audit trails and institutional-grade reporting for regulatory
              compliance.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-12">Powered by CarbonFi Labs</h2>
            <p className="leading-relaxed">
              Athlas Verity is developed by CarbonFi Labs, a team of climate technology experts dedicated to building
              the infrastructure for a sustainable future.
            </p>

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
                  <Link href="/verification/green-carbon" className="hover:text-accent transition-colors">
                    Verification
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-accent transition-colors">
                    Dashboard
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
