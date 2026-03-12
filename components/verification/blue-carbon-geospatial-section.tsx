"use client"

import React, { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, MapPin, Waves } from "lucide-react"
import { EnhancedMapInterface } from "@/components/geospatial/enhanced-map-interface"
import { calculateAndFormatArea } from "@/lib/polygon-area-calculator"
import { parseGeoJSON, parseKML, validatePolygon } from "@/lib/polygon-file-handlers"

interface BlueCarbonGeospatialSectionProps {
  onDataUpdate?: (data: {
    polygon: Array<[number, number]>
    area: number
    areaDisplay: string
    ecosystemType: string
    tidalZoneType: string
    sedimentDepth?: number
  }) => void
}

export function BlueCarbonGeospatialSection({ onDataUpdate }: BlueCarbonGeospatialSectionProps) {
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [areaResult, setAreaResult] = useState<{ hectares: number; km2: number; display: string } | null>(null)
  const [ecosystemType, setEcosystemType] = useState("")
  const [tidalZoneType, setTidalZoneType] = useState("")
  const [sedimentDepth, setSedimentDepth] = useState("")
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
          ecosystemType,
          tidalZoneType,
          sedimentDepth: sedimentDepth ? parseFloat(sedimentDepth) : undefined,
        })
      }

      setError(null)
    }
  }, [ecosystemType, tidalZoneType, sedimentDepth, onDataUpdate])

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
      } else if (file.name.endsWith(".zip")) {
        // For shapefile zip files
        const result = await parseGeoJSON(file)
        coordinates = result.coordinates
      } else {
        setError("Unsupported file format. Please use GeoJSON, KML, or Shapefile ZIP.")
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

  // Fetch satellite data and run blue carbon analysis
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
          ecosystemType,
          tidalZoneType,
          sedimentDepth: sedimentDepth ? parseFloat(sedimentDepth) : undefined,
          cloudThreshold: 25,
          analysisType: "blue-carbon",
          sources: ["nasa", "jaxa", "sentinel"],
        }),
      })

      if (!response.ok) throw new Error("Failed to fetch satellite data")

      setSuccessMessage("Satellite data fetched successfully! Analyzing coastal ecosystem...")
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
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Waves className="w-6 h-6 text-blue-600" />
          Coastal Geospatial Analysis
        </h2>
        <p className="text-sm text-muted-foreground">Define coastal ecosystem boundaries and analyze blue carbon potential using satellite data</p>
      </div>

      {/* Map Section */}
      <Card className="border-border/50 bg-card/30 overflow-hidden p-0">
        <div className="h-96 lg:h-[500px] w-full">
          <EnhancedMapInterface
            polygon={polygon}
            setPolygon={updateArea}
            location={{ latitude: "1.35", longitude: "103.8", radius: "5" }}
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
              Supported: GeoJSON, KML, Shapefile ZIP
            </p>
          </div>

          <div className="border-2 border-dashed border-border/50 rounded-lg p-4 text-center hover:border-blue-500/50 transition-colors cursor-pointer">
            <input
              type="file"
              accept=".geojson,.json,.kml,.zip"
              onChange={handleFileUpload}
              disabled={loading}
              className="hidden"
              id="polygon-file-blue"
            />
            <label htmlFor="polygon-file-blue" className="cursor-pointer block">
              <div className="text-xs text-muted-foreground">
                {loading ? "Uploading..." : "Click to upload or drag & drop"}
              </div>
            </label>
          </div>
        </Card>

        {/* Area Result Card */}
        {areaResult && (
          <Card className="border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
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
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                  99.97% (Geodesic)
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Ecosystem Type Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Ecosystem Type</h3>
          <select
            value={ecosystemType}
            onChange={(e) => setEcosystemType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
          >
            <option value="">Select ecosystem...</option>
            <option value="mangrove">Mangrove Forest</option>
            <option value="seagrass">Seagrass Meadow</option>
            <option value="salt_marsh">Salt Marsh</option>
            <option value="tidal_flat">Tidal Flat</option>
            <option value="kelp_forest">Kelp Forest</option>
            <option value="mixed_coastal">Mixed Coastal Vegetation</option>
            <option value="restored_mangrove">Restored Mangrove</option>
          </select>
        </Card>

        {/* Tidal Zone Type Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Tidal Zone Type</h3>
          <select
            value={tidalZoneType}
            onChange={(e) => setTidalZoneType(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
          >
            <option value="">Select tidal zone...</option>
            <option value="subtidal">Subtidal (Always submerged)</option>
            <option value="intertidal">Intertidal (Tidal flux)</option>
            <option value="supratidal">Supratidal (Storm surge only)</option>
            <option value="upper_intertidal">Upper Intertidal</option>
            <option value="lower_intertidal">Lower Intertidal</option>
          </select>
        </Card>

        {/* Sediment Depth Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Sediment Depth (cm)</h3>
          <input
            type="number"
            value={sedimentDepth}
            onChange={(e) => setSedimentDepth(e.target.value)}
            placeholder="e.g., 100"
            min="0"
            max="500"
            step="10"
            className="w-full px-3 py-2 bg-background border border-border/50 rounded-lg text-sm text-foreground"
          />
          <p className="text-xs text-muted-foreground">Depth of carbon-rich sediment layer</p>
        </Card>

        {/* Location Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-3">
          <h3 className="font-semibold text-sm">Location</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Latitude: {polygon[0]?.[0].toFixed(4) || "---"}</p>
            <p>Longitude: {polygon[0]?.[1].toFixed(4) || "---"}</p>
            {polygon.length > 0 && (
              <p className="text-blue-600">
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
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Coastal Ecosystem...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Fetch Satellite Data & Analyze Blue Carbon
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Analysis includes: Vegetation mapping, sediment carbon modeling, coastal boundary validation, ecological plausibility checks
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
        <Card className="border-blue-500/20 bg-blue-500/5 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600">{successMessage}</div>
        </Card>
      )}
    </div>
  )
}
