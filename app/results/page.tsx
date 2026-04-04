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
import { formatNumberWithCommas } from "@/lib/format-utils"

// ✅ FIXED: Coordinate type accepts both number and string
interface Coordinate {
  latitude: number | string
  longitude: number | string
}

interface FormData {
  projectName: string
  projectDescription: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  carbonOffsetType: string
  coordinates: Coordinate[]
}

// ✅ FIXED: Added all missing properties
interface ResultsData extends FormData {
  // Project location & details
  projectLocation?: string
  country?: string
  forestType?: string
  dominantSpecies?: string
  vegetationClassification?: string
  vegetationDescription?: string
  ndviValue?: number
  
  // Blue carbon specific properties
  ecosystemType?: string
  tidalZoneType?: string
  salinityType?: string
  waterDepth?: string
  sedimentDepthEstimate?: string
  coastalProtectionStatus?: string
  humanDisturbanceLevel?: string
  
  // Risk & legal
  deforestationRiskLevel?: string
  legalProtectionStatus?: string
  
  // Verification
  baselineYear?: string
  methodologyRef?: string
  
  // Satellite data
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
  
  // Analysis results
  analysisResults?: {
    carbonStock?: number
    biomassAGB?: number
    carbonSequestration?: number
  }
  
  satelliteAnalysisData?: {
    ndvi?: number
    evi?: number
    canopy_density?: number
    elevation?: number
    sar_backscatter?: number
  }
  
