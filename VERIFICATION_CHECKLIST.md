# Verification Checklist - Data Structure & Form Integration

## Quick Test Guide

Gunakan checklist ini untuk verify bahwa semua perbaikan bekerja dengan benar.

---

## Test 1: GeoJSON File Upload

### Prerequisites
- Batas Petak.geojson file (atau any valid GeoJSON dengan 819 polygons)
- Browser dengan akses ke aplikasi

### Steps

1. **Navigate to Upload Page**
   - [ ] Go to `/upload` page
   - [ ] Verify page loads without errors

2. **Upload GeoJSON File**
   - [ ] Click file input atau drag-drop Batas Petak.geojson
   - [ ] Verify file accepted (should be auto-detected as .geojson)
   - [ ] Check console for log message

3. **Verify Parsing**
   - [ ] Alert should show:
     - Area: XXXX.XX ha
     - Coordinates: number of points
   - [ ] No error message about "No polygon coordinates found"

4. **Verify ZIP Download**
   - [ ] Automatic download of `Batas Petak-verification.zip`
   - [ ] File size > 100KB (contains polygon coordinates)

5. **Check Form Population** (if on form page)
   - [ ] `dataLuasan` field: "XXXX.XX ha" ✓
   - [ ] `dataKoordinat` field: "6.5, 107.2" format ✓
   - [ ] No error messages

---

## Test 2: ZIP File Structure Verification

### After downloading verification ZIP

1. **Extract ZIP File**
   - [ ] Extract verification_data.zip
   - [ ] Verify 4 files exist:
     - `verification_data.json` ✓
     - `polygon_coordinates.csv` ✓
     - `polygon_geometry.geojson` ✓
     - `README.txt` ✓

2. **Inspect verification_data.json**
   ```bash
   # Using terminal or text editor
   cat verification_data.json | head -50
   ```
   - [ ] Valid JSON format (no parse errors)
   - [ ] Contains `satelliteMetadata.area_ha` ✓
   - [ ] Contains `vegetationData` object ✓
   - [ ] `vegetationData.dominantSpecies` field present ✓
   - [ ] `vegetationData.averageTreeHeight` field present ✓
   - [ ] `vegetationData.vegetationDescription` field present ✓

3. **Verify Key Fields in JSON**
   ```json
   {
     "satelliteMetadata": {
       "area_ha": [NUMERIC VALUE],
       "polygon": [[lat,lng], ...],
       "bounds": {...}
     },
     "vegetationData": {
       "forestType": "Tropical Forest",
       "dominantSpecies": "[SPECIES NAME]",
       "averageTreeHeight": "[NUMERIC RANGE]",
       "vegetationDescription": "[TEXT]",
       "canopyCover": "[PERCENTAGE]",
       "ndvi": [0.0-1.0]
     }
   }
   ```

---

## Test 3: Form Field Auto-Population

### On Green Carbon Form Page (`/verification/green-carbon/create`)

1. **Upload ZIP File**
   - [ ] Go to form
   - [ ] Click "Upload Satellite Data" button
   - [ ] Select `verification_data.json` from extracted ZIP

2. **Verify Field Population**

   **Field: Project Area (Hectares)** - `dataLuasan`
   - [ ] Contains numeric area + " ha" suffix
   - [ ] Example: "1234.56 ha"
   - [ ] NOT: empty, "Error", or text

   **Field: Project Location Coordinates** - `dataKoordinat`
   - [ ] Format: "6.500000, 107.200000"
   - [ ] Contains comma-separated lat,lng
   - [ ] NOT: "Error reading file"

   **Field: Dominant Species** - `dominantSpecies`
   - [ ] Contains actual species name
   - [ ] Example: "Dipterocarpus, Shorea, Dryobalanops"
   - [ ] NOT: vegetation description
   - [ ] NOT: "Dense forest..."

   **Field: Average Tree Height (m)** - `averageTreeHeight`
   - [ ] Contains ONLY numeric value or range
   - [ ] Example: "25-30" or "28"
   - [ ] NOT: "25-30 meters with dense canopy"
   - [ ] Editable as input field

   **Field: Vegetation Description** - `vegetationDescription`
   - [ ] Contains detailed description
   - [ ] Example: "Dense tropical forest ecosystem with mixed species..."
   - [ ] Multiple sentences
   - [ ] Contains canopy/height/composition info

   **Field: Forest Type** - `forestType`
   - [ ] Example: "Tropical Forest"
   - [ ] Properly classified

   **Field: Vegetation Classification** - `vegetationClassification`
   - [ ] Based on forest type or canopy cover
   - [ ] Example: "Dense Forest"

   **Field: NDVI Value** - `ndviValue`
   - [ ] Numeric 0-1
   - [ ] Example: 0.68, 0.75, etc
   - [ ] Indicates vegetation health

---

## Test 4: Console Logging Verification

### Check Browser Console (F12 → Console tab)

1. **After GeoJSON Upload**
   Look for logs like:
   ```
   [v0] Processing GeoJSON file: Batas Petak.geojson
   [v0] GeoJSON parsed successfully: {coordinates: 825, area: 1234.56, format: "FeatureCollection"}
   [v0] Polygon coordinates extracted: 825 points
   [v0] Dominant Species: Mixed tropical species Tree Height: 25-30
   ```
   - [ ] All logs present
   - [ ] No ERROR or exceptions

2. **After ZIP Upload to Form**
   Look for logs like:
   ```
   [v0] Satellite data successfully extracted: {
     area: "1234.56 ha",
     areaHa: 1234.56,
     coordinates: "6.5, 107.2",
     forestType: "Tropical Forest",
     species: "Mixed tropical species",
     height: "25-30",
     ...
   }
   ```
   - [ ] All data fields logged
   - [ ] No errors or warnings

