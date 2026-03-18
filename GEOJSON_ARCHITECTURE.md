# GeoJSON Integration Architecture

## System Overview

This document describes the technical architecture of the GeoJSON parsing and form integration system.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      USER UPLOADS GEOJSON FILE                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │  app/upload/page.tsx │
                    │  handleGeoJSONImport │
                    └──────────┬───────────┘
                               │
                               ▼
         ┌─────────────────────────────────────────┐
         │ lib/polygon-file-handlers.ts            │
         │ detectAndParseFile(file)                │
         │ ├─ parseGeoJSON()                      │
         │ ├─ parseKML()                          │
         │ ├─ parseZIP()                          │
         │ └─ parseCSV()                          │
         └──────────────┬──────────────────────────┘
                        │
                        ▼ Returns: ParsedPolygon
         ┌─────────────────────────────────┐
         │ ParsedPolygon Interface          │
         ├─ coordinates: [lat, lng][]      │
         ├─ area: number                   │
         ├─ polygonCount: number           │
         ├─ format: string                 │
         └──────────────┬──────────────────┘
                        │
                        ▼
      ┌────────────────────────────────────────┐
      │ lib/geojson-to-form-data.ts            │
      │ convertPolygonToFormData()              │
      │ ├─ Extract coordinates                 │
      │ ├─ Calculate bounds                    │
      │ └─ Estimate carbon (IPCC defaults)    │
      └──────────────┬─────────────────────────┘
                     │
                     ▼ Returns: VerificationFormSatelliteData
      ┌────────────────────────────────────────┐
      │ VerificationFormSatelliteData           │
      ├─ type: 'satellite_verification_data'   │
      ├─ coordinates: {lat, lng}[]             │
      ├─ satelliteMetadata.polygon: [lat,lng][]│
      ├─ satelliteMetadata.area_ha: number     │
      ├─ carbonData: {biomass, carbon, co2}    │
      └──────────────┬─────────────────────────┘
                     │
            ┌────────┴──────────┐
            │                   │
            ▼                   ▼
      ┌──────────────┐   ┌────────────────────┐
      │ Auto-populate│   │ createVerification │
      │ Form Fields  │   │ DataZIP()          │
      └──────────────┘   └──────┬─────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ ZIP File Generated    │
                    ├─ verification_data   │
                    │   .json              │
                    ├─ polygon_coordinates │
                    │   .csv               │
                    ├─ polygon_geometry    │
                    │   .geojson           │
                    └─ README.txt          │
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Download to User      │
                    │ Browser               │
                    └───────────────────────┘
```

## Key Components

### 1. Polygon File Handlers (`lib/polygon-file-handlers.ts`)

**Purpose**: Detect file format and parse to standardized structure

**Exported Functions**:
```typescript
detectAndParseFile(file: File): Promise<ParsedPolygon>
  ├─ parseGeoJSON(file: File): Promise<ParsedPolygon>
  ├─ parseKML(file: File): Promise<ParsedPolygon>
  ├─ parseZIP(file: File): Promise<ParsedPolygon>
  ├─ parseCSV(file: File): Promise<ParsedPolygon>
  └─ validatePolygon(coords): {isValid, error?}
```

**Key Logic**:
- Auto-detects format from file extension and content
- Extracts outer boundary and inner rings (holes)
- Converts all coordinates to [lat, lng] format
- Validates coordinate ranges
- Returns ParsedPolygon with area calculated via Shoelace formula

**Example Output**:
```typescript
{
  coordinates: [[lat1, lng1], [lat2, lng2], ...],
  area: 12500.5,
  polygonCount: 1,
  holeCount: 0,
  format: 'GeoJSON',
  isValid: true
}
```

### 2. Satellite Data Parser (`lib/satellite-data-parser.ts`)

**Purpose**: Parse satellite analysis data from files (used for satellite verification)

**Key Additions**:
```typescript
extractPolygonCoordinates(geojson): Array<[number, number]>
  ├─ Handles FeatureCollection
  ├─ Handles Feature with Polygon geometry
  └─ Handles direct Polygon/MultiPolygon

