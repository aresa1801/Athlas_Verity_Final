import { BlueCarbonForm } from "@/components/forms/blue-carbon-form"
import { Card } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export const metadata = {
  title: "Create Blue Carbon Project - Athlas Verity",
  description: "Start a new blue carbon verification project",
}

export default function CreateBlueCarbonPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-border/30 px-6 py-4 bg-background/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Dashboard</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">Verification</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">Create Project</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <BlueCarbonForm />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
              <h3 className="font-semibold text-foreground mb-4">What Happens Next?</h3>
              <div className="space-y-3">
                {[
                  "Project submission and validation",
                  "Satellite data collection",
                  "Biomass estimation (AGB)",
                  "IPCC cross-validation",
                  "Aura verification",
                  "Final credit issuance",
                ].map((step, idx) => (
                  <div key={idx} className="flex gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 p-6">
              <h3 className="font-semibold text-foreground mb-2">Estimated Timeline</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Project verification typically completes in 5-7 business days from submission.
              </p>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div>🗓️ <span>Average verification: 6 days</span></div>
                <div>📊 <span>Success rate: 98.7%</span></div>
              </div>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
              <h3 className="font-semibold text-foreground mb-4">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Check out our documentation for detailed guides on project creation and verification.
              </p>
              <a
                href="/documentation"
                className="inline-block text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                View Documentation →
              </a>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
