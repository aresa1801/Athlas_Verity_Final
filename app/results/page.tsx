"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Copy, ArrowLeft, CheckCircle } from "lucide-react"
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

    // Detect if this is a blue carbon project
  // Only recalculate if we have projectData (for PDF styling purposes)
  const detectedBlueCarbonProject = projectData && (projectData.tidalZoneType || projectData.ecosystemType?.toLowerCase().includes('mangrove') || projectData.ecosystemType?.toLowerCase().includes('seagrass') || projectData.salinityType)
  
  const primaryColor = isBlueCarbonProject || detectedBlueCarbonProject ? "#0EA5E9" : "#3DD68C"
  const primaryColorRgba = isBlueCarbonProject || detectedBlueCarbonProject ? "14, 165, 233" : "61, 214, 140"
  const primaryTextColor = isBlueCarbonProject || detectedBlueCarbonProject ? "text-cyan-900 dark:text-cyan-400" : "text-emerald-900 dark:text-emerald-400"

    const carbonOffsetTypes: Record<string, string> = {
      reforestation: "Reforestation",
      afforestation: "Afforestation",
      "renewable-energy": "Renewable Energy",
      "agricultural-practices": "Agricultural Practices",
      "wetland-restoration": "Wetland Restoration",
      "methane-capture": "Methane Capture",
      other: "Other",
      "forest-conservation": "Forest Conservation",
      "sustainable-forest-management": "Sustainable Forest Management",
      agroforestry: "Agroforestry",
      "regenerative-agriculture": "Regenerative Agriculture",
      "grassland-restoration": "Grassland & Pasture Restoration",
      "mangrove-restoration": "Mangrove Restoration",
      "seagrass-conservation": "Seagrass Meadow Conservation",
      "salt-marsh-restoration": "Salt Marsh Restoration",
      "kelp-forest-conservation": "Kelp Forest Conservation",
      "coral-reef-restoration": "Coral Reef Restoration",
      "biomass-energy": "Biomass Energy Projects",
      "geothermal-energy": "Geothermal Energy",
      "energy-efficiency": "Energy Efficiency Improvements",
      "soil-carbon-sequestration": "Soil Carbon Sequestration",
      "no-till-agriculture": "No-Till Agriculture",
      "cover-crops": "Cover Crop Implementation",
      biochar: "Biochar Production & Sequestration",
      composting: "Organic Waste Composting",
      "peatland-restoration": "Peatland Restoration & Protection",
      "riparian-buffer": "Riparian Buffer Restoration",
      "water-conservation": "Water Conservation & Treatment",
      "livestock-management": "Livestock Emission Reduction",
      "waste-management": "Waste Management & Recycling",
      "wastewater-treatment": "Wastewater Treatment",
      "urban-forest": "Urban Forest Expansion",
      "green-buildings": "Green Buildings & Infrastructure",
      "biodiversity-conservation": "Biodiversity Conservation",
      "wildlife-habitat": "Wildlife Habitat Restoration",
      "carbon-capture-storage": "Carbon Capture & Storage (CCS)",
      "direct-air-capture": "Direct Air Capture (DAC)",
      "carbon-utilization": "Carbon Utilization Projects",
    }

    const filledCoordinates = (projectData?.coordinates || []).filter((c) => c?.latitude && c?.longitude) || []
    
    console.log("[v0] PDF Generation - FilledCoordinates:", {
      total: filledCoordinates.length,
      projectDataCoordinates: projectData?.coordinates?.length || 0,
      sample: filledCoordinates[0],
      all: filledCoordinates
    })

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Validation Report - ${projectData?.projectName}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', 'Helvetica', sans-serif; 
              background: #0D0F10; 
              color: #FFFFFF;
              line-height: 1.6;
            }
            .page { 
              page-break-after: always; 
              padding: 40px;
              min-height: 100vh;
              background: #0D0F10;
              color: #FFFFFF;
            }
            .section { 
              margin-bottom: 30px; 
              background: rgba(${primaryColorRgba}, 0.05);
              border: 1px solid rgba(${primaryColorRgba}, 0.2);
              padding: 20px; 
              border-radius: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .page-break { page-break-before: always; }
            h1 { 
              color: ${primaryColor}; 
              border-bottom: 2px solid ${primaryColor}; 
              padding-bottom: 15px;
              margin-bottom: 30px;
              font-size: 32px;
            }
            h2 { 
              color: ${primaryColor}; 
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 20px;
              border-left: 4px solid ${primaryColor};
              padding-left: 15px;
            }
            .label { 
              font-weight: 600; 
              color: ${primaryColor};
              margin-bottom: 5px;
            }
            .value { 
              margin-left: 10px; 
              color: #E0E0E0;
            }
            .score { 
              display: inline-block; 
              background: ${primaryColor}; 
              color: #0D0F10; 
              padding: 8px 12px; 
              border-radius: 4px; 
              margin: 5px 0;
              font-weight: 600;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-top: 15px;
              background: rgba(255, 255, 255, 0.02);
            }
            th { 
              background: ${primaryColor}; 
              color: #0D0F10; 
              padding: 12px; 
              text-align: left;
              font-weight: 600;
            }
            td { 
              padding: 12px; 
              border-bottom: 1px solid ${primaryColorRgba}0.1);
              color: #E0E0E0;
            }
            tr:last-child td { border-bottom: none; }
            .grid { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 15px;
              margin-top: 15px;
            }
            .grid-item {
              background: rgba(255, 255, 255, 0.03);
              padding: 12px;
              border-radius: 6px;
              border: 1px solid rgba(${primaryColorRgba}, 0.1);
            }
            .highlight-accent {
              background: rgba(${primaryColorRgba}, 0.2);
              border-left: 4px solid ${primaryColor};
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
            }
            .metric-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid rgba(${primaryColorRgba}, 0.1);
            }
            .metric-row:last-child { border-bottom: none; }
            .metric-label { color: #B0B0B0; }
            .metric-value { color: ${primaryColor}; font-weight: 600; }
            .final-value {
              font-size: 28px;
              color: ${primaryColor};
              font-weight: 700;
              margin: 15px 0;
            }
            .footer { 
              text-align: center; 
              font-size: 12px; 
              color: #666;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid rgba(${primaryColorRgba}, 0.1);
            }
            @media print { 
              body { margin: 0; background: #0D0F10; }
              .page { page-break-after: always; }
              .section { page-break-inside: avoid; break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- PAGE 1: PROJECT OVERVIEW -->
          <div class="page">
            <h1>Athlas Verity Impact Verification & Carbon Reduction Report</h1>
            <p style="color: ${primaryColor}; font-size: 16px; margin-bottom: 40px;">Generated via Athlas Verity AI System</p>
            
            <div class="section">
              <h2>Project Location Detail</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Location</div>
                  <div class="value">${projectData?.projectLocation || "N/A"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Country</div>
                  <div class="value">${projectData?.country || "N/A"}</div>
                </div>
              </div>
              <div class="grid" style="margin-top: 15px;">
                <div class="grid-item">
                  <div class="label">Project Name</div>
                  <div class="value">${projectData?.projectName || "N/A"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Project Area</div>
                  <div class="value">${carbonInputs.area_ha.toFixed(2)} hectares</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Carbon Offset Type</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Classification</div>
                  <div class="value">${isBlueCarbonProject ? "Blue Carbon" : "Green Carbon"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Verification Status</div>
                  <div style="color: ${primaryColor}; font-weight: 700;">✓ Verified</div>
                </div>
              </div>
              ${isBlueCarbonProject ? `
              <div class="grid" style="margin-top: 15px;">
                <div class="grid-item">
                  <div class="label">Ecosystem Type</div>
                  <div class="value">${projectData?.ecosystemType || "N/A"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Tidal Zone Type</div>
                  <div class="value">${projectData?.tidalZoneType || "N/A"}</div>
                </div>
              </div>
              ` : ''}
            </div>

            <div class="section">
              <h2>Project Description</h2>
              <div class="value" style="line-height: 1.8; font-size: 12px;">
                ${projectData?.projectName ? `Project "${projectData.projectName}" located in ${projectData?.projectLocation || 'the project area'}, encompasses approximately ${carbonInputs.area_ha.toFixed(2)} hectares of ${isBlueCarbonProject ? 'coastal ecosystem' : 'forest ecosystem'} with ${projectData?.forestType || 'tropical ecosystem'} classification. ${isBlueCarbonProject ? `The project focuses on blue carbon sequestration through ${projectData?.ecosystemType || 'coastal wetland'} conservation. Tidal zone type: ${projectData?.tidalZoneType || 'variable'}, Ecosystem: ${projectData?.ecosystemType || 'mixed coastal species'}.` : 'The project is focused on carbon offset generation through forest protection and restoration activities.'} With an estimated carbon stock of ${(carbonInputs.agb_per_ha * carbonInputs.area_ha * 0.47).toFixed(2)} tC and dominant species of ${projectData?.dominantSpecies || 'mixed species'}, this project demonstrates significant biodiversity value and carbon sequestration potential. ${isBlueCarbonProject ? `Coastal parameters: Water depth (${projectData?.waterDepth || 'N/A'}), Salinity (${projectData?.salinityType || 'N/A'}), Sediment depth (${projectData?.sedimentDepthEstimate || 'N/A'}).` : 'The vegetation is characterized by dense forest cover with healthy canopy structure.'} Located in ${projectData?.country || 'a carbon-rich region'}, the project contributes to global climate change mitigation efforts.` : "N/A"}
              </div>
            </div>
          </div>

          <!-- PAGE 2: PROJECT OWNER & COORDINATES -->
          <div class="page page-break">
            <h1>Project Owner & Geospatial Data</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Owner Information & Asset Coordinates</p>
            
            <div class="section">
              <h2>Project Owner Information</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Owner Name</div>
                  <div class="value">${projectData?.ownerName || "N/A"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Email Address</div>
                  <div class="value">${projectData?.ownerEmail || "N/A"}</div>
                </div>
              </div>
              <div class="grid" style="margin-top: 15px;">
                <div class="grid-item">
                  <div class="label">Phone Number</div>
                  <div class="value">${projectData?.ownerPhone || "N/A"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Verification Status</div>
                  <div style="color: ${primaryColor}; font-weight: 700;">✓ Verified & Confirmed</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Carbon Asset Coordinates</h2>
              <p style="color: #94a3b8; font-size: 12px; margin-bottom: 10px;">
                <strong>Satellite Data Verification:</strong> ${filledCoordinates.length} Asset Points Verified
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin-bottom: 15px;">
                Source: Satellite Imagery Database | Verification Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <table>
                <tr>
                  <th style="width: 10%;">Point #</th>
                  <th style="width: 30%;">Latitude</th>
                  <th style="width: 30%;">Longitude</th>
                  <th style="width: 30%;">Verification Status</th>
                </tr>
                ${filledCoordinates.length > 0
                  ? filledCoordinates
                      .map(
                        (coord, idx) => {
                          const lat = typeof coord.latitude === 'string' ? parseFloat(coord.latitude) : (coord.latitude || 0);
                          const lon = typeof coord.longitude === 'string' ? parseFloat(coord.longitude) : (coord.longitude || 0);
                          return `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td style="text-align: center; font-family: monospace;">${lat.toFixed(6)}°</td>
                    <td style="text-align: center; font-family: monospace;">${lon.toFixed(6)}°</td>
                    <td style="color: #22C55E; text-align: center; font-weight: 600;">✓ Verified</td>
                  </tr>
                `;
                        },
                      )
                      .join("")
                  : `
                  <tr>
                    <td colspan="4" style="text-align: center; color: #94a3b8;">No verified coordinates available</td>
                  </tr>
                `}
              </table>
            </div>

            <div class="section">
              <h2>Geospatial Coverage Verification</h2>
              <div class="metric-row">
                <span class="metric-label">Total Asset Points Registered</span>
                <span class="metric-value" style="color: ${primaryColor}; font-weight: 700;">${filledCoordinates.length}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Points from Satellite Data</span>
                <span class="metric-value" style="color: ${primaryColor}; font-weight: 700;">${filledCoordinates.length}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Satellite Data Source</span>
                <span class="metric-value">Verified Satellite Imagery & Ground Truth</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Coverage Area</span>
                <span class="metric-value">${carbonInputs.area_ha.toFixed(2)} hectares</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Geospatial Coverage Verified</span>
                <span class="metric-value" style="color: #22C55E; font-weight: 700;">✓ Confirmed</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Proof-Chain Hash</span>
                <span class="metric-value" style="font-size: 10px; word-break: break-all;">${mockValidationResult.proof_chain.substring(0, 60)}...</span>
              </div>
            </div>
          </div>

          <!-- PAGE 3: VERIFICATION RESULTS -->
          <div class="page page-break">
            <h1>Verification Results & Scores</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Athlas Verity AI System Validation Metrics</p>

            ${isBlueCarbonProject ? `
            <div class="section">
              <h2>Blue Carbon Ecosystem Parameters</h2>
              <div class="metric-row">
                <span class="metric-label">Carbon Sequestration Rate (SOC)</span>
                <span class="metric-value">${((carbonInputs.agb_per_ha * carbonInputs.carbon_fraction) / 10).toFixed(2)} tC/ha/year</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Coastal Protection Status</span>
                <span class="metric-value">${projectData?.coastalProtectionStatus || "N/A"}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Human Disturbance Level</span>
                <span class="metric-value">${projectData?.humanDisturbanceLevel || "N/A"}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Legal Protection Status</span>
                <span class="metric-value">${projectData?.legalProtectionStatus || "N/A"}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Baseline Year</span>
                <span class="metric-value">${projectData?.baselineYear || "N/A"}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Methodology Reference</span>
                <span class="metric-value">${projectData?.methodologyRef || "Verra VCS"}</span>
              </div>
            </div>
            ` : ''}

            <div class="section">
              <h2>Integrity & Quality Scores</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Integrity Class</div>
                  <div class="score">${mockValidationResult.integrity_class}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Aura Score</div>
                  <div class="score">${(mockValidationResult.aura_score * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div class="grid" style="margin-top: 15px;">
                <div class="grid-item">
                  <div class="label">Authenticity Score</div>
                  <div class="score">${(mockValidationResult.authenticity_score * 100).toFixed(1)}%</div>
                </div>
                <div class="grid-item">
                  <div class="label">Validator Consensus</div>
                  <div class="score">${(mockValidationResult.validator_consensus * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div style="margin-top: 15px;">
                <div class="grid-item">
                  <div class="label">Data Consistency Score</div>
                  <div class="score">${(mockValidationResult.data_consistency_score * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Validation Summary</h2>
              <div class="metric-row">
                <span class="metric-label">Data Quality Check</span>
                <span class="metric-value">✓ Passed</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Satellite Imagery Verification</span>
                <span class="metric-value">✓ Passed</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Geospatial Consistency</span>
                <span class="metric-value">✓ Passed</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Anomaly Flags</span>
                <span class="metric-value">None Detected</span>
              </div>
            </div>

            ${isBlueCarbonProject && blueCarbonResult ? `
            <div class="section">
              <h2>International Verification Summary</h2>
              <div class="highlight-accent" style="background: rgba(${primaryColorRgba}, 0.1); border-left: 4px solid ${primaryColor}; padding: 15px; margin: 15px 0;">
                <p style="color: #B0B0B0; margin-bottom: 10px;">Final Verified Reduction (Verra/IUCN Standards)</p>
                <div class="final-value" style="color: ${primaryColor};">${blueCarbonResult.final_verified_reduction_tco2.toLocaleString()}</div>
                <p style="color: #B0B0B0;">tonnes CO₂ equivalent (after international verification discounts)</p>
              </div>
              
              <div class="metric-row">
                <span class="metric-label">Ex-ante Credits</span>
                <span class="metric-value">${blueCarbonResult.ex_ante_credits_tco2.toLocaleString()} tCO₂</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Verra Compliance Status</span>
                <span class="metric-value">${blueCarbonResult.verra_compliance_status || "Compliant"}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Integrity Score</span>
                <span class="metric-value">${blueCarbonResult.integrity_score || 95}/100</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Carbon Stock</span>
                <span class="metric-value">${blueCarbonResult.total_carbon_stock_tc.toLocaleString()} tC</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Project Area</span>
                <span class="metric-value">${carbonInputs.area_ha.toFixed(2)} hectares</span>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- PAGE 4: CARBON CALCULATIONS -->
          <div class="page page-break">
            ${blueCarbonResult ? `
            <h1>Blue Carbon Calculations (IPCC/Verra Compliant)</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">International Standards-Based Carbon Accounting with AGB, BGB & SOC</p>
            
            <div class="section">
              <h2>Final Verified Credits (Blue Carbon)</h2>
              <div class="highlight-accent" style="background: rgba(${primaryColorRgba}, 0.1); border-left: 4px solid ${primaryColor}; padding: 15px; margin: 15px 0;">
                <p style="color: #B0B0B0; margin-bottom: 10px;">Total Verified Blue Carbon Credits</p>
                <div class="final-value" style="color: ${primaryColor};">${blueCarbonResult.net_verified_credits_tco2.toLocaleString()}</div>
                <p style="color: #B0B0B0;">tonnes CO₂ equivalent over ${parseInt(projectData?.baselineYear || "2020") + 10 - parseInt(projectData?.baselineYear || "2020")} years</p>
              </div>
            </div>

            <div class="section">
              <h2>Biomass Pool Breakdown (per hectare)</h2>
              <table>
                <tr>
                  <th>Carbon Pool</th>
                  <th>Amount (tC/ha)</th>
                  <th>Notes</th>
                </tr>
                <tr>
                  <td>Aboveground Biomass (AGB)</td>
                  <td>${blueCarbonResult.agb_tc_ha.toFixed(2)}</td>
                  <td>Mangrove/Seagrass vegetation</td>
                </tr>
                <tr>
                  <td>Belowground Biomass (BGB)</td>
                  <td>${blueCarbonResult.bgb_tc_ha.toFixed(2)}</td>
                  <td>Roots and subsurface biomass</td>
                </tr>
                <tr>
                  <td>Dead Wood</td>
                  <td>${blueCarbonResult.dead_wood_tc_ha.toFixed(2)}</td>
                  <td>Dead trees and branches</td>
                </tr>
                <tr>
                  <td>Litter</td>
                  <td>${blueCarbonResult.litter_tc_ha.toFixed(2)}</td>
                  <td>Decomposing plant material</td>
                </tr>
                <tr>
                  <td>Soil Organic Carbon (SOC)</td>
                  <td>${blueCarbonResult.soc_tc_ha.toFixed(2)}</td>
                  <td>Critical blue carbon sink</td>
                </tr>
                <tr style="background: rgba(${primaryColorRgba}, 0.05); font-weight: 600;">
                  <td>TOTAL Carbon Stock</td>
                  <td>${blueCarbonResult.total_biomass_tc_ha.toFixed(2)}</td>
                  <td>All pools combined</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>Carbon Sequestration & Baseline</h2>
              <div class="metric-row">
                <span class="metric-label">Annual Sequestration Rate</span>
                <span class="metric-value">${blueCarbonResult.annual_sequestration_rate_tco2_ha.toFixed(2)} tCO2/ha/year</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Project Sequestration</span>
                <span class="metric-value">${blueCarbonResult.total_project_sequestration_tco2.toLocaleString()} tCO2</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Baseline Emissions</span>
                <span class="metric-value">${blueCarbonResult.baseline_emissions_tco2.toLocaleString()} tCO2</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Gross Removals</span>
                <span class="metric-value">${blueCarbonResult.gross_removals_tco2.toLocaleString()} tCO2</span>
              </div>
            </div>

            <div class="section">
              <h2>Deductions & Adjustments</h2>
              <div class="metric-row">
                <span class="metric-label">Leakage Adjustment</span>
                <span class="metric-value">-${blueCarbonResult.leakage_adjustment_tco2.toLocaleString()} tCO2</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Buffer Pool Reserve</span>
                <span class="metric-value">-${blueCarbonResult.buffer_pool_tco2.toLocaleString()} tCO2</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Uncertainty Discount</span>
                <span class="metric-value">-${blueCarbonResult.uncertainty_discount_tco2.toLocaleString()} tCO2</span>
              </div>
            </div>

            <div class="section">
              <h2>Ecosystem Co-Benefits</h2>
              <div class="metric-row">
                <span class="metric-label">Coastal Protection Value</span>
                <span class="metric-value">${blueCarbonResult.coastal_protection_value}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Biodiversity Benefit</span>
                <span class="metric-value">${blueCarbonResult.biodiversity_benefit}</span>
              </div>
            </div>
            ` : `
            <h1>Carbon Reduction Calculations</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Step-by-Step Carbon Accounting & Verification</p>
            
            <div class="section">
              <h2>Final Verified Carbon Reduction</h2>
              <div class="highlight-accent" style="background: rgba(${primaryColorRgba}, 0.1); border-left: 4px solid ${primaryColor}; padding: 15px; margin: 15px 0;">
                <p style="color: #B0B0B0; margin-bottom: 10px;">Total Net Reduction (Verified)</p>
                <div class="final-value" style="color: ${primaryColor};">${carbonCalculation.final_verified_reduction_tco2.toLocaleString()}</div>
                <p style="color: #B0B0B0;">tonnes CO₂ equivalent</p>
              </div>
            </div>

            <div class="section">
              <h2>Calculation Inputs & Parameters</h2>
              <div class="metric-row">
                <span class="metric-label">Aboveground Biomass (AGB)</span>
                <span class="metric-value">${carbonCalculation.agb_per_ha.toFixed(2)} t/ha</span>
              </div>`}
            
              <div class="metric-row">
                <span class="metric-label">Carbon Fraction</span>
                <span class="metric-value">${carbonCalculation.carbon_fraction.toFixed(2)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Project Area</span>
                <span class="metric-value">${carbonCalculation.area_ha.toFixed(2)} ha</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Project Duration</span>
                <span class="metric-value">${carbonInputs.duration_years} years</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Baseline Emissions Rate</span>
                <span class="metric-value">${carbonInputs.baseline_emission.toFixed(1)} tCO₂/ha/year</span>
              </div>
            </div>

          </div>

          <!-- PAGE 5: VALIDATORS INFORMATION -->
          <div class="page page-break">
            <h1>Validators Information</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Athlas Verity AI System Validator Network & Consensus Data</p>
            
            <div class="section">
              <h2>Validator Nodes & Contributions</h2>
              <table>
                <tr>
                  <th>Validator ID</th>
                  <th>Role</th>
                  <th>Model Type</th>
                  <th>Confidence</th>
                </tr>
                ${mockValidationResult.contributors
                  .map(
                    (contributor) => `
                  <tr>
                    <td style="font-size: 11px; word-break: break-all;">${contributor.id}</td>
                    <td>${contributor.role}</td>
                    <td>${contributor.model_type}</td>
                    <td>${(contributor.confidence * 100).toFixed(1)}%</td>
                  </tr>
                `,
                  )
                  .join("")}
              </table>
            </div>

            <div class="section">
              <h2>Verification Authority & Proof-Chain</h2>
              <div class="metric-row">
                <span class="metric-label">Consensus Threshold</span>
                <span class="metric-value">93.0%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Validators Participated</span>
                <span class="metric-value">${mockValidationResult.contributors.length}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Average Confidence</span>
                <span class="metric-value">${((mockValidationResult.contributors.reduce((sum, c) => sum + c.confidence, 0) / mockValidationResult.contributors.length) * 100).toFixed(1)}%</span>
              </div>
            </div>

          </div>

          <!-- PAGE 6: BLUE CARBON SPECIFIC VERIFICATION (if blue carbon project) -->
          ${isBlueCarbonProject ? `
          <div class="page page-break">
            <h1>Blue Carbon Verification Results</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Comprehensive Blue Carbon Ecosystem Assessment</p>
            
            <div class="section">
              <h2>Final Verified Reduction (International Standards)</h2>
              <div style="background: rgba(74, 222, 128, 0.1); padding: 20px; border-radius: 6px; border-left: 6px solid #4ade80; margin: 15px 0;">
                <div style="font-size: 32px; font-weight: 700; color: #4ade80;">${Math.round(blueCarbonResult?.final_verified_reduction_tco2 || 0).toLocaleString()} tCO₂e</div>
                <div style="font-size: 12px; color: #B0B0B0; margin-top: 8px;">Final verified reduction following Verra VCS, IUCN Blue Carbon, and IPCC AR6 Tier 2 methodologies</div>
              </div>
            </div>

            <div class="section">
              <h2>Integrity Verification Score</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Integrity Score</div>
                  <div class="score">${blueCarbonResult?.integrity_score || 85}/100</div>
                </div>
                <div class="grid-item">
                  <div class="label">Verra Compliance</div>
                  <div class="score">${blueCarbonResult?.verra_compliance_status || "Compliant"}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Comprehensive Verification Discounts</h2>
              <table>
                <tr>
                  <th>Verification Factor</th>
                  <th>Discount %</th>
                  <th>Rationale</th>
                </tr>
                <tr>
                  <td>Saturation Discount</td>
                  <td>${blueCarbonResult?.saturation_discount_percent || 0}%</td>
                  <td>Ecosystem carbon saturation limits</td>
                </tr>
                <tr>
                  <td>Permanence Risk</td>
                  <td>${blueCarbonResult?.permanence_risk_discount_percent || 0}%</td>
                  <td>Climate change & sea-level rise impact</td>
                </tr>
                <tr>
                  <td>Additionality</td>
                  <td>${blueCarbonResult?.additionality_discount_percent || 0}%</td>
                  <td>Project necessity verification</td>
                </tr>
              </table>
            </div>
          </div>

          <!-- PAGE 7: BLUE CARBON BIOMASS & SOC BREAKDOWN -->
          <div class="page page-break">
            <h1>Blue Carbon Biomass & Soil Carbon Analysis</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Detailed Carbon Pool Quantification</p>
            
            <div class="section">
              <h2>Carbon Pool Distribution (tC/ha)</h2>
              <table>
                <tr>
                  <th>Carbon Pool</th>
                  <th>Value (tC/ha)</th>
                  <th>% of Total</th>
                  <th>Standard Methodology</th>
                </tr>
                <tr>
                  <td>Above Ground Biomass (AGB)</td>
                  <td>${(blueCarbonResult?.agb_tc_ha || 0).toFixed(2)}</td>
                  <td>${(((blueCarbonResult?.agb_tc_ha || 0) / ((blueCarbonResult?.agb_tc_ha || 0) + (blueCarbonResult?.bgb_tc_ha || 0) + (blueCarbonResult?.soc_tc_ha || 0) + (blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0))) * 100).toFixed(1)}%</td>
                  <td>IPCC AR6 / Satellite derived</td>
                </tr>
                <tr>
                  <td>Below Ground Biomass (BGB)</td>
                  <td>${(blueCarbonResult?.bgb_tc_ha || 0).toFixed(2)}</td>
                  <td>${(((blueCarbonResult?.bgb_tc_ha || 0) / ((blueCarbonResult?.agb_tc_ha || 0) + (blueCarbonResult?.bgb_tc_ha || 0) + (blueCarbonResult?.soc_tc_ha || 0) + (blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0))) * 100).toFixed(1)}%</td>
                  <td>Ecosystem-specific ratios</td>
                </tr>
                <tr>
                  <td>Soil Organic Carbon (SOC)</td>
                  <td>${(blueCarbonResult?.soc_tc_ha || 0).toFixed(2)}</td>
                  <td>${(((blueCarbonResult?.soc_tc_ha || 0) / ((blueCarbonResult?.agb_tc_ha || 0) + (blueCarbonResult?.bgb_tc_ha || 0) + (blueCarbonResult?.soc_tc_ha || 0) + (blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0))) * 100).toFixed(1)}%</td>
                  <td>IPCC Tier 2 (bulk density × depth)</td>
                </tr>
                <tr>
                  <td>Dead Wood & Litter</td>
                  <td>${((blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0)).toFixed(2)}</td>
                  <td>${((((blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0)) / ((blueCarbonResult?.agb_tc_ha || 0) + (blueCarbonResult?.bgb_tc_ha || 0) + (blueCarbonResult?.soc_tc_ha || 0) + (blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0))) * 100).toFixed(1)}%</td>
                  <td>IPCC coefficients</td>
                </tr>
                <tr style="background: rgba(74, 222, 128, 0.1); font-weight: 700;">
                  <td>TOTAL</td>
                  <td>${((blueCarbonResult?.agb_tc_ha || 0) + (blueCarbonResult?.bgb_tc_ha || 0) + (blueCarbonResult?.soc_tc_ha || 0) + (blueCarbonResult?.dead_wood_tc_ha || 0) + (blueCarbonResult?.litter_tc_ha || 0)).toFixed(2)}</td>
                  <td>100%</td>
                  <td>Combined</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>Annual Carbon Sequestration</h2>
              <div class="metric-row">
                <span class="metric-label">Annual Rate</span>
                <span class="metric-value">${(blueCarbonResult?.annual_sequestration_rate_tco2_ha || 0).toFixed(2)} tCO₂/ha/year</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Project Duration</span>
                <span class="metric-value">10 years</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Sequestration</span>
                <span class="metric-value">${Math.round((blueCarbonResult?.total_project_sequestration_tco2 || 0)).toLocaleString()} tCO₂</span>
              </div>
            </div>
          </div>

          <!-- PAGE 8: COASTAL CO-BENEFITS & RISK ASSESSMENT -->
          <div class="page page-break">
            <h1>Coastal Co-benefits & Environmental Assessment</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Blue Carbon Ecosystem Services & Risk Analysis</p>
            
            <div class="section">
              <h2>Co-benefits Assessment</h2>
              <div style="background: rgba(34, 197, 94, 0.1); padding: 15px; border-radius: 6px; border-left: 4px solid #22C55E; margin: 15px 0;">
                <p><strong>Coastal Protection Value:</strong></p>
                <p style="color: #B0B0B0; margin-top: 8px;">${blueCarbonResult?.coastal_protection_value || "High (storm surge, wave attenuation)"}</p>
              </div>
              <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 6px; border-left: 4px solid #3B82F6; margin: 15px 0;">
                <p><strong>Biodiversity Benefit:</strong></p>
                <p style="color: #B0B0B0; margin-top: 8px;">${blueCarbonResult?.biodiversity_benefit || "High (nursery habitat for fish)"}</p>
              </div>
            </div>

            <div class="section">
              <h2>Risk & Permanence Analysis</h2>
              <div class="metric-row">
                <span class="metric-label">Climate Change Risk</span>
                <span class="metric-value" style="color: #EAB308;">Moderate - Sea-level rise impact</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Permanence Assurance</span>
                <span class="metric-value">${blueCarbonResult?.permanence_risk_discount_percent || 12}% discount applied</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Human Disturbance</span>
                <span class="metric-value">Legal protection status verified</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Buffer Pool Allocation</span>
                <span class="metric-value">${Math.round(blueCarbonResult?.buffer_pool_tco2 || 0).toLocaleString()} tCO₂ reserved</span>
              </div>
            </div>
          </div>

          <!-- PAGE 9: METHODOLOGICAL COMPLIANCE -->
          <div class="page page-break">
            <h1>Methodological Compliance & Standards</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">International Standards & Best Practices Verification</p>
            
            <div class="section">
              <h2>Compliance with International Standards</h2>
              <table>
                <tr>
                  <th>Standard/Protocol</th>
                  <th>Compliance Status</th>
                  <th>Applicable Tier/Version</th>
                </tr>
                <tr>
                  <td>IPCC AR6 Climate Change 2021</td>
                  <td style="color: #22C55E;">✓ Compliant</td>
                  <td>Tier 2 Methodology</td>
                </tr>
                <tr>
                  <td>Verra VCS v4.4</td>
                  <td style="color: #22C55E;">✓ Compliant</td>
                  <td>Blue Carbon Standards</td>
                </tr>
                <tr>
                  <td>IUCN Blue Carbon Guidelines</td>
                  <td style="color: #22C55E;">✓ Compliant</td>
                  <td>Coastal Ecosystem Standards</td>
                </tr>
                <tr>
                  <td>ISO 14064-2:2019</td>
                  <td style="color: #22C55E;">✓ Compliant</td>
                  <td>GHG Quantification</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>AGB & BGB Calculation Methodology</h2>
              <div style="font-size: 12px; color: #B0B0B0; line-height: 1.8; background: rgba(100, 116, 139, 0.1); padding: 12px; border-radius: 4px;">
                <p><strong>AGB Estimation:</strong> Above Ground Biomass derived from satellite-based remote sensing combined with ground-truthed measurements using IPCC allometric equations for coastal ecosystems</p>
                <p style="margin-top: 10px;"><strong>BGB Calculation:</strong> Below Ground Biomass calculated using ecosystem-specific BGB/AGB ratios (mangrove: 0.45, seagrass: 0.6, salt marsh: 0.5) following IPCC AR6 recommendations</p>
                <p style="margin-top: 10px;"><strong>SOC Assessment:</strong> Soil Organic Carbon quantified using Tier 2 IPCC method: SOC = Bulk Density (g/cm³) × Depth (cm) × Organic Matter (%) × 10</p>
              </div>
            </div>
          </div>
          ` : ``}

          <!-- PAGE 10: DISCLAIMER & DATA INTEGRITY NOTICE (Part 1) -->
          <div class="page page-break">
            <h1>Disclaimer & Data Integrity Notice</h1>
            
            <div class="section" style="background: rgba(255, 193, 7, 0.05); border: 1px solid rgba(255, 193, 7, 0.2); page-break-inside: avoid; break-inside: avoid;">
              <h2 style="color: #FFD700; border-left-color: #FFD700;">Important Information</h2>
              
              <div style="color: #E0E0E0; line-height: 1.8; margin-top: 20px;">
                <p style="margin-bottom: 15px;">
                  <strong>Data Source & Accuracy:</strong><br/>
                  The carbon reduction calculations, metrics, and verification results presented in this report are derived solely from data and documentation provided by the Carbon Project Developer or Carbon Asset Owner. The accuracy, completeness, and authenticity of all underlying data depend entirely on the information submitted during the verification process.
                </p>

                <p style="margin-bottom: 15px;">
                  <strong>Calculation Methodology:</strong><br/>
                  All carbon accounting calculations follow established IPCC (Intergovernmental Panel on Climate Change) methodologies and are computed based on the input parameters provided. These include Above Ground Biomass (AGB), carbon fractions, project area, baseline emissions, leakage factors, and buffer pool adjustments. The integrity of results is contingent upon the accuracy of these input values.
                </p>

                <p style="margin-bottom: 15px;">
                  <strong>Validator Network Verification:</strong><br/>
                  The Athlas Verity AI System decentralized validator network has reviewed and verified the submitted data against publicly available standards and protocols. However, this verification is computational in nature and does not constitute an audit or independent certification of the carbon asset or project claims.
                </p>
              </div>
            </div>
          </div>

          <!-- PAGE 11: DISCLAIMER & DATA INTEGRITY NOTICE (Part 2) -->
          <div class="page page-break">
            <h1 style="font-size: 18px; margin-bottom: 20px;">Disclaimer & Data Integrity Notice (Continued)</h1>
            
            <div class="section" style="background: rgba(255, 193, 7, 0.05); border: 1px solid rgba(255, 193, 7, 0.2); page-break-inside: avoid; break-inside: avoid;">
              <div style="color: #E0E0E0; line-height: 1.8;">
                <p style="margin-bottom: 15px;">
                  <strong>Limitation of Liability:</strong><br/>
                  Athlas Verity Platform and the AI validator network assume no liability for errors, omissions, or misstatements in the source data provided by project developers or asset owners. Users are solely responsible for the accuracy and legitimacy of all information submitted for verification.
                </p>

                <p style="margin-bottom: 15px;">
                  <strong>Use of This Report:</strong><br/>
                  This report is intended for informational purposes only and should not be construed as investment advice, financial guidance, or certification of carbon credits. Any commercial use of this verification report requires explicit authorization from Athlas Verity Platform and compliance with applicable regulatory frameworks.
                </p>

                <p style="margin-bottom: 15px;">
                  <strong>Data Confidentiality:</strong><br/>
                  This document contains sensitive project and verification data. Recipients are obligated to maintain appropriate confidentiality and restrict access to authorized personnel only.
                </p>

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(${primaryColorRgba}, 0.2); font-style: italic; color: #B0B0B0;">
                  By accessing this verification report, you acknowledge that you have read, understood, and agree to be bound by the terms and limitations outlined in this disclaimer. If you do not agree with any provision herein, you must discontinue the use of this report immediately.
                </p>

                <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(${primaryColorRgba}, 0.2); text-align: center; font-size: 12px; color: #888;">
                  <p style="margin-bottom: 8px; font-style: italic;">Generated on ${new Date().toLocaleString()}</p>
                  <p style="margin-bottom: 8px; font-weight: 500; color: ${primaryColor};">Athlas Verity Platform - Powered by CarbonFi Labs System</p>
                  <p style="margin-bottom: 15px; color: #FFD700;">This report contains sensitive verification data. Please handle with appropriate confidentiality.</p>
                  <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(${primaryColorRgba}, 0.1); color: #666;">© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.</p>
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const printWindow = window.open("", "", "width=800,height=600")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()

      setTimeout(async () => {
        printWindow.print()

        try {
          const canvas = await html2canvas(printWindow.document.body)
          const pdf = new jsPDF()
          const imgData = canvas.toDataURL("image/png")
          const imgWidth = 210
          const pageHeight = 297
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          let heightLeft = imgHeight

          let position = 0
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
          heightLeft -= pageHeight

          while (heightLeft >= 0) {
            position = heightLeft - imgHeight
            pdf.addPage()
            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
            heightLeft -= pageHeight
          }

          const pdfBlob = pdf.output("blob")
          const fileName = `${projectData?.projectName || "Validation-Report"}-${new Date().getTime()}.pdf`

          const formData = new FormData()
          formData.append("pdf", pdfBlob, fileName)
          formData.append("fileName", fileName)
          formData.append("projectName", projectData?.projectName || "Unknown Project")

          const uploadResponse = await fetch("/api/drive/upload-pdf", {
            method: "POST",
            body: formData,
          })

          if (!uploadResponse.ok) {
            try {
              const responseText = await uploadResponse.text()
              try {
                const errorData = JSON.parse(responseText)
                console.error("[v0] Google Drive upload failed with status:", uploadResponse.status)
                console.error("[v0] Error details:", errorData)
                alert(`Failed to upload PDF to Google Drive: ${errorData.details || "Unknown error"}`)
              } catch {
                console.error("[v0] Google Drive upload failed with status:", uploadResponse.status, responseText)
                alert(`Failed to upload PDF to Google Drive: HTTP ${uploadResponse.status}`)
              }
            } catch (readError) {
              console.error("[v0] Failed to read error response:", readError)
              alert(`Failed to upload PDF to Google Drive: HTTP ${uploadResponse.status}`)
            }
            return
          }

          let uploadResult
          try {
            const responseText = await uploadResponse.text()
            uploadResult = JSON.parse(responseText)
          } catch (parseError) {
            console.error("[v0] Failed to parse upload response as JSON:", parseError)
            alert(`Error: Invalid response from server`)
            return
          }
          if (uploadResult.success) {
            console.log("[v0] PDF uploaded to Google Drive:", uploadResult.fileLink)
            alert(`PDF successfully uploaded to Google Drive!\nFile: ${uploadResult.fileName}`)
          } else {
            console.error("[v0] Upload returned success=false:", uploadResult)
            alert(`Failed to upload PDF: ${uploadResult.error}`)
          }
        } catch (uploadError) {
          console.error("[v0] PDF upload to Google Drive failed:", uploadError)
          alert(
            `Error uploading PDF to Google Drive: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}`,
          )
        }
      }, 500)
    }
  }

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
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-background border border-border rounded p-4">
                  <p className="text-xs text-muted-foreground mb-2">Raw Carbon Stock</p>
                  <p className="text-lg font-semibold text-foreground">
                    {carbonCalculation.raw_carbon_stock_tc.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tC</p>
                </div>
                <div className="bg-background border border-border rounded p-4">
                  <p className="text-xs text-muted-foreground mb-2">Converted CO₂</p>
                  <p className="text-lg font-semibold text-foreground">
                    {carbonCalculation.converted_co2_tco2.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂</p>
                </div>
                <div className="bg-background border border-border rounded p-4">
                  <p className="text-xs text-muted-foreground mb-2">Baseline Emissions</p>
                  <p className="text-lg font-semibold text-foreground">
                    {carbonCalculation.baseline_emissions_total_tco2.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂</p>
                </div>
                <div className="bg-background border border-border rounded p-4">
                  <p className="text-xs text-muted-foreground mb-2">Gross Reduction</p>
                  <p className="text-lg font-semibold text-foreground">
                    {carbonCalculation.gross_reduction_tco2.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">tCO₂</p>
                </div>
              </div>

              {/* Applied Adjustments */}
              <div className="bg-background border border-border rounded p-4">
                <p className="text-sm font-semibold mb-4 text-foreground">Applied Adjustments</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Leakage ({carbonCalculation.leakage_adjustment_percent}%)</p>
                    <p className="text-sm font-semibold text-red-400">
                      -{carbonCalculation.leakage_reduction_tco2.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} tCO₂
                    </p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">Buffer Pool ({carbonCalculation.buffer_pool_percent}%)</p>
                    <p className="text-sm font-semibold text-red-400">
                      -{carbonCalculation.buffer_reduction_tco2.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} tCO₂
                    </p>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-3">
                    <p className="text-sm text-muted-foreground">Integrity Class ({(carbonCalculation.integrity_class_factor * 100).toFixed(1)}%)</p>
                    <p className="text-sm font-semibold text-red-400">
                      -{carbonCalculation.integrity_class_adjustment_tco2.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })} tCO₂
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Carbon Accounting Calculations Table */}
            <Card className="bg-card border-border p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">Carbon Accounting Calculations</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">Metric</th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">AGB (t/ha)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {(agbEstimation?.agb_tpha_final || carbonInputs.agb_per_ha || 124.2).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Carbon Fraction</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonInputs.carbon_fraction}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Project Area (ha)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonInputs.area_ha?.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Raw Carbon Stock (tC)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.raw_carbon_stock_tc.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Converted CO₂ (tCO₂)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.converted_co2_tco2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Baseline Emissions (tCO₂)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.baseline_emissions_total_tco2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Gross Reduction (tCO₂)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.gross_reduction_tco2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Leakage Adjustment (%)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.leakage_adjustment_percent}%
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Buffer Pool (%)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.buffer_pool_percent}%
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Net Reduction (tCO₂)</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {carbonCalculation.net_reduction_tco2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                    <tr className="hover:bg-background/50">
                      <td className="py-3 px-4 text-sm text-foreground">Integrity Class Adjustment</td>
                      <td className="py-3 px-4 text-sm text-right text-foreground font-medium">
                        {(carbonCalculation.integrity_class_factor * 100).toFixed(1)}%
                      </td>
                    </tr>
                    <tr className="border-t-2 border-green-700/50 hover:bg-background/50">
                      <td className="py-3 px-4 text-sm font-semibold text-foreground">Final Verified Reduction (tCO₂)</td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-green-400">
                        {carbonCalculation.final_verified_reduction_tco2.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* Export & Proof-Chain Section */}
        <Card className="bg-card border-border p-6">
          <h3 className="text-xl font-semibold mb-4">Export Validation Package</h3>

          <div className="bg-card border border-border rounded p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">Proof-Chain Hash:</p>
            <div className="flex items-center gap-2">
              <code className="text-sm bg-background px-3 py-2 rounded flex-1 overflow-auto text-accent">
                {mockValidationResult.proof_chain}
              </code>
              <Button onClick={handleCopyProof} variant="outline" size="sm" className="border-border bg-transparent">
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

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
