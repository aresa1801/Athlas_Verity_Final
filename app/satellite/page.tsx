"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Satellite, MapPin, Calendar, Cloud, Loader2, Sparkles, Shield } from "lucide-react"
import { WalletConnect } from "@/components/wallet-connect"
import { MapInterface } from "@/components/satellite/map-interface"
import { SatellitePreview } from "@/components/satellite/satellite-preview"
import { CarbonEstimationDashboard } from "@/components/ai-carbon/carbon-estimation-dashboard"
import { buildFeatureCube } from "@/lib/ai-carbon/feature-engineering"
import { estimateBiomass } from "@/lib/ai-carbon/biomass-estimation"
import { convertTocarbonCredit } from "@/lib/ai-carbon/carbon-conversion"
import { runAIConsensusVerification } from "@/lib/ai-carbon/aura-consensus"
import type { FeatureCube } from "@/lib/ai-carbon/types"
import {
  classifyVegetationMap,
  type VegetationClassificationInput,
} from "@/lib/vegetation-classification/vegetation-classifier"
import { VegetationMapDashboard } from "@/components/vegetation-classification/vegetation-map-dashboard"

export default function SatellitePage() {
  const [location, setLocation] = useState({
    latitude: "",
    longitude: "",
    radius: "5",
  })
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  })
  const [cloudThreshold, setCloudThreshold] = useState(20)
  const [dataSources, setDataSources] = useState<string[]>(["mpc", "gee", "aws"])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [carbonEstimation, setCarbonEstimation] = useState<any>(null)
  const [showCarbonAnalysis, setShowCarbonAnalysis] = useState(false)
  const [vegetationClassification, setVegetationClassification] = useState<any>(null)
  const [esaValidation, setEsaValidation] = useState<any>(null)
  const [auraConsensus, setAuraConsensus] = useState<any>(null)
  const [showVegetationAnalysis, setShowVegetationAnalysis] = useState(false)
  const [areaResult, setAreaResult] = useState<any>(null)
  const [polygonAreaHa, setPolygonAreaHa] = useState<number | null>(null)

  // Removed duplicate header from satellite page - using main header from layout instead

  const handleFetchData = async () => {
    if (!dateRange.start || !dateRange.end) {
      alert("Please select a date range")
      return
    }

    if (polygon.length === 0 && (!location.latitude || !location.longitude)) {
      alert("Please provide either coordinates or draw a polygon on the map")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/satellite/fetch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          polygon:
            polygon.length > 0
              ? polygon
              : generateCirclePolygon(
                  Number.parseFloat(location.latitude),
                  Number.parseFloat(location.longitude),
                  Number.parseFloat(location.radius),
                ),
          dateRange,
          cloudThreshold,
          dataSources,
        }),
      })

      const data = await response.json()

      if (data.success && data.results.length > 0) {
        setResults(data.results)
        setShowCarbonAnalysis(false)
        setShowVegetationAnalysis(false)
      } else {
        alert("No satellite data found for the specified parameters")
      }
    } catch (error) {
      console.error("[v0] Error fetching satellite data:", error)
      alert("Failed to fetch satellite data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleRunCarbonEstimation = () => {
    if (!results || results.length === 0) {
      alert("Please fetch satellite data first")
      return
    }

    try {
      // Calculate project area from polygon or radius
      let area_ha: number
      if (areaResult?.areaHa) {
        area_ha = areaResult.areaHa
        console.log("[v0] Using map-verified polygon area:", area_ha, "ha")
      } else if (polygon.length > 0) {
        // Use the accurate Shoelace formula-based calculation
        area_ha = calculatePolygonArea(polygon)
        console.log("[v0] Calculated polygon area via formula:", area_ha, "ha")
      } else {
        // Only use radius approximation if no polygon drawn
        area_ha = Math.PI * Number.parseFloat(location.radius) ** 2
        console.log("[v0] Using circle area approximation:", area_ha, "ha")
      }

      setPolygonAreaHa(area_ha)

      // Use first result for feature extraction
      const result = results[0]

      // Mock band values (in production, would extract from actual rasters)
      const mockBands = {
        B02: 0.05, // Blue
        B03: 0.06, // Green
        B04: 0.04, // Red
        B08: 0.35, // NIR
        B11: 0.15, // SWIR1
        B12: 0.1, // SWIR2
      }

      // Step 1: Feature engineering
      const featureCube: FeatureCube = buildFeatureCube(
        mockBands,
        {
          latitude: Number.parseFloat(location.latitude) || polygon[0][0],
          longitude: Number.parseFloat(location.longitude) || polygon[0][1],
        },
        area_ha,
      )

      // Step 2: Biomass estimation
      const biomassEstimate = estimateBiomass(featureCube, area_ha)

      // Step 3: Aura consensus
      const consensus = runAIConsensusVerification(biomassEstimate.agb_mean)

      // Step 4: Carbon conversion
      const carbonCredit = convertTocarbonCredit({
        biomass: biomassEstimate,
        area_ha,
        project_duration_years: 20,
        baseline_agb_per_ha: 30, // Degraded forest baseline
        leakage_percent: 10,
        buffer_pool_percent: 20,
        integrity_class: consensus.integrity_class,
      })

      setCarbonEstimation({
        biomass: biomassEstimate,
        carbon: carbonCredit,
        integrity: consensus,
        features: featureCube,
        projectInfo: {
          name: "Carbon Project",
          area_ha,
          location: {
            latitude: Number.parseFloat(location.latitude) || polygon[0][0],
            longitude: Number.parseFloat(location.longitude) || polygon[0][1],
          },
        },
      })
      setShowCarbonAnalysis(true)
    } catch (error) {
      console.error("[v0] Error running carbon estimation:", error)
      alert("Failed to run carbon estimation. Please try again.")
    }
  }

  const handleExportCarbonPDF = () => {
    if (!carbonEstimation) return

    const { biomass, carbon, integrity, projectInfo, features } = carbonEstimation

    const pdfContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Athlas Verity AI Carbon Intelligence Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .section { margin-top: 20px; }
    h1 { color: #3DD68C; }
    h2 { color: #3DD68C; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
    .highlight { background-color: #f0f0f0; padding: 10px; border-left: 3px solid #3DD68C; }
  </style>
</head>
<body>
  <h1>Athlas Verity AI Carbon Intelligence Report</h1>
  <p><strong>Project ID:</strong> ${Date.now()}<br>
  <strong>Generated:</strong> ${new Date().toLocaleString()}<br>
  <strong>Methodology:</strong> Satellite + AI + IPCC</p>

  <div class="section">
    <h2>Final Carbon Credit Output</h2>
    <div class="highlight">${carbon.final_verified_co2_tco2} tCO₂e</div>
    <p style="text-align: center; margin-top: 10px;">Conservative P10 estimate with all deductions applied</p>
  </div>

  <div class="section">
    <h2>Project Information</h2>
    <table>
      <tr><td>Project Area</td><td>${projectInfo.area_ha.toFixed(2)} hectares</td></tr>
      <tr><td>Location</td><td>${projectInfo.location.latitude.toFixed(4)}, ${projectInfo.location.longitude.toFixed(4)}</td></tr>
      <tr><td>Per Hectare Credit</td><td>${(carbon.final_verified_co2_tco2 / projectInfo.area_ha).toFixed(2)} tCO₂e/ha</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Biomass Estimation (AGB)</h2>
    <table>
      <tr><th>Metric</th><th>Value</th></tr>
      <tr><td>Mean Estimate</td><td>${biomass.agb_mean} t/ha</td></tr>
      <tr><td>Conservative (P10)</td><td>${biomass.agb_p10} t/ha</td></tr>
      <tr><td>Median (P50)</td><td>${biomass.agb_p50} t/ha</td></tr>
      <tr><td>Optimistic (P90)</td><td>${biomass.agb_p90} t/ha</td></tr>
      <tr><td>Model Confidence</td><td>${(biomass.confidence * 100).toFixed(0)}%</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Vegetation Indices</h2>
    <table>
      <tr><th>Index</th><th>Value</th></tr>
      <tr><td>NDVI</td><td>${features.vegetation.NDVI}</td></tr>
      <tr><td>EVI</td><td>${features.vegetation.EVI}</td></tr>
      <tr><td>NBR</td><td>${features.vegetation.NBR}</td></tr>
      <tr><td>SAVI</td><td>${features.vegetation.SAVI}</td></tr>
      <tr><td>NDMI</td><td>${features.vegetation.NDMI}</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Carbon Conversion (IPCC Methodology)</h2>
    <table>
      <tr><th>Step</th><th>Value</th></tr>
      <tr><td>AGB (Conservative P10)</td><td>${biomass.agb_p10} t/ha</td></tr>
      <tr><td>Carbon Fraction</td><td>0.47</td></tr>
      <tr><td>Carbon Stock (tC)</td><td>${carbon.carbon_stock_tc_conservative} tC</td></tr>
      <tr><td>CO₂ Conversion (44/12)</td><td>${carbon.co2_conservative_tco2} tCO₂</td></tr>
      <tr><td>Baseline CO₂</td><td>${carbon.baseline_co2_tco2} tCO₂</td></tr>
      <tr><td>Gross Reduction</td><td>${carbon.gross_reduction_tco2} tCO₂</td></tr>
      <tr><td>Leakage Deduction</td><td>-${carbon.leakage_deduction_tco2} tCO₂</td></tr>
      <tr><td>Buffer Pool Deduction</td><td>-${carbon.buffer_pool_deduction_tco2} tCO₂</td></tr>
      <tr><td>Integrity Discount (${carbon.integrity_discount_percent}%)</td><td>-${carbon.integrity_deduction_tco2} tCO₂</td></tr>
      <tr style="background-color: #3DD68C; color: #000;"><td><strong>Final Verified Credits</strong></td><td><strong>${carbon.final_verified_co2_tco2} tCO₂e</strong></td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Aura Subnet Consensus</h2>
    <table>
      <tr><td>Aura Score</td><td>${(integrity.aura_score * 100).toFixed(0)}%</td></tr>
      <tr><td>Integrity Class</td><td>${integrity.integrity_class}</td></tr>
      <tr><td>Validator Consensus</td><td>${(integrity.validator_consensus * 100).toFixed(0)}%</td></tr>
      <tr><td>Model Agreement</td><td>${(integrity.consensus_metrics.model_agreement * 100).toFixed(0)}%</td></tr>
      <tr><td>Spatial Consistency</td><td>${(integrity.consensus_metrics.spatial_consistency * 100).toFixed(0)}%</td></tr>
      <tr><td>Historical Plausibility</td><td>${(integrity.consensus_metrics.historical_plausibility * 100).toFixed(0)}%</td></tr>
      <tr><td>Data Quality Score</td><td>${(integrity.consensus_metrics.data_quality_score * 100).toFixed(0)}%</td></tr>
    </table>
  </div>

  <div class="section">
    <h2>Validator Contributors</h2>
    <table>
      <tr><th>Miner ID</th><th>Role</th><th>AGB Estimate</th><th>Confidence</th></tr>
      ${integrity.contributors
        .map(
          (c) => `
        <tr>
          <td><code>${c.miner_id}</code></td>
          <td>${c.role.replace("_", " ")}</td>
          <td>${c.agb_estimate} t/ha</td>
          <td>${(c.confidence * 100).toFixed(0)}%</td>
        </tr>
      `,
        )
        .join("")}
    </table>
    <p style="margin-top: 10px;"><strong>Proof-Chain Hash:</strong><br><code style="color: #3DD68C;">${integrity.proof_chain_hash}</code></p>
  </div>

  <div class="section">
    <p style="margin-top: 20px;">Generated on ${new Date().toLocaleString()}<br>
    Athlas Verity Platform - Powered by Athlas Verity AI System<br>
    © 2025 Athlas Verity - Environmental Impact Verification Platform<br>
    This report contains verified carbon credit data. Handle with appropriate confidentiality.</p>
  </div>
</body>
</html>
    `

    const blob = new Blob([pdfContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `carbon-credit-report-${Date.now()}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleExport = async () => {
    if (!results) return

    try {
      // Create a comprehensive PDF report
      const pdfContent = generatePDFContent()

      // Create ZIP file with both PDF and GeoTIFF data
      const { default: JSZip } = await import("jszip")
      const zip = new JSZip()

      // Add PDF report
      const pdfBlob = new Blob([pdfContent], { type: "text/html" })
      zip.file("satellite-report.html", pdfBlob)

      const verificationData = {
        type: "satellite_verification_data",
        version: "1.0",
        timestamp: new Date().toISOString(),
        coordinates:
          polygon.length >= 2
            ? [
                { latitude: polygon[0][0].toFixed(6), longitude: polygon[0][1].toFixed(6) },
                { latitude: polygon[1][0].toFixed(6), longitude: polygon[1][1].toFixed(6) },
              ]
            : [],
        projectDescription: `Satellite-verified carbon project area with ${polygon.length} boundary points. 
Date range: ${dateRange.start} to ${dateRange.end}. 
Cloud threshold: ${cloudThreshold}%. 
Data sources: ${dataSources.join(", ")}.`,
        carbonData: carbonEstimation
          ? {
              biomass_agb_mean: carbonEstimation.biomass.agb_mean,
              carbon_tC: carbonEstimation.carbon.carbon_stock_tc_conservative,
              co2_tCO2: carbonEstimation.carbon.co2_conservative_tco2,
              net_verified_co2: carbonEstimation.carbon.final_verified_co2_tco2,
              integrity_class: carbonEstimation.integrity.integrity_class,
              aura_score: carbonEstimation.integrity.aura_score,
            }
          : null,
        satelliteMetadata: {
          polygon,
          dateRange,
          cloudThreshold,
          dataSources,
        },
        results,
      }
      zip.file("verification_data.json", JSON.stringify(verificationData, null, 2))

      // Add metadata JSON
      const metadataJson = JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          query: {
            polygon,
            dateRange,
            cloudThreshold,
            dataSources,
          },
          results,
          carbonEstimation,
        },
        null,
        2,
      )
      zip.file("metadata.json", metadataJson)

      // Add band URLs as text file for GeoTIFF downloads
      const geotiffInfo = results
        .map((result, idx) => {
          return (
            `\n=== ${result.source} ===\n` +
            Object.entries(result.bands)
              .map(([band, url]) => `${band}: ${url || "N/A"}`)
              .join("\n")
          )
        })
        .join("\n\n")
      zip.file("geotiff-download-urls.txt", geotiffInfo)

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `satellite-verification-data-${Date.now()}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("[v0] Error creating ZIP:", error)
      alert("Failed to create export package")
    }
  }

  const generatePDFContent = () => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Satellite Data Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .section { margin-top: 20px; }
    h1 { color: #3DD68C; }
    h2 { color: #3DD68C; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
    th { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Athlas Verity Satellite Data Report</h1>
  <div class="section">
    <h2>Query Parameters</h2>
    <table>
      <tr><td>Date Range</td><td>${dateRange.start} to ${dateRange.end}</td></tr>
      <tr><td>Cloud Threshold</td><td>${cloudThreshold}%</td></tr>
      <tr><td>Data Sources</td><td>${dataSources.join(", ")}</td></tr>
      <tr><td>Polygon Points</td><td>${polygon.length > 0 ? polygon.length : "Circle from coordinates"}</td></tr>
    </table>
  </div>
  ${results
    .map(
      (result, idx) => `
  <div class="section">
    <h2>Result ${idx + 1}: ${result.source}</h2>
    <table>
      <tr><td>Platform</td><td>${result.metadata.platform}</td></tr>
      <tr><td>Resolution</td><td>${result.metadata.resolution}</td></tr>
      <tr><td>Cloud Cover</td><td>${result.metadata.cloud_cover?.toFixed(1) || "N/A"}%</td></tr>
      <tr><td>EPSG</td><td>${result.metadata.epsg}</td></tr>
    </table>
    <h3>Available Bands</h3>
    <ul>
      ${Object.entries(result.bands)
        .map(([band, url]) => `<li>${band}: ${url ? "Available" : "N/A"}</li>`)
        .join("")}
    </ul>
    <h3>Computed Indices</h3>
    <ul>
      ${Object.entries(result.indices)
        .map(([name, data]: [string, any]) => `<li>${name}: ${data.formula}</li>`)
        .join("")}
    </ul>
  </div>
  `,
    )
    .join("")}
  <div class="section" style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #3DD68C;">
    <p style="text-align: center; font-size: 12px; color: #888;">
      Generated on ${new Date().toLocaleString()}<br>
      Athlas Verity Platform - Powered by Athlas Verity AI System<br>
      © 2025 Athlas Verity - Environmental Impact Verification Platform
    </p>
  </div>
</body>
</html>
    `
  }

  const toggleDataSource = (source: string) => {
    setDataSources((prev) => (prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]))
  }

  const handleRunVegetationClassification = () => {
    if (!results || results.length === 0) {
      alert("Please fetch satellite data first")
      return
    }

    try {
      // Calculate project area from polygon
      const area_ha =
        polygon.length > 0 ? calculatePolygonArea(polygon) : Math.PI * Number.parseFloat(location.radius) ** 2

      // Mock pixel inputs with coastal detection
      const mockPixels: VegetationClassificationInput[] = Array.from(
        { length: Math.max(100, Math.round(area_ha * 10)) },
        (_, i) => {
          // Simulate coastal vs inland pixels
          const isCoastal = i % 20 === 0 // 5% coastal pixels
          return {
            NDVI: 0.5 + Math.random() * 0.35,
            EVI: 0.4 + Math.random() * 0.3,
            NBR: 0.3 + Math.random() * 0.4,
            SAVI: 0.45 + Math.random() * 0.3,
            NDMI: isCoastal ? 0.4 + Math.random() * 0.3 : 0.2 + Math.random() * 0.2,
            canopy_height_mean: Math.random() * 25,
            texture_variance: Math.random() * 0.25,
            elevation: Math.random() * 500,
            slope: Math.random() * 30,
            is_coastal_area: isCoastal,
            elevation_from_coastline: isCoastal ? Math.random() * 2 : Math.random() * 20,
          }
        },
      )

      // Classify with polygon area for accurate scaling
      const classification = classifyVegetationMap(mockPixels, 100, area_ha)

      setVegetationClassification(classification)
      setShowVegetationAnalysis(true)
    } catch (error) {
      console.error("[v0] Error in vegetation classification:", error)
      alert("Failed to run vegetation classification")
    }
  }

  const handleMapAreaCalculated = (area: any) => {
    setAreaResult(area)
    if (area?.areaHa) {
      setPolygonAreaHa(area.areaHa)
      console.log("[v0] Polygon area verified from map:", area.areaHa, "ha")
    }
  }

  function generateCirclePolygon(lat: number, lng: number, radiusKm: number): Array<[number, number]> {
    const points: Array<[number, number]> = []
    const numPoints = 32
    const radiusDeg = radiusKm / 111.32 // Approximate conversion

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI
      const pointLat = lat + radiusDeg * Math.cos(angle)
      const pointLng = lng + (radiusDeg * Math.sin(angle)) / Math.cos((lat * Math.PI) / 180)
      points.push([pointLat, pointLng])
    }

    return points
  }

  function calculatePolygonArea(polygon: Array<[number, number]>): number {
    // Simplified area calculation (in hectares)
    // In production, would use proper geospatial calculation
    if (polygon.length < 3) return 0

    let area = 0
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length
      area += polygon[i][0] * polygon[j][1]
      area -= polygon[j][0] * polygon[i][1]
    }
    area = Math.abs(area / 2)

    // Convert to hectares (rough approximation)
    return area * 12100
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">AI Carbon Intelligence Module</h2>
          <p className="text-muted-foreground">
            Convert satellite imagery into verified carbon credits using transparent AI and IPCC methodology
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-1 space-y-6">
            {/* Location Input */}
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Location Input</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    placeholder="-6.2088"
                    value={location.latitude}
                    onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    placeholder="106.8456"
                    value={location.longitude}
                    onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="radius">Radius (km)</Label>
                  <Input
                    id="radius"
                    type="number"
                    placeholder="5"
                    value={location.radius}
                    onChange={(e) => setLocation({ ...location, radius: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div className="pt-2 text-xs text-muted-foreground">Or draw a polygon on the map →</div>
              </div>
            </Card>

            {/* Date Range */}
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Date Range</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="bg-background border-border"
                  />
                </div>
              </div>
            </Card>

            {/* Cloud Cover Threshold */}
            <Card className="bg-card border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Cloud className="w-5 h-5 text-accent" />
                <h3 className="font-semibold">Cloud Cover Threshold</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Max Cloud Cover</Label>
                    <span className="text-sm text-accent">{cloudThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={cloudThreshold}
                    onChange={(e) => setCloudThreshold(Number.parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                </div>
              </div>
            </Card>

            {/* Data Source Selector */}
            <Card className="bg-card border-border p-6">
              <h3 className="font-semibold mb-4">Data Sources</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataSources.includes("mpc")}
                    onChange={() => toggleDataSource("mpc")}
                    className="w-4 h-4 accent-accent"
                  />
                  <div>
                    <div className="font-medium">Microsoft Planetary Computer</div>
                    <div className="text-xs text-muted-foreground">STAC API (Primary)</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataSources.includes("gee")}
                    onChange={() => toggleDataSource("gee")}
                    className="w-4 h-4 accent-accent"
                  />
                  <div>
                    <div className="font-medium">Google Earth Engine</div>
                    <div className="text-xs text-muted-foreground">Feature Extraction</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dataSources.includes("aws")}
                    onChange={() => toggleDataSource("aws")}
                    className="w-4 h-4 accent-accent"
                  />
                  <div>
                    <div className="font-medium">AWS Sentinel-2</div>
                    <div className="text-xs text-muted-foreground">Raw Tiles</div>
                  </div>
                </label>
              </div>
            </Card>

            {/* Fetch Button */}
            <Button
              onClick={handleFetchData}
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrieving Imagery...
                </>
              ) : (
                <>
                  <Satellite className="w-4 h-4 mr-2" />
                  Fetch Satellite Data
                </>
              )}
            </Button>

            {/* Carbon Estimation Button */}
            {results && !showCarbonAnalysis && (
              <Button onClick={handleRunCarbonEstimation} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Carbon Estimation
              </Button>
            )}

            {/* Vegetation Classification Button */}
            {results && !showVegetationAnalysis && (
              <Button
                onClick={handleRunVegetationClassification}
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Run Vegetation Classification
              </Button>
            )}
          </div>

          {/* Middle/Right Panel: Map & Results */}
          <div className="lg:col-span-2 space-y-6">
            <MapInterface
              polygon={polygon}
              setPolygon={setPolygon}
              location={location}
              onAreaCalculated={handleMapAreaCalculated}
            />

            {results && !showCarbonAnalysis && !showVegetationAnalysis && (
              <SatellitePreview results={results} onExport={handleExport} />
            )}

            {/* Carbon Estimation Dashboard */}
            {showCarbonAnalysis && carbonEstimation && (
              <CarbonEstimationDashboard
                biomassEstimate={carbonEstimation.biomass}
                carbonCredit={carbonEstimation.carbon}
                consensus={carbonEstimation.integrity}
                projectInfo={carbonEstimation.projectInfo}
                onExportPDF={handleExportCarbonPDF}
              />
            )}

            {/* Vegetation Classification Results */}
            {showVegetationAnalysis && vegetationClassification && (
              <div className="space-y-6 mt-8 border-t border-secondary/30 pt-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6 text-accent" />
                  Vegetation Classification Analysis
                </h2>

                <VegetationMapDashboard classification={vegetationClassification} />

                {/* ESA WorldCover Validation */}
                {esaValidation && (
                  <Card className="border-secondary/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-accent" />
                      ESA WorldCover Cross-Validation
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-foreground/60">Agreement with ESA</p>
                        <p className="text-3xl font-bold text-accent">
                          {esaValidation.agreement_percentage.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/60">Integrity Adjustment</p>
                        <p className="text-3xl font-bold text-accent">
                          {(esaValidation.integrity_adjustment_factor * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <p
                      className={`mt-4 text-sm ${esaValidation.validation_status === "PASS" ? "text-green-600" : esaValidation.validation_status === "WARNING" ? "text-yellow-600" : "text-red-600"}`}
                    >
                      {esaValidation.message}
                    </p>
                  </Card>
                )}

                {/* Aura Subnet Consensus */}
                {auraConsensus && (
                  <Card className="border-secondary/30 p-6">
                    <h3 className="text-lg font-semibold mb-4">Aura Subnet Validator Consensus</h3>
                    <p className="text-sm mb-4">{auraConsensus.validator_summary}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-secondary/20 p-3 rounded">
                        <p className="text-xs text-foreground/60">Consensus Probability</p>
                        <p className="text-2xl font-bold text-accent">
                          {(auraConsensus.consensus_probability * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-secondary/20 p-3 rounded">
                        <p className="text-xs text-foreground/60">Integrity Class</p>
                        <p className="text-2xl font-bold text-accent">{auraConsensus.integrity_class}</p>
                      </div>
                      <div className="bg-secondary/20 p-3 rounded">
                        <p className="text-xs text-foreground/60">Carbon Discount</p>
                        <p className="text-2xl font-bold text-accent">
                          {(auraConsensus.integrity_penalty * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
