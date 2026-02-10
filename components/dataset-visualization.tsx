import { Card } from "@/components/ui/card"
import { ImageIcon, FileText, Table2 } from "lucide-react"

export default function DatasetVisualization() {
  return (
    <Card className="bg-card border-border p-6">
      <h3 className="text-lg font-semibold mb-4">Dataset Preview</h3>

      <div className="space-y-3">
        <div className="bg-background rounded-lg p-4 border border-border flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">satellite_imagery.tif</p>
            <p className="text-xs text-muted-foreground">GeoTIFF • 256 MB</p>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border flex items-center gap-3">
          <FileText className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">field_survey_report.pdf</p>
            <p className="text-xs text-muted-foreground">PDF • 12 MB</p>
          </div>
        </div>

        <div className="bg-background rounded-lg p-4 border border-border flex items-center gap-3">
          <Table2 className="w-5 h-5 text-accent flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">biomass_data.csv</p>
            <p className="text-xs text-muted-foreground">CSV • 2.4 MB</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-background rounded border border-border">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Dataset successfully normalized and preprocessed for cross-validator analysis
        </p>
      </div>
    </Card>
  )
}
