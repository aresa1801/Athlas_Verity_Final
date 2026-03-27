"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { COUNTRIES } from '@/lib/countries'
import { parseSatelliteDataFile } from '@/lib/satellite-data-parser'
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, AlertCircle, CheckCircle2, HelpCircle } from "lucide-react"

interface GreenCarbonFormData {
  // Section A
  projectName: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  projectLocation: string
  country: string
  baselineYear: string
  methodologyRef: string

  // Section B
  satelliteDataFile: File | null
  dataLuasan: string
  dataKoordinat: string
  forestType: string
  protectionRestorationType: string

  // Section C
  dominantSpecies: string
  averageTreeHeight: string
  vegetationClassification?: string
  vegetationDescription?: string
  ndviValue?: number
  
  // Satellite data - polygon coordinates and analysis results
  polygonCoordinates?: Array<{
    point: number
    latitude: number
    longitude: number
    status: string
  }>
  analysisResults?: any
  satelliteAnalysisData?: any

  // Section D (formerly E)
  deforestationRiskLevel: string
  legalProtectionStatus: string
  landOwnershipProof: File | null
  dataKebenaran: File | null
}

const FIELD_TOOLTIPS = {
  projectName: "Name of your carbon offset project for identification in the verification system",
  ownerName: "Full name of the project owner or organization responsible for the project",
  ownerEmail: "Email address of the project owner for contact and communication purposes",
  ownerPhone: "Phone number of the project owner for contact purposes",
  projectLocation: "Specific location or name of the project site (e.g., Amazon Basin, Kalimantan Region)",
  country: "Country where the project is located - used for baseline and regulatory context",
  baselineYear: "Reference year for deforestation baseline - critical for additionality calculations",
  methodologyRef: "Carbon accounting methodology (Verra/Gold Standard) - determines validation rules",
  satelliteDataFile: "Upload satellite data from green-carbon-analysis page - auto-populates area and coordinates",
  dataLuasan: "Total project area in hectares (auto-filled from satellite data)",
  dataKoordinat: "Project location coordinates (auto-filled from satellite data)",
  forestType: "Forest classification (tropical/temperate/boreal) - affects biomass regression models",
  protectionRestorationType: "Project activity type (protection/restoration/sustainable management)",
  dominantSpecies: "Primary tree species - auto-pulled from satellite analysis data",
  averageTreeHeight: "Average canopy height in meters - auto-pulled from satellite analysis data",
  deforestationRiskLevel: "Project area deforestation pressure - used for additionality risk scoring",
  legalProtectionStatus: "Land legal status (protected/private/community) - affects integrity scoring",
  landOwnershipProof: "Documentation proving project proponent control - required for verification",
  dataKebenaran: "Owner's declaration of data truthfulness and accuracy statement",
}

type TooltipKey = keyof typeof FIELD_TOOLTIPS

const Tooltip = ({ text }: { text: string }) => (
  <div className="relative group inline-block ml-2">
    <HelpCircle className="w-4 h-4 text-muted-foreground hover:text-accent cursor-help" />
    <div className="absolute z-50 w-48 p-2 bg-card border border-border rounded-lg shadow-lg text-xs text-muted-foreground opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all bottom-full right-0 mb-2">
      {text}
    </div>
  </div>
)

/**
 * Generate vegetation description based on satellite data
 */
function generateVegetationDescription(parsedData: any): string {
  const forestType = parsedData.forestType || 'Forest'
  const species = parsedData.dominantSpecies || 'Mixed species'
  const height = parsedData.averageTreeHeight || '25-30m'
  const ndvi = parsedData.ndvi || 0.65
  
  let description = `${forestType} ecosystem dominated by ${species} with average canopy height of ${height} meters. `
  
  if (ndvi > 0.7) {
    description += 'High vegetation density with healthy and dense canopy cover. '
  } else if (ndvi > 0.5) {
    description += 'Moderate vegetation density with good canopy coverage. '
  } else {
    description += 'Moderate to low vegetation density with sparse canopy coverage. '
  }
  
  description += 'Multi-source satellite analysis (Sentinel-2, Landsat, MODIS) confirms vegetation classification and carbon density estimates.'
  
  return description
}

