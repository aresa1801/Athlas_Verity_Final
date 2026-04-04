"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Copy, ArrowLeft, CheckCircle, MapPin, Info, Lock } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import IntegrityClassPanel from "@/components/integrity-class-panel"
import ValidatorContributorsPanel from "@/components/validator-contributors-panel"
import DatasetVisualization from "@/components/dataset-visualization"
import { calculateCarbonReduction, type CarbonCalculationInputs } from "@/lib/carbon-calculator"
import { calculateBlueCarbonCredits, type BlueCarbonInputs } from "@/lib/blue-carbon-calculator"
import { WalletConnect } from "@/components/wallet-connect"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import Image from "next/image"
import { estimateAGB, type AGBEstimationResult } from "@/lib/agb-estimation-engine"
import { BlueCarbonResultsDisplay } from "@/components/verification/blue-carbon-results-display"
import type { BlueCarbonResult } from "@/lib/blue-carbon-calculator"
import { generateBatuahHilirPDF, type BatuahHilirPDFData } from "@/lib/pdf-generators/batuah-hilir-pdf-generator"

interface FormData {
  projectName: string
  projectDescription: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  carbonOffsetType: string
  coordinates: Array<{ latitude: string; longitude: string }>
}

interface ResultsData extends FormData {
  satelliteData?: {
    bands?: any
    area_ha?: number
    features?: any
    polygon_area_ha?: number
    net_verified_co2?: number
    biomass_agb_mean?: number
    co2_tCO2?: number
    carbon_tC?: number
    rawGeoJSON?: any
  }
  calculatedAreaHa?: number
  // Blue carbon specific properties
  ecosystemType?: string
  tidalZoneType?: string
  salinityType?: string
  waterDepth?: string
  sedimentDepthEstimate?: string
  deforestationRiskLevel?: string
  country?: string
  baselineYear?: string
}

