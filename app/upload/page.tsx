"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Upload, Loader2, ArrowLeft, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"
import { WalletConnect } from "@/components/wallet-connect"
import { calculateAndFormatArea } from "@/lib/polygon-area-calculator"

interface Coordinate {
  id: number
  latitude: string
  longitude: string
}

interface FormData {
  projectName: string
  projectDescription: string
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  carbonOffsetType: string
  ownershipProof: File | null
  truthStatement: File | null
  coordinates: Coordinate[]
  satelliteData?: {
    bands?: any
    area_ha?: number
    features?: any
    polygon_area_ha?: number
    biomass_agb_mean?: number
    carbon_tC?: number
    co2_tCO2?: number
    net_verified_co2?: number
  }
  calculatedAreaHa?: number
  calculatedAreaKm2?: number
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    projectName: "",
    projectDescription: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    carbonOffsetType: "",
    ownershipProof: null,
    truthStatement: null,
    coordinates: [{ id: 1, latitude: "", longitude: "" }],
  })

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    setFiles([...files, ...droppedFiles])
  }

  const handleSatelliteDataImport = async (file: File) => {
    try {
      const JSZip = (await import("jszip")).default
      const zip = await JSZip.loadAsync(file)

      // Look for verification_data.json
      const verificationFile = zip.file("verification_data.json")
      if (!verificationFile) {
        alert("Invalid satellite data file. Missing verification_data.json")
        return
      }

      const content = await verificationFile.async("text")
      const data = JSON.parse(content)

      if (data.type !== "satellite_verification_data") {
        alert("Invalid verification data format")
        return
      }

      let polygonAreaHa = 0
      if (data.satelliteMetadata?.polygon && Array.isArray(data.satelliteMetadata.polygon)) {
        const polygon = data.satelliteMetadata.polygon
        const coords = polygon.map((p: any) => ({
          latitude: Array.isArray(p) ? p[0] : p.latitude,
          longitude: Array.isArray(p) ? p[1] : p.longitude,
        }))
        // Calculate area from polygon coordinates using Shoelace formula
        polygonAreaHa = calculatePolygonAreaFromCoords(coords)
        console.log("[v0] Calculated polygon area from satellite data:", polygonAreaHa, "ha")
      }

      const carbonData = data.carbonData || {}

      setFormData((prev) => ({
        ...prev,
        projectDescription: prev.projectDescription || data.projectDescription || "",
        coordinates:
          data.coordinates && data.coordinates.length > 0
            ? data.coordinates.slice(0, 2).map((coord: any, idx: number) => ({
                id: idx + 1,
                latitude: String(coord.latitude),
                longitude: String(coord.longitude),
              }))
            : prev.coordinates,
        satelliteData: {
          bands: data.results?.[0]?.bands,
          area_ha: polygonAreaHa,
          polygon_area_ha: polygonAreaHa,
          features: data.results?.[0]?.indices,
          // Store the original carbon calculations from satellite page
          biomass_agb_mean: carbonData.biomass_agb_mean,
          carbon_tC: carbonData.carbon_tC,
          co2_tCO2: carbonData.co2_tCO2,
          net_verified_co2: carbonData.net_verified_co2,
        },
        calculatedAreaHa: polygonAreaHa,
        calculatedAreaKm2: polygonAreaHa / 100, // Convert hectares to km2
      }))

      console.log("[v0] Satellite data imported successfully with area:", polygonAreaHa, "ha and verified carbon data")
      alert("Satellite data imported successfully! Please review and complete remaining fields.")
    } catch (error) {
      console.error("[v0] Error importing satellite data:", error)
      alert("Failed to import satellite data. Please check the file format.")
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)

      newFiles.forEach((file) => {
        if (file.name.includes("satellite-verification-data") && file.name.endsWith(".zip")) {
          handleSatelliteDataImport(file)
        }
      })

      setFiles([...files, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleFormChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCoordinateChange = (id: number, field: "latitude" | "longitude", value: string) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: prev.coordinates.map((coord) => (coord.id === id ? { ...coord, [field]: value } : coord)),
    }))
  }

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFormChange("ownershipProof", e.target.files[0])
    }
  }

  const handleStatementFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFormChange("truthStatement", e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.projectName || !formData.ownerName || !formData.ownershipProof || !formData.truthStatement) {
      alert("Please fill all required fields")
      return
    }

    const filledCoordinates = formData.coordinates.filter((c) => c.latitude && c.longitude)
    if (filledCoordinates.length < 1) {
      alert("At least one coordinate point must be filled")
      return
    }

    const numericCoordinates = filledCoordinates.map((c) => ({
      latitude: Number.parseFloat(String(c.latitude)),
      longitude: Number.parseFloat(String(c.longitude)),
    }))

    const areaCalc = calculateAndFormatArea(numericCoordinates)

    setFormData((prev) => ({
      ...prev,
      calculatedAreaHa: areaCalc.hectares,
      calculatedAreaKm2: areaCalc.km2,
    }))
    setShowPreview(true)
  }

  const handleConfirmSubmission = async () => {
    setIsProcessing(true)
    sessionStorage.setItem("projectFormData", JSON.stringify(formData))
    await new Promise((resolve) => setTimeout(resolve, 2000))
    router.push("/results")
  }

  const calculatePolygonAreaFromCoords = (coords: Array<{ latitude: number; longitude: number }>): number => {
    if (coords.length < 3) return 0

    let area = 0
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length
      area += coords[i].longitude * coords[j].latitude
      area -= coords[j].longitude * coords[i].latitude
    }
    area = Math.abs(area) / 2

    // Convert from degrees² to km² (approximate at equator: 1 degree ≈ 111 km)
    // More accurate: use meters directly, then convert to hectares
    const metersPerDegree = 111320 // At equator
    const areaKm2 = (area * metersPerDegree * metersPerDegree) / 1000000
    const areaHa = areaKm2 * 100

    return Math.round(areaHa * 100) / 100
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

      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 text-accent hover:text-accent/80 mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <h2 className="text-4xl font-bold mb-2">Upload Ecological Dataset</h2>
        <p className="text-muted-foreground mb-8">
          Submit satellite imagery, field reports, carbon project documents, and soil/biomass data for validation
        </p>

        <Card className="bg-card border-border p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Project Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleFormChange("projectName", e.target.value)}
                placeholder="Enter project name"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Project Description</label>
              <textarea
                value={formData.projectDescription}
                onChange={(e) => handleFormChange("projectDescription", e.target.value)}
                placeholder="Detailed description of the carbon offset project"
                rows={3}
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Project Owner Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Owner Name *</label>
              <input
                type="text"
                value={formData.ownerName}
                onChange={(e) => handleFormChange("ownerName", e.target.value)}
                placeholder="Full name of project owner"
                className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.ownerEmail}
                  onChange={(e) => handleFormChange("ownerEmail", e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.ownerPhone}
                  onChange={(e) => handleFormChange("ownerPhone", e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Carbon Offset Type</h3>
          <div>
            <label className="block text-sm font-medium mb-3">Select Carbon Offset Type *</label>
            <select
              value={formData.carbonOffsetType}
              onChange={(e) => handleFormChange("carbonOffsetType", e.target.value)}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">-- Select Carbon Offset Type --</option>

              {/* Green Carbon */}
              <optgroup label="Green Carbon">
                <option value="reforestation">Reforestation</option>
                <option value="afforestation">Afforestation</option>
                <option value="forest-conservation">Forest Conservation</option>
                <option value="sustainable-forest-management">Sustainable Forest Management</option>
                <option value="agroforestry">Agroforestry</option>
                <option value="regenerative-agriculture">Regenerative Agriculture</option>
                <option value="grassland-restoration">Grassland & Pasture Restoration</option>
              </optgroup>

              {/* Blue Carbon */}
              <optgroup label="Blue Carbon">
                <option value="mangrove-restoration">Mangrove Restoration</option>
                <option value="seagrass-conservation">Seagrass Meadow Conservation</option>
                <option value="salt-marsh-restoration">Salt Marsh Restoration</option>
                <option value="kelp-forest-conservation">Kelp Forest Conservation</option>
                <option value="coral-reef-restoration">Coral Reef Restoration</option>
              </optgroup>

              {/* Energy & Industrial */}
              <optgroup label="Energy & Industrial">
                <option value="renewable-energy">Renewable Energy (Solar, Wind, Hydro)</option>
                <option value="biomass-energy">Biomass Energy Projects</option>
                <option value="geothermal-energy">Geothermal Energy</option>
                <option value="energy-efficiency">Energy Efficiency Improvements</option>
              </optgroup>

              {/* Soil & Agriculture */}
              <optgroup label="Soil & Agriculture">
                <option value="soil-carbon-sequestration">Soil Carbon Sequestration</option>
                <option value="no-till-agriculture">No-Till Agriculture</option>
                <option value="cover-crops">Cover Crop Implementation</option>
                <option value="biochar">Biochar Production & Sequestration</option>
                <option value="composting">Organic Waste Composting</option>
              </optgroup>

              {/* Wetlands & Water */}
              <optgroup label="Wetlands & Water">
                <option value="wetland-restoration">Wetland Restoration</option>
                <option value="peatland-restoration">Peatland Restoration & Protection</option>
                <option value="riparian-buffer">Riparian Buffer Restoration</option>
                <option value="water-conservation">Water Conservation & Treatment</option>
              </optgroup>

              {/* Methane & Waste */}
              <optgroup label="Methane & Waste">
                <option value="methane-capture">Methane Capture (Landfill & Agriculture)</option>
                <option value="livestock-management">Livestock Emission Reduction</option>
                <option value="waste-management">Waste Management & Recycling</option>
                <option value="wastewater-treatment">Wastewater Treatment</option>
              </optgroup>

              {/* Urban & Biodiversity */}
              <optgroup label="Urban & Biodiversity">
                <option value="urban-forest">Urban Forest Expansion</option>
                <option value="green-buildings">Green Buildings & Infrastructure</option>
                <option value="biodiversity-conservation">Biodiversity Conservation</option>
                <option value="wildlife-habitat">Wildlife Habitat Restoration</option>
              </optgroup>

              {/* Technology */}
              <optgroup label="Technology & Direct Capture">
                <option value="carbon-capture-storage">Carbon Capture & Storage (CCS)</option>
                <option value="direct-air-capture">Direct Air Capture (DAC)</option>
                <option value="carbon-utilization">Carbon Utilization Projects</option>
              </optgroup>

              {/* Other */}
              <option value="other">Other Carbon Offset Project</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Select the primary type of carbon offset project. Each category has specific validation criteria.
          </p>
        </Card>

        <Card className="bg-card border-border p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Ownership Proof & Data Truthfulness Statement</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-3">Upload Ownership Proof *</label>
              <div className="relative">
                <input
                  type="file"
                  id="proof-file"
                  onChange={handleProofFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label
                  htmlFor="proof-file"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-sm">
                      {formData.ownershipProof
                        ? formData.ownershipProof.name
                        : "Click or drag ownership proof document"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-3">Upload Data Truthfulness Statement *</label>
              <div className="relative">
                <input
                  type="file"
                  id="statement-file"
                  onChange={handleStatementFileChange}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <label
                  htmlFor="statement-file"
                  className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent/50 transition-colors"
                >
                  <div className="text-center">
                    <Upload className="w-5 h-5 text-accent mx-auto mb-1" />
                    <p className="text-sm">
                      {formData.truthStatement ? formData.truthStatement.name : "Click or drag truthfulness statement"}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-6 mb-8">
          <h3 className="text-xl font-semibold mb-6">Carbon Asset Location Coordinates</h3>
          <div className="space-y-3">
            {formData.coordinates.map((coord, index) => (
              <div
                key={coord.id}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-border last:border-b-0"
              >
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Point {index + 1} - Latitude {index === 0 && "*"}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={coord.latitude}
                    onChange={(e) => handleCoordinateChange(coord.id, "latitude", e.target.value)}
                    placeholder="-6.123456"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Point {index + 1} - Longitude {index === 0 && "*"}
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={coord.longitude}
                    onChange={(e) => handleCoordinateChange(coord.id, "longitude", e.target.value)}
                    placeholder="106.123456"
                    className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Format: Latitude (range -90 to 90), Longitude (range -180 to 180). At least one point is required.
          </p>
          <Button
            onClick={() => {
              const newId = Math.max(...formData.coordinates.map((c) => c.id), 0) + 1
              setFormData((prev) => ({
                ...prev,
                coordinates: [...prev.coordinates, { id: newId, latitude: "", longitude: "" }],
              }))
            }}
            variant="outline"
            className="mt-4"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Point
          </Button>
        </Card>

        {/* Upload Zone */}
        <Card
          className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer mb-8 ${
            isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="w-12 h-12 text-accent mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Drag and drop files here</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Supported: Satellite data ZIP, Images (GeoTIFF, JPEG, PNG), PDFs, CSV data
          </p>
          <Button variant="outline" className="border-border bg-transparent">
            Browse Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            onChange={handleFileInput}
            className="hidden"
            accept=".zip,.tif,.tiff,.jpg,.jpeg,.png,.pdf,.csv"
          />
        </Card>

        {/* File List */}
        {files.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h3>
            <div className="space-y-3">
              {files.map((file, index) => (
                <Card key={index} className="bg-card border-border p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mb-8">
          <Button
            onClick={handleSubmit}
            disabled={files.length === 0 || isProcessing}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting to Aura Subnet...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Submit for Validation
              </>
            )}
          </Button>
        </div>

        {/* Info Section */}
        <Card className="bg-card border-border p-6">
          <h4 className="font-semibold mb-2">Validation Process</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Dataset normalization and preprocessing</li>
            <li>Cross-validator dispatch to Baseline Validators</li>
            <li>AI Domain Model scoring (satellite, text, geospatial)</li>
            <li>Consensus formation and confidence weighting</li>
            <li>Integrity Class assignment and proof-chain generation</li>
          </ol>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto w-full">
            <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Preview Your Submission</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Project Information Section */}
              <div className="pb-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-3 text-accent">Project Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Project Name:</span>
                    <p className="font-medium">{formData.projectName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Description:</span>
                    <p className="font-medium whitespace-pre-wrap">{formData.projectDescription || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Carbon Offset Type:</span>
                    <p className="font-medium capitalize">{formData.carbonOffsetType.replace(/-/g, " ")}</p>
                  </div>
                </div>
              </div>

              {/* Owner Information Section */}
              <div className="pb-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-3 text-accent">Project Owner</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Owner Name:</span>
                    <p className="font-medium">{formData.ownerName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{formData.ownerEmail || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <p className="font-medium">{formData.ownerPhone || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Location & Area Section */}
              <div className="pb-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-3 text-accent">Location & Area</h3>
                <div className="space-y-3 text-sm">
                  {formData.coordinates
                    .filter((c) => c.latitude && c.longitude)
                    .map((coord, idx) => (
                      <div key={idx}>
                        <span className="text-muted-foreground">Point {idx + 1}:</span>
                        <p className="font-medium">
                          {coord.latitude}, {coord.longitude}
                        </p>
                      </div>
                    ))}
                  {formData.calculatedAreaHa && (
                    <div className="pt-2 border-t border-border">
                      <span className="text-muted-foreground">Total Area:</span>
                      <p className="font-medium text-lg text-accent">
                        {formData.calculatedAreaHa.toFixed(2)} ha ({formData.calculatedAreaKm2?.toFixed(2)} km²)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Files Section */}
              <div className="pb-6 border-b border-border">
                <h3 className="text-lg font-semibold mb-3 text-accent">Uploaded Files ({files.length})</h3>
                <div className="space-y-2 text-sm">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background p-2 rounded">
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-muted-foreground ml-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Proof Documents Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-accent">Documents Verified</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Ownership Proof: {formData.ownershipProof?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>Truthfulness Statement: {formData.truthStatement?.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3">
              <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1 border-border">
                Back to Edit
              </Button>
              <Button
                onClick={handleConfirmSubmission}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm & Submit
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
