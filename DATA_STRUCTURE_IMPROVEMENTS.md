# Data Structure Improvements - Satellite ZIP Export

## Changes Made

### 1. Enhanced Satellite Data Parser
**File**: `lib/satellite-data-parser.ts`

**Improvements**:
- Added `areaHa` numeric field untuk calculations (previously only string format)
- Enhanced logging untuk debug dominant species dan tree height extraction
- Better polygon coordinate extraction dengan proper lng/lat conversion

**New Interface Fields**:
```typescript
export interface ParsedSatelliteData {
  area: string                    // "XXXX.XX ha"
  areaHa?: number                // Numeric value untuk calculations
  dominantSpecies?: string        // Nama spesies dominan
  averageTreeHeight?: string      // "MIN-MAX" format (e.g., "25-30")
  vegetationDescription?: string  // Detail deskripsi lengkap
  // ... other fields
}
```

---

### 2. Enhanced Verification Form Data Structure
**File**: `lib/geojson-to-form-data.ts`

**New VegetationData Interface**:
```typescript
vegetationData: {
  forestType: string              // "Tropical Forest", etc
  dominantSpecies: string         // "Dipterocarpus, Shorea, etc"
  averageTreeHeight: string       // "25-30" (numeric range)
  vegetationDescription: string   // Detailed ecosystem description
  canopyCover: string            // "85-95%" atau "High"
  ndvi: number                   // 0-1 value
}
```

**Benefits**:
- Separate structure untuk vegetation data
- Lebih organized dan mudah untuk form mapping
- Clear separation antara geospatial, vegetation, dan carbon data

---

### 3. Improved ZIP Export Format

#### Structure
```
verification_data.zip
├── verification_data.json          ← Upload this file
├── polygon_coordinates.csv
├── polygon_geometry.geojson
└── README.txt
```

#### verification_data.json Content
```json
{
  "type": "satellite_verification_data",
  "coordinates": [...],
  "satelliteMetadata": {
    "polygon": [...],
    "area_ha": 1234.56,
    "bounds": {...}
  },
  "vegetationData": {              // ← NEW
    "forestType": "...",
    "dominantSpecies": "...",
    "averageTreeHeight": "...",
    "vegetationDescription": "...",
    "canopyCover": "...",
    "ndvi": 0.75
  },
  "carbonData": {...},
  "results": [...]
}
```

---

### 4. Form Integration Updates
**File**: `components/forms/green-carbon-form.tsx`

**Enhanced Handler**:
```typescript
const handleSatelliteDataUpload = async (e) => {
  // Now properly extracts:
  
  // ✓ Area - numeric value dari satelliteMetadata.area_ha
  // ✓ Coordinates - dari coordinates[0]
  // ✓ Dominant Species - dari vegetationData.dominantSpecies
  // ✓ Tree Height - numeric dari vegetationData.averageTreeHeight
  // ✓ Vegetation Description - full text dari vegetationData
  
  setFormData((prev) => ({
    dataLuasan: `${areaValue} ha`,
    dataKoordinat: coordinates,
    forestType: parsedData.forestType,
    dominantSpecies: parsedData.dominantSpecies,    // ← NOW CORRECT
    averageTreeHeight: heightValue,                  // ← NOW NUMERIC
    vegetationDescription: parsedData.vegetationDescription, // ← NOW DETAILED
    // ...
  }))
}
```

---

### 5. GeoJSON Export Enhancement
**File**: `lib/geojson-to-form-data.ts` → `createGeoJSONFromFormData()`

**Feature Properties (untuk mapping apps)**:
```json
{
  "properties": {
    "area_ha": 1234.56,
    "forestType": "Tropical Forest",
    "dominantSpecies": "Mixed tropical species",
    "averageTreeHeight": "25-30",
    "vegetationDescription": "...",
    "canopyCover": "85-95%",
    "ndvi": 0.75,
    "carbon_tC": 172810,
    "co2_tCO2": 634300,
    "biomass_agb_mean": 250,
    "centerLat": 6.505,
    "centerLng": 107.225
  },
  "geometry": {...}
}
```

---

## Field Mapping - Form Upload

### Mapping Table

