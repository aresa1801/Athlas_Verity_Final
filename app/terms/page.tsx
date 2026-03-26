"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation */}
      <nav className="border-b border-border/30 px-6 py-3 flex items-center justify-between sticky top-0 bg-background/60 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity flex-1">
          <Image
            src="/athlas-verity-banner-logo.png"
            alt="Athlas Verity"
            width={1400}
            height={80}
            className="h-32 w-auto max-w-3xl"
            priority
          />
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:block text-xs text-muted-foreground uppercase tracking-wide">
            AI Carbon Verification
          </div>
          <WalletConnect />
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <section className="px-6 py-16 md:py-24 max-w-4xl mx-auto w-full">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Terms of Service</h1>

          <div className="space-y-6 text-muted-foreground">
            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Agreement to Terms</h2>
              <p className="leading-relaxed">
                By accessing and using the Athlas Verity platform, you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Use License</h2>
              <p className="leading-relaxed mb-4">
                Permission is granted to temporarily download one copy of the materials (information or software) on
                Athlas Verity's platform for personal, non-commercial transitory viewing only. This is the grant of a
                license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>Modifying or copying the materials</li>
                <li>Using the materials for any commercial purpose or for any public display</li>
                <li>Attempting to decompile or reverse engineer any software</li>
                <li>Removing any copyright or other proprietary notations from the materials</li>
                <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
              </ul>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Disclaimer</h2>
              <p className="leading-relaxed">
                The materials on Athlas Verity's platform are provided on an 'as is' basis. Athlas Verity makes no
                warranties, expressed or implied, and hereby disclaims and negates all other warranties including,
                without limitation, implied warranties or conditions of merchantability, fitness for a particular
                purpose, or non-infringement of intellectual property or other violation of rights.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Limitations</h2>
              <p className="leading-relaxed">
                In no event shall Athlas Verity or its suppliers be liable for any damages (including, without
                limitation, damages for loss of data or profit, or due to business interruption) arising out of the use
                or inability to use the materials on Athlas Verity's platform.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Accuracy of Materials</h2>
              <p className="leading-relaxed">
                The materials appearing on Athlas Verity's platform could include technical, typographical, or
                photographic errors. Athlas Verity does not warrant that any of the materials on its platform are
                accurate, complete, or current.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms and Conditions, please contact us at legal@athlasverity.com
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