export default function ResultsPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [projectData, setProjectData] = useState<ResultsData | null>(null)
  const [aiCarbonData, setAiCarbonData] = useState<any>(null)
  const [agbEstimation, setAgbEstimation] = useState<AGBEstimationResult | null>(null)
  const [blueCarbonResult, setBlueCarbonResult] = useState<BlueCarbonResult | null>(null)
  const [isBlueCarbonProject, setIsBlueCarbonProject] = useState(false)
  const [projectMapImage, setProjectMapImage] = useState<string>("")
  const [isCalculating, setIsCalculating] = useState(false)

  const [carbonInputs, setCarbonInputs] = useState<CarbonCalculationInputs>({
    agb_per_ha: 0, // Will be set from satellite data
    carbon_fraction: 0.47,
    area_ha: 0, // Will be set from satellite data
    baseline_emission: 1.8,
    duration_years: 10,
    leakage: 5,
    buffer_pool: 20,
    integrity_class: "IC-A",
    validator_consensus: 0.93,
  })

  // Calculate carbon reduction based on current inputs
  const carbonCalculation = carbonInputs.area_ha > 0 && carbonInputs.agb_per_ha > 0 
    ? calculateCarbonReduction(carbonInputs)
    : calculateCarbonReduction({
        agb_per_ha: 124.2,
        carbon_fraction: 0.47,
        area_ha: 87,
        baseline_emission: 1.8,
        duration_years: 10,
        leakage: 5,
        buffer_pool: 20,
        integrity_class: "IC-A",
        validator_consensus: 0.93,
      })

  useEffect(() => {
    const data = sessionStorage.getItem("projectFormData")
    
    // Get query parameters
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    const projectType = params.get("type")
    
    if (data) {
      const parsedData = JSON.parse(data) as ResultsData
      
      // Extract coordinates from satellite data if not already present
      if (!parsedData.coordinates || parsedData.coordinates.length === 0) {
        const coordinates: Array<{ latitude: number; longitude: number }> = []
        
        // Try to extract from rawGeoJSON if available
        if (parsedData.satelliteData?.rawGeoJSON?.features) {
          const features = parsedData.satelliteData.rawGeoJSON.features
          
          features.forEach((feature: any) => {
            if (feature.geometry?.type === 'Point' && feature.geometry.coordinates) {
              const [lon, lat] = feature.geometry.coordinates
              if (lat && lon) {
                coordinates.push({ latitude: lat, longitude: lon })
              }
            } else if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates) {
              const ring = feature.geometry.coordinates[0]
              ring.forEach(([lon, lat]: [number, number]) => {
                if (lat && lon) {
                  coordinates.push({ latitude: lat, longitude: lon })
                }
              })
            } else if (feature.geometry?.type === 'MultiPolygon' && feature.geometry.coordinates) {
              feature.geometry.coordinates.forEach((polygon: any[]) => {
                const ring = polygon[0]
                ring.forEach(([lon, lat]: [number, number]) => {
                  if (lat && lon) {
                    coordinates.push({ latitude: lat, longitude: lon })
                  }
                })
              })
            }
          })
        }
        
        if (coordinates.length > 0) {
          parsedData.coordinates = coordinates
          console.log("[v0] Extracted", coordinates.length, "coordinates from satellite data")
        }
      }
      
      console.log("[v0] Coordinates available for PDF:", {
        count: parsedData.coordinates?.length || 0,
        sample: parsedData.coordinates?.[0],
        allCoordinates: parsedData.coordinates
      })
      
      setProjectData(parsedData)

      // Extract area from satellite data with proper fallback chain
      let area = 0
      let biomassAgb = 0
      
      // Try to get area from multiple sources
      if (parsedData.satelliteData?.polygon_area_ha && parsedData.satelliteData.polygon_area_ha > 0) {
        area = parsedData.satelliteData.polygon_area_ha
        console.log("[v0] Using polygon_area_ha from satellite data:", area)
      } else if (parsedData.satelliteData?.area_ha && parsedData.satelliteData.area_ha > 0) {
        area = parsedData.satelliteData.area_ha
        console.log("[v0] Using area_ha from satellite data:", area)
      } else if (parsedData.calculatedAreaHa && parsedData.calculatedAreaHa > 0) {
        area = parsedData.calculatedAreaHa
        console.log("[v0] Using calculated area:", area)
      } else {
        console.warn("[v0] No area data found, using default 87 ha")
        area = 87
      }

      // Try to get AGB from satellite data
      if (parsedData.satelliteData?.biomass_agb_mean && parsedData.satelliteData.biomass_agb_mean > 0) {
        biomassAgb = parsedData.satelliteData.biomass_agb_mean
        console.log("[v0] Using biomass_agb_mean from satellite data:", biomassAgb)
      } else {
        console.log("[v0] No direct AGB data, will estimate from satellite features")
      }

      // Initialize AGB estimation with satellite features
      const satelliteFeatures = {
        ndvi: parsedData.satelliteData?.features?.ndvi || 0.65,
        evi: parsedData.satelliteData?.features?.evi || 0.45,
        canopyDensity: parsedData.satelliteData?.features?.canopy_density || 0.75,
        elevation: parsedData.satelliteData?.features?.elevation || 500,
        sarBackscatter: parsedData.satelliteData?.features?.sar_backscatter || 0.3,
      }

      // Determine ecosystem type for AGB estimation
      let agbEcosystemType = "tropical_forest"
      const ecosystemTypeStr = parsedData.ecosystemType?.toLowerCase() || ""
      if (ecosystemTypeStr.includes("mangrove")) {
        agbEcosystemType = "mangrove"
      } else if (ecosystemTypeStr.includes("seagrass")) {
        agbEcosystemType = "seagrass"
      } else if (ecosystemTypeStr.includes("marsh")) {
        agbEcosystemType = "salt_marsh"
      }

      // Run AGB estimation pipeline with appropriate ecosystem type
      const agbResult = estimateAGB(satelliteFeatures, area, agbEcosystemType)
      setAgbEstimation(agbResult)
      console.log("[v0] AGB estimation for ecosystem type:", agbEcosystemType, "- Result:", agbResult.agb_tpha_final, "t/ha")

      // Use actual AGB from satellite data if available, otherwise use estimation
      const finalAGB = biomassAgb > 0 ? biomassAgb : agbResult.agb_tpha_final
      
      // Calculate dynamic leakage based on deforestation risk level and area
      let leakage = 5 // Default
      const riskLevel = parsedData.deforestationRiskLevel?.toLowerCase() || ""
      
      // Area-based leakage (takes priority if higher)
      if (area > 100000) {
        leakage = 20 // Above 100,000 ha: 20%
      } else if (area > 50000) {
        leakage = 10 // Above 50,000 ha: 10%
      } else {
        // Risk level-based leakage for areas <= 50,000 ha
        if (riskLevel === "low" || riskLevel === "very low") {
          leakage = 5
        } else if (riskLevel === "medium") {
          leakage = 10
        } else if (riskLevel === "high") {
          leakage = 20
        }
      }
      
      console.log("[v0] Final values - Area:", area, "ha, AGB:", finalAGB, "t/ha, Risk Level:", riskLevel, ", Leakage:", leakage + "%")

      // Update carbon inputs with actual data and dynamic leakage
      setCarbonInputs({
        agb_per_ha: finalAGB,
        carbon_fraction: 0.47,
        area_ha: area,
        baseline_emission: 1.8,
        duration_years: 10,
        leakage: leakage,
        buffer_pool: 20,
        integrity_class: "IC-A",
        validator_consensus: 0.93,
      })

      // Check if this is a blue carbon project
      const isBlueCarbon = parsedData.tidalZoneType || parsedData.ecosystemType?.toLowerCase().includes('mangrove') || 
                                  parsedData.ecosystemType?.toLowerCase().includes('seagrass') || parsedData.salinityType
      setIsBlueCarbonProject(isBlueCarbon)

      // If blue carbon project, calculate using blue carbon methodology
      if (isBlueCarbon) {
        console.log("[v0] Blue Carbon project detected, using blue carbon calculator")
        
        // Parse ecosystem type
        let ecosystemType: "mangrove" | "seagrass" | "salt_marsh" = "mangrove"
        if (parsedData.ecosystemType?.toLowerCase().includes('seagrass')) {
          ecosystemType = "seagrass"
        } else if (parsedData.ecosystemType?.toLowerCase().includes('marsh')) {
          ecosystemType = "salt_marsh"
        }

        // Parse water depth
        const waterDepthStr = parsedData.waterDepth || "2"
        const waterDepth = parseFloat(waterDepthStr) || 2

        // Parse sediment depth
        const sedimentDepthStr = parsedData.sedimentDepthEstimate || "100"
        const sedimentDepth = parseFloat(sedimentDepthStr) || 100

        // Create blue carbon inputs
        const blueCarbonInputs: BlueCarbonInputs = {
          area_ha: area,
          ecosystem_type: ecosystemType,
          country: parsedData.country || "Unknown",
          baseline_year: parseInt(parsedData.baselineYear) || 2020,
          tidal_zone_type: parsedData.tidalZoneType || "intertidal",
          salinity_type: parsedData.salinityType || "marine",
          water_depth_m: waterDepth,
          sediment_depth_cm: sedimentDepth,
          agb_t_ha: finalAGB,
          bgb_ratio: 0.45, // Standard mangrove BGB/AGB ratio
          dead_wood_t_ha: finalAGB * 0.08,
          litter_t_ha: finalAGB * 0.03,
          soc_t_ha: finalAGB * 3.5, // SOC is 3-4x biomass for coastal ecosystems
          soc_depth_m: 1.0,
          bulk_density_g_cm3: 0.8, // Typical for mangrove soils
          organic_matter_percent: 8, // 8% organic matter
          baseline_emission_t_co2_ha_year: 1.5,
          degradation_rate_percent: 0,
          duration_years: 10,
          leakage_percent: leakage,
          buffer_pool_percent: 20,
          integrity_class: "IC-A",
          uncertainty_discount: 5,
        }

        const blueCarbonResult = calculateBlueCarbonCredits(blueCarbonInputs)
        setBlueCarbonResult(blueCarbonResult)
        console.log("[v0] Blue Carbon calculation complete:", blueCarbonResult)
      }

      // Set AI carbon data structure for display with actual data
      setAiCarbonData({
        carbon_estimation: {
          project_id: `proj_${Date.now()}`,
          project_name: parsedData.projectName,
          location: {
            coordinates: parsedData.coordinates,
            area_ha: area,
          },
          agb_tpha: finalAGB,
          agb_uncertainty_pct: agbResult.agb_uncertainty_pct,
          carbon_stock_tc: finalAGB * area * 0.47,
          co2_equivalent_tco2: finalAGB * area * 0.47 * (44 / 12),
          verification_methods: agbResult.agb_source_models,
          aura_verification: agbResult.aura_verification,
          scientific_basis: agbResult.scientific_references,
        },
      })

      // Generate polygon map for green carbon projects only (not for blue carbon)
      const shouldGenerateMap = !(parsedData.tidalZoneType || parsedData.ecosystemType?.toLowerCase().includes('mangrove') || 
                                  parsedData.ecosystemType?.toLowerCase().includes('seagrass') || parsedData.salinityType)
      if (shouldGenerateMap && parsedData.coordinates && parsedData.coordinates.length > 0) {
        try {
          const mapCanvas = generatePolygonMap(
            parsedData.coordinates as Array<{ latitude: number; longitude: number }>,
            parsedData.projectName || "Project Area",
            area
          )
          if (mapCanvas) {
            setProjectMapImage(mapCanvas)
            console.log("[v0] Polygon map generated for PDF")
          }
        } catch (error) {
          console.error("[v0] Error generating polygon map:", error)
        }
      }
    } else if (projectType === "blue-carbon") {
      // Fallback for blue carbon demo when no sessionStorage data exists
      console.log("[v0] No sessionStorage data but blue-carbon type requested, creating demo data")
      console.log("[v0] Blue Carbon Demo Mode: ACTIVATED")
      
      setIsBlueCarbonProject(true)
      
      // Create demo blue carbon project data
      const demoBlueCarbonData: ResultsData = {
        projectName: "Demo Blue Carbon Project - Mangrove Restoration",
        projectDescription: "Coastal mangrove restoration and conservation project",
        ownerName: "Demo User",
        ownerEmail: "demo@example.com",
        ownerPhone: "+1-555-0000",
        carbonOffsetType: "blue-carbon",
        coordinates: [
          { latitude: "-6.9", longitude: "110.4" },
          { latitude: "-6.95", longitude: "110.4" },
          { latitude: "-6.95", longitude: "110.45" },
          { latitude: "-6.9", longitude: "110.45" },
        ],
        ecosystemType: "mangrove",
        tidalZoneType: "intertidal",
        salinityType: "marine",
      }
      
      setProjectData(demoBlueCarbonData)
      
      // Set demo satellite data with blue carbon project characteristics
      const demoBlueCarbonInputs: BlueCarbonInputs = {
        area_ha: 50,
        ecosystem_type: "mangrove",
        country: "Indonesia",
        baseline_year: 2020,
        tidal_zone_type: "intertidal",
        salinity_type: "marine",
        water_depth_m: 2.5,
        sediment_depth_cm: 100,
        agb_t_ha: 85, // Typical mangrove AGB
        bgb_ratio: 0.45,
        dead_wood_t_ha: 6.8,
        litter_t_ha: 2.55,
        soc_t_ha: 297.5, // High soil carbon for mangroves
        soc_depth_m: 1.0,
        bulk_density_g_cm3: 0.8,
        organic_matter_percent: 8,
        baseline_emission_t_co2_ha_year: 1.5,
        degradation_rate_percent: 0,
        duration_years: 10,
        leakage_percent: 5,
        buffer_pool_percent: 20,
        integrity_class: "IC-A",
        uncertainty_discount: 5,
      }
      
      // Calculate blue carbon result
      const demoBlueCarbonResult = calculateBlueCarbonCredits(demoBlueCarbonInputs)
      setBlueCarbonResult(demoBlueCarbonResult)
      
      // Update carbon inputs for display
      setCarbonInputs({
        agb_per_ha: 85,
        carbon_fraction: 0.47,
        area_ha: 50,
        baseline_emission: 1.8,
        duration_years: 10,
        leakage: 5,
        buffer_pool: 20,
        integrity_class: "IC-A",
        validator_consensus: 0.93,
      })
      
      console.log("[v0] Demo blue carbon data loaded:", demoBlueCarbonResult)
    }
  }, [])

  const calculateAICarbon = async (data: ResultsData) => {
    setIsCalculating(true)
    try {
      const coordinates = data.coordinates.filter((c) => c.latitude && c.longitude)
      let area_ha: number

      // Check if satellite data has area from map calculation
      if (data.satelliteData?.polygon_area_ha) {
        area_ha = data.satelliteData.polygon_area_ha
        console.log("[v0] Using stored polygon area from map:", area_ha, "ha")
      } else if (data.satelliteData?.area_ha) {
        area_ha = data.satelliteData.area_ha
        console.log("[v0] Using satellite data area:", area_ha, "ha")
      } else if (coordinates.length > 0) {
        area_ha = calculatePolygonArea(coordinates)
        console.log("[v0] Recalculated area from coordinates:", area_ha, "ha")
      } else {
        area_ha = 87 // Default fallback
        console.log("[v0] Using default fallback area: 87 ha")
      }

      const response = await fetch("/api/carbon/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bands: data.satelliteData?.bands,
          location: {
            latitude: Number.parseFloat(coordinates[0]?.latitude || "0"),
            longitude: Number.parseFloat(coordinates[0]?.longitude || "0"),
          },
          area_ha: area_ha,
          polygon_area_ha: area_ha, // Ensure polygon area is explicitly passed
          carbonOffsetType: data.carbonOffsetType,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setAiCarbonData(result.carbon_estimation)
        setCarbonInputs((prev) => ({
          ...prev,
          agb_per_ha: result.carbon_estimation.agb_mean,
          area_ha: area_ha, // Use the consistent area value
        }))
        console.log("[v0] Carbon calculation completed with area:", area_ha, "ha")
      }
    } catch (error) {
      console.error("[v0] AI carbon calculation error:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const generatePolygonMap = (
    coordinates: Array<{ latitude: number; longitude: number }>,
    projectName: string,
    areaHa: number
  ): string | null => {
    try {
      if (coordinates.length < 2) return null

      // Canvas dimensions
      const width = 800
      const height = 600
      const padding = 60
      const innerWidth = width - padding * 2
      const innerHeight = height - padding * 2

      // Create canvas
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      // Background
      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, width, height)

      // Title
      ctx.fillStyle = "#64748b"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Project Polygon Map", 20, 30)

      // Find bounds
      const lats = coordinates.map((c) => c.latitude)
      const lons = coordinates.map((c) => c.longitude)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)

      const latRange = maxLat - minLat || 0.001
      const lonRange = maxLon - minLon || 0.001
      const scale = Math.max(innerWidth / lonRange, innerHeight / latRange) * 0.9

      // Convert coordinates to canvas points
      const centerLon = (minLon + maxLon) / 2
      const centerLat = (minLat + maxLat) / 2
      const canvasPoints = coordinates.map((coord) => ({
        x: padding + innerWidth / 2 + (coord.longitude - centerLon) * scale,
        y: padding + innerHeight / 2 - (coord.latitude - centerLat) * scale,
      }))

      // Draw grid
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 1
      for (let i = 0; i <= 10; i++) {
        const y = padding + (innerHeight / 10) * i
        ctx.beginPath()
        ctx.moveTo(padding, y)
        ctx.lineTo(width - padding, y)
        ctx.stroke()

        const x = padding + (innerWidth / 10) * i
        ctx.beginPath()
        ctx.moveTo(x, padding)
        ctx.lineTo(x, height - padding)
        ctx.stroke()
      }

      // Draw polygon
      ctx.fillStyle = "rgba(34, 197, 94, 0.2)"
      ctx.strokeStyle = "#22C55E"
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
      for (let i = 1; i < canvasPoints.length; i++) {
        ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Draw vertices
      ctx.fillStyle = "#22C55E"
      canvasPoints.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      // Draw center point
      const centerX = padding + innerWidth / 2
      const centerY = padding + innerHeight / 2
      ctx.fillStyle = "#3B82F6"
      ctx.beginPath()
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
      ctx.fill()

      // Axes
      ctx.strokeStyle = "#475569"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(centerX, padding)
      ctx.lineTo(centerX, height - padding)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(padding, centerY)
      ctx.lineTo(width - padding, centerY)
      ctx.stroke()

      // Labels
      ctx.fillStyle = "#94a3b8"
      ctx.font = "11px Arial"
      ctx.textAlign = "center"

      // Latitude labels
      ctx.fillText(`${maxLat.toFixed(3)}°`, padding - 40, padding + 5)
      ctx.fillText(`${centerLat.toFixed(3)}°`, padding - 40, centerY + 5)
      ctx.fillText(`${minLat.toFixed(3)}°`, padding - 40, height - padding + 5)

      // Longitude labels
      ctx.textAlign = "center"
      ctx.fillText(`${minLon.toFixed(3)}°`, padding + 5, height - padding + 20)
      ctx.fillText(`${centerLon.toFixed(3)}°`, centerX, height - padding + 20)
      ctx.fillText(`${maxLon.toFixed(3)}°`, width - padding - 5, height - padding + 20)

      // Info box
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)"
      ctx.fillRect(padding, height - padding + 30, innerWidth, 50)
      ctx.strokeStyle = "#22C55E"
      ctx.lineWidth = 1.5
      ctx.strokeRect(padding, height - padding + 30, innerWidth, 50)

      ctx.fillStyle = "#e2e8f0"
      ctx.font = "bold 11px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Area: ${areaHa.toFixed(2)} ha | Vertices: ${coordinates.length}`, padding + 10, height - padding + 50)

      return canvas.toDataURL("image/png")
    } catch (error) {
      console.error("[v0] Error in generatePolygonMap:", error)
      return null
    }
  }

  const calculatePolygonArea = (coordinates: Array<{ latitude: string; longitude: string }>): number => {
    if (coordinates.length < 3) return 87
    const R = 6371000 // Earth radius in meters
    let area = 0

    const coords = coordinates.map((c) => ({
      latitude: Number.parseFloat(c.latitude),
      longitude: Number.parseFloat(c.longitude),
    }))

    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length
      const lat1 = (coords[i].latitude * Math.PI) / 180
      const lat2 = (coords[j].latitude * Math.PI) / 180
      const dlng = ((coords[j].longitude - coords[i].longitude) * Math.PI) / 180

      area += Math.sin(lat1) * Math.cos(lat2) * Math.sin(dlng)
      area -= Math.sin(lat2) * Math.cos(lat1) * Math.sin(dlng)
    }

    area = (Math.abs(area) * (R * R)) / 2
    return area / 10000 // Convert m² to hectares
  }

  const mockValidationResult = {
    integrity_class: "IC-A",
    aura_score: 0.91,
    authenticity_score: 0.87,
    validator_consensus: 0.93,
    data_consistency_score: 0.89,
    anomaly_flags: [],
    proof_chain: "0x7821199fed82a3b4c5d6e7f8g9h0i1j2k3l4m5n6o7p8q9r0s1t2u3v4w5x6y7z",
    contributors: [
      {
        id: "validator_128",
        role: "Baseline Validator",
        confidence: 0.94,
        model_type: "Data Quality Check",
        timestamp: "2024-12-11T10:30:00Z",
      },
      {
        id: "miner_312",
        role: "AI Domain Model",
        confidence: 0.88,
        model_type: "Satellite Imagery CNN",
        timestamp: "2024-12-11T10:31:00Z",
      },
      {
        id: "miner_445",
        role: "AI Domain Model",
        confidence: 0.91,
        model_type: "Geospatial Regression",
        timestamp: "2024-12-11T10:31:30Z",
      },
      {
        id: "validator_567",
        role: "Quality Validator",
        confidence: 0.96,
        model_type: "Consistency Analysis",
        timestamp: "2024-12-11T10:32:00Z",
      },
    ],
  }

  const handleCopyProof = () => {
    navigator.clipboard.writeText(mockValidationResult.proof_chain)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify({ ...mockValidationResult, carbon_calculation: carbonCalculation }, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "validation-proof-chain.json"
    link.click()
  }

  const handleExportPDF = async () => {
    if (!projectData) {
      alert("Project data is not yet loaded. Please wait and try again.")
      return
    }

    try {
      // Only generate Batuah Hilir format PDF for green carbon projects
      if (isBlueCarbonProject) {
        alert("PDF export for Blue Carbon projects coming soon. Currently only Green Carbon format is available.")
        return
      }

      // Prepare PDF data from current state
      const pdfData: BatuahHilirPDFData = {
        // Project Information
        projectName: projectData?.projectName || "Green Carbon Project",
        carbonOffsetType: "Green Carbon",
        projectDescription: projectData?.projectDescription,
        projectLocation: projectData?.projectLocation || "Unknown Location",
        
        // Project Owner Information
        ownerName: projectData?.ownerName || "Unknown",
        ownerEmail: projectData?.ownerEmail || "unknown@example.com",
        ownerPhone: projectData?.ownerPhone || "Unknown",
        
        // Carbon Asset Coordinates
        coordinates: projectData?.coordinates,
        totalAssetPoints: projectData?.coordinates?.filter((c) => c?.latitude && c?.longitude)?.length || 0,
        
        // Verification Status
        verificationStatus: "Verified",
        
        // Integrity & Quality Scores
        integrityClass: carbonInputs.integrity_class || "IC-A",
        auraScore: 91,
        authenticityScore: 87,
        validatorConsensus: carbonInputs.validator_consensus || 93,
        dataConsistencyScore: 89,
        
        // Validation Summary
        dataQualityCheck: true,
        satelliteImageryVerification: true,
        geospatialConsistency: true,
        anomalyFlags: [],
        
        // Carbon Reduction Calculations
        finalVerifiedReduction: carbonCalculation.final_verified_reduction_tco2,
        
        // Calculation Inputs & Parameters
        agb: agbEstimation?.agb_tpha_final || carbonInputs.agb_per_ha || 215.6,
        carbonFraction: carbonInputs.carbon_fraction || 0.47,
        projectArea: carbonInputs.area_ha || 3023.5,
        projectDuration: carbonInputs.duration_years || 10,
        baselineEmissionsRate: carbonInputs.baseline_emission || 1.8,
        
        // Detailed Calculation Steps
        rawCarbonStock: carbonCalculation.raw_carbon_stock_tc,
        convertedCO2: carbonCalculation.converted_co2_tco2,
        baselineEmissions: carbonCalculation.baseline_emissions_total_tco2,
        grossReduction: carbonCalculation.gross_reduction_tco2,
        leakageAdjustment: carbonCalculation.leakage_reduction_tco2,
        leakagePercent: carbonCalculation.leakage_adjustment_percent,
        bufferPoolDeduction: carbonCalculation.buffer_reduction_tco2,
        bufferPoolPercent: carbonCalculation.buffer_pool_percent,
        netReduction: carbonCalculation.net_reduction_tco2,
        integrityClassAdjustment: carbonCalculation.integrity_class_adjustment_tco2,
        integrityClassPercent: (carbonCalculation.integrity_class_factor * 100),
        
        // Validators Information
        validators: mockValidationResult.contributors.map((c) => ({
          id: c.id,
          role: c.role,
          modelType: c.model_type,
          confidence: c.confidence * 100,
        })),
        consensusThreshold: 93,
        averageConfidence: 92.3,
        
        // Vegetation Classification
        primaryForestType: projectData?.satelliteData?.features?.forest_type || "Tropical Rainforest",
        vegetationClass: "Dense Forest",
        ndvi: projectData?.satelliteData?.features?.ndvi || 0.75,
        evi: projectData?.satelliteData?.features?.evi || 0.45,
        gndvi: projectData?.satelliteData?.features?.gndvi || 0.48,
        lai: projectData?.satelliteData?.features?.lai || 6.5,
        canopyDensity: projectData?.satelliteData?.features?.canopy_density || 0.75,
        averageTreeHeight: "25-35 meters",
        crownCoverage: "85-95%",
        vegetationHealthStatus: "Excellent",
        
        // Additional data
        generatedDate: new Date(),
      }

      // Generate PDF
      await generateBatuahHilirPDF(pdfData)
    } catch (error) {
      console.error("[v0] PDF generation failed:", error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Return component render
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link 
          href={isBlueCarbonProject ? "/verification/blue-carbon/create" : "/verification/green-carbon/create"}
          className="flex items-center gap-2 text-accent hover:text-accent/80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Upload Another Dataset
        </Link>

        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-4xl font-bold">Validation Complete</h2>
          {isBlueCarbonProject && !projectData?.projectName?.includes("Demo") && (
            <span className="inline-block px-3 py-1 bg-cyan-500/20 text-cyan-600 text-sm font-medium rounded-full border border-cyan-500/30">
              Blue Carbon
            </span>
          )}
          {isBlueCarbonProject && projectData?.projectName?.includes("Demo") && (
            <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-600 text-sm font-medium rounded-full border border-amber-500/30">
              Demo Data
            </span>
          )}
        </div>
        <p className="text-muted-foreground mb-8">
          {isBlueCarbonProject && projectData?.projectName?.includes("Demo")
            ? "This is a demonstration of blue carbon verification results"
            : "Your ecological dataset has been processed by the Athlas Verity AI System validators"}
        </p>

        {/* Desktop Layout: 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column: Dataset Visualization */}
          <div className="lg:col-span-1">
            <DatasetVisualization />
          </div>

          {/* Middle Column: Integrity Class & Metrics */}
          <div className="lg:col-span-1">
            <IntegrityClassPanel validationResult={mockValidationResult} />
          </div>

          {/* Right Column: Validator Contributors */}
          <div className="lg:col-span-1">
            <ValidatorContributorsPanel contributors={mockValidationResult.contributors} />
          </div>
        </div>

        {/* Blue Carbon Results Display */}
        {isBlueCarbonProject && blueCarbonResult && (
          <div className="mb-8">
            <BlueCarbonResultsDisplay 
              data={blueCarbonResult}
              projectArea={carbonInputs.area_ha}
              projectDuration={carbonInputs.duration_years}
            />
          </div>
        )}

        {/* Carbon Reduction Summary - Green Carbon Only */}
        {!isBlueCarbonProject && (
          <>
            <Card className="bg-card border-border p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Carbon Reduction Summary
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">Verified CO₂ Equivalent Reduction</p>
                </div>
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>

              {/* Final Verified Reduction - Large highlighted box */}
              <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/50 rounded-lg p-6 mb-8">
                <p className="text-sm text-muted-foreground mb-2">Final Verified Reduction</p>
                <p className="text-4xl font-bold text-green-400">
                  {carbonCalculation.final_verified_reduction_tco2.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">tonnes CO₂ equivalent</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Gross Reduction</p>
                  <p className="text-2xl font-bold text-foreground">
                    {carbonCalculation.gross_reduction_tco2.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂e</p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">After Leakage & Buffer</p>
                  <p className="text-2xl font-bold text-foreground">
                    {carbonCalculation.net_reduction_tco2.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂e</p>
                </div>
              </div>

              {/* Detailed Calculation Steps */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-sm font-semibold mb-4">Detailed Calculation Breakdown:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">1. Raw Carbon Stock</span>
                    <span className="font-medium">{carbonCalculation.raw_carbon_stock_tc.toLocaleString(undefined, { maximumFractionDigits: 2 })} tC</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">2. Converted to CO₂</span>
                    <span className="font-medium">{carbonCalculation.converted_co2_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">3. Baseline Emissions</span>
                    <span className="font-medium">{carbonCalculation.baseline_emissions_total_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">4. Gross Reduction</span>
                    <span className="font-medium text-green-400">{carbonCalculation.gross_reduction_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">5. Leakage Adjustment ({carbonCalculation.leakage_adjustment_percent.toFixed(1)}%)</span>
                    <span className="font-medium text-red-400">-{carbonCalculation.leakage_reduction_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">6. Buffer Pool ({carbonCalculation.buffer_pool_percent.toFixed(1)}%)</span>
                    <span className="font-medium text-red-400">-{carbonCalculation.buffer_reduction_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted-foreground/20">
                    <span className="text-muted-foreground">7. Net Reduction</span>
                    <span className="font-medium">{carbonCalculation.net_reduction_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">8. Integrity Class Adjustment ({(carbonCalculation.integrity_class_factor * 100).toFixed(1)}%)</span>
                    <span className="font-medium text-red-400">-{carbonCalculation.integrity_class_adjustment_tco2.toLocaleString(undefined, { maximumFractionDigits: 2 })} tCO₂</span>
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Verification Details Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Left: Coordinates Display */}
          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent" />
              Geospatial Verification
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Total Points Verified</span>
                <span className="font-semibold">{projectData?.coordinates?.filter((c) => c?.latitude && c?.longitude)?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Coverage Area</span>
                <span className="font-semibold">{carbonInputs.area_ha.toFixed(2)} hectares</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Verification Status</span>
                <span className="font-semibold text-green-400">✓ Confirmed</span>
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-3">Registered Coordinates:</p>
                <div className="bg-muted/50 rounded p-3 max-h-48 overflow-y-auto">
                  {projectData?.coordinates && projectData.coordinates.length > 0 ? (
                    <ul className="space-y-2">
                      {projectData.coordinates.map((coord, idx) => {
                        if (!coord?.latitude || !coord?.longitude) return null
                        const lat = typeof coord.latitude === 'string' ? parseFloat(coord.latitude) : coord.latitude
                        const lon = typeof coord.longitude === 'string' ? parseFloat(coord.longitude) : coord.longitude
                        return (
                          <li key={idx} className="text-xs font-mono text-foreground">
                            <span className="text-muted-foreground">Pt {idx + 1}:</span> {lat.toFixed(6)}°, {lon.toFixed(6)}°
                          </li>
                        )
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No coordinates registered</p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Right: Project Info */}
          <Card className="bg-card border-border p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-accent" />
              Project Information
            </h3>
            <div className="space-y-3">
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Project Name</p>
                <p className="font-semibold">{projectData?.projectName || "N/A"}</p>
              </div>
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Location</p>
                <p className="font-semibold">{projectData?.projectLocation || "N/A"}</p>
              </div>
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Project Owner</p>
                <p className="font-semibold">{projectData?.ownerName || "N/A"}</p>
              </div>
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Contact Email</p>
                <p className="font-semibold text-sm break-all">{projectData?.ownerEmail || "N/A"}</p>
              </div>
              <div className="py-2 border-b border-border">
                <p className="text-sm text-muted-foreground mb-1">Contact Phone</p>
                <p className="font-semibold">{projectData?.ownerPhone || "N/A"}</p>
              </div>
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-1">Verification Status</p>
                <p className="font-semibold text-green-400">✓ Verified</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Proof Chain Section */}
        <Card className="bg-card border-border p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-accent" />
            Proof Chain Verification
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Verification Hash</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted/50 p-3 rounded text-xs break-all text-foreground">
                  {mockValidationResult.proof_chain}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyProof}
                  className="flex-shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Export Options */}
        <Card className="bg-card border-border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-accent" />
            Export Verification Report
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Download your complete verification report in multiple formats
          </p>

          <div className="space-y-3">
            <Button onClick={handleExportJSON} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <Download className="w-4 h-4 mr-2" />
              Export Validation Package (JSON)
            </Button>
            <Button onClick={handleExportPDF} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              <Download className="w-4 h-4 mr-2" />
              Download Complete PDF Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
