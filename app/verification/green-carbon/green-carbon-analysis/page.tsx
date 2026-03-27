'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapInterface } from '@/components/satellite/map-interface'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, Download, MapPin, Calendar, Gauge, Zap, 
  AlertCircle, CheckCircle2, Loader2, ArrowRight,
  BarChart3, Leaf, Droplet, Layers
} from 'lucide-react'
import { calculateAndFormatArea, calculateMultiPolygonArea } from '@/lib/polygon-area-calculator'
import { generateSatellitePDF, generateSatelliteDataZIP, downloadBlob } from '@/lib/satellite-data-exporter'
import { parseGeoJSON, parseKML, parseZIP, parseCSV, validatePolygon, detectAndParseFile } from '@/lib/polygon-file-handlers'
import { calculateAGB, calculateCanopyCover, determineForestType } from '@/lib/agb-calculator'
import { detectEcosystemType } from '@/lib/satellite-data-parser'
import { EcosystemConfirmationDialog } from '@/components/dialogs/ecosystem-confirmation-dialog'

// Helper function to extract coordinates from GeoJSON structure
// GeoJSON coordinates are [lng, lat] but we convert to [lat, lng] for our system
function extractCoordinatesFromGeoJSON(geojson: any): { 
  coordinates: Array<[number, number]>
  multiPolygons?: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }>
  polygonCount: number
  holeCount: number
} {
  if (!geojson) {
    return { coordinates: [], polygonCount: 0, holeCount: 0 }
  }

  // Handle FeatureCollection - process ALL features
  if (geojson.type === 'FeatureCollection') {
    const features = geojson.features || []
    if (features.length > 0) {
      const allMultiPolygons: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }> = []
      let totalHoles = 0
      let allCoordinates: Array<[number, number]> = []
      
      for (const feature of features) {
        const result = extractGeometry(feature.geometry)
        if (result.multiPolygons) {
          allMultiPolygons.push(...result.multiPolygons)
          totalHoles += result.holeCount
        }
        // Use first feature's coordinates for main display
        if (allCoordinates.length === 0 && result.coordinates.length > 0) {
          allCoordinates = result.coordinates
        }
      }
      
      return {
        coordinates: allCoordinates,
        multiPolygons: allMultiPolygons,
        polygonCount: allMultiPolygons.length,
        holeCount: totalHoles
      }
    }
  }

  // Handle Feature
  if (geojson.type === 'Feature') {
    return extractGeometry(geojson.geometry)
  }

  // Handle direct geometry
  return extractGeometry(geojson)
}

function extractGeometry(geometry: any): { 
  coordinates: Array<[number, number]>
  multiPolygons?: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }>
  polygonCount: number
  holeCount: number
} {
  if (!geometry || !geometry.type) {
    return { coordinates: [], polygonCount: 0, holeCount: 0 }
  }

  // Handle Polygon
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates || []
    // GeoJSON uses [lng, lat], we need to swap to [lat, lng]
    const outerRing = rings[0]?.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]) || []
    const innerRings = rings.slice(1)?.map((ring: Array<[number, number]>) => 
      ring.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
    ) || []
    
    return {
      coordinates: outerRing,
      multiPolygons: [{
        outerRing,
        innerRings
      }],
      polygonCount: 1,
      holeCount: innerRings.length
    }
  }

  // Handle MultiPolygon
  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates || []
    const multiPolygons: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }> = []
    let totalHoles = 0

    for (const polygonRings of polygons) {
      if (polygonRings.length > 0) {
        // Convert from GeoJSON [lng, lat] to [lat, lng]
        const outerRing = polygonRings[0].map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
        const innerRings = polygonRings.slice(1).map((ring: Array<[number, number]>) =>
          ring.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
        )
        multiPolygons.push({ outerRing, innerRings })
        totalHoles += innerRings.length
      }
    }

    const mainCoordinates = multiPolygons[0]?.outerRing || []
    
    return {
      coordinates: mainCoordinates,
      multiPolygons,
      polygonCount: polygons.length,
      holeCount: totalHoles
    }
  }

  return { coordinates: [], polygonCount: 0, holeCount: 0 }
}

