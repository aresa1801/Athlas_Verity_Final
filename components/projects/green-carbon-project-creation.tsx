'use client'

import { useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Loader2, MapPin, Leaf, AlertTriangle, FileUp, Zap } from 'lucide-react'
import { useLoadingState } from '@/hooks/use-loading-state'
import { ProgressIndicator } from '@/components/progress-indicator'
import { ErrorAlert } from '@/components/error-alert'

interface ProjectData {
  // Section 1: Project Identity
  projectName: string
  organization: string
  country: string
  methodology: string
  
  // Section 2: Geospatial Data
  polygon: Array<[number, number]>
  totalArea: number
  forestType: string[]
  protectionType: string[]
  
  // Section 3: Ecological Data
  dominantSpecies: string
  averageCanopyHeight: string
  biomassEstimate: string
  ndvi: string
  
  // Section 4: Risk & Additionality
  deforestationRisk: string
  fireRisk: string
  climateVulnerability: string
  additionalityScore: string
  statementFile: File | null
}

export function GreenCarbonProjectCreation() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ProjectData>({
    projectName: '',
    organization: '',
    country: '',
    methodology: 'verra',
    polygon: [],
    totalArea: 0,
    forestType: [],
    protectionType: [],
    dominantSpecies: '',
    averageCanopyHeight: '',
    biomassEstimate: '',
    ndvi: '',
    deforestationRisk: '',
    fireRisk: '',
    climateVulnerability: '',
    additionalityScore: '',
    statementFile: null,
  })

  const { isLoading, progress, error, setError, setProgress } = useLoadingState()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const countryList = [
    { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
    { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
    { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
    { code: 'CD', name: 'Democratic Republic of Congo', flag: '🇨🇩' },
    { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  ]

  const forestTypes = [
    'Tropical Rainforest',
    'Tropical Dry Forest',
    'Subtropical Forest',
    'Temperate Forest',
    'Boreal Forest',
    'Mangrove Forest',
    'Peat Swamp Forest',
    'Montane Forest',
    'Cloud Forest',
  ]

  const protectionTypes = [
    'Strict Protection',
    'Sustainable Forest Management',
    'Reduced Impact Logging',
    'Community Forest Management',
    'Watershed Protection',
    'Biodiversity Corridor',
  ]

  const handleInputChange = (field: keyof ProjectData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setValidationErrors((prev) => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }

  const handleMultiSelect = (field: 'forestType' | 'protectionType', value: string) => {
    setFormData((prev) => {
      const current = prev[field] as string[]
      return {
        ...prev,
        [field]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      }
    })
  }

  const validateStep = useCallback((step: number): boolean => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.projectName.trim()) newErrors.projectName = 'Project name is required'
      if (!formData.organization.trim()) newErrors.organization = 'Organization name is required'
      if (!formData.country) newErrors.country = 'Country is required'
    }

    if (step === 2) {
      if (formData.polygon.length < 3) newErrors.polygon = 'Polygon must have at least 3 points'
      if (formData.totalArea === 0) newErrors.totalArea = 'Area must be greater than 0'
      if (formData.forestType.length === 0) newErrors.forestType = 'At least one forest type is required'
    }

    if (step === 3) {
      if (!formData.dominantSpecies.trim()) newErrors.dominantSpecies = 'Dominant species is required'
      if (!formData.averageCanopyHeight) newErrors.averageCanopyHeight = 'Canopy height is required'
    }

    if (step === 4) {
      if (!formData.deforestationRisk) newErrors.deforestationRisk = 'Deforestation risk assessment is required'
      if (!formData.statementFile) newErrors.statementFile = 'Statement of Data Truth is required'
    }

    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleNext = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleRunAnalysis = async () => {
    if (!validateStep(4)) return

    setProgress(0)
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 10 : 90))
    }, 500)

    try {
      // Simulate Gemini AI analysis
      await new Promise((resolve) => setTimeout(resolve, 3000))
      setProgress(100)
      clearInterval(progressInterval)
      console.log('[v0] Project analysis complete:', formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
      clearInterval(progressInterval)
    }
  }

  const stepContent = {
    1: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Project Identity
          </h3>
          <p className="text-sm text-muted-foreground">Define your carbon verification project</p>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="projectName" className="text-foreground font-semibold">
              Project Name
            </Label>
            <Input
              id="projectName"
              placeholder="e.g., Amazon Reforestation Initiative"
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className="mt-2"
              aria-invalid={!!validationErrors.projectName}
            />
            {validationErrors.projectName && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.projectName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="organization" className="text-foreground font-semibold">
              Organization / Developer
            </Label>
            <Input
              id="organization"
              placeholder="Your organization name"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              className="mt-2"
              aria-invalid={!!validationErrors.organization}
            />
            {validationErrors.organization && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.organization}</p>
            )}
          </div>

          <div>
            <Label htmlFor="country" className="text-foreground font-semibold">
              Country
            </Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger className="mt-2" aria-invalid={!!validationErrors.country}>
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {countryList.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors.country && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.country}</p>
            )}
          </div>

          <div>
            <Label htmlFor="methodology" className="text-foreground font-semibold">
              Methodology Reference
            </Label>
            <Select value={formData.methodology} onValueChange={(value) => handleInputChange('methodology', value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verra">Verra VCS</SelectItem>
                <SelectItem value="gold">Gold Standard</SelectItem>
                <SelectItem value="pcer">PCR - Certified Emissions Reductions</SelectItem>
                <SelectItem value="ncs">Natural Climate Solutions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    ),

    2: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-emerald-500" />
            Geospatial Data
          </h3>
          <p className="text-sm text-muted-foreground">Define project boundaries and forest characteristics</p>
        </div>

        <div className="grid gap-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm text-muted-foreground mb-2">Project Area</p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{formData.totalArea.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">hectares</span>
            </div>
          </Card>

          <div>
            <Label className="text-foreground font-semibold mb-3 block">Forest Type (Select all that apply)</Label>
            <div className="grid grid-cols-1 gap-2">
              {forestTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/10">
                  <input
                    type="checkbox"
                    checked={formData.forestType.includes(type)}
                    onChange={() => handleMultiSelect('forestType', type)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </div>
            {validationErrors.forestType && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.forestType}</p>
            )}
          </div>

          <div>
            <Label className="text-foreground font-semibold mb-3 block">Protection/Restoration Type</Label>
            <div className="grid grid-cols-1 gap-2">
              {protectionTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-accent/10">
                  <input
                    type="checkbox"
                    checked={formData.protectionType.includes(type)}
                    onChange={() => handleMultiSelect('protectionType', type)}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground">{type}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),

    3: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-500" />
            Ecological Data
          </h3>
          <p className="text-sm text-muted-foreground">Satellite analysis powered by NASA, JAXA, and AWS</p>
        </div>

        <div className="grid gap-4">
          <Card className="border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-start gap-3">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5" />
              <div>
                <p className="font-semibold text-foreground text-sm">Multi-Source Satellite Analysis</p>
                <p className="text-xs text-muted-foreground mt-1">Analyzing data from NASA Landsat, JAXA ALOS PALSAR, and Sentinel-2</p>
              </div>
            </div>
          </Card>

          <div>
            <Label htmlFor="dominantSpecies" className="text-foreground font-semibold">
              Dominant Tree Species
            </Label>
            <Input
              id="dominantSpecies"
              placeholder="e.g., Shorea, Dipterocarpaceae"
              value={formData.dominantSpecies}
              onChange={(e) => handleInputChange('dominantSpecies', e.target.value)}
              className="mt-2"
              aria-invalid={!!validationErrors.dominantSpecies}
            />
            {validationErrors.dominantSpecies && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.dominantSpecies}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="canopyHeight" className="text-foreground font-semibold">
                Average Canopy Height (m)
              </Label>
              <Input
                id="canopyHeight"
                type="number"
                placeholder="25-45"
                value={formData.averageCanopyHeight}
                onChange={(e) => handleInputChange('averageCanopyHeight', e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="biomass" className="text-foreground font-semibold">
                Biomass Estimate (Mg/ha)
              </Label>
              <Input
                id="biomass"
                type="number"
                placeholder="200-400"
                value={formData.biomassEstimate}
                onChange={(e) => handleInputChange('biomassEstimate', e.target.value)}
                className="mt-2"
                disabled
              />
            </div>
          </div>

          <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
            <p className="text-sm font-semibold text-foreground mb-2">NDVI Analysis</p>
            <p className="text-xs text-muted-foreground">Vegetation health index: {formData.ndvi || 'Pending analysis'}</p>
          </Card>
        </div>
      </div>
    ),

    4: (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Risk & Additionality
          </h3>
          <p className="text-sm text-muted-foreground">Gemini AI-powered risk assessment and additionality analysis</p>
        </div>

        <div className="grid gap-4">
          <div>
            <Label htmlFor="deforRisk" className="text-foreground font-semibold">
              Deforestation Risk Level
            </Label>
            <Select value={formData.deforestationRisk} onValueChange={(value) => handleInputChange('deforestationRisk', value)}>
              <SelectTrigger className="mt-2" aria-invalid={!!validationErrors.deforestationRisk}>
                <SelectValue placeholder="Select risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="very-low">Very Low (0-2)</SelectItem>
                <SelectItem value="low">Low (2-4)</SelectItem>
                <SelectItem value="medium">Medium (4-6)</SelectItem>
                <SelectItem value="high">High (6-8)</SelectItem>
                <SelectItem value="very-high">Very High (8-10)</SelectItem>
              </SelectContent>
            </Select>
            {validationErrors.deforestationRisk && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.deforestationRisk}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fireRisk" className="text-foreground font-semibold">
                Fire Risk
              </Label>
              <Select value={formData.fireRisk} onValueChange={(value) => handleInputChange('fireRisk', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="climateVuln" className="text-foreground font-semibold">
                Climate Vulnerability
              </Label>
              <Select value={formData.climateVulnerability} onValueChange={(value) => handleInputChange('climateVulnerability', value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="statement" className="text-foreground font-semibold flex items-center gap-2">
              <FileUp className="w-4 h-4" />
              Statement of Data Truth
            </Label>
            <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/50 transition-colors">
              <input
                id="statement"
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleInputChange('statementFile', file)
                }}
                className="hidden"
                aria-label="Upload statement"
              />
              <label htmlFor="statement" className="cursor-pointer">
                <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PDF or image (PNG, JPG)</p>
                {formData.statementFile && (
                  <p className="text-xs text-emerald-600 mt-2">✓ {formData.statementFile.name}</p>
                )}
              </label>
            </div>
            {validationErrors.statementFile && (
              <p className="text-xs text-red-500 mt-1">{validationErrors.statementFile}</p>
            )}
          </div>
        </div>
      </div>
    ),
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Green Carbon Verification</h1>
              <p className="text-muted-foreground mt-1">Step {currentStep} of 4</p>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
              Project Creation
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}

        {/* Progress Indicator */}
        {isLoading && <ProgressIndicator progress={progress} message="Analyzing project data with Gemini AI..." />}

        {/* Form Content */}
        <Card className="border-border/50 bg-card/50 p-8 mb-8">
          {stepContent[currentStep as keyof typeof stepContent]}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4 justify-between">
          <Button
            onClick={handlePrev}
            variant="outline"
            disabled={currentStep === 1 || isLoading}
            className="px-6"
          >
            Previous
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleRunAnalysis}
              className="px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Run Verification
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
