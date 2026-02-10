import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { MainHeader } from "@/components/header/main-header"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Athlas Verity - Carbon Credit Verification Platform",
  description: "Verify ecological datasets through AI-powered validation - Athlas Verity",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.png",
        type: "image/png",
        sizes: "any",
      },
    ],
    apple: "/favicon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <div className="flex flex-col min-h-screen">
          <MainHeader />
          <main className="flex-1">{children}</main>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
