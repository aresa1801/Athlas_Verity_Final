'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { MapInterface } from '@/components/satellite/map-interface'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, Download, MapPin, Calendar, Gauge, Zap, 
  AlertCircle, CheckCircle2, Loader2, ArrowRight,
  BarChart3, Leaf, Droplet
} from 'lucide-react'
import { calculateAndFormatArea } from '@/lib/polygon-area-calculator'

export default function SatelliteAnalysisPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [polygon, setPolygon] = useState<Array<[number, number]>>([])
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [areaData, setAreaData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [analysisRunning, setAnalysisRunning] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [locationInput, setLocationInput] = useState({ latitude: '', longitude: '' })
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setUploadedFile(file)
    
    // Simulate file parsing and area calculation
    try {
      // Extract coordinates from file (simplified)
      const mockCoordinates = [
        { latitude: -2.5, longitude: 118.0 },
        { latitude: -2.5, longitude: 118.1 },
        { latitude: -2.4, longitude: 118.1 },
        { latitude: -2.4, longitude: 118.0 },
      ]
      
      const result = calculateAndFormatArea(mockCoordinates)
      setAreaData(result)
      
      // Update polygon
      setPolygon(mockCoordinates.map(c => [c.latitude, c.longitude]))
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
    // Simulate Gemini AI analysis
    setTimeout(() => {
      setAnalysisResults({
        carbonEstimation: {
          agb: 287.4,
          unit: 'Mg/ha',
          confidence: 0.92
        },
        vegetationClassification: {
          dominantSpecies: 'Shorea spp., Dipterocarpus spp.',
          forestType: 'Tropical Rainforest',
          ndvi: 0.78
        },
        coastalData: {
          isCoastal: false,
          distance: 'N/A'
        }
      })
      setAnalysisRunning(false)
    }, 2000)
  }

  return (
    <main className="min-h-screen bg-background">
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
                  location={{ latitude: '-2.5', longitude: '118.0', radius: '5' }}
                />
              </div>
              {polygon.length > 0 && (
                <p className="text-xs text-emerald-600 mt-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Polygon plotted with {polygon.length} points
                </p>
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

            {/* Area Calculation Results */}
            {areaData && (
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
        {areaData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Location Input */}
            <Card className="border-border/50 bg-card/50 p-4">
              <label className="text-xs font-semibold text-foreground mb-2 block">Location Coordinates</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Latitude"
                  value={locationInput.latitude}
                  onChange={(e) => setLocationInput(prev => ({ ...prev, latitude: e.target.value }))}
                  className="w-full text-xs px-2 py-1 border border-border rounded bg-background"
                />
                <input
                  type="text"
                  placeholder="Longitude"
                  value={locationInput.longitude}
                  onChange={(e) => setLocationInput(prev => ({ ...prev, longitude: e.target.value }))}
                  className="w-full text-xs px-2 py-1 border border-border rounded bg-background"
                />
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
              <select className="w-full text-xs px-2 py-2 border border-border rounded bg-background">
                <option>NASA Landsat 8/9</option>
                <option>JAXA ALOS PALSAR-2</option>
                <option>Sentinel-2</option>
                <option>All Sources</option>
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
        {areaData && (
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Carbon Estimation */}
                <Card className="border-emerald-500/20 bg-emerald-500/5 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Leaf className="w-5 h-5 text-emerald-600" />
                      Carbon Estimation (AI)
                    </h3>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs">
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </div>
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      Vegetation Classification (AI)
                    </h3>
                    <Button size="sm" variant="ghost" className="gap-1 text-xs">
                      <Download className="w-3 h-3" />
                      PDF
                    </Button>
                  </div>
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
              </div>

              {/* Download Data Package */}
              <Button className="w-full h-11 gap-2 bg-gradient-to-r from-cyan-600 to-blue-600">
                <Download className="w-4 h-4" />
                Download Satellite Data Package (ZIP)
              </Button>

              {/* Proceed Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <Link href="/verification/green-carbon/create" className="w-full">
                  <Button className="w-full gap-2">
                    <Leaf className="w-4 h-4" />
                    Proceed to Green Carbon Verification
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
                <Link href="/verification/blue-carbon/create" className="w-full">
                  <Button className="w-full gap-2 variant-outline" variant="outline">
                    <Droplet className="w-4 h-4" />
                    Proceed to Blue Carbon Verification
                    <ArrowRight className="w-4 h-4 ml-auto" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
