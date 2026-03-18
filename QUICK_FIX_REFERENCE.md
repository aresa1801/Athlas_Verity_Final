# Quick Reference - Form Data Structure Fix

## The Problem (In 30 Seconds)

```
Upload ZIP to form:
❌ dominantSpecies = "Dense forest ecosystem with mixed..." (WRONG - this is description!)
❌ averageTreeHeight = "Dense canopy with average height..." (WRONG - this is description!)
✓ vegetationDescription = "Dense forest..." (CORRECT)
```

## The Solution

Separate the data into dedicated fields in ZIP:

```json
{
  "vegetationData": {
    "dominantSpecies": "Dipterocarpus, Shorea",     // ← SPECIES ONLY
    "averageTreeHeight": "25-30",                    // ← NUMERIC ONLY
    "vegetationDescription": "Dense forest with...", // ← DETAILED TEXT
    "forestType": "Tropical Forest",
    "canopyCover": "85-95%",
    "ndvi": 0.75
  }
}
```

---

## Files Changed - Quick Summary

### 1. `lib/satellite-data-parser.ts`
```diff
  export interface ParsedSatelliteData {
    area: string
+   areaHa?: number          // ← Added for calculations
    // ... rest of fields
  }
```

### 2. `lib/geojson-to-form-data.ts`
```diff
  export interface VerificationFormSatelliteData {
    satelliteMetadata: { ... }
+   vegetationData: {         // ← NEW STRUCTURE
+     forestType: string
+     dominantSpecies: string
+     averageTreeHeight: string
+     vegetationDescription: string
+     canopyCover: string
+     ndvi: number
+   }
    carbonData: { ... }
  }
```

### 3. `components/forms/green-carbon-form.tsx`
```diff
  const handleSatelliteDataUpload = async (e) => {
    // ...
+   // Extract height as numeric (remove "m", "meters", etc)
+   let heightValue = String(parsedData.averageTreeHeight)
+     .replace(/[^0-9\-\.]/g, '')
    
    setFormData((prev) => ({
      dominantSpecies: parsedData.dominantSpecies,  // ← Species ONLY
      averageTreeHeight: heightValue,               // ← Numeric ONLY
      vegetationDescription: parsedData.vegetationDescription,
    }))
  }
```

---

## Field Mapping (Most Important!)

| Form Field | JSON Path | Type | Example |
|-----------|-----------|------|---------|
| **Dominant Species** | `vegetationData.dominantSpecies` | string | "Dipterocarpus, Shorea" |
| **Average Tree Height** | `vegetationData.averageTreeHeight` | string | "25-30" |
| **Vegetation Description** | `vegetationData.vegetationDescription` | string | "Dense tropical forest..." |
| Project Area | `satelliteMetadata.area_ha` | number | 1234.56 |
| Coordinates | `coordinates[0]` | object | {lat: 6.5, lng: 107.2} |

---

## What the ZIP Contains Now

```
verification_data.zip
└── verification_data.json
    {
      "satelliteMetadata": {
        "area_ha": 1234.56,
        "polygon": [[6.5, 107.2], ...],
        "bounds": { ... }
      },
      "vegetationData": {
        "dominantSpecies": "...",
        "averageTreeHeight": "...",
        "vegetationDescription": "...",
        "forestType": "...",
        "canopyCover": "...",
        "ndvi": 0.75
      },
      "carbonData": { ... }
    }
```

---

## Testing (Quick Version)

### Test 1: Upload GeoJSON
```
1. Upload Batas Petak.geojson
2. ZIP downloads automatically
3. Alert shows: "Area: XXXX.XX ha, Coordinates: XXXX points"
```

### Test 2: Extract ZIP
```
verification_data.zip
├── verification_data.json     ← Main file
├── polygon_coordinates.csv
├── polygon_geometry.geojson
└── README.txt
```

