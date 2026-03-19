# Green Carbon Analysis → Create Form Data Flow

## Complete Data Capture & Population Guide

### Overview
This document explains the complete data flow from the green-carbon-analysis page through to the create form, ensuring all satellite data is captured and auto-populated correctly.

---

## Stage 1: Analysis Page Data Capture

### URL: `/verification/green-carbon/green-carbon-analysis`

#### What Happens When User Runs Analysis:

1. **User Uploads GeoJSON/Polygon**
   - File parsed into coordinates
   - Polygon area calculated in hectares
   - Center coordinates calculated

2. **"Fetch Satellite Data & Run AI Analysis" Button Clicked**
   - Simulates satellite data fetch
   - Calculates NDVI (0.65-0.80 range)
   - Determines forest type and species
   - Calculates AGB (Above Ground Biomass)
   - Estimates carbon stock

3. **Analysis Results Generated**
   - NDVI value
   - Canopy cover (calculated from NDVI)
   - Forest type (Tropical/Temperate/Boreal)
   - Dominant species
   - AGB (Mg/ha)
   - Total carbon stock (tC)
   - Confidence score
   - Methodology reference

#### Data Structure in Memory:
```javascript
analysisResults = {
  carbonEstimation: {
    agb: "250.45",                    // ← AGB (Above Ground Biomass)
    unit: "Ton CO2e/Ha",
    confidence: 0.85,
    totalCarbon: "154567.89",         // ← Total carbon in tC
    methodology: "BIOMASS R Package (Chave et al. 2014)"
  },
  vegetationClassification: {
    dominantSpecies: "Dipterocarpus, Shorea",
    forestType: "Tropical Forest",
    ndvi: 0.72
  },
  coastalData: {
    isCoastal: false,
    distance: "N/A"
  }
}
```

---

## Stage 2: Export/Download ZIP

### Function: `handleDownloadDataPackage()`
- Location: `/verification/green-carbon/green-carbon-analysis/page.tsx` (line ~438)

#### What Gets Exported:

```javascript
const data = {
  projectName: 'Satellite Analysis Project',
  timestamp: '2024-01-15T10:30:00Z',
  analysisVersion: 'v2.0',
  
  // AREA DATA
  area: { 
    hectares: 1234.56,    // ← Project area in hectares
    km2: 12.3456
  },
  
  // COORDINATES
  polygonCoordinates: [[lat, lng], ...],
  centerCoordinates: { 
    latitude: 6.5234,     // ← Center point
    longitude: 107.2456
  },
  
  // VEGETATION DATA (AUTO-FILL FIELDS)
  forestType: "Tropical Forest",
  dominantSpecies: "Dipterocarpus, Shorea",
  averageTreeHeight: "25-30",
  vegetationDescription: "",
  
  // SATELLITE DATA
  satellite: {
    ndvi: 0.72,
    cloudCover: 15,
    vegetationClass: "Dipterocarpus, Shorea",
    biomass: 250.45,
    carbonEstimate: 154567.89,
    unit: "tC/ha",
    methodology: "BIOMASS R Package",
    confidence: 0.85
  },
  
  // CARBON DATA (FOR REDUCTION CALCULATION)
  carbonData: {
    agb: 250.45,              // ← AGB in Mg/ha
    agbUnit: "tC/ha",
    totalCarbonStock: 154567.89,  // ← Total stock in tC
    totalCarbonStockUnit: "tC",
    co2e: "425234.56",        // ← CO2 equivalent in tCO2e
    co2eUnit: "tCO2e",
    methodology: "BIOMASS R Package",
    confidence: 0.85
  },
  
  location: "Indonesia, Borneo",
  dateRange: { startDate: "2024-01-01", endDate: "2024-01-15" },
  satelliteSource: "Sentinel-2, Landsat 8/9"
}
```

#### ZIP File Contents:
```
satellite-analysis-<timestamp>.zip
├── satellite_analysis.json       ← Main data file (exported structure above)
├── satellite_analysis.csv        ← CSV summary
├── polygon_coordinates.geojson   ← GeoJSON with boundaries
├── polygon_coordinates.txt       ← Plain text coordinates
└── README.txt                    ← Manifest file
```

---

## Stage 3: Upload to Create Form

### URL: `/verification/green-carbon/create`

#### Component: `GreenCarbonForm`
- Location: `/components/forms/green-carbon-form.tsx`

### Upload Handler Flow:

```
User selects ZIP file
        ↓
handleSatelliteDataUpload() triggered
        ↓
parseSatelliteDataFile(file) called
        ↓
parseSatelliteDataZIP() extracts ZIP
        ↓
Look for satellite_analysis.json
        ↓
parseVerificationDataJSON() or extractAnalysisData()
        ↓
ParsedSatelliteData returned with:
  - areaHa (numeric)
  - coordinates (string: "lat, lng")
  - forestType
  - dominantSpecies
  - averageTreeHeight
  - vegetationDescription
  - biomass
  - carbonEstimate
  - ndvi
        ↓
Form fields updated
```

---

## Stage 4: Form Field Auto-Population

### Form Fields & Data Source Mapping:

