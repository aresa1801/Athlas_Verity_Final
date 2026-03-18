# Satellite Data Export Structure - Complete Reference

## Overview
When you download satellite data from the satellite page and upload it to the green-carbon-form, the ZIP file should now contain all necessary fields for complete form auto-population.

## ZIP File Contents

### 1. verification_data.json (MAIN DATA FILE)
This is the primary file that contains all satellite analysis data and is parsed by the form.

```json
{
  "type": "satellite_verification_data",
  "version": "1.0",
  "timestamp": "2024-03-18T...",
  
  "coordinates": [
    {
      "latitude": 6.500000,
      "longitude": 107.245000
    }
  ],
  
  "projectDescription": "Satellite-verified carbon project area...",
  
  "satelliteMetadata": {
    "polygon": [[lat, lng], [lat, lng], ...],
    "polygon_area_ha": 1234.56,      // Project Area in hectares
    "polygon_area_km2": 12.3456,     // Project Area in km²
    "dateRange": {
      "start": "2023-01-01",
      "end": "2023-12-31"
    },
    "cloudThreshold": 20,
    "dataSources": ["mpc", "gee", "aws"],
    "centerCoordinates": {           // Project Location Coordinates
      "latitude": 6.500000,
      "longitude": 107.245000
    }
  },
  
  "vegetationData": {                 // Auto-fill Vegetation fields
    "forestType": "Tropical Forest",
    "dominantSpecies": "Mixed tropical species",
    "averageTreeHeight": "25-30",     // Average Tree Height (m)
    "vegetationDescription": "Dense tropical forest ecosystem...",
    "canopyCover": "85-95%",
    "ndvi": 0.75
  },
  
  "carbonData": {
    "biomass_agb_mean": 250.45,      // Above Ground Biomass (Mg/ha)
    "carbon_tC": 125.23,             // Carbon Stock per hectare (tC/ha)
    "co2_tCO2": 459.45,              // CO2 equivalent (tCO2/ha)
    "net_verified_co2": 400.50,      // Net verified CO2
    "total_carbon_stock_tc": 154567.89,  // Total Stock Carbon for project
    "integrity_class": "A",
    "aura_score": 95.5
  },
  
  "results": [...]  // Satellite band and index data
}
```

## Form Field Mapping

| Form Field | Source Location | Type | Example |
|-----------|------------------|------|---------|
| **Project Area (Hectares)** | `satelliteMetadata.polygon_area_ha` | number | 1234.56 |
| **Project Location Coordinates** | `satelliteMetadata.centerCoordinates` | {lat, lng} | 6.5, 107.245 |
| **Forest Type** | `vegetationData.forestType` | string | "Tropical Forest" |
| **Dominant Species** | `vegetationData.dominantSpecies` | string | "Dipterocarpus, Shorea" |
| **Average Tree Height (m)** | `vegetationData.averageTreeHeight` | string | "25-30" |
| **Vegetation Description** | `vegetationData.vegetationDescription` | string | "Dense tropical forest..." |
| **Canopy Cover %** | `vegetationData.canopyCover` | string | "85-95%" |
| **AGB (Biomass)** | `carbonData.biomass_agb_mean` | number | 250.45 |
| **Carbon Stock (tC)** | `carbonData.carbon_tC` | number | 125.23 |
| **Total Stock Carbon** | `carbonData.total_carbon_stock_tc` | number | 154567.89 |
| **NDVI** | `vegetationData.ndvi` | number | 0.75 |

## Data Completeness Checklist

When uploading satellite data to green-carbon form, verify these fields are present:

### Required for Area Calculation
- [x] `satelliteMetadata.polygon_area_ha` - Project area in hectares
- [x] `satelliteMetadata.polygon_area_km2` - Project area in km²

### Required for Location
- [x] `satelliteMetadata.centerCoordinates.latitude`
- [x] `satelliteMetadata.centerCoordinates.longitude`
- [x] `coordinates[0].latitude` - Center point latitude
- [x] `coordinates[0].longitude` - Center point longitude

