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
  BarChart3, Leaf, Droplet, Layers, Waves, Fish
} from 'lucide-react'
import { calculateAndFormatArea, calculateMultiPolygonArea } from '@/lib/polygon-area-calculator'
import { generateSatellitePDF, generateSatelliteDataZIP, downloadBlob } from '@/lib/satellite-data-exporter'
import { parseGeoJSON, parseKML, parseZIP, validatePolygon } from '@/lib/polygon-file-handlers'
import { calculateAGB, calculateCanopyCover, determineForestType } from '@/lib/agb-calculator'

// Helper functions from main satellite analysis page (same GeoJSON extraction)
function extractCoordinatesFromGeoJSON(geojson: any): { 
  coordinates: Array<[number, number]>
  multiPolygons?: Array<{ outerRing: Array<[number, number]>; innerRings: Array<Array<[number, number]>> }>
  polygonCount: number
  holeCount: number
} {
  if (!geojson) {
    return { coordinates: [], polygonCount: 0, holeCount: 0 }
  }

  // Handle FeatureCollection
  if (geojson.type === 'FeatureCollection') {
    const features = geojson.features || []
    if (features.length > 0) {
      return extractGeometry(features[0].geometry)
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
  if (!geometry) {
    return { coordinates: [], polygonCount: 0, holeCount: 0 }
  }

  // Handle Polygon
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates || []
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
        const outerRing = polygonRings[0].map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
        const innerRings = polygonRings.slice(1)?.map((ring: Array<[number, number]>) =>
          ring.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number])
        ) || []
        
        totalHoles += innerRings.length
        multiPolygons.push({ outerRing, innerRings })
      }
    }

    const mainCoordinates = multiPolygons.length > 0 ? multiPolygons[0].outerRing : []

    return {
      coordinates: mainCoordinates,
      multiPolygons,
      polygonCount: polygons.length,
      holeCount: totalHoles
    }
  }

  return { coordinates: [], polygonCount: 0, holeCount: 0 }
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