extractGeometryCoordinates(geometry): Array<[number, number]>
  ├─ Polygon: uses coordinates[0] as outer ring
  ├─ MultiPolygon: uses first polygon's outer ring
  └─ Converts [lng, lat] to [lat, lng]

calculateGeodesicArea(coordinates): number
  ├─ Uses spherical excess formula
  ├─ More accurate than Shoelace for geographic coordinates
  └─ Returns hectares
```

### 3. GeoJSON to Form Data Bridge (`lib/geojson-to-form-data.ts`)

**Purpose**: Convert parsed GeoJSON to verification form structure

**Main Functions**:
```typescript
// Convert ParsedPolygon to form data
convertPolygonToFormData(
  polygon: ParsedPolygon,
  description?: string
): VerificationFormSatelliteData

// Convert satellite data to form data
convertSatelliteDataToFormData(
  satelliteData: ParsedSatelliteData,
  coordinates: Array<[number, number]>
): VerificationFormSatelliteData

// Create downloadable ZIP file
createVerificationDataZIP(
  formData: VerificationFormSatelliteData,
  fileName?: string
): Promise<Blob>
```

**Data Structure**:
```typescript
interface VerificationFormSatelliteData {
  type: 'satellite_verification_data',
  projectDescription: string,
  coordinates: [{latitude, longitude}],
  satelliteMetadata: {
    polygon: [lat, lng][],
    area_ha: number,
    bounds: {north, south, east, west}
  },
  carbonData: {
    biomass_agb_mean: number,
    carbon_tC: number,
    co2_tCO2: number,
    net_verified_co2: number
  },
  results: [{
    bands: {B2, B3, B4, B5, ...},
    indices: {ndvi, ndbi, ndmi, ...}
  }]
}
```

### 4. Satellite Data Exporter (`lib/satellite-data-exporter.ts`)

**Purpose**: Generate export files (PDF and ZIP) with satellite analysis

**Key Functions**:
```typescript
generateSatellitePDF(data): Promise<Blob>
generateSatelliteDataZIP(data): Promise<Blob>
generateGeoJSONFile(data): string
generateCoordinatesFile(data): string
downloadBlob(blob, filename): void
```

**ZIP Contents**:
- `README.txt` - Usage instructions
- `satellite_analysis.json` - Complete data
- `satellite_analysis.csv` - Summary table
- `polygon_coordinates.geojson` - GeoJSON geometry
- `polygon_coordinates.txt` - Coordinate list

### 5. Upload Page Integration (`app/upload/page.tsx`)

**New Handler**:
```typescript
handleGeoJSONImport(file: File): Promise<void>
  1. parseFile with detectAndParseFile()
  2. Validate polygon (≥3 coordinates)
  3. Convert to form data
  4. Create verification ZIP
  5. Auto-download ZIP
  6. Update form fields
  7. Show success alert
```

## Coordinate Systems

### Input Format (GeoJSON Standard)
```
[longitude, latitude]
Range: lon ±180°, lat ±90°
Example: [106.8456, -6.2088]  # Jakarta, Indonesia
```

### Internal Format (Application)
```
[latitude, longitude]
Range: lat ±90°, lon ±180°
Example: [-6.2088, 106.8456]
```

### Conversion
```javascript
// GeoJSON to Internal
const [lat, lng] = [geoJson[1], geoJson[0]];

// Internal to GeoJSON
const [lng, lat] = [internal[1], internal[0]];
```

## Area Calculation Methods

### Method 1: Shoelace Formula (Fast, Less Accurate)
Used for quick validation:
```javascript
area = |Σ(lng_i * lat_i+1 - lng_i+1 * lat_i)| / 2
// Treats Earth as flat, okay for small areas
```

### Method 2: Geodetic Formula (Accurate, Recommended)
Used for final calculations:
```javascript
// Spherical excess method
E = 2 * atan2(...)  // Complex formula
area = E * R²  // E = excess, R = Earth radius
// Accounts for Earth's curvature
```

## Carbon Estimation

Default values used when satellite data unavailable:

```
Tropical Forest (Default):
  - Biomass (AGB): 250 Mg/ha
  - Carbon stock: 140 tC/ha  (IPCC default)
  - CO₂ equivalent: 3.667 × carbon

