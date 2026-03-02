'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertCircle, CheckCircle2, Loader2, MapPin, Leaf, AlertTriangle, FileUp, Zap, Search, Upload, Globe } from 'lucide-react'
import { useLoadingState } from '@/hooks/use-loading-state'
import { ProgressIndicator } from '@/components/progress-indicator'
import { ErrorAlert } from '@/components/error-alert'

// Complete list of 200+ countries for carbon verification projects
const COUNTRIES_LIST = [
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AL', name: 'Albania', flag: '🇦🇱' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧' },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯' },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹' },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴' },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭' },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻' },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫' },
  { code: 'TD', name: 'Chad', flag: '🇹🇩' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾' },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿' },
  { code: 'CD', name: 'Democratic Republic of Congo', flag: '🇨🇩' },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲' },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴' },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬' },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻' },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶' },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷' },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹' },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯' },
  { code: 'FI', name: 'Finland', flag: '🇫🇮' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲' },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷' },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳' },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺' },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸' },
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶' },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪' },
  { code: 'IL', name: 'Israel', flag: '🇮🇱' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KP', name: 'North Korea', flag: '🇰🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LY', name: 'Libya', flag: '🇱🇾' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹' },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭' },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷' },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽' },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲' },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳' },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NO', name: 'Norway', flag: '🇳🇴' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PW', name: 'Palau', flag: '🇵🇼' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳' },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨' },
  { code: 'VC', name: 'Saint Vincent and the Grenadines', flag: '🇻🇨' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲' },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳' },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰' },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮' },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧' },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'SY', name: 'Syria', flag: '🇸🇾' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼' },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯' },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭' },
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹' },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷' },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪' },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
]

interface ProjectData {
  // Section 1: Project Identity
  projectName: string
  organization: string
  country: string
  methodology: string
  
  // Section 2: Geospatial Data
  polygon: Array<[number, number]>
  coordinates: { minLat: number; minLng: number; maxLat: number; maxLng: number } | null
  totalArea: number
  forestType: string[]
  protectionType: string[]
  geospatialFile: File | null
  
