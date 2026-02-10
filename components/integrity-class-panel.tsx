import { Card } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface IntegrityClassPanelProps {
  validationResult: {
    integrity_class: string
    aura_score: number
    authenticity_score: number
    validator_consensus: number
    data_consistency_score: number
    anomaly_flags: string[]
  }
}

export default function IntegrityClassPanel({ validationResult }: IntegrityClassPanelProps) {
  const getClassColor = (icClass: string) => {
    switch (icClass) {
      case "IC-A":
        return "text-accent bg-accent/10 border-accent/30"
      case "IC-B":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
      case "IC-C":
        return "text-orange-500 bg-orange-500/10 border-orange-500/30"
      case "IC-F":
        return "text-destructive bg-destructive/10 border-destructive/30"
      default:
        return "text-muted-foreground"
    }
  }

  const getClassDescription = (icClass: string) => {
    switch (icClass) {
      case "IC-A":
        return "High Integrity - Dataset meets all validation criteria"
      case "IC-B":
        return "Moderate Integrity - Minor concerns identified"
      case "IC-C":
        return "Low Integrity - Multiple validation concerns"
      case "IC-F":
        return "Fails Integrity Threshold - Dataset rejected"
      default:
        return "Unknown Classification"
    }
  }

  return (
    <Card className="bg-card border-border p-6">
      <h3 className="text-lg font-semibold mb-6">Integrity Class Assessment</h3>

      <div className={`rounded-lg border-2 p-6 mb-6 ${getClassColor(validationResult.integrity_class)}`}>
        <p className="text-sm text-muted-foreground mb-2">Classification Result</p>
        <p className="text-4xl font-bold mb-2">{validationResult.integrity_class}</p>
        <p className="text-sm">{getClassDescription(validationResult.integrity_class)}</p>
      </div>

      <div className="space-y-4">
        <div className="bg-background rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Aura Score</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{(validationResult.aura_score * 100).toFixed(0)}%</p>
            <div className="w-24 bg-border rounded-full h-2">
              <div className="bg-accent h-2 rounded-full" style={{ width: `${validationResult.aura_score * 100}%` }} />
            </div>
          </div>
        </div>

        <div className="bg-background rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Validator Consensus</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{(validationResult.validator_consensus * 100).toFixed(0)}%</p>
            <div className="w-24 bg-border rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: `${validationResult.validator_consensus * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-background rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Authenticity Score</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{(validationResult.authenticity_score * 100).toFixed(0)}%</p>
            <div className="w-24 bg-border rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: `${validationResult.authenticity_score * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-background rounded p-3">
          <p className="text-xs text-muted-foreground mb-1">Data Consistency</p>
          <div className="flex items-center justify-between">
            <p className="text-lg font-semibold">{(validationResult.data_consistency_score * 100).toFixed(0)}%</p>
            <div className="w-24 bg-border rounded-full h-2">
              <div
                className="bg-accent h-2 rounded-full"
                style={{ width: `${validationResult.data_consistency_score * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {validationResult.anomaly_flags.length === 0 && (
        <div className="mt-6 flex items-center gap-2 text-sm text-accent bg-accent/10 p-3 rounded">
          <CheckCircle className="w-4 h-4" />
          No anomalies detected
        </div>
      )}
    </Card>
  )
}
