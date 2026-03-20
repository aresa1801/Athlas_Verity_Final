"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ExternalLink } from "lucide-react"

interface SatellitePreviewProps {
  results: any[]
  onExport: () => void
}

export function SatellitePreview({ results, onExport }: SatellitePreviewProps) {
  return (
    <div className="space-y-6">
      {results.map((result, index) => (
        <div key={index} className="space-y-4">
          <Card className="bg-card border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{result.source}</h3>
              {result.status && (
                <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">{result.status}</span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Platform</div>
                <div className="font-semibold">{result.metadata.platform}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Resolution</div>
                <div className="font-semibold">{result.metadata.resolution}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Cloud Cover</div>
                <div className="font-semibold">{result.metadata.cloud_cover?.toFixed(1) || "N/A"}%</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">EPSG</div>
                <div className="font-semibold">{result.metadata.epsg}</div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-3">Available Bands (Real Data)</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(result.bands).map(([band, url]: [string, any]) => (
                  <a
                    key={band}
                    href={url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`text-center p-3 bg-background rounded-lg border border-border hover:border-accent transition-colors ${!url ? "opacity-50 pointer-events-none" : ""}`}
                  >
                    <div className="font-semibold text-accent mb-1">{band}</div>
                    <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      {url ? (
                        <>
                          GeoTIFF <ExternalLink className="w-3 h-3" />
                        </>
                      ) : (
                        "N/A"
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Computed Indices (Real-time Calculations)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(result.indices).map(([indexName, indexData]: [string, any]) => (
                  <div key={indexName} className="p-4 bg-background rounded-lg border border-border">
                    <div className="font-semibold text-accent mb-2">{indexName}</div>
                    <div className="text-xs text-muted-foreground mb-2">
                      Formula: <code className="bg-muted px-1 py-0.5 rounded">{indexData.formula}</code>
                    </div>
                    {indexData.description && (
                      <div className="text-xs text-muted-foreground">{indexData.description}</div>
                    )}
                    {indexData.band_urls && (
                      <div className="mt-2 text-xs">
                        {Object.entries(indexData.band_urls).map(([bandType, bandUrl]: [string, any]) => (
                          <div key={bandType} className="text-accent">
                            {bandType.toUpperCase()}: {bandUrl ? "✓ Available" : "✗ N/A"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {result.preview && (
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Preview Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {result.preview.thumbnail && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img
                        src={
                          result.preview.thumbnail ||
                          "/placeholder.svg?height=200&width=300&query=RGB%20True%20Color%20Composite"
                        }
                        alt="RGB Composite"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2 bg-background text-xs text-center">RGB True Color</div>
                    </div>
                  )}
                  {result.preview.ndvi && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img
                        src={
                          result.preview.ndvi ||
                          "/placeholder.svg?height=200&width=300&query=NDVI%20Heatmap%20Vegetation"
                        }
                        alt="NDVI Heatmap"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2 bg-background text-xs text-center">NDVI Heatmap</div>
                    </div>
                  )}
                  {result.preview.nbr && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img
                        src={result.preview.nbr || "/placeholder.svg?height=200&width=300&query=NBR%20Burn%20Index"}
                        alt="NBR Index"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2 bg-background text-xs text-center">NBR Burn Index</div>
                    </div>
                  )}
                  {result.preview.ndmi && (
                    <div className="border border-border rounded-lg overflow-hidden">
                      <img
                        src={
                          result.preview.ndmi || "/placeholder.svg?height=200&width=300&query=NDMI%20Soil%20Moisture"
                        }
                        alt="NDMI Moisture"
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-2 bg-background text-xs text-center">NDMI Moisture</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      ))}

      <Button onClick={onExport} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
        <Download className="w-4 h-4 mr-2" />
        Export Package (ZIP: PDF + GeoTIFF + Metadata)
      </Button>
    </div>
  )
}