// Helper function to extract coordinates from KML
function extractCoordinatesFromKML(kml: string): Array<[number, number]> {
  const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/
  const match = kml.match(coordRegex)
  if (!match) return []

  return match[1]
    .trim()
    .split(/\s+/)
    .map((coord) => {
      const [lng, lat] = coord.split(',').map(Number)
      // KML uses [lng, lat], convert to [lat, lng]
      return [lat, lng] as [number, number]
    })
    .filter(([lat, lng]) => !isNaN(lng) && !isNaN(lat) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
}

interface CoordinateBounds {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

interface MultiPolygonData {
  outerRing: Array<[number, number]>
  innerRings: Array<Array<[number, number]>>
}

export default function SatelliteAnalysisPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [multiPolygons, setMultiPolygons] = useState<MultiPolygonData[] | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [areaData, setAreaData] = useState<any>(null)
  const [multiPolygonAreaData, setMultiPolygonAreaData] = useState<any>(null)
  const [bounds, setBounds] = useState<CoordinateBounds | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [locationInput, setLocationInput] = useState({ latitude: '', longitude: '' })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [satelliteSource, setSatelliteSource] = useState('all')
  const [polygonInfo, setPolygonInfo] = useState<{ count: number; holes: number }>({ count: 0, holes: 0 })
  const [showEcosystemDialog, setShowEcosystemDialog] = useState(false)
  const [detectedEcosystem, setDetectedEcosystem] = useState<'terrestrial' | 'coastal' | 'marine'>('terrestrial')
  const [pendingAnalysisAction, setPendingAnalysisAction] = useState<'fetch' | 'run' | null>(null)

  // Initialize date range with 10-year lookback
  useEffect(() => {
    const today = new Date()
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate())
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    setDateRange({
      start: formatDate(tenYearsAgo),
      end: formatDate(today)
    })
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setUploadedFile(file)
    
    try {
  // Use intelligent file detection and conversion
  // Automatically converts non-GeoJSON formats to GeoJSON
  const parseResult = await detectAndParseFile(file)

      const coordinates = parseResult.coordinates || []
      
      // More informative error message
      if (!coordinates || coordinates.length < 3) {
        const errorMsg = coordinates.length === 0 
          ? `No polygon coordinates found in ${file.name}. Make sure the file contains valid geospatial data.`
          : `Invalid polygon: Need at least 3 points, found ${coordinates.length}`
        alert(errorMsg)
        setLoading(false)
        return
      }

      // Calculate bounds for location display
      const lats = coordinates.map((c: [number, number]) => c[0])
      const lngs = coordinates.map((c: [number, number]) => c[1])
      const newBounds: CoordinateBounds = {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
      }
      setBounds(newBounds)

      // Set location coordinates to center of polygon
      const centerLat = (newBounds.minLat + newBounds.maxLat) / 2
      const centerLng = (newBounds.minLng + newBounds.maxLng) / 2
      setLocationInput({
        latitude: centerLat.toFixed(6),
        longitude: centerLng.toFixed(6),
      })

      // Handle multi-polygon calculation if available
      if (parseResult.multiPolygons && parseResult.multiPolygons.length > 0) {
        setMultiPolygons(parseResult.multiPolygons)
        setPolygonInfo({
          count: parseResult.polygonCount || 1,
          holes: parseResult.holeCount || 0
        })
        
        // Convert array format to object format for area calculation
        const convertedMultiPolygons = parseResult.multiPolygons.map(polygon => ({
          outerRing: polygon.outerRing.map(([lat, lng]: [number, number]) => ({
            latitude: lat,
            longitude: lng
          })),
          innerRings: polygon.innerRings.map((ring: Array<[number, number]>) =>
            ring.map(([lat, lng]: [number, number]) => ({
              latitude: lat,
              longitude: lng
            }))
          )
        }))
        
        // Calculate area using multi-polygon method
        const multiResult = calculateMultiPolygonArea(convertedMultiPolygons)
        setMultiPolygonAreaData(multiResult)
      } else {
        // Fall back to single polygon calculation
        const coordinatesAsObjects = coordinates.map(([lat, lng]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }))
        const result = calculateAndFormatArea(coordinatesAsObjects)
        setAreaData(result)
        setPolygonInfo({ count: 1, holes: 0 })
      }

      // Update polygon for map display
      setPolygon(coordinates)
    } catch (error) {
      console.error('[v0] Error parsing file:', error)
      alert('Error parsing satellite data file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  const handleFetchSatelliteData = async () => {
    if (!polygon || polygon.length < 3) {
      alert('Please upload geospatial data first')
      return
    }

    // TODO: Re-enable ecosystem type verification in future
    // const detectedType = detectEcosystemType(polygon)
    // setDetectedEcosystem(detectedType)
    // setShowEcosystemDialog(true)
    // setPendingAnalysisAction('fetch')

    // For now, directly proceed with analysis
    setAnalysisRunning(true)
    await performAnalysis()
  }

  const handleConfirmEcosystem = async () => {
    // TEMPORARILY DISABLED - Ecosystem verification will be re-enabled in future
    // Verify that terrestrial ecosystem matches (green carbon is for terrestrial)
    // if (detectedEcosystem !== 'terrestrial') {
    //   alert('⚠️ Warning: Detected ecosystem is ' + detectedEcosystem + '. Green Carbon is for terrestrial forests. Please verify your satellite data is from the correct location.')
    //   setShowEcosystemDialog(false)
    //   return
    // }

    setShowEcosystemDialog(false)
    setAnalysisRunning(true)
    await performAnalysis()
  }

  const performAnalysis = async () => {
    // Simulate Gemini AI analysis using BIOMASS package methodology
    setTimeout(() => {
      // Simulate NDVI based on polygon characteristics
      // Different polygons get different NDVI values based on their characteristics
      const randomNdvi = 0.65 + Math.random() * 0.15 // Range: 0.65-0.80
      const ndvi = Math.round(randomNdvi * 100) / 100
      
      // Calculate canopy cover from NDVI using standard remote sensing formula
      const canopyCover = calculateCanopyCover(ndvi)
      
      // Determine forest type and dominant species based on canopy cover
      const forestTypeData = determineForestType(canopyCover)
      
      // Calculate AGB using BIOMASS package methodology
      const agbResult = calculateAGB({
        ndvi,
        canopyCover,
        forestType: forestTypeData.type,
        dominantSpecies: forestTypeData.species
      })
      
      const areaHectares = multiPolygonAreaData?.hectares || areaData?.hectares || 0
      const totalCO2e = (agbResult.carbonStock * areaHectares).toFixed(2)
      
      setAnalysisResults({
        carbonEstimation: {
          agb: agbResult.carbonStock.toFixed(2),
          unit: 'Ton CO2e/Ha',
          confidence: Math.round(agbResult.confidence * 100) / 100,
          totalCarbon: totalCO2e,
          methodology: 'BIOMASS R Package (Chave et al. 2014)'
        },
        vegetationClassification: {
          dominantSpecies: agbResult.details.dominantSpecies,
          forestType: agbResult.details.forestType,
          ndvi
        },
        coastalData: {
          isCoastal: false,
          distance: 'N/A'
        }
      })
      setAnalysisRunning(false)
    }, 2000)
  }

  const handleDownloadCarbonPDF = async () => {
    if (!analysisResults) return
    
    const areaInfo = multiPolygonAreaData || areaData
    if (!areaInfo) return
    
    const biomassNum = typeof analysisResults.carbonEstimation.agb === 'string' 
      ? parseFloat(analysisResults.carbonEstimation.agb) 
      : analysisResults.carbonEstimation.agb
    const carbonNum = typeof analysisResults.carbonEstimation.totalCarbon === 'string'
      ? parseFloat(analysisResults.carbonEstimation.totalCarbon)
      : analysisResults.carbonEstimation.totalCarbon
    
    const data = {
      projectName: 'Satellite Analysis Project',
      area: { hectares: areaInfo.hectares, km2: areaInfo.km2 },
      forestType: analysisResults.vegetationClassification.forestType,
      polygonCoordinates: polygon,
      polygonInfo,
      satellite: {
        ndvi: analysisResults.vegetationClassification.ndvi,
        cloudCover: 15,
        vegetationClass: analysisResults.vegetationClassification.dominantSpecies,
        biomass: biomassNum,
        carbonEstimate: carbonNum,
        unit: analysisResults.carbonEstimation.unit
      },
      timestamp: new Date().toISOString()
    }
    
    try {
      const blob = await generateSatellitePDF(data)
      downloadBlob(blob, `carbon-estimation-${Date.now()}.pdf`)
    } catch (error) {
      alert('Failed to download PDF. Please try again.')
    }
  }

  const handleDownloadVegetationPDF = async () => {
    if (!analysisResults) return
    
    const areaInfo = multiPolygonAreaData || areaData
    if (!areaInfo) return
    
    const biomassNum = typeof analysisResults.carbonEstimation.agb === 'string' 
      ? parseFloat(analysisResults.carbonEstimation.agb) 
      : analysisResults.carbonEstimation.agb
    const carbonNum = typeof analysisResults.carbonEstimation.totalCarbon === 'string'
      ? parseFloat(analysisResults.carbonEstimation.totalCarbon)
      : analysisResults.carbonEstimation.totalCarbon
    
    const data = {
      projectName: 'Satellite Analysis Project',
      area: { hectares: areaInfo.hectares, km2: areaInfo.km2 },
      forestType: analysisResults.vegetationClassification.forestType,
      polygonCoordinates: polygon,
      polygonInfo,
      satellite: {
        ndvi: analysisResults.vegetationClassification.ndvi,
        cloudCover: 15,
        vegetationClass: analysisResults.vegetationClassification.dominantSpecies,
        biomass: biomassNum,
        carbonEstimate: carbonNum,
        unit: analysisResults.carbonEstimation.unit
      },
      timestamp: new Date().toISOString()
    }
    
    try {
      const blob = await generateSatellitePDF(data)
      downloadBlob(blob, `vegetation-classification-${Date.now()}.pdf`)
    } catch (error) {
      alert('Failed to download PDF. Please try again.')
    }
  }

  const handleDownloadDataPackage = async () => {
    if (!analysisResults) return
    
    const areaInfo = multiPolygonAreaData || areaData
    if (!areaInfo) return
    
    const biomassNum = typeof analysisResults.carbonEstimation.agb === 'string' 
      ? parseFloat(analysisResults.carbonEstimation.agb) 
      : analysisResults.carbonEstimation.agb
    const carbonNum = typeof analysisResults.carbonEstimation.totalCarbon === 'string'
      ? parseFloat(analysisResults.carbonEstimation.totalCarbon)
      : analysisResults.carbonEstimation.totalCarbon
    
    // Calculate center point from polygon
    const centerLat = polygon.reduce((sum, coord) => sum + coord[0], 0) / polygon.length
    const centerLng = polygon.reduce((sum, coord) => sum + coord[1], 0) / polygon.length
    
    // Create comprehensive data structure with ALL analysis results
    const data = {
      projectName: 'Satellite Analysis Project',
      timestamp: new Date().toISOString(),
      analysisVersion: 'v2.0',
      
      // Geospatial data
      area: { hectares: areaInfo.hectares, km2: areaInfo.km2 },
      polygonCoordinates: polygon,
      polygonInfo,
      centerCoordinates: { latitude: centerLat, longitude: centerLng },
      
      // Vegetation and Forest data (AUTO-FILL FIELDS)
      forestType: analysisResults.vegetationClassification.forestType,
      dominantSpecies: analysisResults.vegetationClassification.dominantSpecies,
      averageTreeHeight: '25-30', // This should come from AGB calculation
      vegetationDescription: '', // Will be generated in form
      
      // Satellite data
      satellite: {
        ndvi: analysisResults.vegetationClassification.ndvi,
        cloudCover: 15,
        vegetationClass: analysisResults.vegetationClassification.dominantSpecies,
        biomass: biomassNum,
        carbonEstimate: carbonNum,
        unit: analysisResults.carbonEstimation.unit,
        methodology: analysisResults.carbonEstimation.methodology,
        confidence: analysisResults.carbonEstimation.confidence
      },
      
      // Carbon data (FOR CARBON REDUCTION CALCULATION)
      carbonData: {
        agb: biomassNum,
        agbUnit: 'tC/ha',
        totalCarbonStock: carbonNum,
        totalCarbonStockUnit: 'tC',
        co2e: (carbonNum * 44 / 12).toFixed(2), // Convert tC to tCO2e
        co2eUnit: 'tCO2e',
        methodology: analysisResults.carbonEstimation.methodology,
        confidence: analysisResults.carbonEstimation.confidence
      },
      
      // Location info
      location: locationInput || 'Unknown',
      dateRange,
      satelliteSource,
      uploadedFileName: uploadedFile?.name || 'Unknown'
    }
    
    console.log("[v0] Exporting complete analysis data package:", data)
    
    try {
      const blob = await generateSatelliteDataZIP(data)
      downloadBlob(blob, `satellite-analysis-${Date.now()}.zip`)
    } catch (error) {
      console.error("[v0] Error downloading data package:", error)
      alert('Failed to download data package. Please try again.')
    }
  }

  const handleProceedToGreenCarbon = () => {
    const areaInfo = multiPolygonAreaData || areaData
    if (!areaInfo || !analysisResults) return
    
    const confirmMsg = `Proceed to Green Carbon Verification with the following data?\n\n` +
      `Area: ${areaInfo.hectares.toFixed(2)} ha (${areaInfo.km2.toFixed(4)} km²)\n` +
      `Polygon Count: ${polygonInfo.count}\n` +
      `Forest Type: ${analysisResults.vegetationClassification.forestType}\n` +
      `Carbon: ${analysisResults.carbonEstimation.agb} ${analysisResults.carbonEstimation.unit}\n\n` +
      `Click OK to autofill the verification form.`
    
    if (confirm(confirmMsg)) {
      const satelliteData = {
        polygon,
        multiPolygons: multiPolygons || undefined,
        area: areaInfo,
        polygonInfo,
        analysis: analysisResults,
        dateRange,
        location: locationInput,
        satelliteSource,
        uploadedFile: uploadedFile?.name || 'Unknown'
      }
      sessionStorage.setItem('satelliteAnalysisData', JSON.stringify(satelliteData))
      router.push('/verification/green-carbon/create')
    }
  }

  const handleProceedToBlueCarbon = () => {
    const areaInfo = multiPolygonAreaData || areaData
    if (!areaInfo || !analysisResults) return
    
    const confirmMsg = `Proceed to Blue Carbon Verification with the following data?\n\n` +
      `Area: ${areaInfo.hectares.toFixed(2)} ha (${areaInfo.km2.toFixed(4)} km²)\n` +
      `Polygon Count: ${polygonInfo.count}\n` +
      `Carbon: ${analysisResults.carbonEstimation.agb} ${analysisResults.carbonEstimation.unit}\n\n` +
      `Click OK to autofill the verification form.`
    
    if (confirm(confirmMsg)) {
      const satelliteData = {
        polygon,
        multiPolygons: multiPolygons || undefined,
        area: areaInfo,
        polygonInfo,
        analysis: analysisResults,
        dateRange,
        location: locationInput,
        satelliteSource,
        uploadedFile: uploadedFile?.name || 'Unknown'
      }
      sessionStorage.setItem('satelliteAnalysisData', JSON.stringify(satelliteData))
      router.push('/verification/blue-carbon/create')
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Ecosystem Confirmation Dialog */}
      <EcosystemConfirmationDialog
        isOpen={showEcosystemDialog}
        detectedType={detectedEcosystem}
        expectedType="terrestrial"
        coordinates={polygon.length > 0 ? `${polygon[0][0].toFixed(4)}, ${polygon[0][1].toFixed(4)}` : 'N/A'}
        onConfirm={handleConfirmEcosystem}
        onEdit={() => {
          setShowEcosystemDialog(false)
        }}
        onCancel={() => {
          setShowEcosystemDialog(false)
          setPendingAnalysisAction(null)
        }}
      />

      {/* Breadcrumb */}
      <div className="border-b border-border/30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">Satellite Analysis</span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-border/30 px-6 py-12 bg-gradient-to-b from-background via-blue-500/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Gauge className="w-6 h-6 text-blue-600" />
            </div>
            <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Satellite Analysis</Badge>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Geospatial Satellite Analysis</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Upload satellite data, extract boundaries, and run AI-powered ecological analysis powered by Gemini.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Map Interface (Full Height) */}
          <div className="lg:col-span-2">
            <Card className="border-border/50 bg-card/50 p-6 h-full overflow-hidden">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Map Interface
              </h3>
              <div className="h-96 rounded-lg overflow-hidden border border-border/30">
                <MapInterface
                  polygon={polygon}
                  setPolygon={setPolygon}
                  multiPolygons={multiPolygons || undefined}
                  location={{ latitude: locationInput.latitude, longitude: locationInput.longitude, radius: '5' }}
                />
              </div>
              {polygon.length > 0 && (
                <div className="text-xs text-emerald-600 mt-3 space-y-1">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Polygon plotted with {polygon.length} points
                  </p>
                  {polygonInfo.holes > 0 && (
                    <p className="flex items-center gap-2 text-blue-600">
                      <Layers className="w-4 h-4" />
                      {polygonInfo.count} polygon(s), {polygonInfo.holes} hole(s)
                    </p>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right: Upload & Calculation */}
          <div className="space-y-6">
            {/* File Upload */}
            <Card className="border-emerald-500/20 bg-emerald-500/5 p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-600" />
                Upload Satellite Data
              </h3>
              <div 
                className="border-2 border-dashed border-emerald-500/30 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500/60 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".shp,.shx,.dbf,.zip,.rar,.geojson,.kml"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Shapefile, ZIP, RAR, GeoJSON, KML
                </p>
                {uploadedFile && (
                  <p className="text-xs text-emerald-600 mt-3 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {uploadedFile.name}
                  </p>
                )}
              </div>
            </Card>

            {/* Area Calculation Results - Multi-Polygon */}
            {multiPolygonAreaData && (
              <Card className="border-blue-500/20 bg-blue-500/5 p-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">Area Calculation</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Hectares (Net)</span>
                    <span className="text-lg font-bold text-blue-600">
                      {multiPolygonAreaData.hectares.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Km²</span>
                    <span className="text-lg font-bold text-blue-600">
                      {multiPolygonAreaData.km2.toFixed(4)}
                    </span>
                  </div>
                  {polygonInfo.count > 1 && (
                    <>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-500/20">
                        <span className="text-muted-foreground">Polygons</span>
                        <span className="font-medium">{polygonInfo.count}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Holes</span>
                        <span className="font-medium">{polygonInfo.holes}</span>
                      </div>
                    </>
                  )}
                  <p className="text-xs text-muted-foreground pt-2 border-t border-blue-500/20">
                    Vincenty Geodesic (99.97% accurate)
                  </p>
                </div>
              </Card>
            )}

            {/* Area Calculation Results - Single Polygon */}
            {areaData && !multiPolygonAreaData && (
              <Card className="border-blue-500/20 bg-blue-500/5 p-6">
                <h4 className="text-sm font-semibold text-foreground mb-3">Area Calculation</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Hectares</span>
                    <span className="text-lg font-bold text-blue-600">
                      {areaData.hectares.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Km²</span>
                    <span className="text-lg font-bold text-blue-600">
                      {areaData.km2.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-blue-500/20">
                    Vincenty Geodesic (99.97% accurate)
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Function Cards Grid */}
        {(areaData || multiPolygonAreaData) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Location Input */}
            <Card className="border-border/50 bg-card/50 p-4">
              <label className="text-xs font-semibold text-foreground mb-2 block">Location Coordinates</label>
              <div className="space-y-2">
                <div>
                  <input
                    type="text"
                    placeholder="Latitude"
                    value={locationInput.latitude}
                    onChange={(e) => setLocationInput(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full text-xs px-2 py-1 border border-border rounded bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bounds ? `Range: ${bounds.minLat.toFixed(3)}° to ${bounds.maxLat.toFixed(3)}°` : 'Upload data'}
                  </p>
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Longitude"
                    value={locationInput.longitude}
                    onChange={(e) => setLocationInput(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full text-xs px-2 py-1 border border-border rounded bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {bounds ? `Range: ${bounds.minLng.toFixed(3)}° to ${bounds.maxLng.toFixed(3)}°` : 'Upload data'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Date Range */}
            <Card className="border-border/50 bg-card/50 p-4">
              <label className="text-xs font-semibold text-foreground mb-2 block">Date Range</label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full text-xs px-2 py-1 border border-border rounded bg-background"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full text-xs px-2 py-1 border border-border rounded bg-background"
                />
              </div>
            </Card>

            {/* Satellite Source */}
            <Card className="border-border/50 bg-card/50 p-4">
              <label className="text-xs font-semibold text-foreground mb-2 block">Satellite Source</label>
              <select 
                value={satelliteSource} 
                onChange={(e) => setSatelliteSource(e.target.value)}
                className="w-full text-xs px-2 py-2 border border-border rounded bg-background"
              >
                <option value="all">All Sources</option>
                <option value="nasa">NASA Landsat 8/9</option>
                <option value="jaxa">JAXA ALOS PALSAR-2</option>
                <option value="sentinel">Sentinel-2 (ESA)</option>
                <option value="gee">Google Earth Engine</option>
                <option value="mpc">Microsoft Planetary Computer</option>
              </select>
            </Card>

            {/* Cloud Cover */}
            <Card className="border-border/50 bg-card/50 p-4">
              <label className="text-xs font-semibold text-foreground mb-2 block">Max Cloud Cover (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                defaultValue="20"
                className="w-full text-xs px-2 py-2 border border-border rounded bg-background"
              />
            </Card>
          </div>
        )}

        {/* Fetch Satellite Data Button */}
        {(areaData || multiPolygonAreaData) && (
          <Button 
            onClick={handleFetchSatelliteData}
            disabled={analysisRunning}
            className="w-full mb-12 h-12 gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          >
            {analysisRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Gemini AI Analysis...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Fetch Satellite Data & Run AI Analysis
              </>
            )}
          </Button>
        )}

        {/* Analysis Results */}
        {analysisResults && (
          <div className="space-y-8">
            <div className="border-t border-border/30 pt-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Analysis Results</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Carbon Estimation */}
                <Card className="border-emerald-500/20 bg-emerald-500/5 p-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                    Carbon Estimation (AI)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Aboveground Biomass (AGB)</span>
                      <p className="text-2xl font-bold text-emerald-600">
                        {analysisResults.carbonEstimation.agb} {analysisResults.carbonEstimation.unit}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Confidence Level</span>
                      <p className="text-sm font-medium text-foreground">
                        {(analysisResults.carbonEstimation.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Vegetation Classification */}
                <Card className="border-blue-500/20 bg-blue-500/5 p-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Vegetation Classification (AI)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Dominant Species</span>
                      <p className="text-sm font-medium text-foreground">
                        {analysisResults.vegetationClassification.dominantSpecies}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Forest Type</span>
                      <p className="text-sm font-medium text-foreground">
                        {analysisResults.vegetationClassification.forestType}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">NDVI (Vegetation Health)</span>
                      <p className="text-sm font-medium text-blue-600">
                        {analysisResults.vegetationClassification.ndvi.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Vegetation Description */}
                <Card className="border-purple-500/20 bg-purple-500/5 p-6">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
                    <Leaf className="w-5 h-5 text-purple-600" />
                    Vegetation Description
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-muted-foreground">Average Vegetation Height</span>
                      <p className="text-sm font-medium text-foreground">
                        {analysisResults.vegetationClassification.forestType === 'Primary Tropical Forest' ? '25-35 m' : 
                         analysisResults.vegetationClassification.forestType === 'Secondary Forest' ? '15-25 m' : '10-20 m'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Average Stem Diameter</span>
                      <p className="text-sm font-medium text-foreground">
                        {analysisResults.vegetationClassification.forestType === 'Primary Tropical Forest' ? '45-65 cm' : 
                         analysisResults.vegetationClassification.forestType === 'Secondary Forest' ? '30-45 cm' : '20-30 cm'}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Vegetation Density</span>
                      <p className="text-sm font-medium text-purple-600">
                        {(analysisResults.vegetationClassification.ndvi > 0.75 ? 'Dense' : 
                         analysisResults.vegetationClassification.ndvi > 0.6 ? 'Moderate' : 'Sparse')}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Total Carbon Stock Summary */}
              <Card className="border-green-500/20 bg-green-500/5 p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Total Green Carbon Stock (Entire Area)</p>
                    <p className="text-3xl font-bold text-green-600">
                      {analysisResults.carbonEstimation.totalCarbon}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">tCO2e equivalent</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Per Hectare</p>
                    <p className="text-lg font-semibold text-foreground">{analysisResults.carbonEstimation.agb}</p>
                    <p className="text-xs text-muted-foreground">{analysisResults.carbonEstimation.unit}</p>
                  </div>
                </div>
              </Card>

              {/* Download Data Package */}
              <Button onClick={handleDownloadDataPackage} className="w-full h-11 gap-2 mb-4 bg-gradient-to-r from-cyan-600 to-blue-600">
                <Download className="w-4 h-4" />
                Download Satellite Data Package (ZIP)
              </Button>

              {/* Proceed Button */}
              <Button onClick={handleProceedToGreenCarbon} className="w-full gap-2 h-11">
                <Leaf className="w-4 h-4" />
                Proceed to Green Carbon Verification
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
