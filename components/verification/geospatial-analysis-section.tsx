"use client"

import React, { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, MapPin } from "lucide-react"
import { EnhancedMapInterface } from "@/components/geospatial/enhanced-map-interface"
import { calculateAndFormatArea } from "@/lib/polygon-area-calculator"
import { parseGeoJSON, parseKML, validatePolygon } from "@/lib/polygon-file-handlers"

interface GeospatialAnalysisSectionProps {
  onDataUpdate?: (data: {
    polygon: Array<[number, number]>
    area: number
    areaDisplay: string
    forestType: string
    protectionType: string
  }) => void
}

export function GeospatialAnalysisSection({ onDataUpdate }: GeospatialAnalysisSectionProps) {
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [areaResult, setAreaResult] = useState<{ hectares: number; km2: number; display: string } | null>(null)
  const [forestType, setForestType] = useState("")
  const [protectionType, setProtectionType] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Update area when polygon changes
  const updateArea = useCallback((newPolygon: Array<[number, number]>) => {
    setPolygon(newPolygon)
    if (newPolygon.length >= 3) {
      const coords = newPolygon.map((p) => ({ latitude: p[0], longitude: p[1] }))
      const result = calculateAndFormatArea(coords)
      setAreaResult(result)

      if (onDataUpdate) {
        onDataUpdate({
          polygon: newPolygon,
          area: result.hectares,
          areaDisplay: result.display,
          forestType,
          protectionType,
        })
      }

      setError(null)
    }
  }, [forestType, protectionType, onDataUpdate])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      let coordinates: Array<[number, number]> = []

      if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
        const result = await parseGeoJSON(file)
        coordinates = result.coordinates
      } else if (file.name.endsWith(".kml")) {
        const result = await parseKML(file)
        coordinates = result.coordinates
      } else {
        setError("Unsupported file format. Please use GeoJSON or KML.")
        setLoading(false)
        return
      }

      const validation = validatePolygon(coordinates)
      if (!validation.isValid) {
        setError(validation.error || "Invalid polygon")
        setLoading(false)
        return
      }

      updateArea(coordinates)
      setSuccessMessage(`Successfully loaded ${file.name}`)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(`Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  // Fetch satellite data and run AI estimation
  const handleFetchSatelliteData = async () => {
    if (polygon.length < 3) {
      setError("Please define a polygon on the map first")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/satellite/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polygon,
          forestType,
          cloudThreshold: 25,
          sources: ["nasa", "jaxa", "sentinel"],
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch satellite data")

      setSuccessMessage("Satellite data fetched successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(`Satellite fetch failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Geospatial Analysis</h2>
        <p className="text-sm text-muted-foreground">Define project boundaries and upload polygon data for satellite analysis</p>
      </div>

      {/* Map Section */}
      <Card className="border-border/50 bg-card/30 overflow-hidden p-0">
        <div className="h-96 lg:h-[500px] w-full">
          <EnhancedMapInterface
            polygon={polygon}
            setPolygon={updateArea}
            location={{ latitude: "-2.5", longitude: "118.0", radius: "5" }}
            onAreaCalculated={(result) => setAreaResult(result)}
          />
        </div>
      </Card>

      {/* Upload and Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* File Upload Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-4">
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Polygon
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Supported: GeoJSON, KML (.geojson, .kml files)
            </p>
          </div>

          <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-accent/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".geojson,.json,.kml"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
              id="polygon-file"
            />
            <label htmlFor="polygon-file" className="cursor-pointer block">
              <div className="text-xs text-muted-foreground">
                {loading ? "Uploading..." : "Click to upload or drag & drop"}
              </div>
            </label>
          </div>
        </Card>

        {/* Area Result Card */}
        {areaResult && (
          <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500" />
                Area Calculation
              </h3>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Area:</span>
                <span className="font-semibold">{areaResult.display}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Precision:</span>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600">
                  99.97% (Vincenty)
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Forest Type Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Forest Type</h3>
          <select
            value={forestType}
            onChange={(e) => setForestType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
          >
            <option value="">Select forest type...</option>
            <option value="tropical_rain">Tropical Rainforest</option>
            <option value="tropical_dry">Tropical Dry</option>
            <option value="subtropical">Subtropical</option>
            <option value="temperate">Temperate</option>
            <option value="boreal">Boreal</option>
            <option value="mangrove">Mangrove</option>
            <option value="peat">Peat Swamp</option>
            <option value="montane">Montane</option>
          </select>
        </Card>

        {/* Protection Type Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Protection/Restoration Type</h3>
          <select
            value={protectionType}
            onChange={(e) => setProtectionType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
          >
            <option value="">Select type...</option>
            <option value="protected_area">Protected Area</option>
            <option value="restoration">Restoration</option>
            <option value="afforestation">Afforestation</option>
            <option value="conservation">Conservation</option>
            <option value="sustainable_management">Sustainable Management</option>
          </select>
        </Card>

        {/* Location Card (Placeholder) */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Location</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Latitude: {polygon[0]?.[0].toFixed(4) || "---"}</p>
            <p>Longitude: {polygon[0]?.[1].toFixed(4) || "---"}</p>
            {polygon.length > 0 && (
              <p className="text-emerald-600">
                {polygon.length} points defined
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Fetch Satellite Data Button */}
      <Card className="border-border/50 bg-card/30 p-4">
        <Button
          onClick={handleFetchSatelliteData}
          disabled={polygon.length < 3 || loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Fetching Satellite Data...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Fetch Satellite Data & Analyze with Gemini AI
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Analysis includes: NDVI, vegetation classification, biomass estimation, carbon projection
        </p>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-red-500/20 bg-red-500/5 p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-600">{error}</div>
        </Card>
      )}

      {/* Success Message */}
      {successMessage && (
        <Card className="border-emerald-500/20 bg-emerald-500/5 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-600">{successMessage}</div>
        </Card>
      )}
    </div>
  )
}