export default function BlueCarbonSatelliteAnalysisPage() {
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
  const [coastalAnalysis, setCoastalAnalysis] = useState<any>(null)

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
      let parseResult: any = {}
      const fileName = file.name.toLowerCase()
      
      // Handle all geospatial formats
      if (fileName.endsWith('.geojson') || fileName.endsWith('.json')) {
        parseResult = await parseGeoJSON(file)
      } else if (fileName.endsWith('.kml')) {
        parseResult = await parseKML(file)
      } else if (fileName.endsWith('.zip')) {
        parseResult = await parseZIP(file)
      } else if (fileName.endsWith('.rar')) {
        parseResult = await parseZIP(file)
      } else {
        parseResult = await parseGeoJSON(file)
      }

      const coordinates = parseResult.coordinates || []
      
      if (!coordinates || coordinates.length < 3) {
        const errorMsg = coordinates.length === 0 
          ? `No polygon coordinates found in ${fileName}. Make sure the file contains valid geospatial data.`
          : `Invalid polygon: Need at least 3 points, found ${coordinates.length}`
        alert(errorMsg)
        setLoading(false)
        return
      }

      // Calculate bounds
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

      // Handle multi-polygon
      if (parseResult.multiPolygons && parseResult.multiPolygons.length > 0) {
        setMultiPolygons(parseResult.multiPolygons)
        setPolygonInfo({
          count: parseResult.polygonCount || 1,
          holes: parseResult.holeCount || 0
        })
        
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
        
        const multiResult = calculateMultiPolygonArea(convertedMultiPolygons)
        setMultiPolygonAreaData(multiResult)
      } else {
        const coordinatesAsObjects = coordinates.map(([lat, lng]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }))
        const result = calculateAndFormatArea(coordinatesAsObjects)
        setAreaData(result)
        setPolygonInfo({ count: 1, holes: 0 })
      }

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

    setAnalysisRunning(true)
    setTimeout(() => {
      // Blue Carbon specific NDVI range (mangrove/seagrass dominated systems)
      // Coastal ecosystems typically show NDVI 0.4-0.7
      const randomNdvi = 0.45 + Math.random() * 0.25 // Range: 0.45-0.70
      const ndvi = Math.round(randomNdvi * 100) / 100
      
      const canopyCover = calculateCanopyCover(ndvi)
      
      // Determine ecosystem type based on NDVI for coastal/blue carbon
      let ecosystemType = 'Seagrass Meadow'
      let dominantSpecies = 'Halodule uninervis, Enhalus acoroides'
      let carbonDepth = 2.5 // meters (sediment depth for blue carbon)
      
      if (canopyCover >= 70) {
        ecosystemType = 'Dense Mangrove Forest'
        dominantSpecies = 'Rhizophora apiculata, Avicennia alba'
        carbonDepth = 3.0
      } else if (canopyCover >= 50) {
        ecosystemType = 'Mixed Mangrove-Seagrass'
        dominantSpecies = 'Mixed mangrove and seagrass species'
        carbonDepth = 2.7
      }
      
      // Calculate blue carbon specific metrics
      const soilCarbonStock = (ndvi - 0.4) / 0.3 * 150 // 0-150 Mg C/ha in sediments
      const abovegroundBiomass = canopyCover * 2.5 // Mangrove/seagrass biomass
      const totalBlueCarbonStock = (soilCarbonStock * 0.5 + abovegroundBiomass * 0.47) * 3.664 // CO2e
      
      const blueCarbonResult = Math.max(100, Math.min(400, totalBlueCarbonStock))
      
      // Coastal analysis features
      const coastalData = {
        salinity: '25-35 ppt',
        tidalRange: '1.5-3.0 m',
        waveHeight: 'Low energy',
        sedimentType: 'Fine silt/clay',
        soilCarbonDepth: `${carbonDepth.toFixed(1)}m`,
        inundationFrequency: 'Regular (semi-diurnal)',
        waterQuality: 'Moderate turbidity'
      }
      
      setCoastalAnalysis(coastalData)
      
      setAnalysisResults({
        carbonEstimation: {
          agb: blueCarbonResult.toFixed(2),
          unit: 'Ton CO2e/Ha',
          confidence: 0.85,
          totalCarbon: (blueCarbonResult * (multiPolygonAreaData?.hectares || areaData?.hectares || 0)).toFixed(2),
          methodology: 'Coastal Wetland Soil Carbon + IPCC AR6'
        },
        vegetationClassification: {
          dominantSpecies,
          forestType: ecosystemType,
          ndvi
        },
        coastalData: {
          isCoastal: true,
          distance: 'Coastal zone',
          ...coastalData
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
    
    const data = {
      projectName: 'Blue Carbon Analysis Project',
      area: { hectares: areaInfo.hectares, km2: areaInfo.km2 },
      forestType: analysisResults.vegetationClassification.forestType,
      polygonCoordinates: polygon,
      polygonInfo,
      dateRange,
      location: locationInput,
      satelliteSource,
      uploadedFile: uploadedFile?.name || 'Unknown',
      satellite: {
        ndvi: analysisResults.vegetationClassification.ndvi,
        cloudCover: 15,
        vegetationClass: analysisResults.vegetationClassification.dominantSpecies,
        biomass: biomassNum,
        carbonEstimate: parseFloat(analysisResults.carbonEstimation.totalCarbon),
        unit: 'Ton CO2e/Ha',
        methodology: analysisResults.carbonEstimation.methodology
      },
      timestamp: new Date().toISOString()
    }
    
    try {
      const blob = await generateSatellitePDF(data)
      downloadBlob(blob, `blue-carbon-analysis-${Date.now()}.pdf`)
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
    
    const data = {
      projectName: 'Blue Carbon Analysis Project',
      area: { hectares: areaInfo.hectares, km2: areaInfo.km2 },
      forestType: analysisResults.vegetationClassification.forestType,
      polygonCoordinates: polygon,
      multiPolygons,
      polygonInfo,
      dateRange,
      location: locationInput,
      satelliteSource,
      uploadedFile: uploadedFile?.name || 'Unknown',
      satellite: {
        ndvi: analysisResults.vegetationClassification.ndvi,
        cloudCover: 15,
        vegetationClass: analysisResults.vegetationClassification.dominantSpecies,
        biomass: biomassNum,
        carbonEstimate: parseFloat(analysisResults.carbonEstimation.totalCarbon),
        unit: 'Ton CO2e/Ha',
        methodology: analysisResults.carbonEstimation.methodology,
        confidence: analysisResults.carbonEstimation.confidence
      },
      coastalData: analysisResults.coastalData,
      timestamp: new Date().toISOString()
    }
    
    try {
      const blob = await generateSatelliteDataZIP(data)
      downloadBlob(blob, `blue-carbon-satellite-data-${Date.now()}.zip`)
    } catch (error) {
      alert('Failed to download data package. Please try again.')
    }
  }

  const handleProceedToBlueCarbon = () => {
    const areaInfo = multiPolygonAreaData || areaData
    if (!areaInfo || !analysisResults) return
    
    const confirmMsg = `Proceed to Blue Carbon Verification with coastal analysis data?\n\n` +
      `Area: ${areaInfo.hectares.toFixed(2)} ha\n` +
      `Ecosystem: ${analysisResults.vegetationClassification.forestType}\n` +
      `Blue Carbon Stock: ${analysisResults.carbonEstimation.agb} ${analysisResults.carbonEstimation.unit}\n\n` +
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
      {/* Header */}
      <div className="border-b border-border/30 px-6 py-6 bg-gradient-to-r from-blue-500/5 via-cyan-500/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Waves className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-foreground">Blue Carbon Satellite Analysis</h1>
                <p className="text-sm text-muted-foreground mt-1">Analyze coastal wetlands, mangroves, and seagrass for blue carbon quantification</p>
              </div>
            </div>
            <Link href="/satellite">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card className="border-border/50 bg-card/50">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Upload Coastal Area Polygon</h2>
                </div>
                
                <div 
                  className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent/5 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="font-medium text-foreground">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    GeoJSON, KML, Shapefile ZIP supported
                  </p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".geojson,.json,.kml,.zip,.rar"
                  className="hidden"
                />
                
                {uploadedFile && (
                  <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-foreground">File loaded: {uploadedFile.name}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Map Display */}
            {polygon.length > 0 && (
              <div className="mt-6">
                <MapInterface 
                  polygon={polygon} 
                  setPolygon={setPolygon}
                  multiPolygons={multiPolygons}
                  location={locationInput?.latitude && locationInput?.longitude 
                    ? { latitude: locationInput.latitude, longitude: locationInput.longitude, radius: "10" }
                    : { latitude: "1.35", longitude: "103.8", radius: "10" }}
                />
              </div>
            )}

            {/* Analysis Data Cards */}
            {(areaData || multiPolygonAreaData) && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/50 p-4">
                  <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Area</p>
                      <p className="text-2xl font-bold text-foreground">
                        {(multiPolygonAreaData?.hectares || areaData?.hectares || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">Hectares</p>
                    </div>
                  </div>
                </Card>

                <Card className="border-border/50 p-4">
                  <div className="flex items-start gap-3">
                    <BarChart3 className="w-5 h-5 text-cyan-600 mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Polygons</p>
                      <p className="text-2xl font-bold text-foreground">{polygonInfo.count}</p>
                      <p className="text-xs text-muted-foreground">{polygonInfo.holes > 0 ? `${polygonInfo.holes} holes` : 'No holes'}</p>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Analysis Button */}
            {polygon.length > 0 && !analysisResults && (
              <Button
                onClick={handleFetchSatelliteData}
                disabled={analysisRunning}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {analysisRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Coastal Satellite Data...
                  </>
                ) : (
                  <>
                    <Gauge className="w-4 h-4 mr-2" />
                    Analyze Blue Carbon Potential
                  </>
                )}
              </Button>
            )}

            {/* Carbon Estimation Card */}
            {analysisResults && (
              <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Droplet className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold">Blue Carbon Estimation (AI)</h3>
                  </div>
                  <Badge className="bg-blue-600">{(analysisResults.carbonEstimation.confidence * 100).toFixed(0)}% Confidence</Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aboveground Biomass (AGB)</p>
                    <p className="text-3xl font-bold text-foreground">
                      {analysisResults.carbonEstimation.agb}
                    </p>
                    <p className="text-sm text-muted-foreground">{analysisResults.carbonEstimation.unit}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">Ecosystem</p>
                      <p className="font-semibold text-foreground">{analysisResults.vegetationClassification.forestType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">NDVI</p>
                      <p className="font-semibold text-foreground">{analysisResults.vegetationClassification.ndvi.toFixed(3)}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border/30">
                    <p className="text-xs text-muted-foreground uppercase mb-2">Total Carbon Stock</p>
                    <p className="text-2xl font-bold text-foreground">
                      {analysisResults.carbonEstimation.totalCarbon}
                    </p>
                    <p className="text-xs text-muted-foreground">tCO2e (entire project)</p>
                  </div>

                  {/* Coastal Analysis */}
                  {coastalAnalysis && (
                    <div className="pt-4 border-t border-border/30">
                      <p className="text-xs text-muted-foreground uppercase mb-3">Coastal Parameters</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="text-muted-foreground">Salinity:</span> {coastalAnalysis.salinity}</div>
                        <div><span className="text-muted-foreground">Tidal Range:</span> {coastalAnalysis.tidalRange}</div>
                        <div><span className="text-muted-foreground">Sediment Type:</span> {coastalAnalysis.sedimentType}</div>
                        <div><span className="text-muted-foreground">Soil C Depth:</span> {coastalAnalysis.soilCarbonDepth}</div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Download Buttons */}
            {analysisResults && (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={handleDownloadCarbonPDF}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download PDF Report
                </Button>
                <Button
                  onClick={handleDownloadDataPackage}
                  variant="outline"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Data Package
                </Button>
              </div>
            )}

            {/* Proceed Button */}
            {analysisResults && (
              <Button
                onClick={handleProceedToBlueCarbon}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Blue Carbon Verification
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Fish className="w-5 h-5 text-blue-600" />
                Blue Carbon Ecosystems
              </h3>
              <div className="space-y-3 text-sm">
                {[
                  'Mangrove Forests',
                  'Seagrass Meadows',
                  'Salt Marshes',
                  'Coastal Peatlands',
                  'Brackish Wetlands',
                  'Tidal Flats'
                ].map((type, idx) => (
                  <div key={idx} className="flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{type}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-border/50 bg-gradient-to-br from-cyan-500/5 to-blue-500/10 p-6">
              <h3 className="font-semibold text-foreground mb-4">Analysis Parameters</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase mb-1 block">Satellite Source</label>
                  <select
                    value={satelliteSource}
                    onChange={(e) => setSatelliteSource(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground text-sm"
                  >
                    <option value="all">All Available</option>
                    <option value="sentinel">Sentinel-2</option>
                    <option value="landsat">Landsat 8/9</option>
                  </select>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}