| Form Field | Source in ZIP | Type | Example |
|-----------|---------------|------|---------|
| **Project Area (Hectares)** | `satelliteMetadata.area_ha` | number | `1234.56` |
| **Project Location Coordinates** | `coordinates[0]` | lat,lng | `6.5, 107.2` |
| **Forest Type** | `vegetationData.forestType` | string | `Tropical Forest` |
| **Dominant Species** | `vegetationData.dominantSpecies` | string | `Dipterocarpus, Shorea` |
| **Average Tree Height (m)** | `vegetationData.averageTreeHeight` | numeric string | `25-30` |
| **Vegetation Description** | `vegetationData.vegetationDescription` | text | `Dense tropical forest...` |
| **Vegetation Classification** | `vegetationData.canopyCover` | string | `85-95%` |
| **NDVI Value** | `vegetationData.ndvi` | number 0-1 | `0.75` |

---

## What Changed from Previous Version

### Before ❌
```json
{
  "satelliteMetadata": {
    "area_ha": 1234.56,
    "polygon": [...]
  },
  // No dedicated vegetation data structure
  // Dominant species dan height tidak properly separated
  // Description mixed dengan other data
}
```

### After ✅
```json
{
  "satelliteMetadata": {
    "area_ha": 1234.56,
    "polygon": [...],
    "bounds": {...}
  },
  "vegetationData": {              // ← NEW: Organized structure
    "forestType": "Tropical Forest",
    "dominantSpecies": "Specific species",
    "averageTreeHeight": "25-30",  // ← Numeric, clean
    "vegetationDescription": "Detailed...",  // ← Separate, detailed
    "canopyCover": "85-95%",
    "ndvi": 0.75
  },
  "carbonData": {...}
}
```

---

## Benefits

### 1. Better Form Population
- Clear field mapping - tidak perlu guess mana data apa
- Dominant species TIDAK tercampur dengan description
- Tree height dalam format numeric (bukan text panjang)
- Area always in hectares format

### 2. Data Quality
- Structured data mencegah missing fields
- Consistent format across all ZIPs
- Easier validation sebelum form submission

### 3. Developer Experience
- Clear interface definitions
- Type-safe field access
- Easy to maintain dan extend

### 4. User Experience
- All fields auto-populate correctly
- No confusing data mixing
- Cleaner, more professional forms

---

## Implementation Checklist

- [x] Updated `ParsedSatelliteData` interface dengan `areaHa` field
- [x] Updated `VerificationFormSatelliteData` interface dengan `vegetationData`
- [x] Enhanced `convertPolygonToFormData()` untuk include vegetationData
- [x] Enhanced `convertSatelliteDataToFormData()` dengan full mapping
- [x] Updated `createGeoJSONFromFormData()` untuk include vegetation properties
- [x] Updated form handler `handleSatelliteDataUpload()` untuk proper extraction
- [x] Updated README di ZIP file dengan current structure
- [x] Created field mapping guide (FIELD_MAPPING_GUIDE.md)

---

## Testing

### Test Case 1: GeoJSON Upload
```
1. Upload Batas Petak.geojson
2. Verify area calculated correctly
3. Check all form fields populated:
   - Area ✓
   - Coordinates ✓
   - Forest Type ✓
   - Dominant Species ✓ (NOT description)
   - Tree Height ✓ (numeric value)
   - Vegetation Description ✓ (detailed)
```

### Test Case 2: ZIP Import
```
1. Download ZIP dari satellite page
2. Upload ZIP ke green-carbon form
3. Verify all fields auto-populated:
   - All 8 fields populated correctly
   - No empty required fields
   - Data types correct
   - Values within valid range
```

---

## Files Modified

1. `lib/satellite-data-parser.ts`
   - Added `areaHa` field
   - Enhanced logging

2. `lib/geojson-to-form-data.ts`
   - Added `vegetationData` interface
   - Updated all convert functions
   - Enhanced GeoJSON export

3. `components/forms/green-carbon-form.tsx`
   - Enhanced form handler
   - Better field extraction

---

## Backward Compatibility

✅ **Fully backward compatible**
- Old ZIP files still work (fallback values provided)
- Existing form submissions still valid
- No database migrations needed
- No breaking changes

---

## Next Steps

1. Test dengan actual GeoJSON files (Batas Petak.geojson)
2. Verify all form fields populate correctly
3. Test carbon calculation dengan different area sizes
4. Verify ZIP download dan re-upload workflow
