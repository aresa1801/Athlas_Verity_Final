const errorMessages = {
  UPLOAD: {
    INVALID_FORMAT: "File format not supported. Please upload shapefile components or GeoJSON.",
    MISSING_COMPONENTS: "Shapefile missing required components (.shp, .shx, .dbf)",
    CORRUPTED: "File appears corrupted. Please check and re-upload.",
    SIZE_LIMIT: "File exceeds 500MB limit. Please split or compress.",
    PARSE_ERROR: "Could not parse geospatial data. Check file integrity."
  },
  
  GEOMETRY: {
    INVALID_POLYGON: "Polygon is invalid (self-intersections or open rings)",
    AREA_TOO_SMALL: "Area too small for carbon project (minimum 1 hectare)",
    AREA_TOO_LARGE: "Area exceeds maximum (500,000 hectares)",
    COORDINATES_OUT_OF_RANGE: "Coordinates out of valid range"
  },
  
  SATELLITE: {
    NO_DATA: "No satellite data available for this area/date range",
    CLOUD_COVER: "Cloud cover too high (>25%) for selected dates",
    API_LIMIT: "Satellite API rate limit reached. Try again later.",
    PROCESSING_ERROR: "Error processing satellite data"
  },
  
  GEMINI: {
    API_ERROR: "Gemini AI service unavailable",
    ANALYSIS_FAILED: "AI analysis failed. Please try again.",
    CONFIDENCE_LOW: "AI confidence below threshold (70%). Manual review required."
  }
};