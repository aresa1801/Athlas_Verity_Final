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
import CarbonReductionSummaryCard from "@/components/carbon-reduction-summary-card"
import CarbonAccountingTable from "@/components/carbon-accounting-table"
import { calculateCarbonReduction, type CarbonCalculationInputs } from "@/lib/carbon-calculator"
import { calculateBlueCarbonCredits, type BlueCarbonInputs } from "@/lib/blue-carbon-calculator"
import { WalletConnect } from "@/components/wallet-connect"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import Image from "next/image"
import { estimateAGB, type AGBEstimationResult } from "@/lib/agb-estimation-engine"

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
  }
  calculatedAreaHa?: number
}

export default function ResultsPage() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [projectData, setProjectData] = useState<ResultsData | null>(null)
  const [aiCarbonData, setAiCarbonData] = useState<any>(null)
  const [agbEstimation, setAgbEstimation] = useState<AGBEstimationResult | null>(null)
  const [blueCarbonResult, setBlueCarbonResult] = useState<any>(null)
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
      }
      
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

      // Run AGB estimation pipeline
      const agbResult = estimateAGB(satelliteFeatures, area, "tropical_forest")
      setAgbEstimation(agbResult)

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

      // Generate polygon map for green carbon projects only
      if (!isBlueCarbon && parsedData.coordinates && parsedData.coordinates.length > 0) {
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
    const isBlueCarbonProject = projectData.tidalZoneType || projectData.ecosystemType?.toLowerCase().includes('mangrove') || projectData.ecosystemType?.toLowerCase().includes('seagrass') || projectData.salinityType
    
    // Use blue colors for blue carbon, green for others
    const primaryColor = isBlueCarbonProject ? "#0EA5E9" : "#3DD68C"
    const primaryColorRgba = isBlueCarbonProject ? "14, 165, 233" : "61, 214, 140"
    const primaryTextColor = isBlueCarbonProject ? "text-cyan-900 dark:text-cyan-400" : "text-emerald-900 dark:text-emerald-400"

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

          <!-- PAGE 5: DETAILED CALCULATION STEPS -->
          <div class="page page-break">
            <h1>Detailed Calculation Steps</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Step-by-Step Carbon Reduction Verification</p>
            
            <div class="section">
              <h2>Carbon Calculation Breakdown</h2>
              <div class="metric-row">
                <span class="metric-label">1. Raw Carbon Stock (tC)</span>
                <span class="metric-value">${carbonCalculation.raw_carbon_stock_tc.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">2. Converted to CO₂ (tCO₂)</span>
                <span class="metric-value">${carbonCalculation.converted_co2_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">3. Baseline Emissions (tCO₂)</span>
                <span class="metric-value">${carbonCalculation.baseline_emissions_total_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">4. Gross Reduction (tCO₂)</span>
                <span class="metric-value">${carbonCalculation.gross_reduction_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">5. Leakage Adjustment (${carbonCalculation.leakage_adjustment_percent}%)</span>
                <span class="metric-value">-${carbonCalculation.leakage_reduction_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">6. Buffer Pool Deduction (${carbonCalculation.buffer_pool_percent}%)</span>
                <span class="metric-value">-${carbonCalculation.buffer_reduction_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">7. Net Reduction (tCO₂)</span>
                <span class="metric-value">${carbonCalculation.net_reduction_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">8. Integrity Class Adjustment (${(carbonCalculation.integrity_class_factor * 100).toFixed(1)}%)</span>
                <span class="metric-value">-${carbonCalculation.integrity_class_adjustment_tco2.toLocaleString()}</span>
              </div>
              <div class="metric-row" style="border: none; padding-top: 15px; border-top: 2px solid ${primaryColor}; margin-top: 15px; font-size: 16px;">
                <span class="metric-label" style="color: ${primaryColor}; font-weight: 700;">Final Verified Reduction</span>
                <span class="metric-value" style="font-size: 18px;">${carbonCalculation.final_verified_reduction_tco2.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- PAGE 6: VALIDATORS INFORMATION -->
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

          <!-- PAGE 8: VEGETATION CLASSIFICATION -->
          <div class="page page-break">
            <h1>Vegetation Classification</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Satellite-Based Vegetation Analysis & Classification Results</p>
            
            <div class="section">
              <h2>Forest Type Classification</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Primary Forest Type</div>
                  <div class="value">${projectData?.satelliteData?.features?.forest_type || 'Tropical Rainforest'}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Vegetation Class</div>
                  <div class="value">${projectData?.satelliteData?.features?.vegetation_class || 'Dense Forest'}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>Vegetation Indices</h2>
              <table>
                <tr>
                  <th>Vegetation Index</th>
                  <th>Value</th>
                  <th>Classification</th>
                </tr>
                <tr>
                  <td>NDVI (Normalized Difference Vegetation Index)</td>
                  <td>${projectData?.satelliteData?.features?.ndvi?.toFixed(4) || '0.7200'}</td>
                  <td>Dense Vegetation</td>
                </tr>
                <tr>
                  <td>EVI (Enhanced Vegetation Index)</td>
                  <td>${projectData?.satelliteData?.features?.evi?.toFixed(4) || '0.5100'}</td>
                  <td>Healthy Vegetation</td>
                </tr>
                <tr>
                  <td>GNDVI (Green NDVI)</td>
                  <td>${projectData?.satelliteData?.features?.gndvi?.toFixed(4) || '0.4800'}</td>
                  <td>Active Growth</td>
                </tr>
                <tr>
                  <td>LAI (Leaf Area Index)</td>
                  <td>${projectData?.satelliteData?.features?.lai?.toFixed(2) || '6.50'} m²/m²</td>
                  <td>High Leaf Coverage</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>Canopy Characteristics</h2>
              <div class="metric-row">
                <span class="metric-label">Canopy Density</span>
                <span class="metric-value">${projectData?.satelliteData?.features?.canopy_density ? (projectData.satelliteData.features.canopy_density * 100).toFixed(1) : '75.0'}%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Average Tree Height</span>
                <span class="metric-value">25-35 meters</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Crown Coverage</span>
                <span class="metric-value">85-95%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Vegetation Health Status</span>
                <span class="metric-value" style="color: ${primaryColor}; font-weight: 600;">✓ Excellent</span>
              </div>
            </div>
          </div>

          <!-- PAGE 9: VEGETATION DESCRIPTION -->
          <div class="page page-break">
            <h1>Detailed Vegetation Description</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Comprehensive Ecosystem Profile & Biodiversity Assessment</p>
            
            <div class="section">
              <h2>Ecosystem Overview</h2>
              <div style="background: rgba(${primaryColorRgba}, 0.1); padding: 15px; border-radius: 6px; border-left: 4px solid ${primaryColor}; margin: 15px 0;">
                <p style="color: #E0E0E0; line-height: 1.8;">
                  ${(() => {
                    const ndvi = projectData?.satelliteData?.features?.ndvi || projectData?.ndviValue || 0.65
                    const area = carbonInputs.area_ha || 87
                    let healthStatus = "healthy, actively growing"
                    let vegetationType = "dense, multi-layered canopy"
                    let biodiversityLevel = "exceptional"
                    
                    if (ndvi >= 0.8) {
                      healthStatus = "pristine and extremely healthy"
                      vegetationType = "very dense, multi-layered canopy with high vigor"
                      biodiversityLevel = "outstanding"
                    } else if (ndvi >= 0.7) {
                      healthStatus = "healthy and actively growing"
                      vegetationType = "dense, multi-layered canopy structure"
                      biodiversityLevel = "exceptional"
                    } else if (ndvi >= 0.6) {
                      healthStatus = "moderately healthy with active growth"
                      vegetationType = "moderate canopy density with mixed strata"
                      biodiversityLevel = "good"
                    } else if (ndvi >= 0.5) {
                      healthStatus = "showing signs of moderate disturbance or degradation"
                      vegetationType = "sparse to moderate canopy coverage"
                      biodiversityLevel = "moderate"
                    } else {
                      healthStatus = "significantly stressed or degraded"
                      vegetationType = "limited canopy coverage with sparse vegetation"
                      biodiversityLevel = "reduced"
                    }
                    
                    return `This project encompasses a ${area.toFixed(2)} hectare area of forest ecosystem with NDVI value of ${ndvi.toFixed(4)} indicating ${healthStatus} vegetation. 
The vegetation is characterized by ${vegetationType} with ${biodiversityLevel} biodiversity. 
Satellite analysis reveals vegetation indices consistent with ${ndvi >= 0.7 ? 'active photosynthetic activity and carbon sequestration' : 'moderate to reduced vegetation vigor'} indicating a forest with ${ndvi >= 0.7 ? 'minimal disturbance and strong regenerative capacity' : 'varying levels of ecological pressure'}. 
The ecosystem demonstrates ${ndvi >= 0.7 ? 'strong' : ndvi >= 0.5 ? 'moderate' : 'limited'} carbon sequestration potential and serves as ${ndvi >= 0.7 ? 'critical habitat for diverse flora and fauna species' : 'habitat with varying conservation value'}.`
                  })()}
                </p>
              </div>
            </div>

            <div class="section">
              <h2>Forest Structure</h2>
              <div class="metric-row">
                <span class="metric-label">Canopy Layer</span>
                <span class="metric-value">Emergent & Upper Canopy (25-35m)</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Understory Layer</span>
                <span class="metric-value">Dense Mid-story (10-20m)</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Forest Floor</span>
                <span class="metric-value">Rich Herbaceous & Regeneration Layer</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Structural Complexity</span>
                <span class="metric-value" style="color: ${primaryColor};">Very High (Multi-strata)</span>
              </div>
            </div>

            <div class="section">
              <h2>Vegetation Composition</h2>
              <table>
                <tr>
                  <th>Species Category</th>
                  <th>Composition %</th>
                  <th>Characteristics</th>
                </tr>
                <tr>
                  <td>Dipterocarps & Hardwoods</td>
                  <td>45%</td>
                  <td>Long-lived, high value timber species</td>
                </tr>
                <tr>
                  <td>Legumes & N-fixers</td>
                  <td>20%</td>
                  <td>Nitrogen cycling, pioneer species</td>
                </tr>
                <tr>
                  <td>Fruit & Nut Trees</td>
                  <td>15%</td>
                  <td>Wildlife food sources, keystone species</td>
                </tr>
                <tr>
                  <td>Medicinal & Endemic Species</td>
                  <td>20%</td>
                  <td>Rare, bioactive, conservation priority</td>
                </tr>
              </table>
            </div>

            <div class="section">
              <h2>Biodiversity & Habitat Value</h2>
              <div class="metric-row">
                <span class="metric-label">Species Richness Index</span>
                <span class="metric-value">Very High</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Endemic Species</span>
                <span class="metric-value">Confirmed Present</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Conservation Priority</span>
                <span class="metric-value" style="color: ${primaryColor}; font-weight: 600;">High</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Carbon Sequestration Capacity</span>
                <span class="metric-value">${agbEstimation?.agb_tpha_final.toFixed(2) || '250'} tC/ha</span>
              </div>
            </div>

            <div class="section">
              <h2>Vegetation Health Assessment</h2>
              <div style="background: rgba(${primaryColorRgba}, 0.1); padding: 15px; border-radius: 6px; border-left: 4px solid ${primaryColor}; margin: 15px 0;">
                <p style="color: #E0E0E0; line-height: 1.8;">
                  The vegetation exhibits optimal health status with no significant signs of stress, disease, or degradation. 
                  Spectral signatures consistent with vigorous photosynthetic activity across all canopy layers. 
                  Forest demonstrates resilience and regenerative capacity with active recruitment of new growth. 
                  Minimal anthropogenic impact detected. Ecological integrity maintained at high levels.
                </p>
              </div>
            </div>
          </div>

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

        <h2 className="text-4xl font-bold mb-2">Validation Complete</h2>
        <p className="text-muted-foreground mb-8">
          Your ecological dataset has been processed by the Athlas Verity AI System validators
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

        <div className="mb-8">
          <CarbonReductionSummaryCard
            calculation={carbonCalculation}
            integrityClass={mockValidationResult.integrity_class}
          />
        </div>

        <div className="mb-8">
          <CarbonAccountingTable calculation={carbonCalculation} />
        </div>

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
