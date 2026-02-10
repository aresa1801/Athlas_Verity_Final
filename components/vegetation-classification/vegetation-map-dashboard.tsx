// Vegetation Classification Results Dashboard
// Displays classified map, confidence indicators, and area summary

"use client"

import { Card } from "@/components/ui/card"
import { AlertCircle, TrendingUp, Leaf, Shield } from "lucide-react"
import type { VegetationClassificationOutput } from "@/lib/vegetation-classification/vegetation-classifier"

interface VegetationMapDashboardProps {
  classification: VegetationClassificationOutput
}

const vegetationColors: Record<string, string> = {
  "Dense Forest": "bg-green-900",
  "Open Forest": "bg-green-700",
  Shrubland: "bg-yellow-600",
  Grassland: "bg-yellow-400",
  Cropland: "bg-orange-400",
  Mangrove: "bg-teal-700",
  "Non-Vegetation": "bg-stone-500",
  Water: "bg-blue-600",
}

export function VegetationMapDashboard({ classification }: VegetationMapDashboardProps) {
  const summary = classification.area_summary_ha
  const totalArea = Object.entries(summary)
    .filter(([key]) => !["total_pixels", "pixel_area_m2"].includes(key))
    .reduce((sum, [_, value]) => sum + (typeof value === "number" ? value : 0), 0)

  const classes = [
    { name: "Dense Forest", value: summary.dense_forest_ha },
    { name: "Open Forest", value: summary.open_forest_ha },
    { name: "Shrubland", value: summary.shrubland_ha },
    { name: "Grassland", value: summary.grassland_ha },
    { name: "Cropland", value: summary.cropland_ha },
    { name: "Mangrove", value: summary.mangrove_ha },
    { name: "Non-Vegetation", value: summary.non_vegetation_ha },
    { name: "Water", value: summary.water_ha },
  ].filter((c) => c.value > 0)

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-background to-secondary/20 border-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60">Classification Accuracy</p>
              <p className="text-2xl font-bold text-accent">
                {(classification.classification_accuracy_estimate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-foreground/50 mt-1">ESA WorldCover agreement</p>
            </div>
            <Shield className="w-8 h-8 text-accent/60" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-background to-secondary/20 border-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60">Mean Confidence</p>
              <p className="text-2xl font-bold text-accent">
                {(classification.mean_class_probability * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-foreground/50 mt-1">per pixel classification</p>
            </div>
            <TrendingUp className="w-8 h-8 text-accent/60" />
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-background to-secondary/20 border-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground/60">Total Area Classified</p>
              <p className="text-2xl font-bold text-accent">{totalArea.toFixed(1)}</p>
              <p className="text-xs text-foreground/50 mt-1">hectares</p>
            </div>
            <Leaf className="w-8 h-8 text-accent/60" />
          </div>
        </Card>
      </div>

      {/* Legend and Area Summary */}
      <Card className="border-secondary/30 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-accent" />
          Vegetation Cover Area Summary
        </h3>

        <div className="space-y-3">
          {classes.map((vegClass) => (
            <div key={vegClass.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-4 h-4 rounded ${vegetationColors[vegClass.name] || "bg-gray-500"}`} />
                <span className="text-sm font-medium">{vegClass.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-32 bg-secondary/20 rounded h-2">
                  <div
                    className={`h-full rounded ${vegetationColors[vegClass.name] || "bg-gray-500"}`}
                    style={{ width: `${(vegClass.value / totalArea) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-mono w-20 text-right">{vegClass.value.toFixed(2)} ha</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-secondary/20 mt-6 pt-4">
          <div className="flex justify-between">
            <span className="text-sm font-semibold">Total Classified Area</span>
            <span className="text-sm font-mono font-semibold text-accent">{totalArea.toFixed(2)} ha</span>
          </div>
        </div>
      </Card>

      {/* Low Confidence Warnings */}
      {classification.low_confidence_flags.length > 0 && (
        <Card className="border-yellow-500/30 bg-yellow-500/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-700 mb-2">Low Confidence Classifications</h4>
              <ul className="space-y-1 text-sm text-yellow-600">
                {classification.low_confidence_flags.map((flag, idx) => (
                  <li key={idx}>
                    • {flag.class}: {flag.pixel_count} pixels - {flag.reason}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-yellow-600 mt-3 italic">
                ⚠️ Low-confidence areas will trigger Aura Subnet integrity penalties and reduce carbon eligibility.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Data Quality Metadata */}
      <Card className="border-secondary/30 p-4">
        <h4 className="text-sm font-semibold mb-2">Classification Metadata</h4>
        <div className="space-y-1 text-xs text-foreground/60">
          <p>• Model: Random Forest (trained on ESA WorldCover 10m labels)</p>
          <p>• Total Pixels: {summary.total_pixels.toLocaleString()}</p>
          <p>
            • Pixel Size: {summary.pixel_area_m2} m² ({Math.sqrt(summary.pixel_area_m2)}m ×{" "}
            {Math.sqrt(summary.pixel_area_m2)}m)
          </p>
          <p>• Classification Method: Supervised pixel-level ML with confidence scoring</p>
          <p>• ESA Agreement: {(classification.classification_accuracy_estimate * 100).toFixed(1)}% (baseline OA)</p>
        </div>
      </Card>
    </div>
  )
}