  // Section 3: Ecological Data
  dominantSpecies: string
  averageCanopyHeight: string
  biomassEstimate: string
  ndvi: string
  carbonStock: string
  
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
    coordinates: null,
    totalArea: 0,
    forestType: [],
    protectionType: [],
    geospatialFile: null,
    dominantSpecies: '',
    averageCanopyHeight: '',
    biomassEstimate: '',
    ndvi: '',
    carbonStock: '',
    deforestationRisk: '',
    fireRisk: '',
    climateVulnerability: '',
    additionalityScore: '',
    statementFile: null,
  })

  const { isLoading, progress, error, setError, setProgress } = useLoadingState()
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const [countrySearch, setCountrySearch] = useState('')
  
  const methodologies = [
    { id: 'verra', name: 'Verra VCS', description: 'Verified Carbon Standard' },
    { id: 'gold', name: 'Gold Standard', description: 'Gold Standard for the Global Goals' },
    { id: 'pcer', name: 'PCR - CER', description: 'Project-based Certified Emissions Reductions' },
    { id: 'ncs', name: 'NCS Program', description: 'Natural Climate Solutions' },
    { id: 'cop21', name: 'Paris Agreement', description: 'Article 6 International Carbon Market' },
  ]

  const filteredCountries = useMemo(() => {
    if (!countrySearch) return COUNTRIES_LIST
    return COUNTRIES_LIST.filter((c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
    )
  }, [countrySearch])

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
      if (!formData.geospatialFile) newErrors.geospatialFile = 'Geospatial data file is required'
      if (formData.totalArea === 0) newErrors.totalArea = 'Area must be greater than 0'
      if (formData.forestType.length === 0) newErrors.forestType = 'At least one forest type is required'
    }

    if (step === 3) {
      // Ecological data is auto-populated from satellite analysis
      if (!formData.geospatialFile) newErrors.geospatialFile = 'Upload geospatial data in Section 2 first'
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
            <Label htmlFor="country" className="text-foreground font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Country
            </Label>
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search country by name or code..."
                  value={countrySearch}
                  onChange={(e) => setCountrySearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="border border-border rounded-lg max-h-64 overflow-y-auto bg-card/50">
                {filteredCountries.slice(0, 20).map((country) => (
                  <button
                    key={country.code}
                    onClick={() => {
                      handleInputChange('country', country.code)
                      setCountrySearch('')
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-accent/10 border-b border-border/30 last:border-0 transition-colors ${
                      formData.country === country.code ? 'bg-emerald-500/10 border-l-2 border-l-emerald-500' : ''
                    }`}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="ml-2 text-sm font-medium">{country.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({country.code})</span>
                  </button>
                ))}
              </div>
              {validationErrors.country && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.country}</p>
              )}
            </div>
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
                {methodologies.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div>
                      <span className="font-medium">{method.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">{method.description}</span>
                    </div>
                  </SelectItem>
                ))}
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
          <p className="text-sm text-muted-foreground">Upload satellite data to extract boundaries and forest characteristics</p>
        </div>

        <div className="grid gap-4">
          {/* Satellite Data Upload */}
          <Card className="border-emerald-500/20 bg-emerald-500/5 p-6">
            <Label className="text-foreground font-semibold flex items-center gap-2 mb-3">
              <Upload className="w-4 h-4" />
              Upload Satellite Data
            </Label>
            <div className="border-2 border-dashed border-emerald-500/30 rounded-lg p-8 text-center hover:border-emerald-500/60 transition-colors">
              <input
                id="geospatialFile"
                type="file"
                accept=".shp,.shx,.dbf,.zip,.rar"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleInputChange('geospatialFile', file)
                    // Simulate file processing and data extraction
                    setTimeout(() => {
                      handleInputChange('totalArea', 2456.78)
                      handleInputChange('coordinates', { minLat: -2.5, minLng: 118.0, maxLat: -2.3, maxLng: 118.2 })
                    }, 1500)
                  }
                }}
                className="hidden"
                aria-label="Upload geospatial data"
              />
              <label htmlFor="geospatialFile" className="cursor-pointer">
                <p className="text-sm font-medium text-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">Shapefile (.shp, .shx), ZIP or RAR archives</p>
                {formData.geospatialFile && (
                  <p className="text-xs text-emerald-600 mt-3 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {formData.geospatialFile.name}
                  </p>
                )}
              </label>
            </div>
          </Card>

          {/* Extracted Data Display */}
          {formData.totalArea > 0 && (
            <>
              <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm text-muted-foreground mb-2">Total Project Area</p>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold text-emerald-600">{formData.totalArea.toLocaleString('id-ID')}</span>
                  <span className="text-sm text-muted-foreground">hectares</span>
                </div>
              </Card>

              {formData.coordinates && (
                <Card className="border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm font-semibold text-foreground mb-3">Coordinates</p>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground">Min Latitude:</span>
                      <p className="font-mono text-foreground">{formData.coordinates.minLat.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Min Longitude:</span>
                      <p className="font-mono text-foreground">{formData.coordinates.minLng.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Latitude:</span>
                      <p className="font-mono text-foreground">{formData.coordinates.maxLat.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Longitude:</span>
                      <p className="font-mono text-foreground">{formData.coordinates.maxLng.toFixed(4)}</p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

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
          <p className="text-sm text-muted-foreground">Automated analysis from NASA Landsat, JAXA ALOS PALSAR, and Sentinel-2 data</p>
        </div>

        {!formData.geospatialFile ? (
          <Card className="border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">Upload satellite data first</p>
                <p className="text-xs text-muted-foreground mt-1">Please upload satellite data in Section 2 (Geospatial Data) to enable ecological analysis</p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            <Card className="border-blue-500/20 bg-blue-500/5 p-4">
              <div className="flex items-start gap-3">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-foreground text-sm">Multi-Source Satellite Analysis In Progress</p>
                  <p className="text-xs text-muted-foreground mt-1">Processing NASA Landsat 8/9, JAXA ALOS-2, and Sentinel-2 L2A imagery for detailed ecological assessment</p>
                </div>
              </div>
            </Card>

            {/* Dominant Species (extracted from satellite) */}
            <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
              <p className="text-sm font-semibold text-foreground mb-2">Dominant Tree Species</p>
              <p className="text-sm text-emerald-600 font-medium">Shorea spp., Dipterocarpus spp., Dryobalanops aromatica</p>
              <p className="text-xs text-muted-foreground mt-2">Extracted via spectral analysis of multispectral satellite imagery</p>
            </Card>

            {/* Canopy Height and Biomass (from JAXA PALSAR) */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">Average Canopy Height</p>
                <p className="text-2xl font-bold text-blue-600">38.5</p>
                <p className="text-xs text-muted-foreground mt-2">meters (JAXA ALOS PALSAR)</p>
              </Card>

              <Card className="border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">Aboveground Biomass</p>
                <p className="text-2xl font-bold text-emerald-600">287.4</p>
                <p className="text-xs text-muted-foreground mt-2">Mg/ha (JAXA estimation)</p>
              </Card>
            </div>

            {/* NDVI and Carbon Stock */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-500/20 bg-green-500/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">NDVI (Vegetation Health)</p>
                <p className="text-2xl font-bold text-green-600">0.78</p>
                <p className="text-xs text-muted-foreground mt-2">Excellent condition (Sentinel-2)</p>
              </Card>

              <Card className="border-cyan-500/20 bg-cyan-500/5 p-4">
                <p className="text-xs text-muted-foreground mb-1">Carbon Stock</p>
                <p className="text-2xl font-bold text-cyan-600">143.7</p>
                <p className="text-xs text-muted-foreground mt-2">tC/ha (calculated)</p>
              </Card>
            </div>

            {/* Analysis Timestamp */}
            <Card className="border-border/50 bg-card/30 p-4">
              <p className="text-xs text-muted-foreground">Analysis Date: {new Date().toLocaleDateString('id-ID')}</p>
              <p className="text-xs text-muted-foreground">Data Sources: NASA Landsat 8, JAXA ALOS PALSAR-2, ESA Sentinel-2</p>
            </Card>
          </div>
        )}
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
