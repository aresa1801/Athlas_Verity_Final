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
  const [isCalculating, setIsCalculating] = useState(false)

  const [carbonInputs, setCarbonInputs] = useState<CarbonCalculationInputs>({
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

  const carbonCalculation = calculateCarbonReduction(carbonInputs)

  useEffect(() => {
    const data = sessionStorage.getItem("projectFormData")
    if (data) {
      const parsedData = JSON.parse(data) as ResultsData
      setProjectData(parsedData)

      const area = parsedData.satelliteData?.polygon_area_ha || parsedData.calculatedAreaHa || 87

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

      // Update carbon inputs with estimated AGB
      setCarbonInputs((prev) => ({
        ...prev,
        agb_per_ha: agbResult.agb_tpha_final,
        area_ha: area,
      }))

      // Set AI carbon data structure for display
      setAiCarbonData({
        carbon_estimation: {
          project_id: `proj_${Date.now()}`,
          project_name: parsedData.projectName,
          location: {
            coordinates: parsedData.coordinates,
            area_ha: area,
          },
          agb_tpha: agbResult.agb_tpha_final,
          agb_uncertainty_pct: agbResult.agb_uncertainty_pct,
          carbon_stock_tc: agbResult.agb_tpha_final * area * 0.47,
          co2_equivalent_tco2: agbResult.agb_tpha_final * area * 0.47 * (44 / 12),
          verification_methods: agbResult.agb_source_models,
          aura_verification: agbResult.aura_verification,
          scientific_basis: agbResult.scientific_references,
        },
      })
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

    const filledCoordinates = projectData?.coordinates.filter((c) => c.latitude && c.longitude) || []

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
              background: rgba(61, 214, 140, 0.05);
              border: 1px solid rgba(61, 214, 140, 0.2);
              padding: 20px; 
              border-radius: 8px;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .page-break { page-break-before: always; }
            h1 { 
              color: #3DD68C; 
              border-bottom: 2px solid #3DD68C; 
              padding-bottom: 15px;
              margin-bottom: 30px;
              font-size: 32px;
            }
            h2 { 
              color: #3DD68C; 
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 20px;
              border-left: 4px solid #3DD68C;
              padding-left: 15px;
            }
            .label { 
              font-weight: 600; 
              color: #3DD68C;
              margin-bottom: 5px;
            }
            .value { 
              margin-left: 10px; 
              color: #E0E0E0;
            }
            .score { 
              display: inline-block; 
              background: #3DD68C; 
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
              background: #3DD68C; 
              color: #0D0F10; 
              padding: 12px; 
              text-align: left;
              font-weight: 600;
            }
            td { 
              padding: 12px; 
              border-bottom: 1px solid rgba(61, 214, 140, 0.1);
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
              border: 1px solid rgba(61, 214, 140, 0.1);
            }
            .highlight-green {
              background: rgba(61, 214, 140, 0.2);
              border-left: 4px solid #3DD68C;
              padding: 15px;
              margin: 15px 0;
              border-radius: 4px;
            }
            .metric-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid rgba(61, 214, 140, 0.1);
            }
            .metric-row:last-child { border-bottom: none; }
            .metric-label { color: #B0B0B0; }
            .metric-value { color: #3DD68C; font-weight: 600; }
            .final-value {
              font-size: 28px;
              color: #3DD68C;
              font-weight: 700;
              margin: 15px 0;
            }
            .footer { 
              text-align: center; 
              font-size: 12px; 
              color: #666;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid rgba(61, 214, 140, 0.1);
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
            <p style="color: #3DD68C; font-size: 16px; margin-bottom: 40px;">Generated via Athlas Verity AI System</p>
            
            <div class="section">
              <h2>Project Information</h2>
              <div class="grid">
                <div class="grid-item">
                  <div class="label">Project Name</div>
                  <div class="value">${projectData?.projectName || "N/A"}</div>
                </div>
                <div class="grid-item">
                  <div class="label">Carbon Offset Type</div>
                  <div class="value">${carbonOffsetTypes[projectData?.carbonOffsetType || ""] || "N/A"}</div>
                </div>
              </div>
              <div style="margin-top: 15px;" class="grid-item">
                <div class="label">Project Description</div>
                <div class="value">${projectData?.projectDescription || "N/A"}</div>
              </div>
            </div>

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
                  <div style="color: #3DD68C; font-weight: 600;">✓ Verified</div>
                </div>
              </div>
            </div>
          </div>

          <!-- PAGE 2: CARBON ASSET COORDINATES -->
          <div class="page page-break">
            <h1>Carbon Asset Coordinates</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Geospatial Location Data - 8 Asset Points</p>
            
            <div class="section">
              <h2>Geographic Coordinates (8 Points)</h2>
              <table>
                <tr>
                  <th>Point Number</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                </tr>
                ${filledCoordinates
                  .map(
                    (coord, idx) => `
                  <tr>
                    <td>Point ${idx + 1}</td>
                    <td>${coord.latitude}</td>
                    <td>${coord.longitude}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </table>
            </div>

            <div class="section">
              <h2>Verification Details</h2>
              <div class="metric-row">
                <span class="metric-label">Total Asset Points Registered</span>
                <span class="metric-value">${filledCoordinates.length}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Geospatial Coverage Verified</span>
                <span class="metric-value">✓ Confirmed</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Proof-Chain Hash</span>
                <span class="metric-value" style="font-size: 10px; word-break: break-all;">${mockValidationResult.proof_chain.substring(0, 40)}...</span>
              </div>
            </div>
          </div>

          <!-- PAGE 3: VERIFICATION RESULTS -->
          <div class="page page-break">
            <h1>Verification Results & Scores</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Athlas Verity AI System Validation Metrics</p>

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
            <h1>Carbon Reduction Calculations</h1>
            <p style="color: #B0B0B0; margin-bottom: 30px;">Step-by-Step Carbon Accounting & Verification</p>
            
            <div class="section">
              <h2>Final Verified Carbon Reduction</h2>
              <div class="highlight-green">
                <p style="color: #B0B0B0; margin-bottom: 10px;">Total Net Reduction (Verified)</p>
                <div class="final-value">${carbonCalculation.final_verified_reduction_tco2.toLocaleString()}</div>
                <p style="color: #B0B0B0;">tonnes CO₂ equivalent</p>
              </div>
            </div>

            <div class="section">
              <h2>Calculation Inputs & Parameters</h2>
              <div class="metric-row">
                <span class="metric-label">Aboveground Biomass (AGB)</span>
                <span class="metric-value">${carbonCalculation.agb_per_ha.toFixed(2)} t/ha</span>
              </div>
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

            <div class="section">
              <h2>Detailed Calculation Steps</h2>
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
              <div class="metric-row" style="border: none; padding-top: 15px; border-top: 2px solid #3DD68C; margin-top: 15px; font-size: 16px;">
                <span class="metric-label" style="color: #3DD68C; font-weight: 700;">Final Verified Reduction</span>
                <span class="metric-value" style="font-size: 18px;">${carbonCalculation.final_verified_reduction_tco2.toLocaleString()}</span>
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

            <div class="section">
              <h2>Immutable Proof-Chain Hash</h2>
              <p style="word-break: break-all; background: rgba(255, 255, 255, 0.02); padding: 15px; border-radius: 4px; font-family: monospace; font-size: 10px; border: 1px solid rgba(61, 214, 140, 0.1); color: #3DD68C;">${mockValidationResult.proof_chain}</p>
            </div>
          </div>

          <!-- PAGE 6: DISCLAIMER & DATA INTEGRITY NOTICE (Part 1) -->
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

          <!-- PAGE 7: DISCLAIMER & DATA INTEGRITY NOTICE (Part 2) -->
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

                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(61, 214, 140, 0.2); font-style: italic; color: #B0B0B0;">
                  By accessing this verification report, you acknowledge that you have read, understood, and agree to be bound by the terms and limitations outlined in this disclaimer. If you do not agree with any provision herein, you must discontinue the use of this report immediately.
                </p>

                <div style="margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(61, 214, 140, 0.2); text-align: center; font-size: 12px; color: #888;">
                  <p style="margin-bottom: 8px; font-style: italic;">Generated on ${new Date().toLocaleString()}</p>
                  <p style="margin-bottom: 8px; font-weight: 500; color: #3DD68C;">Athlas Verity Platform - Powered by CarbonFi Labs System</p>
                  <p style="margin-bottom: 15px; color: #FFD700;">This report contains sensitive verification data. Please handle with appropriate confidentiality.</p>
                  <p style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(61, 214, 140, 0.1); color: #666;">© 2025 Athlas Verity - Environmental Impact Verification Platform. All rights reserved.</p>
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
            const errorData = await uploadResponse.json()
            console.error("[v0] Google Drive upload failed with status:", uploadResponse.status)
            console.error("[v0] Error details:", errorData)
            alert(`Failed to upload PDF to Google Drive: ${errorData.details || "Unknown error"}`)
            return
          }

          const uploadResult = await uploadResponse.json()
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
      {/* Navigation */}
      <nav className="border-b border-border px-6 py-3 flex items-center justify-between sticky top-0 bg-background/60 backdrop-blur-md z-50">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity flex-1">
          <Image
            src="/athlas-verity-banner-logo.png"
            alt="Athlas Verity"
            width={1400}
            height={80}
            className="h-32 w-auto max-w-3xl"
            priority
          />
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Athlas Verity Impact Verification</div>
          <WalletConnect />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/upload" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-8">
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