### Required for Vegetation Analysis
- [x] `vegetationData.forestType` - Forest classification
- [x] `vegetationData.dominantSpecies` - Primary species
- [x] `vegetationData.averageTreeHeight` - Height range (numeric format)
- [x] `vegetationData.vegetationDescription` - Detailed description
- [x] `vegetationData.canopyCover` - Canopy coverage percentage
- [x] `vegetationData.ndvi` - NDVI value for vegetation health

### Required for Carbon Reduction Calculation
- [x] `carbonData.biomass_agb_mean` - AGB per hectare
- [x] `carbonData.carbon_tC` - Carbon stock per hectare
- [x] `carbonData.total_carbon_stock_tc` - Total project carbon stock
- [x] `carbonData.co2_tCO2` - CO2 equivalent per hectare
- [x] `carbonData.net_verified_co2` - Net verified CO2

## Parsing Process

When you upload a ZIP file in the green-carbon form:

1. **ZIP is opened** by `parseSatelliteDataFile()` function
2. **verification_data.json is extracted** from ZIP
3. **All fields are parsed** by `parseVerificationDataJSON()` function
4. **Form fields are auto-populated** with extracted values
5. **Carbon calculations** use `total_carbon_stock_tc` value

### Extraction Flow

```
ZIP Upload
  ↓
parseSatelliteDataFile()
  ↓
parseSatelliteDataZIP()
  ↓
Found verification_data.json?
  ├─ YES → parseVerificationDataJSON()
  │         ↓
  │       Extract all fields → Return ParsedSatelliteData
  │         ↓
  │       Form auto-populate
  └─ NO → Look for GeoJSON → parseGeoJSONWithMetadata()
```

## Important Notes

### Data Type Validation
- **Area values** (hectares, km²) must be numeric floats
- **Coordinates** must be [lat, lng] or {latitude, longitude} format
- **Height values** should be string with numeric range (e.g., "25-30")
- **Carbon values** must be numeric (no units in the number itself)

### Unit Specifications
- Area: hectares (ha) and km²
- Height: meters (m)
- Biomass: Mg/ha (Megagrams per hectare)
- Carbon Stock: tC (tons of carbon)
- CO2 Equivalent: tCO2e

### Fallback Defaults (if fields missing)
- Forest Type: "Tropical Forest"
- Dominant Species: "Mixed tropical species"
- Average Height: "25-30"
- Canopy Cover: "75-95%"
- AGB: 250 Mg/ha
- NDVI: 0.68

## Testing Validation

To verify data export is correct:

1. Download satellite data from satellite page
2. Extract ZIP locally
3. Open verification_data.json
4. Check that all required fields are present
5. Verify values are in correct format and units
6. Upload ZIP to green-carbon form
7. Verify all form fields auto-populate
8. Check console logs for extraction details

## Troubleshooting

### Issue: Fields not populating
**Solution**: Check that verification_data.json contains vegetationData and carbonData sections

### Issue: Area shows as 0 or NaN
**Solution**: Verify polygon_area_ha exists and is a valid number

### Issue: Coordinates not showing
**Solution**: Check centerCoordinates or coordinates[0] exists with latitude/longitude fields

### Issue: Carbon calculations incorrect
**Solution**: Verify total_carbon_stock_tc is calculated as `carbon_stock_per_ha * polygon_area_ha`

## Satellite Data Source Information

The satellite page automatically detects:
- **Data Sources**: Microsoft Planetary Computer, Google Earth Engine, AWS Sentinel-2
- **Satellite**: Sentinel-2 (primary), Landsat (secondary)
- **Indices Calculated**: NDVI, NDVI Class, Vegetation Type
- **Date Range**: User-specified (form start and end date)
- **Cloud Cover**: User-specified threshold (default 20%)

All metadata is automatically included in the export for audit trail purposes.