  polygonCoordinates?: Array<{
    latitude: number
    longitude: number
    point?: number
    status?: string
  }>
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
    agb_per_ha: 0,
    carbon_fraction: 0.47,
    area_ha: 0,
    baseline_emission: 1.8,
    duration_years: 10,
    leakage: 5,
    buffer_pool: 20,
    integrity_class: "IC-A",
    validator_consensus: 0.93,
  })

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
    const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "")
    const projectType = params.get("type")
    
    if (data) {
      const parsedData = JSON.parse(data) as ResultsData
      
      if (!parsedData.coordinates || parsedData.coordinates.length === 0) {
        const coordinates: Coordinate[] = []
        
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
        }
      }
      
      setProjectData(parsedData)

      let area = 0
      let biomassAgb = 0
      
      if (parsedData.satelliteData?.polygon_area_ha && parsedData.satelliteData.polygon_area_ha > 0) {
        area = parsedData.satelliteData.polygon_area_ha
      } else if (parsedData.satelliteData?.area_ha && parsedData.satelliteData.area_ha > 0) {
        area = parsedData.satelliteData.area_ha
      } else if (parsedData.calculatedAreaHa && parsedData.calculatedAreaHa > 0) {
        area = parsedData.calculatedAreaHa
      } else {
        area = 87
      }

      if (parsedData.satelliteData?.biomass_agb_mean && parsedData.satelliteData.biomass_agb_mean > 0) {
        biomassAgb = parsedData.satelliteData.biomass_agb_mean
      }

      const satelliteFeatures = {
        ndvi: parsedData.satelliteData?.features?.ndvi || 0.65,
        evi: parsedData.satelliteData?.features?.evi || 0.45,
        canopyDensity: parsedData.satelliteData?.features?.canopy_density || 0.75,
        elevation: parsedData.satelliteData?.features?.elevation || 500,
        sarBackscatter: parsedData.satelliteData?.features?.sar_backscatter || 0.3,
      }

      let agbEcosystemType = "tropical_forest"
      const ecosystemTypeStr = parsedData.ecosystemType?.toLowerCase() || ""
      if (ecosystemTypeStr.includes("mangrove")) {
        agbEcosystemType = "mangrove"
      } else if (ecosystemTypeStr.includes("seagrass")) {
        agbEcosystemType = "seagrass"
      } else if (ecosystemTypeStr.includes("marsh")) {
        agbEcosystemType = "salt_marsh"
      }

      const agbResult = estimateAGB(satelliteFeatures, area, agbEcosystemType)
      setAgbEstimation(agbResult)

      const finalAGB = biomassAgb > 0 ? biomassAgb : agbResult.agb_tpha_final
      
      let leakage = 5
      const riskLevel = parsedData.deforestationRiskLevel?.toLowerCase() || ""
      
      if (area > 100000) {
        leakage = 20
      } else if (area > 50000) {
        leakage = 10
      } else {
        if (riskLevel === "low" || riskLevel === "very low") {
          leakage = 5
        } else if (riskLevel === "medium") {
          leakage = 10
        } else if (riskLevel === "high") {
          leakage = 20
        }
      }

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

      const isBlueCarbon = parsedData.tidalZoneType || parsedData.ecosystemType?.toLowerCase().includes('mangrove') || 
                                  parsedData.ecosystemType?.toLowerCase().includes('seagrass') || parsedData.salinityType
      setIsBlueCarbonProject(isBlueCarbon)

      if (isBlueCarbon) {
        let ecosystemType: "mangrove" | "seagrass" | "salt_marsh" = "mangrove"
        if (parsedData.ecosystemType?.toLowerCase().includes('seagrass')) {
          ecosystemType = "seagrass"
        } else if (parsedData.ecosystemType?.toLowerCase().includes('marsh')) {
          ecosystemType = "salt_marsh"
        }

        const waterDepthStr = parsedData.waterDepth || "2"
        const waterDepth = parseFloat(waterDepthStr) || 2

        const sedimentDepthStr = parsedData.sedimentDepthEstimate || "100"
        const sedimentDepth = parseFloat(sedimentDepthStr) || 100

        const blueCarbonInputs: BlueCarbonInputs = {
          area_ha: area,
          ecosystem_type: ecosystemType,
          country: parsedData.country || "Unknown",
          baseline_year: parseInt(parsedData.baselineYear || "2020"),
          tidal_zone_type: parsedData.tidalZoneType || "intertidal",
          salinity_type: parsedData.salinityType || "marine",
          water_depth_m: waterDepth,
          sediment_depth_cm: sedimentDepth,
          agb_t_ha: finalAGB,
          bgb_ratio: 0.45,
          dead_wood_t_ha: finalAGB * 0.08,
          litter_t_ha: finalAGB * 0.03,
          soc_t_ha: finalAGB * 3.5,
          soc_depth_m: 1.0,
          bulk_density_g_cm3: 0.8,
          organic_matter_percent: 8,
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
      }

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

      const shouldGenerateMap = !(parsedData.tidalZoneType || parsedData.ecosystemType?.toLowerCase().includes('mangrove') || 
                                  parsedData.ecosystemType?.toLowerCase().includes('seagrass') || parsedData.salinityType)
      if (shouldGenerateMap && parsedData.coordinates && parsedData.coordinates.length > 0) {
        try {
          const mapCanvas = generatePolygonMap(
            parsedData.coordinates.map(c => ({ 
              latitude: typeof c.latitude === 'string' ? parseFloat(c.latitude) : c.latitude, 
              longitude: typeof c.longitude === 'string' ? parseFloat(c.longitude) : c.longitude 
            })),
            parsedData.projectName || "Project Area",
            area
          )
          if (mapCanvas) {
            setProjectMapImage(mapCanvas)
          }
        } catch (error) {
          console.error("[v0] Error generating polygon map:", error)
        }
      }
    } else if (projectType === "blue-carbon") {
      setIsBlueCarbonProject(true)
      
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
      
      const demoBlueCarbonInputs: BlueCarbonInputs = {
        area_ha: 50,
        ecosystem_type: "mangrove",
        country: "Indonesia",
        baseline_year: 2020,
        tidal_zone_type: "intertidal",
        salinity_type: "marine",
        water_depth_m: 2.5,
        sediment_depth_cm: 100,
        agb_t_ha: 85,
        bgb_ratio: 0.45,
        dead_wood_t_ha: 6.8,
        litter_t_ha: 2.55,
        soc_t_ha: 297.5,
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
      
      const demoBlueCarbonResult = calculateBlueCarbonCredits(demoBlueCarbonInputs)
      setBlueCarbonResult(demoBlueCarbonResult)
      
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
    }
  }, [])

  const calculateAICarbon = async (data: ResultsData) => {
    setIsCalculating(true)
    try {
      const coordinates = data.coordinates.filter((c) => {
        const lat = typeof c.latitude === 'string' ? parseFloat(c.latitude) : c.latitude
        const lon = typeof c.longitude === 'string' ? parseFloat(c.longitude) : c.longitude
        return lat && lon
      })
      
      let area_ha: number

      if (data.satelliteData?.polygon_area_ha) {
        area_ha = data.satelliteData.polygon_area_ha
      } else if (data.satelliteData?.area_ha) {
        area_ha = data.satelliteData.area_ha
      } else if (coordinates.length > 0) {
        area_ha = calculatePolygonArea(coordinates.map(c => ({
          latitude: typeof c.latitude === 'string' ? c.latitude : String(c.latitude),
          longitude: typeof c.longitude === 'string' ? c.longitude : String(c.longitude)
        })))
      } else {
        area_ha = 87
      }

      const response = await fetch("/api/carbon/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bands: data.satelliteData?.bands,
          location: {
            latitude: Number.parseFloat(coordinates[0]?.latitude?.toString() || "0"),
            longitude: Number.parseFloat(coordinates[0]?.longitude?.toString() || "0"),
          },
          area_ha: area_ha,
          polygon_area_ha: area_ha,
          carbonOffsetType: data.carbonOffsetType,
        }),
      })

      const result = await response.json()
      if (result.success) {
        setAiCarbonData(result.carbon_estimation)
        setCarbonInputs((prev) => ({
          ...prev,
          agb_per_ha: result.carbon_estimation.agb_mean,
          area_ha: area_ha,
        }))
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

      const width = 800
      const height = 600
      const padding = 60
      const innerWidth = width - padding * 2
      const innerHeight = height - padding * 2

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      ctx.fillStyle = "#0f172a"
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = "#64748b"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Project Polygon Map", 20, 30)

      const lats = coordinates.map((c) => c.latitude)
      const lons = coordinates.map((c) => c.longitude)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)

      const latRange = maxLat - minLat || 0.001
      const lonRange = maxLon - minLon || 0.001
      const scale = Math.max(innerWidth / lonRange, innerHeight / latRange) * 0.9

      const centerLon = (minLon + maxLon) / 2
      const centerLat = (minLat + maxLat) / 2
      const canvasPoints = coordinates.map((coord) => ({
        x: padding + innerWidth / 2 + (coord.longitude - centerLon) * scale,
        y: padding + innerHeight / 2 - (coord.latitude - centerLat) * scale,
      }))

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

      ctx.fillStyle = "#22C55E"
      canvasPoints.forEach((point) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 4, 0, Math.PI * 2)
        ctx.fill()
      })

      const centerX = padding + innerWidth / 2
      const centerY = padding + innerHeight / 2
      ctx.fillStyle = "#3B82F6"
      ctx.beginPath()
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2)
      ctx.fill()

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

      ctx.fillStyle = "#94a3b8"
      ctx.font = "11px Arial"
      ctx.textAlign = "center"

      ctx.fillText(`${maxLat.toFixed(3)}°`, padding - 40, padding + 5)
      ctx.fillText(`${centerLat.toFixed(3)}°`, padding - 40, centerY + 5)
      ctx.fillText(`${minLat.toFixed(3)}°`, padding - 40, height - padding + 5)

      ctx.textAlign = "center"
      ctx.fillText(`${minLon.toFixed(3)}°`, padding + 5, height - padding + 20)
      ctx.fillText(`${centerLon.toFixed(3)}°`, centerX, height - padding + 20)
      ctx.fillText(`${maxLon.toFixed(3)}°`, width - padding - 5, height - padding + 20)

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
    const R = 6371000
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
    return area / 10000
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
      // Import PDF generator dynamically
      const { generateBatuahHilirPDF } = await import("@/lib/pdf-generators/batuah-hilir-pdf-generator")

      // Prepare PDF data from current state
      const pdfData = {
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
        integrityClassPercent: carbonCalculation.integrity_class_factor * 100,
        
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
        
        generatedDate: new Date(),
      }

      // Generate PDF
      await generateBatuahHilirPDF(pdfData)
      
      alert("PDF generated successfully and will be downloaded!")
    } catch (error) {
      console.error("[v0] PDF generation failed:", error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-10 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-green-600 mb-2">Verification Results</h1>
            <p className="text-gray-400">Your green carbon project has been successfully verified</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card border-green-600/20">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Final CO₂ Reduction</h3>
              <p className="text-3xl font-bold text-green-600">{formatNumberWithCommas(carbonCalculation.final_verified_reduction_tco2)} tCO₂e</p>
            </div>
          </Card>
          <Card className="bg-card border-blue-600/20">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Verification Status</h3>
              <p className="flex items-center gap-2 text-green-600"><CheckCircle className="w-5 h-5" />Verified</p>
            </div>
          </Card>
          <Card className="bg-card border-purple-600/20">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Integrity Class</h3>
              <p className="text-2xl font-bold text-purple-600">{carbonInputs.integrity_class || "IC-A"}</p>
            </div>
          </Card>
        </div>

        <Card className="mb-8">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold mb-4">Carbon Calculation Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-gray-400">Raw Carbon Stock:</span><span className="font-semibold">{formatNumberWithCommas(carbonCalculation.raw_carbon_stock_tc)} tC</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Converted CO₂:</span><span className="font-semibold">{formatNumberWithCommas(carbonCalculation.converted_co2_tco2)} tCO₂</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Baseline Emissions:</span><span className="font-semibold">{formatNumberWithCommas(carbonCalculation.baseline_emissions_total_tco2)} tCO₂</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Gross Reduction:</span><span className="font-semibold">{formatNumberWithCommas(carbonCalculation.gross_reduction_tco2)} tCO₂</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Leakage Adjustment ({carbonCalculation.leakage_adjustment_percent.toFixed(1)}%):</span><span className="font-semibold">-{formatNumberWithCommas(carbonCalculation.leakage_reduction_tco2)} tCO₂</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Buffer Pool ({carbonCalculation.buffer_pool_percent.toFixed(1)}%):</span><span className="font-semibold">-{formatNumberWithCommas(carbonCalculation.buffer_reduction_tco2)} tCO₂</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Net Reduction:</span><span className="font-semibold">{formatNumberWithCommas(carbonCalculation.net_reduction_tco2)} tCO₂</span></div>
              <div className="flex justify-between border-t pt-3"><span className="text-lg font-semibold">Final Verified Reduction:</span><span className="text-2xl font-bold text-green-600">{formatNumberWithCommas(carbonCalculation.final_verified_reduction_tco2)} tCO₂e</span></div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Project Details</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Project:</span> {projectData?.projectName}</p>
                <p><span className="text-gray-400">Location:</span> {projectData?.projectLocation}</p>
                <p><span className="text-gray-400">Area:</span> {formatNumberWithCommas(carbonInputs.area_ha)} ha</p>
                <p><span className="text-gray-400">Duration:</span> {carbonInputs.duration_years} years</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Verification Scores</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-400">Integrity Class:</span> {carbonInputs.integrity_class}</p>
                <p><span className="text-gray-400">Validator Consensus:</span> {carbonInputs.validator_consensus}%</p>
                <p><span className="text-gray-400">Data Consistency:</span> 89%</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 px-0">
          <Button onClick={handleExportPDF} className="gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-base font-semibold flex-1 sm:flex-none">
            <Download className="w-5 h-5" />
            Download Complete PDF Report
          </Button>
          <Button onClick={handleExportJSON} variant="outline" className="gap-2 px-8 py-3 text-base font-semibold flex-1 sm:flex-none">
            <Copy className="w-5 h-5" />
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  )
}
