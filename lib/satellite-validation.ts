import { z } from 'zod'

// Coordinate validation
const CoordinateSchema = z.object({
  latitude: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= -90 && num <= 90
  }, 'Latitude must be between -90 and 90'),
  longitude: z.string().refine((val) => {
    const num = parseFloat(val)
    return !isNaN(num) && num >= -180 && num <= 180
  }, 'Longitude must be between -180 and 180'),
})

// Polygon validation
const PolygonPointSchema = z.tuple([z.number(), z.number()])

const PolygonSchema = z.array(PolygonPointSchema).min(3, 'Polygon must have at least 3 points')

// Location form validation
export const LocationFormSchema = z.object({
  country: z.string().min(1, 'Country is required'),
  province: z.string().optional(),
  city: z.string().optional(),
  coordinates: CoordinateSchema,
})

// Date range validation
export const DateRangeSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  season: z.enum(['Wet', 'Dry', 'All']).optional(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before end date', path: ['endDate'] }
)

// Satellite source validation
export const SatelliteSourceSchema = z.object({
  source: z.enum(['google', 'sentinel', 'planetary']),
  collection: z.string().min(1, 'Collection is required'),
  resolution: z.enum(['10m', '30m', '100m', '250m']),
})

// Cloud cover validation
export const CloudCoverSchema = z.object({
  maxCloudCover: z.number().min(0).max(100),
  autoFilter: z.boolean().default(true),
})

// Band selection validation
export const BandSelectionSchema = z.object({
  red: z.boolean().default(true),
  green: z.boolean().default(true),
  blue: z.boolean().default(true),
  nir: z.boolean().default(true),
  swir: z.boolean().optional(),
  thermal: z.boolean().optional(),
})

// Index calculation validation
export const IndexCalculationSchema = z.object({
  ndvi: z.boolean().default(true),
  evi: z.boolean().optional(),
  savi: z.boolean().optional(),
  ndmi: z.boolean().optional(),
  nbr: z.boolean().optional(),
})

// Vegetation type validation
export const VegetationTypeSchema = z.enum([
  'tropical',
  'mangrove',
  'peat',
  'temperate',
  'mixed',
])

// Complete satellite verification form validation
export const SatelliteVerificationFormSchema = z.object({
  polygon: PolygonSchema,
  location: LocationFormSchema,
  dateRange: DateRangeSchema,
  satelliteSource: SatelliteSourceSchema,
  cloudCover: CloudCoverSchema,
  bandSelection: BandSelectionSchema,
  indexCalculation: IndexCalculationSchema,
  vegetationType: VegetationTypeSchema,
})

// File upload validation
export const FileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, 'File size must be less than 50MB')
    .refine(
      (file) => [
        'application/json',
        'application/zip',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/xml',
      ].includes(file.type),
      'Invalid file type'
    ),
})

// API response validation
export const SatelliteDataResponseSchema = z.object({
  imageId: z.string(),
  timestamp: z.string(),
  ndvi: z.array(z.number()).optional(),
  cloudCover: z.number(),
  bands: z.record(z.array(z.number())).optional(),
  bounds: z.object({
    north: z.number(),
    south: z.number(),
    east: z.number(),
    west: z.number(),
  }),
})

export const AIAnalysisResponseSchema = z.object({
  carbonEstimate: z.number(),
  biomassEstimate: z.number(),
  vegetationHealth: z.number(),
  confidenceScore: z.number(),
  recommendations: z.array(z.string()),
  dataQuality: z.enum(['High', 'Medium', 'Low']),
})

export type SatelliteVerificationForm = z.infer<typeof SatelliteVerificationFormSchema>
export type FileUpload = z.infer<typeof FileUploadSchema>
export type SatelliteDataResponse = z.infer<typeof SatelliteDataResponseSchema>
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>
