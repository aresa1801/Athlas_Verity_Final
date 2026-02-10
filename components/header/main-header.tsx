"use client"
import Link from "next/link"
import Image from "next/image"
import { Leaf, Zap } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"

export function MainHeader() {
  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border/30 z-50">
      {/* Main Header - Logo Left, Menu Center, Wallet Right */}
      <nav className="flex items-center justify-between py-3 px-6 gap-8">
        {/* Logo - Left Side */}
        <Link href="/" className="flex-shrink-0 hover:opacity-90 transition-opacity">
          <Image
            src="/athlas-verity-banner-logo.png"
            alt="Athlas Verity"
            width={1400}
            height={80}
            className="h-24 w-auto"
            priority
          />
        </Link>

        {/* Navigation Links - Center */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {/* Dashboard Card */}
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-accent/40 bg-card/40 hover:bg-accent/5 transition-all duration-150 backdrop-blur-sm"
          >
            Dashboard
          </Link>

          {/* Verification Dropdown with Card */}
          <div className="relative group">
            <button className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground border border-border/40 group-hover:border-accent/40 bg-card/40 group-hover:bg-accent/5 transition-all duration-150 backdrop-blur-sm flex items-center gap-1">
              Verification
              <svg
                className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Dropdown Menu with Enhanced Styling */}
            <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-56 bg-background/95 backdrop-blur-md border border-border/40 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 py-1 z-50">
              <Link
                href="/verification/green-carbon"
                className="flex items-center gap-2 px-3 py-2 mx-1 rounded-md hover:bg-accent/8 border border-transparent hover:border-emerald-500/20 text-foreground transition-all duration-150"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-emerald-500/15 text-emerald-600 flex-shrink-0">
                  <Leaf className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs">Green Carbon</div>
                  <div className="text-xs text-muted-foreground">Forests</div>
                </div>
              </Link>

              <Link
                href="/verification/blue-carbon"
                className="flex items-center gap-2 px-3 py-2 mx-1 rounded-md hover:bg-accent/8 border border-transparent hover:border-blue-500/20 text-foreground transition-all duration-150"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-blue-500/15 text-blue-600 flex-shrink-0">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-7a1 1 0 11-2 0 1 1 0 012 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs">Blue Carbon</div>
                  <div className="text-xs text-muted-foreground">Coastal</div>
                </div>
              </Link>

              <Link
                href="/verification/renewable-energy"
                className="flex items-center gap-2 px-3 py-2 mx-1 rounded-md hover:bg-accent/8 border border-transparent hover:border-amber-500/20 text-foreground transition-all duration-150"
              >
                <span className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500/15 text-amber-600 flex-shrink-0">
                  <Zap className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs">Renewable</div>
                  <div className="text-xs text-muted-foreground">Energy</div>
                </div>
              </Link>
            </div>
          </div>

          {/* Docs Card */}
          <Link
            href="/documentation"
            className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground border border-border/40 hover:border-accent/40 bg-card/40 hover:bg-accent/5 transition-all duration-150 backdrop-blur-sm"
          >
            Documentations
          </Link>
        </div>

        {/* Wallet Connect - Right Side */}
        <div className="flex-shrink-0 ml-auto">
          <WalletConnect />
        </div>
      </nav>
    </header>
  )
}
