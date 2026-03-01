import { ZodError } from 'zod'

export class SatelliteVerificationError extends Error {
  constructor(
    public code: string,
    public message: string,
    public details?: Record<string, unknown>,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'SatelliteVerificationError'
  }
}

export const ERROR_CODES = {
  // Validation errors
  INVALID_POLYGON: 'INVALID_POLYGON',
  INVALID_COORDINATES: 'INVALID_COORDINATES',
  INVALID_DATE_RANGE: 'INVALID_DATE_RANGE',
  INVALID_FILE_FORMAT: 'INVALID_FILE_FORMAT',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // Map errors
  POLYGON_SELF_INTERSECTS: 'POLYGON_SELF_INTERSECTS',
  POLYGON_TOO_COMPLEX: 'POLYGON_TOO_COMPLEX',
  OUT_OF_BOUNDS: 'OUT_OF_BOUNDS',

  // API errors
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_AUTHENTICATION_FAILED: 'API_AUTHENTICATION_FAILED',
  API_NO_DATA: 'API_NO_DATA',
  API_TIMEOUT: 'API_TIMEOUT',

  // Satellite data errors
  NO_SATELLITE_DATA: 'NO_SATELLITE_DATA',
  CLOUD_COVER_EXCEEDED: 'CLOUD_COVER_EXCEEDED',
  INSUFFICIENT_SCENES: 'INSUFFICIENT_SCENES',

  // Processing errors
  PROCESSING_FAILED: 'PROCESSING_FAILED',
  AI_ANALYSIS_FAILED: 'AI_ANALYSIS_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
}

export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.INVALID_POLYGON]: 'Please draw a valid polygon on the map',
  [ERROR_CODES.INVALID_COORDINATES]: 'Please enter valid latitude (-90 to 90) and longitude (-180 to 180)',
  [ERROR_CODES.INVALID_DATE_RANGE]: 'End date must be after start date',
  [ERROR_CODES.INVALID_FILE_FORMAT]: 'File must be GeoJSON, KML, WKT, or CSV format',
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size must be less than 50MB',
  [ERROR_CODES.POLYGON_SELF_INTERSECTS]: 'Polygon cannot intersect itself. Please redraw',
  [ERROR_CODES.POLYGON_TOO_COMPLEX]: 'Polygon has too many vertices. Simplify and try again',
  [ERROR_CODES.OUT_OF_BOUNDS]: 'Location is outside valid geographic bounds',
  [ERROR_CODES.API_RATE_LIMIT]: 'API rate limit reached. Please wait and try again',
  [ERROR_CODES.API_AUTHENTICATION_FAILED]: 'Authentication failed. Please check API keys',
  [ERROR_CODES.API_NO_DATA]: 'No data available for selected location',
  [ERROR_CODES.API_TIMEOUT]: 'Request timed out. Please try again',
  [ERROR_CODES.NO_SATELLITE_DATA]: 'No satellite data available for this location and date range',
  [ERROR_CODES.CLOUD_COVER_EXCEEDED]: 'Cloud cover exceeds threshold. Try different dates',
  [ERROR_CODES.INSUFFICIENT_SCENES]: 'Not enough satellite scenes available',
  [ERROR_CODES.PROCESSING_FAILED]: 'Satellite data processing failed. Please try again',
  [ERROR_CODES.AI_ANALYSIS_FAILED]: 'AI analysis failed. Please try again',
  [ERROR_CODES.EXPORT_FAILED]: 'Report export failed. Please try again',
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again',
}

export function handleValidationError(error: ZodError) {
  const fieldErrors = error.flatten().fieldErrors
  const formatted: Record<string, string[]> = {}

  Object.entries(fieldErrors).forEach(([field, errors]) => {
    formatted[field] = errors || []
  })

  return {
    code: 'VALIDATION_ERROR',
    message: 'Please check the highlighted fields',
    fieldErrors: formatted,
    statusCode: 400,
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof SatelliteVerificationError) {
    return {
      code: error.code,
      message: ERROR_MESSAGES[error.code] || error.message,
      statusCode: error.statusCode,
      details: error.details,
    }
  }

  if (error instanceof TypeError) {
    return {
      code: ERROR_CODES.API_TIMEOUT,
      message: 'Request failed. Please check your connection',
      statusCode: 503,
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('rate limit')) {
      return {
        code: ERROR_CODES.API_RATE_LIMIT,
        message: ERROR_MESSAGES[ERROR_CODES.API_RATE_LIMIT],
        statusCode: 429,
      }
    }

    if (message.includes('authentication') || message.includes('unauthorized')) {
      return {
        code: ERROR_CODES.API_AUTHENTICATION_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.API_AUTHENTICATION_FAILED],
        statusCode: 401,
      }
    }

    if (message.includes('timeout')) {
      return {
        code: ERROR_CODES.API_TIMEOUT,
        message: ERROR_MESSAGES[ERROR_CODES.API_TIMEOUT],
        statusCode: 504,
      }
    }
  }

  return {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    statusCode: 500,
  }
}

export function createErrorAlert(error: unknown) {
  if (error instanceof ZodError) {
    return handleValidationError(error)
  }
  return handleApiError(error)
}