| Form Field | Extracted From | ZIP Path | Example |
|-----------|----------------|----------|---------|
| **Project Area (Hectares)** | `area.hectares` | `data.area.hectares` | `1234.56` |
| **Project Location Coordinates** | `centerCoordinates` | `data.centerCoordinates` | `6.5234, 107.2456` |
| **Dominant Species** | `dominantSpecies` | `data.dominantSpecies` | `Dipterocarpus, Shorea` |
| **Average Tree Height (m)** | `averageTreeHeight` | `data.averageTreeHeight` | `25-30` |
| **Forest Type** | `forestType` | `data.forestType` | `Tropical Forest` |
| **Vegetation Description** | `vegetationDescription` | `data.vegetationDescription` | Detailed description |
| **Canopy Cover** | Calculated from NDVI | `satellite.ndvi` | `75-95%` |
| **NDVI Value** | Direct | `satellite.ndvi` | `0.72` |

### Form Auto-Fill Code:
```typescript
setFormData((prev) => ({
  ...prev,
  dataLuasan: "1234.56 ha",                              // Project Area
  dataKoordinat: "6.5234, 107.2456",                     // Coordinates
  forestType: "Tropical Forest",                         // Forest Type
  dominantSpecies: "Dipterocarpus, Shorea",              // Dominant Species
  averageTreeHeight: "25-30",                            // Tree Height
  vegetationDescription: "Dense tropical forest...",      // Description
  ndviValue: 0.72                                        // NDVI
}))
```

---

## Stage 5: Carbon Data for Reduction Calculation

### Carbon-Related Fields:

#### Stored in Form (Optional Advanced Fields):
```javascript
// These can be added to form for carbon reduction tracking:
- AGBValue: "250.45"           // Above Ground Biomass in Mg/ha
- CarbonStockTotal: "154567.89"  // Total carbon stock in tC
- CO2eTotal: "425234.56"       // Total CO2 equivalent in tCO2e
- Methodology: "BIOMASS R Package (Chave et al. 2014)"
- Confidence: "0.85"           // 85% confidence
```

#### Used For:
- **Carbon Reduction Calculation**: `Total Carbon Stock × Reduction % = Credits Issued`
- **Verification**: IPCC cross-validation
- **Integrity Scoring**: Aura verification process

---

## Data Validation & Error Handling

### What Parser Checks:
1. ✅ File is ZIP format
2. ✅ Contains satellite_analysis.json
3. ✅ JSON is valid
4. ✅ Has required fields (area, coordinates, forest data)
5. ✅ Area value is numeric and > 0
6. ✅ Coordinates are valid lat/lng format

### Error Messages:
- **"File must be ZIP format"** → User uploaded wrong file type
- **"No satellite analysis data found"** → ZIP doesn't contain expected JSON
- **"Error reading satellite data: [message]"** → JSON parsing failed or invalid structure

---

## Complete Data Structure (satellite_analysis.json)

### Minimal Required Fields:
```json
{
  "area": {
    "hectares": 1234.56,
    "km2": 12.3456
  },
  "centerCoordinates": {
    "latitude": 6.5234,
    "longitude": 107.2456
  },
  "forestType": "Tropical Forest",
  "dominantSpecies": "Dipterocarpus",
  "satellite": {
    "ndvi": 0.72,
    "biomass": 250.45,
    "carbonEstimate": 154567.89
  }
}
```

### Complete Data Structure (All Fields):
```json
{
  "projectName": "Satellite Analysis Project",
  "timestamp": "2024-01-15T10:30:00Z",
  "analysisVersion": "v2.0",
  
  "area": {
    "hectares": 1234.56,
    "km2": 12.3456
  },
  
  "polygonCoordinates": [[lat, lng], ...],
  "centerCoordinates": {
    "latitude": 6.5234,
    "longitude": 107.2456
  },
  
  "forestType": "Tropical Forest",
  "dominantSpecies": "Dipterocarpus, Shorea",
  "averageTreeHeight": "25-30",
  "vegetationDescription": "Dense tropical forest with mixed species",
  
  "satellite": {
    "ndvi": 0.72,
    "cloudCover": 15,
    "vegetationClass": "Dipterocarpus, Shorea",
    "biomass": 250.45,
    "carbonEstimate": 154567.89,
    "unit": "tC/ha",
    "methodology": "BIOMASS R Package",
    "confidence": 0.85
  },
  
  "carbonData": {
    "agb": 250.45,
    "agbUnit": "tC/ha",
    "totalCarbonStock": 154567.89,
    "totalCarbonStockUnit": "tC",
    "co2e": "425234.56",
    "co2eUnit": "tCO2e",
    "methodology": "BIOMASS R Package",
    "confidence": 0.85
  },
  
  "location": "Indonesia, Borneo",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-15"
  },
  "satelliteSource": "Sentinel-2, Landsat 8/9"
}
```

---

## Testing Checklist

- [ ] Run analysis with sample GeoJSON
- [ ] Verify all values calculated correctly
- [ ] Download ZIP file
- [ ] Extract ZIP and check satellite_analysis.json
- [ ] Verify JSON structure is valid
- [ ] Upload ZIP to create form
- [ ] Check all fields auto-populate
- [ ] Verify area shows with "ha" suffix
- [ ] Verify coordinates show as "lat, lng"
- [ ] Verify height shows numeric only
- [ ] Verify description is detailed
- [ ] Verify NDVI and carbon values present

---

## Troubleshooting

### Issue: Fields not populating
**Solution**: Check browser console for "[v0]" debug logs showing what was extracted

### Issue: Area shows "0 ha"
**Solution**: Ensure polygon was uploaded before analysis. Check centerCoordinates in ZIP.

### Issue: Coordinates show "0, 0"
**Solution**: Check polygonCoordinates and centerCoordinates in satellite_analysis.json

### Issue: Tree height empty
**Solution**: Ensure averageTreeHeight is in ZIP data. May need to generate from NDVI if missing.

