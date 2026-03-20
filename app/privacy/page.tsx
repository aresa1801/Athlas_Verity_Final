"use client"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Leaf } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"

export default function Privacy() {
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Privacy Policy</h1>

          <div className="space-y-6 text-muted-foreground">
            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Introduction</h2>
              <p className="leading-relaxed">
                Athlas Verity ("we", "our", or "us") operates the Athlas Verity platform. This page informs you of our
                policies regarding the collection, use, and disclosure of personal data when you use our Service and the
                choices you have associated with that data.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Information Collection and Use</h2>
              <p className="leading-relaxed mb-4">
                We collect different types of information for various purposes to provide and improve our Service to
                you.
              </p>
              <ul className="list-disc list-inside space-y-2 leading-relaxed">
                <li>Personal identification information (name, email address, wallet address)</li>
                <li>Project data and satellite imagery you upload</li>
                <li>Usage analytics and platform interactions</li>
                <li>Technical data (IP address, browser type, device information)</li>
              </ul>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Data Security</h2>
              <p className="leading-relaxed">
                The security of your data is important to us, but remember that no method of transmission over the
                Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable
                means to protect your personal data, we cannot guarantee its absolute security.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Changes to This Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new
                Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy.
              </p>
            </Card>

            <Card className="bg-card/50 border-border/30 p-6">
              <h2 className="text-2xl font-semibold text-foreground mb-4">Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at privacy@athlasverity.com
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