---

## Test 5: Data Accuracy Verification

### Polygon Area Calculation

1. **Compare with Other Tools**
   - [ ] Use geojson.io atau mapshaper.org
   - [ ] Upload same GeoJSON
   - [ ] Compare calculated area
   - [ ] Should be within ±5% (acceptable for geodetic calculations)

2. **Verify Coordinates**
   - [ ] Polygon boundary points di-extract correctly
   - [ ] First coordinate matches file
   - [ ] All boundary points included

3. **Carbon Estimation**
   - [ ] Based on area and IPCC defaults
   - [ ] Formula: area_ha × 140 tC/ha = carbon_tC
   - [ ] CO2 = carbon_tC × 3.667

---

## Test 6: Download & Re-import Workflow

### Full Round-Trip Test

1. **Download from Satellite Page**
   - [ ] Generate satellite analysis
   - [ ] Download ZIP file
   - [ ] File size reasonable (>1MB for large polygons)

2. **Import to Verification Form**
   - [ ] Extract ZIP
   - [ ] Select verification_data.json
   - [ ] Upload to form

3. **Verify All Fields Auto-Populate**
   - [ ] No manual data entry required
   - [ ] All required fields filled
   - [ ] Data types correct

4. **Submit Form**
   - [ ] Form validation passes
   - [ ] No missing field errors
   - [ ] Successful submission

---

## Test 7: Error Handling

### Test Invalid Inputs

1. **Wrong File Format**
   - [ ] Upload `.txt` instead of `.zip`
   - [ ] Should show clear error message
   - [ ] Form remains usable

2. **Corrupted ZIP**
   - [ ] Create invalid ZIP file
   - [ ] Upload to form
   - [ ] Should show error, not crash
   - [ ] Helpful error message

3. **Missing Required Fields**
   - [ ] Manually delete a field from JSON
   - [ ] Try to upload
   - [ ] Should provide fallback or error

4. **Invalid Polygon**
   - [ ] GeoJSON dengan < 3 coordinates
   - [ ] Should show error immediately
   - [ ] Clear message: "Polygon must have at least 3 coordinates"

---

## Test 8: Data Persistence

### Check Data Storage

1. **Form State**
   - [ ] After upload, refresh page
   - [ ] Data persists (localStorage atau URL state)
   - [ ] Can edit fields
   - [ ] Can re-submit

2. **Database Storage** (if applicable)
   - [ ] After form submit, check database
   - [ ] All fields stored correctly
   - [ ] Area, coordinates, species all present
   - [ ] Carbon estimates calculated

---

## Performance Checklist

1. **Upload Performance**
   - [ ] GeoJSON parsing: < 2 seconds
   - [ ] ZIP creation: < 1 second
   - [ ] Form population: instant

2. **File Size**
   - [ ] verification_data.json: < 500KB
   - [ ] Complete ZIP: < 2MB
   - [ ] Reasonable for network transfer

3. **Browser Memory**
   - [ ] No memory leaks
   - [ ] Can process multiple files sequentially
   - [ ] Console clear of warnings

---

## Field-by-Field Validation

### Create table to verify each field:

| Field | Required | Type | Min | Max | Format | Status |
|-------|----------|------|-----|-----|--------|--------|
| dataLuasan | Yes | string | 0 | 99999 | "XXX.XX ha" | ✓/✗ |
| dataKoordinat | Yes | string | - | - | "LAT, LNG" | ✓/✗ |
| dominantSpecies | Yes | string | 1 | 200 | Text | ✓/✗ |
| averageTreeHeight | Yes | string | 1 | 100 | Numeric/range | ✓/✗ |
| vegetationDescription | Yes | string | 10 | 1000 | Text | ✓/✗ |
| forestType | Yes | string | - | - | Predefined | ✓/✗ |
| vegetationClassification | No | string | - | - | Text | ✓/✗ |
| ndviValue | Yes | number | 0 | 1 | Decimal | ✓/✗ |

---

## Known Issues & Expected Behavior

### Issue: Area slightly different from mapshaper.io
**Expected**: ±5% variance normal (different projection/calculation method)
**Action**: Document in metadata, not a bug

### Issue: Dominant species shows "Mixed tropical species"
**Expected**: Fallback value when detailed classification unavailable
**Action**: User can edit in form, that's fine

### Issue: Tree height shows "25-30" instead of exact value
**Expected**: Satellite data gives ranges, not precise values
**Action**: User can refine based on field data, appropriate

---

## Sign-Off Checklist

- [ ] All 8 tests completed
- [ ] No critical errors
- [ ] All fields auto-populate correctly
- [ ] Console logging shows proper flow
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Documentation updated
- [ ] Ready for production

---

## Files to Verify

1. **Core Implementation**
   - [ ] `lib/satellite-data-parser.ts` - has areaHa field ✓
   - [ ] `lib/geojson-to-form-data.ts` - has vegetationData ✓
   - [ ] `components/forms/green-carbon-form.tsx` - proper handler ✓
   - [ ] `app/upload/page.tsx` - GeoJSON detection ✓

2. **Documentation**
   - [ ] `FIELD_MAPPING_GUIDE.md` - complete ✓
   - [ ] `DATA_STRUCTURE_IMPROVEMENTS.md` - detailed ✓
   - [ ] `VERIFICATION_CHECKLIST.md` - this file ✓

---

## Test Data Sources

### Recommended Test Files
- Batas Petak.geojson (819 features) - provided
- Small test polygon (< 100 ha) - for basic testing
- Large polygon (> 10,000 ha) - for performance testing
- MultiPolygon GeoJSON - for edge case testing

---

**Last Updated**: [Current Date]
**Status**: Ready for Testing
**Tested By**: _________________
**Date**: _________________
