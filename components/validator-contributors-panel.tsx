import { Card } from "@/components/ui/card"

interface Contributor {
  id: string
  role: string
  confidence: number
  model_type: string
  timestamp: string
}

interface ValidatorContributorsPanelProps {
  contributors: Contributor[]
}

export default function ValidatorContributorsPanel({ contributors }: ValidatorContributorsPanelProps) {
  return (
    <Card className="bg-card border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Validator Contributors</h3>

      <div className="space-y-3">
        {contributors.map((contributor) => (
          <div
            key={contributor.id}
            className="bg-background rounded-lg p-4 border border-border hover:border-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium text-sm">{contributor.id}</p>
                <p className="text-xs text-muted-foreground">{contributor.role}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">{(contributor.confidence * 100).toFixed(0)}%</p>
                <p className="text-xs text-muted-foreground">Confidence</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-2">{contributor.model_type}</p>

            <div className="w-full bg-border rounded-full h-1.5">
              <div className="bg-accent h-1.5 rounded-full" style={{ width: `${contributor.confidence * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
        Results aggregated from Baseline Validators, AI Domain Models, and Quality Validators using consensus-weighted
        scoring mechanism
      </p>
    </Card>
  )
}
