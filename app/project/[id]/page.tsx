import { Button } from "@/components/ui/button"
import { VerificationResults } from "@/components/verification/verification-results"
import { AuditTrail } from "@/components/audit/audit-trail"
import { Download, Share2, ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Project Details - Athlas Verity",
  description: "View detailed verification results and project information",
}

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-4 bg-background/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <VerificationResults />

        {/* Audit Trail */}
        <AuditTrail />

        {/* Bottom CTA */}
        <div className="mt-16 p-8 rounded-lg border border-border/50 bg-gradient-to-r from-accent/5 to-accent/10 text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Credits Ready for Trading</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Your verified carbon credits are now available for trading on connected carbon exchanges.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button>List on Exchange</Button>
            <Button variant="outline">View Trading Dashboard</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