### Test 3: Upload ZIP to Form
```
1. Go to green-carbon form
2. Upload verification_data.json
3. Check fields:
   ✓ Dominant Species = "Species name" (NOT description)
   ✓ Tree Height = "25-30" (NOT description)
   ✓ Vegetation Desc = "Dense forest..." (detailed)
   ✓ Area = "1234.56 ha"
   ✓ Coordinates = "6.5, 107.2"
```

---

## Common Mistakes to Avoid

❌ **Don't**: Put description in dominantSpecies field
```json
"dominantSpecies": "Dense forest ecosystem with mixed species"
```

✅ **Do**: Put only species name
```json
"dominantSpecies": "Dipterocarpus, Shorea, Dryobalanops"
```

---

❌ **Don't**: Put full text in averageTreeHeight
```json
"averageTreeHeight": "The forest has an average canopy height of 25 to 30 meters"
```

✅ **Do**: Put only numeric/range
```json
"averageTreeHeight": "25-30"
```

---

❌ **Don't**: Leave vegetationDescription empty
```json
"vegetationDescription": ""
```

✅ **Do**: Put detailed description
```json
"vegetationDescription": "Dense tropical forest dominated by Dipterocarpus and Shorea species with average canopy height of 25-30 meters and 85-95% canopy cover."
```

---

## Code Examples

### Extracting Height Correctly
```typescript
// ❌ WRONG: Keep full text
averageTreeHeight: "Average height 25-30 meters with dense canopy"

// ✅ RIGHT: Extract numeric only
const heightValue = String(parsedData.averageTreeHeight)
  .replace(/[^0-9\-\.]/g, '')
// Result: "25-30"
```

### Extracting Area Correctly
```typescript
// ❌ WRONG: Keep as string only
dataLuasan: "1234.56"

// ✓ RIGHT: Include unit
dataLuasan: "1234.56 ha"

// Also store numeric for calculations
areaHa: 1234.56
```

---

## Console Debugging

### Look for these logs after upload:
```
[v0] GeoJSON parsed successfully: {coordinates: 825, area: 1234.56}
[v0] Polygon coordinates extracted: 825 points
[v0] Dominant Species: Mixed tropical species Tree Height: 25-30
[v0] Satellite data successfully extracted: {
  area: "1234.56 ha",
  coordinates: "6.5, 107.2",
  species: "Mixed tropical species",
  height: "25-30",
  ...
}
```

### Look for these logs after form upload:
```
[v0] Satellite data successfully extracted: {
  area: "1234.56 ha",
  areaHa: 1234.56,
  coordinates: "6.5, 107.2",
  forestType: "Tropical Forest",
  species: "Mixed tropical species",
  height: "25-30"
}
```

---

## FAQ

### Q: Why separate species from description?
**A**: Because they serve different purposes:
- Species: For species-specific regulations & carbon models
- Description: For human-readable ecosystem overview

### Q: What if satellite data doesn't have specific species?
**A**: Use fallback: `"Mixed tropical species"` (user can edit in form)

### Q: What if we only have average height, not range?
**A**: That's fine! Use `"28"` instead of `"25-30"`

### Q: Can user edit fields after import?
**A**: Yes! All fields are editable in the form.

---

## Reference Files

Quick links to detailed docs:

- **Field Mapping Details**: `FIELD_MAPPING_GUIDE.md`
- **Technical Changes**: `DATA_STRUCTURE_IMPROVEMENTS.md`
- **Testing Procedures**: `VERIFICATION_CHECKLIST.md`
- **Full Summary**: `CHANGES_SUMMARY.md`

---

## Checklist Before Pushing

- [ ] `lib/satellite-data-parser.ts` - has `areaHa` field
- [ ] `lib/geojson-to-form-data.ts` - has `vegetationData` interface
- [ ] Form handler extracts height as numeric
- [ ] ZIP contains all required fields
- [ ] Console logging shows proper extraction
- [ ] No field mixing in auto-population
- [ ] Documentation updated
- [ ] Tests pass

---

## Status
✅ Implementation Complete
Ready for Testing & Deployment