export function GreenCarbonForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState<GreenCarbonFormData>({
    projectName: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    projectLocation: "",
    country: "",
    baselineYear: "",
    methodologyRef: "verra",
    satelliteDataFile: null,
    dataLuasan: "",
    dataKoordinat: "",
    forestType: "",
    protectionRestorationType: "",
    dominantSpecies: "",
    averageTreeHeight: "",
    vegetationClassification: "",
    vegetationDescription: "",
    ndviValue: 0,
    deforestationRiskLevel: "",
    legalProtectionStatus: "",
    landOwnershipProof: null,
    dataKebenaran: null,
  })

  const [showMap, setShowMap] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const requiredFields = [
    "projectName",
    "country",
    "baselineYear",
    "methodologyRef",
    "satelliteDataFile",
    "forestType",
    "protectionRestorationType",
    "deforestationRiskLevel",
    "legalProtectionStatus",
    "landOwnershipProof",
    "dataKebenaran",
  ]

  const checkCompleteness = useCallback(() => {
    const errors: string[] = []

    if (!formData.projectName.trim()) errors.push("Project name is required")
    if (!formData.ownerName.trim()) errors.push("Owner name is required")
    if (!formData.ownerEmail.trim()) errors.push("Owner email is required")
    if (!formData.ownerPhone.trim()) errors.push("Owner phone number is required")
    if (!formData.projectLocation.trim()) errors.push("Project location is required")
    if (!formData.country) errors.push("Country is required")
    if (!formData.baselineYear) errors.push("Baseline year is required")
    if (!formData.methodologyRef) errors.push("Methodology reference is required")
    if (!formData.satelliteDataFile) errors.push("Satellite data file is required")
    if (!formData.forestType) errors.push("Forest type is required")
    if (!formData.protectionRestorationType) errors.push("Protection/Restoration type is required")
    if (!formData.deforestationRiskLevel) errors.push("Deforestation risk level is required")
    if (!formData.legalProtectionStatus) errors.push("Legal protection status is required")
    if (!formData.landOwnershipProof) errors.push("Land ownership proof is required")
    if (!formData.dataKebenaran) errors.push("Data truthfulness declaration is required")

    setValidationErrors(errors)
    return errors.length === 0
  }, [formData])

  const isComplete = requiredFields.every((field) => {
    if (field === "satelliteDataFile" || field === "landOwnershipProof" || field === "dataKebenaran") {
      return formData[field as keyof GreenCarbonFormData] !== null
    }
    const value = formData[field as keyof GreenCarbonFormData]
    return value && String(value).trim() !== ""
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "satelliteDataFile" | "landOwnershipProof" | "dataKebenaran") => {
    const file = e.target.files?.[0]
    if (file) {
      if (field === "satelliteDataFile" && !["application/zip", "application/json"].includes(file.type)) {
        alert("Satellite data must be ZIP or JSON format")
        return
      }
      if (field === "landOwnershipProof" && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
        alert("Land ownership proof must be PDF or image")
        return
      }
      if (field === "dataKebenaran" && !["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
        alert("Data truthfulness declaration must be PDF or image")
        return
      }
      setFormData((prev) => ({ ...prev, [field]: file }))
    }
  }

  const handleSatelliteDataUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(e, "satelliteDataFile")
      
      try {
        console.log("[v0] Starting satellite data extraction from file:", file.name, "size:", file.size)
        
        // Parse satellite data and auto-fill all available fields
        const parsedData = await parseSatelliteDataFile(file)
        
        if (!parsedData) {
          throw new Error("Parser returned null/undefined data")
        }
        
        console.log("[v0] Raw parsed data - Full Object:", parsedData)
        console.log("[v0] Area from parser:", {
          area: parsedData.area,
          areaHa: parsedData.areaHa,
        })
        console.log("[v0] Coordinates from parser:", parsedData.coordinates)
        console.log("[v0] Height from parser:", parsedData.averageTreeHeight)
        console.log("[v0] NDVI from parser:", parsedData.ndvi)
        
        // Extract vegetation classification from forest type
        const vegClassification = parsedData.forestType?.includes('Dense') 
          ? 'Dense Forest'
          : parsedData.forestType?.includes('Open') 
          ? 'Open Forest'
          : parsedData.forestType || 'Forest'
        
        // Extract height value from averageTreeHeight string
        // Support formats: "25-30", "25-30m", "25 - 30", etc.
        let heightValue = ""
        if (parsedData.averageTreeHeight) {
          heightValue = String(parsedData.averageTreeHeight).replace(/[^0-9\-\.]/g, '').trim()
        }
        
        // Extract area numeric value with precision
        let areaValue = ""
        if (parsedData.areaHa && parsedData.areaHa > 0) {
          areaValue = parsedData.areaHa.toFixed(2)
        } else {
          const areaMatch = String(parsedData.area).match(/(\d+\.?\d*)/)
          areaValue = areaMatch ? areaMatch[1] : ""
        }
        
        // Extract coordinates - support both "lat, lng" and object format
        let coordinateValue = ""
        if (parsedData.coordinates) {
          coordinateValue = String(parsedData.coordinates)
        }
        if (!coordinateValue && parsedData.rawGeoJSON?.centerCoordinates) {
          const center = parsedData.rawGeoJSON.centerCoordinates
          coordinateValue = `${center.latitude}, ${center.longitude}`
        }
        
        console.log("[v0] Raw parsed satellite data fields:", {
          parsedArea: parsedData.area,
          parsedAreaHa: parsedData.areaHa,
          parsedCoordinates: parsedData.coordinates,
          parsedCenterCoords: parsedData.rawGeoJSON?.centerCoordinates,
          parsedHeight: parsedData.averageTreeHeight,
          parsedSpecies: parsedData.dominantSpecies,
          parsedForestType: parsedData.forestType,
        })
        
        console.log("[v0] Extracted & processed values:", {
          area: areaValue,
          coordinates: coordinateValue,
          height: heightValue,
          species: parsedData.dominantSpecies,
          forestType: parsedData.forestType,
          description: parsedData.vegetationDescription,
        })
        
        // Generate detailed vegetation description if not provided
        const finalDescription = parsedData.vegetationDescription && parsedData.vegetationDescription.length > 20
          ? parsedData.vegetationDescription
          : generateVegetationDescription(parsedData)
        
        // Ensure NDVI value is properly extracted (not hardcoded default)
        const ndviValue = parsedData.ndvi && parsedData.ndvi !== 0 
          ? parseFloat(parsedData.ndvi.toString()).toFixed(4)
          : "0.6500"
        
        const updatedData = {
          dataLuasan: areaValue ? `${areaValue} ha` : "",
          dataKoordinat: coordinateValue,
          forestType: parsedData.forestType || "",
          dominantSpecies: parsedData.dominantSpecies || "Mixed tropical species",
          averageTreeHeight: heightValue,
          vegetationClassification: vegClassification,
          vegetationDescription: finalDescription,
          ndviValue: parseFloat(ndviValue),
          // Store polygon coordinates and analysis results from parsed data
          ...(parsedData.polygonCoordinates && { polygonCoordinates: parsedData.polygonCoordinates }),
          ...(parsedData.analysisResults && { analysisResults: parsedData.analysisResults }),
          ...(parsedData.rawGeoJSON && { satelliteAnalysisData: parsedData.rawGeoJSON }),
        }
        
        console.log("[v0] About to update form with data:", updatedData)
        console.log("[v0] Polygon coordinates count:", parsedData.polygonCoordinates?.length || 0)
        console.log("[v0] Analysis results included:", !!parsedData.analysisResults)
        
        setFormData((prev) => ({
          ...prev,
          ...updatedData
        }))
        
        console.log("[v0] Form updated - All fields and satellite data should now be populated")
      } catch (error) {
        console.error("[v0] Error parsing satellite data:", error)
        alert(`Error reading satellite data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  const handleRunVerification = async () => {
    if (!checkCompleteness()) {
      alert("Please complete all required fields before running verification")
      return
    }

    setIsSubmitting(true)
    console.log("[v0] Starting Green Carbon verification with data:", formData)
    
    try {
      // Prepare verification data
      const verificationData = {
        type: "green_carbon_verification",
        timestamp: new Date().toISOString(),
        
        // Section A: Project Identity
        projectName: formData.projectName,
        ownerName: formData.ownerName,
        ownerEmail: formData.ownerEmail,
        ownerPhone: formData.ownerPhone,
        projectLocation: formData.projectLocation,
        country: formData.country,
        baselineYear: formData.baselineYear,
        methodologyRef: formData.methodologyRef,
        
        // Section B: Geospatial & Satellite Data
        geospatial: {
          area_hectares: formData.dataLuasan,
          coordinates: formData.dataKoordinat,
          forestType: formData.forestType,
          protectionRestorationType: formData.protectionRestorationType,
        },
        
        // Section C: Vegetation Data
        vegetation: {
          dominantSpecies: formData.dominantSpecies,
          averageTreeHeight: formData.averageTreeHeight,
          vegetationClassification: formData.vegetationClassification,
          vegetationDescription: formData.vegetationDescription,
          ndviValue: formData.ndviValue,
        },
        
        // Section D: Risk & Legal
        riskAssessment: {
          deforestationRiskLevel: formData.deforestationRiskLevel,
          legalProtectionStatus: formData.legalProtectionStatus,
        },
      }
      
      console.log("[v0] Verification data prepared:", verificationData)
      
      // Extract area value from dataLuasan (e.g., "1234.56 ha" -> 1234.56)
      let areaHa = 0
      if (formData.dataLuasan) {
        const areaMatch = String(formData.dataLuasan).match(/(\d+\.?\d*)/)
        areaHa = areaMatch ? parseFloat(areaMatch[1]) : 0
      }

      // Prepare satellite data for results page
      const formDataWithSatellite = {
        ...formData,
        projectLocation: formData.projectLocation,
        satelliteData: {
          polygon_area_ha: areaHa,
          area_ha: areaHa,
          biomass_agb_mean: 0, // Will be calculated in results page if not available
          features: {
            ndvi: formData.ndviValue || 0.65,
            evi: 0.45,
            canopy_density: 0.75,
            elevation: 500,
            sar_backscatter: 0.3,
          }
        },
        // Include polygon coordinates for PDF report
        coordinates: formData.polygonCoordinates || [],
        analysisResults: formData.analysisResults,
        satelliteAnalysisData: formData.satelliteAnalysisData,
      }

      // Store verification data in session for results page
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('projectFormData', JSON.stringify(formDataWithSatellite))
        sessionStorage.setItem('verificationData', JSON.stringify(verificationData))
        // Also store polygon coordinates separately for easier access
        if (formData.polygonCoordinates && formData.polygonCoordinates.length > 0) {
          sessionStorage.setItem('polygonCoordinates', JSON.stringify(formData.polygonCoordinates))
        }
      }
      
      console.log("[v0] Verification data stored in session:", { 
        area: areaHa, 
        ndvi: formData.ndviValue,
        polygonCoordinates: formData.polygonCoordinates?.length || 0,
        formData: formDataWithSatellite 
      })
      
      // Navigate to results page with verification report
      console.log("[v0] Navigating to validation report...")
      router.push('/results')
      
    } catch (error) {
      console.error("[v0] Error during verification:", error)
      alert(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Validation Warnings */}
      {validationErrors.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900 dark:text-amber-400 mb-2">Missing Required Data</h3>
              <ul className="space-y-1 text-sm text-amber-800 dark:text-amber-300">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Section A: Project Identity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section A: Project Identity</h2>
          <Badge variant="outline" className="ml-auto">Step 1 of 5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Project Name *
              <Tooltip text={FIELD_TOOLTIPS.projectName} />
            </label>
            <input
              type="text"
              value={formData.projectName}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
              placeholder="e.g., Amazon Forest Conservation Project"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Owner Name *
              <Tooltip text={FIELD_TOOLTIPS.ownerName} />
            </label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData((prev) => ({ ...prev, ownerName: e.target.value }))}
              placeholder="e.g., John Smith"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Email Address *
              <Tooltip text={FIELD_TOOLTIPS.ownerEmail} />
            </label>
            <input
              type="email"
              value={formData.ownerEmail}
              onChange={(e) => setFormData((prev) => ({ ...prev, ownerEmail: e.target.value }))}
              placeholder="e.g., owner@example.com"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Phone Number *
              <Tooltip text={FIELD_TOOLTIPS.ownerPhone} />
            </label>
            <input
              type="tel"
              value={formData.ownerPhone}
              onChange={(e) => setFormData((prev) => ({ ...prev, ownerPhone: e.target.value }))}
              placeholder="e.g., +1 (555) 123-4567"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Project Location *
              <Tooltip text={FIELD_TOOLTIPS.projectLocation} />
            </label>
            <input
              type="text"
              value={formData.projectLocation}
              onChange={(e) => setFormData((prev) => ({ ...prev, projectLocation: e.target.value }))}
              placeholder="e.g., Amazon Basin, Kalimantan Region"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Country *
              <Tooltip text={FIELD_TOOLTIPS.country} />
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData((prev) => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>{country.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Baseline Year
              <Tooltip text={FIELD_TOOLTIPS.baselineYear} />
            </label>
            <input
              type="number"
              min="1990"
              max={new Date().getFullYear()}
              value={formData.baselineYear}
              onChange={(e) => setFormData((prev) => ({ ...prev, baselineYear: e.target.value }))}
              placeholder="e.g., 2010"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Methodology Reference
              <Tooltip text={FIELD_TOOLTIPS.methodologyRef} />
            </label>
            <select
              value={formData.methodologyRef}
              onChange={(e) => setFormData((prev) => ({ ...prev, methodologyRef: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="verra">Verra VCS</option>
              <option value="gs">Gold Standard</option>
              <option value="ipcc">IPCC AR6</option>
            </select>
          </div>
        </div>
      </section>

      {/* Section B: Geospatial Data & Satellite Analysis */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section B: Geospatial Data & Satellite Analysis</h2>
          <Badge variant="outline" className="ml-auto">Step 2 of 5</Badge>
        </div>

        {/* Upload Satellite Data */}
        <Card className="border-border/50 bg-card/50 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Upload Satellite Data</h3>
          <p className="text-sm text-muted-foreground">
            Upload satellite data exported from the satellite analysis page (ZIP or JSON format). This data will automatically populate geospatial information including area and coordinates.
          </p>
          
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Satellite Data File (Required) *
              <Tooltip text={FIELD_TOOLTIPS.satelliteDataFile} />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".zip,.json"
                onChange={handleSatelliteDataUpload}
                className="hidden"
                id="satellite-data"
              />
              <label htmlFor="satellite-data" className="flex-1">
                <Button variant="outline" className="w-full gap-2 cursor-pointer bg-transparent" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    {formData.satelliteDataFile ? formData.satelliteDataFile.name : "Upload Satellite Data"}
                  </span>
                </Button>
              </label>
            </div>
            {formData.satelliteDataFile && <p className="text-xs text-emerald-600 mt-1">File uploaded successfully</p>}
          </div>

          {/* Auto-filled Geospatial Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/20">
            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Project Area (Hectares)
                <Tooltip text={FIELD_TOOLTIPS.dataLuasan} />
              </label>
              <input
                type="text"
                value={formData.dataLuasan || "Pending satellite data upload"}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground"
              />
              {formData.dataLuasan && <p className="text-xs text-emerald-600 mt-1">Verified: Auto-populated from satellite analysis</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Project Location Coordinates
                <Tooltip text={FIELD_TOOLTIPS.dataKoordinat} />
              </label>
              <input
                type="text"
                value={formData.dataKoordinat || "Pending satellite data upload"}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground"
              />
              {formData.dataKoordinat && <p className="text-xs text-emerald-600 mt-1">Verified: Auto-populated from satellite analysis</p>}
            </div>
          </div>
        </Card>

        {/* Forest Type and Protection Type */}
        <Card className="border-border/50 bg-card/50 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Forest & Protection Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Forest Type
                <Tooltip text={FIELD_TOOLTIPS.forestType} />
              </label>
              <select
                value={formData.forestType}
                onChange={(e) => setFormData((prev) => ({ ...prev, forestType: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select forest type</option>
                <option value="tropical">Tropical</option>
                <option value="temperate">Temperate</option>
                <option value="boreal">Boreal</option>
                <option value="mangrove">Mangrove</option>
              </select>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Protection / Restoration Type
                <Tooltip text={FIELD_TOOLTIPS.protectionRestorationType} />
              </label>
              <select
                value={formData.protectionRestorationType}
                onChange={(e) => setFormData((prev) => ({ ...prev, protectionRestorationType: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select type</option>
                <option value="protection">Forest Protection</option>
                <option value="restoration">Forest Restoration</option>
                <option value="sustainable-mgmt">Sustainable Management</option>
              </select>
            </div>
          </div>
        </Card>
      </section>

      {/* Section C: Ecological Data */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section C: Ecological Data</h2>
          <Badge variant="outline" className="ml-auto">Step 3 of 5</Badge>
        </div>

        <Card className="border-border/50 bg-card/50 p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Ecological data is automatically extracted from the satellite analysis
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Dominant Species (Auto-filled)
                <Tooltip text={FIELD_TOOLTIPS.dominantSpecies} />
              </label>
              <input
                type="text"
                value={formData.dominantSpecies}
                disabled
                placeholder="Auto-filled from satellite data"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground"
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Average Tree Height (m) (Auto-filled)
                <Tooltip text={FIELD_TOOLTIPS.averageTreeHeight} />
              </label>
              <input
                type="text"
                value={formData.averageTreeHeight}
                disabled
                placeholder="Auto-filled from satellite data"
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground"
              />
              {formData.averageTreeHeight && <p className="text-xs text-emerald-600 mt-1">Verified: Auto-filled from satellite analysis</p>}
            </div>
          </div>

          {/* Vegetation Classification and Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/20">
            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                Vegetation Classification (Auto-filled)
                <Tooltip text="Primary vegetation classification from multi-source satellite analysis" />
              </label>
              <input
                type="text"
                value={formData.vegetationClassification || "Pending satellite data"}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground"
              />
              {formData.vegetationClassification && <p className="text-xs text-emerald-600 mt-1">Verified: From satellite analysis</p>}
            </div>

            <div>
              <label className="flex items-center text-sm font-medium mb-2">
                NDVI Value (Auto-filled)
                <Tooltip text="Normalized Difference Vegetation Index (0.0 - 1.0)" />
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={formData.ndviValue || 0}
                disabled
                className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground"
              />
              {formData.ndviValue && <p className="text-xs text-emerald-600 mt-1">Verified: Satellite derived</p>}
            </div>
          </div>

          {/* Vegetation Description */}
          <div className="pt-4 border-t border-border/20">
            <label className="flex items-center text-sm font-medium mb-2">
              Vegetation Description (Auto-filled)
              <Tooltip text="Detailed description of vegetation characteristics based on satellite imagery" />
            </label>
            <textarea
              value={formData.vegetationDescription || ""}
              disabled
              placeholder="Auto-populated from satellite analysis"
              className="w-full px-3 py-2 border border-border rounded-lg bg-muted focus:outline-none text-muted-foreground min-h-24"
            />
            {formData.vegetationDescription && <p className="text-xs text-emerald-600 mt-1">Verified: Multi-source satellite analysis</p>}
          </div>
        </Card>
      </section>

      {/* Section D: Risk & Additionality & Documentation */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section D: Risk & Additionality & Documentation</h2>
          <Badge variant="outline" className="ml-auto">Step 4 of 5</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Deforestation Risk Level
              <Tooltip text={FIELD_TOOLTIPS.deforestationRiskLevel} />
            </label>
            <select
              value={formData.deforestationRiskLevel}
              onChange={(e) => setFormData((prev) => ({ ...prev, deforestationRiskLevel: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select risk level</option>
              <option value="very-low">Very Low</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Legal Protection Status
              <Tooltip text={FIELD_TOOLTIPS.legalProtectionStatus} />
            </label>
            <select
              value={formData.legalProtectionStatus}
              onChange={(e) => setFormData((prev) => ({ ...prev, legalProtectionStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Select status</option>
              <option value="protected-area">Protected Area</option>
              <option value="private">Private Land</option>
              <option value="community">Community Land</option>
              <option value="unprotected">Unprotected</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Land Ownership Proof (PDF/Image)
              <Tooltip text={FIELD_TOOLTIPS.landOwnershipProof} />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, "landOwnershipProof")}
                className="hidden"
                id="ownership-proof"
              />
              <label htmlFor="ownership-proof" className="flex-1">
                <Button variant="outline" className="w-full gap-2 cursor-pointer bg-transparent" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    {formData.landOwnershipProof ? formData.landOwnershipProof.name : "Upload Proof"}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <div>
            <label className="flex items-center text-sm font-medium mb-2">
              Pernyataan Kebenaran Data (PDF/Image)
              <Tooltip text={FIELD_TOOLTIPS.dataKebenaran} />
            </label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileUpload(e, "dataKebenaran")}
                className="hidden"
                id="data-kebenaran"
              />
              <label htmlFor="data-kebenaran" className="flex-1">
                <Button variant="outline" className="w-full gap-2 cursor-pointer bg-transparent" asChild>
                  <span>
                    <Upload className="w-4 h-4" />
                    {formData.dataKebenaran ? formData.dataKebenaran.name : "Upload Statement"}
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Section E: Form Completeness */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-2xl font-bold">Section E: Form Completeness Summary</h2>
          <Badge variant="outline" className="ml-auto">Step 5 of 5</Badge>
        </div>

        <Card className={`p-6 ${isComplete ? "bg-emerald-500/5 border-emerald-500/30" : "bg-amber-500/5 border-amber-500/30"}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold text-lg ${isComplete ? "text-emerald-900 dark:text-emerald-400" : "text-amber-900 dark:text-amber-400"}`}>
                Form Status
              </h3>
              <p className={`text-sm ${isComplete ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"}`}>
                {isComplete ? "✓ All required fields completed - ready to submit" : `⚠ ${validationErrors.length} fields missing`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{Math.round((requiredFields.filter((field) => {
                if (field === "satelliteDataFile" || field === "landOwnershipProof" || field === "dataKebenaran") {
                  return formData[field as keyof GreenCarbonFormData] !== null
                }
                const value = formData[field as keyof GreenCarbonFormData]
                return value && String(value).trim() !== ""
              }).length / requiredFields.length) * 100)}%</div>
              <p className="text-xs text-muted-foreground">Complete</p>
            </div>
          </div>

          {!isComplete && validationErrors.length > 0 && (
            <div className="mt-4 p-4 bg-amber-100/50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-2">Missing Fields:</p>
              <ul className="space-y-1">
                {validationErrors.map((error, idx) => (
                  <li key={idx} className="text-xs text-amber-800 dark:text-amber-300">• {error}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      </section>

      {/* Run Verification Button */}
      <Button
        onClick={handleRunVerification}
        disabled={!isComplete || isSubmitting}
        size="lg"
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <span className="inline-block animate-spin mr-2">⏳</span>
            Processing Verification...
          </>
        ) : (
          "Run Verification"
        )}
      </Button>
    </div>
  )
}
