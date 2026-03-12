"use client"

import React, { useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, Droplet } from "lucide-react"
import { EnhancedMapInterface } from "@/components/geospatial/enhanced-map-interface"
import { calculateAndFormatArea, calculateMultiPolygonArea } from "@/lib/polygon-area-calculator"
import { parseGeoJSON, parseKML, parseZIP, validatePolygon } from "@/lib/polygon-file-handlers"
import { generateSatelliteDataZIP, downloadBlob } from "@/lib/satellite-data-exporter"
import { calculateAGB, calculateCanopyCover, determineForestType } from "@/lib/agb-calculator"

interface BlueCarbonGeospatialProps {
  onDataUpdate?: (data: {
    polygon: Array<[number, number]>
    area: number
    areaDisplay: string
    tidalZoneType: string
    ecosystemType: string
    carbonStock?: number
  }) => void
  tidalZoneType?: string
  ecosystemType?: string
}

interface SatelliteAnalysisResults {
  ndvi: number
  cloudCover: number
  sedimentClass: string
  carbonStock: number
  totalCarbon: number
  salinity: string
  inundationFrequency: string
  confidence: number
}

export function BlueCarbonGeospatialSection({ onDataUpdate, tidalZoneType = "", ecosystemType = "" }: BlueCarbonGeospatialProps) {
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [multiPolygons, setMultiPolygons] = useState<any[]>([])
  const [areaResult, setAreaResult] = useState<{ hectares: number; km2: number; display: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [satelliteResults, setSatelliteResults] = useState<SatelliteAnalysisResults | null>(null)

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
          tidalZoneType,
          ecosystemType,
        })
      }

      setError(null)
    }
  }, [tidalZoneType, ecosystemType, onDataUpdate])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      let result: any = {}

      if (file.name.endsWith(".geojson") || file.name.endsWith(".json")) {
        result = await parseGeoJSON(file)
      } else if (file.name.endsWith(".kml")) {
        result = await parseKML(file)
      } else if (file.name.endsWith(".zip")) {
        result = await parseZIP(file)
      } else {
        setError("Unsupported file format. Please use GeoJSON, KML, or ZIP.")
        setLoading(false)
        return
      }

      if (!result.isValid) {
        setError(result.error || "Invalid polygon data")
        setLoading(false)
        return
      }

      // Store multi-polygon data if available
      if (result.multiPolygons && result.multiPolygons.length > 0) {
        setMultiPolygons(result.multiPolygons)
      }

      const coordinates = result.coordinates || []
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

    setAnalysisRunning(true)
    setError(null)

    // Simulate satellite data analysis for blue carbon ecosystem
    setTimeout(() => {
      // Calculate coastal carbon parameters based on ecosystem type
      const ndvi = 0.55 + Math.random() * 0.25 // Lower NDVI for coastal ecosystems
      const canopyCover = calculateCanopyCover(ndvi)
      
      // Determine ecosystem characteristics
      let sedimentClass = "Silty Clay"
      let salinity = "Marine (30-35 ppt)"
      let inundationFrequency = "Semi-diurnal"
      let baseCarbon = 200 // Ton CO2e/Ha for mangrove
      
      if (ecosystemType === "seagrass") {
        baseCarbon = 150
        sedimentClass = "Sandy Silt"
        salinity = "Marine (28-32 ppt)"
        inundationFrequency = "Subtidal"
      } else if (ecosystemType === "salt-marsh") {
        baseCarbon = 120
        sedimentClass = "Clay"
        salinity = "Brackish (10-25 ppt)"
        inundationFrequency = "Spring tides only"
      }
      
      // Apply canopy cover adjustment
      const carbonStock = baseCarbon * (0.7 + (canopyCover / 100) * 0.3)
      
      const areaHectares = areaResult?.hectares || 0
      const totalCarbon = carbonStock * areaHectares

      setSatelliteResults({
        ndvi: Math.round(ndvi * 100) / 100,
        cloudCover: Math.round(Math.random() * 20),
        sedimentClass,
        carbonStock: Math.round(carbonStock * 10) / 10,
        totalCarbon: Math.round(totalCarbon),
        salinity,
        inundationFrequency,
        confidence: 0.85
      })

      setSuccessMessage("Satellite analysis completed successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
      setAnalysisRunning(false)
    }, 2000)
  }

  // Download satellite data package
  const handleDownloadData = async () => {
    if (!satelliteResults || !areaResult) {
      setError("No satellite data available to download")
      return
    }

    try {
      const exportData = {
        projectName: "Blue Carbon Project",
        area: { hectares: areaResult.hectares, km2: areaResult.km2 },
        forestType: `Coastal ${ecosystemType || "Ecosystem"}`,
        polygonCoordinates: polygon,
        multiPolygons,
        polygonInfo: { count: multiPolygons.length || 1, holes: multiPolygons.flatMap(p => p.innerRings).length || 0 },
        dateRange: {
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        },
        location: "Coastal Ecosystem",
        satelliteSource: "Sentinel-2, Landsat-8",
        satellite: {
          ndvi: satelliteResults.ndvi,
          cloudCover: satelliteResults.cloudCover,
          vegetationClass: `${ecosystemType} - ${satelliteResults.sedimentClass}`,
          biomass: satelliteResults.carbonStock,
          carbonEstimate: satelliteResults.totalCarbon,
          unit: "Ton CO2e/Ha",
          methodology: "Coastal Blue Carbon (Verra VCS + IPCC 2019)",
          confidence: satelliteResults.confidence
        },
        timestamp: new Date().toISOString()
      }

      const blob = await generateSatelliteDataZIP(exportData)
      downloadBlob(blob, `blue-carbon-analysis-${Date.now()}.zip`)
      setSuccessMessage("Data package downloaded successfully!")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      setError(`Download failed: ${err instanceof Error ? err.message : "Unknown error"}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Droplet className="w-5 h-5 text-blue-500" />
          Satellite Analysis - Coastal Ecosystem
        </h3>
        <p className="text-sm text-muted-foreground">Define coastal boundaries and perform satellite-based carbon analysis</p>
      </div>

      {/* Messages */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 dark:text-red-400">Error</h4>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {successMessage && (
        <Card className="border-green-500/30 bg-green-500/5 p-4">
          <div className="flex gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 dark:text-green-300">{successMessage}</p>
          </div>
        </Card>
      )}

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

      {/* Upload and Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* File Upload Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Upload Geospatial Data
            </h4>
            <label className="block">
              <input
                type="file"
                accept=".geojson,.kml,.zip,.json"
                onChange={handleFileUpload}
                disabled={loading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-accent-foreground hover:file:bg-accent/90 cursor-pointer"
              />
            </label>
            <p className="text-xs text-muted-foreground mt-2">Supports GeoJSON, KML, and Shapefile ZIP formats</p>
          </div>
        </Card>

        {/* Analysis Card */}
        <Card className="border-border/50 bg-card/30 p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-foreground mb-3">Satellite Analysis</h4>
            <Button
              onClick={handleFetchSatelliteData}
              disabled={polygon.length < 3 || analysisRunning}
              className="w-full gap-2"
            >
              {analysisRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Run Analysis"
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Area Display */}
      {areaResult && (
        <Card className="border-border/50 bg-gradient-to-r from-blue-500/5 to-blue-500/10 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Area (Hectares)</div>
              <div className="text-lg font-semibold text-foreground">
                {typeof areaResult.hectares === 'number' ? areaResult.hectares.toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Area (km²)</div>
              <div className="text-lg font-semibold text-foreground">
                {typeof areaResult.km2 === 'number' ? areaResult.km2.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Badge variant="outline" className="text-xs">
                {polygon.length >= 3 ? "Valid" : "Pending"}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Satellite Analysis Results */}
      {satelliteResults && (
        <Card className="border-blue-500/30 bg-blue-500/5 p-6 space-y-4">
          <h4 className="font-semibold text-foreground">Satellite Analysis Results</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">NDVI</p>
              <p className="text-sm font-semibold">{satelliteResults.ndvi}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Cloud Cover</p>
              <p className="text-sm font-semibold">{satelliteResults.cloudCover}%</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Carbon Stock</p>
              <p className="text-sm font-semibold">{satelliteResults.carbonStock} tCO2e/ha</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Confidence</p>
              <p className="text-sm font-semibold">{Math.round(satelliteResults.confidence * 100)}%</p>
            </div>
          </div>

          <div className="border-t border-border/30 pt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Sediment Class</p>
              <p className="text-sm font-semibold">{satelliteResults.sedimentClass}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Salinity</p>
              <p className="text-sm font-semibold">{satelliteResults.salinity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Inundation</p>
              <p className="text-sm font-semibold">{satelliteResults.inundationFrequency}</p>
            </div>
          </div>

          <div className="border-t border-border/30 pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Total Project Carbon</p>
                <p className="text-2xl font-bold text-blue-600">{satelliteResults.totalCarbon.toLocaleString()} tCO2e</p>
              </div>
              <Button
                onClick={handleDownloadData}
                className="gap-2"
                variant="outline"
              >
                <Download className="w-4 h-4" />
                Download Data
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
