/**
 * Verification Result Schema - Matches Athlas Verity Validation Report Format
 */

export interface VegetationClassification {
  classification: string // e.g., "Dense Forest", "Open Forest", "Shrubland"
  areaHa: number
  percentage: number
  description: string
}

export interface SatelliteDataSource {
  name: string // e.g., "Microsoft Planetary Computer (MPC) - Sentinel-2"
  type: 'primary' | 'secondary' | 'tertiary'
  resolution: string // e.g., "10m", "250m"
  index?: string // e.g., "NDVI", "Chlorophyll-a"
  value?: number
}

export interface ValidatorInfo {
  validatorId: string
  role: 'BaselineValidator' | 'DomainModel' | 'QualityValidator'
  modelType: string
  confidence: number
}

export interface CarbonCalculationStep {
  step: number
  description: string
  value: number
  unit: string
}

export interface VerificationScores {
  integrityClass: string // e.g., "IC-A"
  auraScore: number
  authenticitySCore: number
  validatorConsensus: number
  dataConsistencyScore: number
}

export interface VegetationAnalysis {
  ndvi: number // Normalized Difference Vegetation Index
  chlorophyllA?: number // For blue carbon (coastal)
  overallConfidenceScore: number
  areaVerificationMatch: number
}

export interface CarbonReductionResult {
  rawCarbonStock: number // tC
  convertedToCO2: number // tCO2
  baselineEmissions: number // tCO2
  grossReduction: number // tCO2
  leakageAdjustment: number // tCO2
  bufferPoolDeduction: number // tCO2
  netReduction: number // tCO2
  integrityAdjustment: number // tCO2
  finalVerifiedReduction: number // tCO2
}

export interface ProjectVerificationResult {
  // Project Information
  projectName: string
  projectDescription: string
  projectArea: number // hectares
  dateRange: {
    start: string // ISO date
    end: string // ISO date
  }
  carbonOffsetType: string // e.g., "Forest Conservation"
  
  // Owner Information
  ownerName: string
  ownerEmail?: string
  ownerPhone?: string
  
  // Geospatial Data
  boundaryPoints: number
  assetCoordinates: Array<{
    point: number
    latitude: number
    longitude: number
  }>
  
  // Verification Status
  verificationStatus: 'Verified' | 'Pending' | 'Failed'
  
  // Verification Scores
  scores: VerificationScores
  
  // Validation Checks
  validationChecks: {
    dataQuality: 'Passed' | 'Failed'
    satelliteImagery: 'Passed' | 'Failed'
    geospatialConsistency: 'Passed' | 'Failed'
    anomalyFlags: string[] // e.g., ["None Detected"]
  }
  
  // Vegetation Classification
  vegetationCover: VegetationClassification[]
  totalClassifiedArea: number
  areaMatchingScore: number
  
  // Multi-Source Satellite Verification
  satelliteSources: SatelliteDataSource[]
  vegetationAnalysis: VegetationAnalysis
  
  // Carbon Calculations
  inputParameters: {
    agb: number // Above Ground Biomass (t/ha)
    carbonFraction: number
    projectDuration: number // years
    baselineEmissionsRate: number // tCO2/ha/year
  }
  carbonCalculationSteps: CarbonCalculationStep[]
  carbonReductionResult: CarbonReductionResult
  
  // Validator Information
  validators: ValidatorInfo[]
  consensusThreshold: number
  averageConfidence: number
  
  // Proof Chain
  proofChainHash: string
  
  // Metadata
  generatedDate: string // ISO datetime
  reportId: string
}

/**
 * Form data structure for collecting verification information
 */
export interface VerificationFormData {
  // From satellite data
  projectName: string
  projectDescription: string
  projectArea: number
  dateRange: { start: string; end: string }
  carbonOffsetType: string
  
  // From form input
  ownerName: string
  ownerEmail: string
  ownerPhone: string
  agb: number
  carbonFraction: number
  projectDuration: number
  baselineEmissionsRate: number
  
  // Vegetation classification (from satellite analysis)
  vegetationClassifications: VegetationClassification[]
  vegetationDescription: string
  ndvi: number
  
  // Raw satellite data
  satelliteDataFile?: File
  rawGeoJSON?: any
}