Formula:
  Total Carbon (tC) = Area (ha) × 140 tC/ha
  Total CO₂ = Total Carbon × 3.667
  
Example:
  Area: 1000 ha
  Carbon: 1000 × 140 = 140,000 tC
  CO₂: 140,000 × 3.667 = 513,380 tCO2e
```

## Error Handling

### Validation Steps
```
1. File exists and readable?
2. Valid JSON/XML?
3. Contains geometry?
4. Geometry has coordinates?
5. ≥3 points in polygon?
6. Coordinates in valid ranges?
7. Polygon not self-intersecting? (warn only)
8. Area > 0?
```

### Error Messages
```typescript
// User-friendly errors
"No polygon coordinates found"
"Invalid coordinate ranges"
"Polygon must have at least 3 points"
"Failed to parse file"

// Development errors
console.log("[v0] Polygon parsing result:", result)
console.log("[v0] Extracted coordinates:", coords.length)
console.log("[v0] Calculated area:", area, "hectares")
```

## Performance Considerations

### Large Files
- **250,000+ coordinates**: Takes ~500ms for area calculation
- **ZIP compression**: jszip adds ~100ms
- **No batching needed**: Single polygon extracted per upload

### Optimization Strategies
- Coordinate simplification (Douglas-Peucker) for display
- Chunked processing for multiple polygons
- Web Worker for calculations (not implemented, but possible)

## Testing Strategy

### Unit Tests Needed
```typescript
// Coordinate extraction
parseGeoJSON with FeatureCollection
parseGeoJSON with Feature
parseGeoJSON with Polygon
parseGeoJSON with MultiPolygon

// Area calculation
Shoelace formula edge cases
Geodetic formula accuracy
Holes in polygon handling

// Data conversion
convertPolygonToFormData with various inputs
Carbon estimation calculations
ZIP file generation and content
```

### Integration Tests
```typescript
// End-to-end flow
Upload GeoJSON → Parse → Convert → Download → Re-import
Verify form fields are populated
Verify area matches uploaded file
Verify carbon estimates are reasonable
```

## Dependencies

**External Libraries**:
- `jszip` - ZIP file generation (optional fallback)
- Built-in JavaScript: JSON, Math, Array methods

**Internal Dependencies**:
- `polygon-file-handlers.ts` - File parsing
- `satellite-data-parser.ts` - Satellite data parsing (optional)
- `geojson-to-form-data.ts` - Format conversion

## Future Enhancements

1. **Shapefile Support**: Add .shp/.dbf parsing without ZIP wrapping
2. **WKT Format**: Support Well-Known Text geometry format
3. **Coordinate System Transform**: Automatically detect and convert from other CRS
4. **Polygon Simplification**: Reduce point count for faster processing
5. **Web Workers**: Move calculations to background thread
6. **3D Coordinates**: Support Z-axis (elevation) if present
7. **Temporal Data**: Handle time-series polygon data
8. **Real-time Validation**: Show errors as user uploads

## Troubleshooting Guide

### GeoJSON won't parse
**Causes**:
- Invalid JSON syntax
- Missing coordinates array
- Wrong coordinate order (should be [lng, lat])

**Solution**:
- Validate with https://geojson.io
- Check coordinate format
- Review error message in console

### Area calculation seems wrong
**Causes**:
- Coordinates in wrong order
- Polygon wraps around Earth
- Very large area (>1,000,000 ha)

**Solution**:
- Verify [lng, lat] order
- Check bounds: lat ±90°, lng ±180°
- Use geodetic calculation for large areas

### Form not auto-populating
**Causes**:
- JavaScript errors
- DOM not ready
- Browser security restrictions

**Solution**:
- Check browser console for errors
- Manually import verification ZIP
- Try different browser

---

**Last Updated**: 2026
**Maintained By**: Atlas Verity Team
**Version**: 2.0
