# Field Mapping Guide - GeoJSON to Green Carbon Form

## Overview
Ketika mengupload file ZIP dari satellite data download, semua field di Green Carbon form harus auto-populate dengan data yang tepat dari struktur verification_data.json.

## Field Mapping Detail

### Section B - Geospatial Data

#### Project Area (Hectares) - `dataLuasan`
- **Source**: `verification_data.json` → `satelliteMetadata.area_ha`
- **Format**: "XXX.XX ha" (e.g., "1234.56 ha")
- **Calculation**: Dari polygon boundary coordinates menggunakan geodetic formula
- **Accuracy**: Presisi tinggi karena dari actual polygon coordinates

**Contoh Data di ZIP:**
```json
{
  "satelliteMetadata": {
    "area_ha": 1234.56,
    "polygon": [[6.5, 107.2], [6.51, 107.2], ...]
  }
}
```

#### Project Location Coordinates - `dataKoordinat`
- **Source**: `verification_data.json` → `coordinates[]` (first point)
- **Format**: "LAT, LNG" (e.g., "6.500000, 107.200000")
- **Use**: Center or first point dari polygon untuk location reference
- **Stored in ZIP**: `polygon_coordinates.csv` untuk backup

**Contoh Data di ZIP:**
```json
{
  "coordinates": [
    { "latitude": 6.5, "longitude": 107.2 },
    { "latitude": 6.51, "longitude": 107.25 }
  ]
}
```

---

### Section C - Vegetation Data

#### Vegetation Description - `vegetationDescription`
- **Source**: `verification_data.json` → `vegetationData.vegetationDescription`
- **Format**: Free text description (dapat sangat detail)
- **Content**: Deskripsi detail tentang jenis vegetasi, kondisi, komposisi
- **Example**: "Dense tropical forest ecosystem with mixed species composition and healthy canopy coverage. Multi-source satellite analysis confirms vegetation classification and carbon density estimates."

#### Dominant Species - `dominantSpecies`
- **Source**: `verification_data.json` → `vegetationData.dominantSpecies`
- **Format**: Nama spesies atau group komposisi (string)
- **Content**: Spesies pohon dominan yang terdeteksi dari satellite analysis
- **Example**: 
  - "Dipterocarpus, Shorea, Dryobalanops" (untuk hutan dipterocarp)
  - "Mixed tropical hardwoods"
  - "Acacia, Eucalyptus" (untuk hutan timur Indonesia)

#### Average Tree Height (m) - `averageTreeHeight`
- **Source**: `verification_data.json` → `vegetationData.averageTreeHeight`
- **Format**: "MIN-MAX" atau single number (string, e.g., "25-30", "28")
- **Unit**: Meter
- **Extraction Rule**: Ambil dari `averageTreeHeight` field yang berisi canopy height
- **Example**: "25-30" atau "28" 

**Note**: Field ini HARUS numeric (bukan descriptive) karena untuk form input field yang calculate area calculation.

---

### Section C - Additional Vegetation Metrics

#### Canopy Cover - `vegetationClassification` (derived)
- **Source**: `vegetationData.canopyCover` 
- **Format**: Percentage atau range (e.g., "85-95%", "High")
- **Used for**: Classification validation
- **Stored in ZIP**: As "canopyCover" in vegetationData

#### NDVI Value - `ndviValue`
- **Source**: `vegetationData.ndvi`
- **Format**: Numeric 0-1 (e.g., 0.68, 0.75)
- **Interpretation**:
  - \> 0.7 = Dense, healthy vegetation
  - 0.5-0.7 = Moderate vegetation
  - < 0.5 = Sparse or degraded

---

## Data Extraction dari Polygon

### Area Calculation (Hectares)
```
Formula: Geodetic area calculation (Spherical excess method)
Input: Polygon coordinates [lat, lng]
Output: Area in hectares (ha)
Accuracy: ±2-5% untuk polygons < 10,000 ha
```

### Carbon Estimation (Default)
```
Tropical Forest Default:
- Carbon Stock: ~140 tC/ha (range 80-200)
- Aboveground Biomass: ~250 Mg/ha
- CO2 Equivalent: carbon_tC × 3.667
```

---

## ZIP File Structure untuk Form Upload

```
verification_data.zip
├── verification_data.json          (Main file - upload ini ke form)
├── polygon_coordinates.csv         (Backup format)
├── polygon_geometry.geojson        (Mapping format)
└── README.txt                      (Instructions)
```

### verification_data.json Content Structure
```json
{
  "type": "satellite_verification_data",
  "projectDescription": "Project description dari metadata",
  "coordinates": [
    { "latitude": 6.5, "longitude": 107.2 },
    { "latitude": 6.51, "longitude": 107.25 }
  ],
  "satelliteMetadata": {
    "polygon": [[6.5, 107.2], [6.51, 107.2], ...],
    "area_ha": 1234.56,
    "bounds": {
      "north": 6.51,
      "south": 6.5,
      "east": 107.25,
      "west": 107.2
    }
  },
  "vegetationData": {
    "forestType": "Tropical Forest",
    "dominantSpecies": "Mixed tropical species",
    "averageTreeHeight": "25-30",
    "vegetationDescription": "Dense tropical forest...",
    "canopyCover": "85-95%",
    "ndvi": 0.75
  },
  "carbonData": {
    "biomass_agb_mean": 250,
    "carbon_tC": 140000,
    "co2_tCO2": 513,800,
    "net_verified_co2": 513,800
  },
  "results": [...]
}
```

---

## Form Auto-Fill Logic

### Mapping di Green Carbon Form Handler
```typescript
// File: components/forms/green-carbon-form.tsx
// Function: handleSatelliteDataUpload()

setFormData((prev) => ({
  dataLuasan: `${areaValue} ha`,              // From satelliteMetadata.area_ha
  dataKoordinat: coordinates,                  // From coordinates[0]
  forestType: vegetationData.forestType,       // From vegetationData.forestType
  dominantSpecies: vegetationData.dominantSpecies,  // From vegetationData.dominantSpecies
  averageTreeHeight: heightValue,              // From vegetationData.averageTreeHeight
  vegetationDescription: vegetationData.vegetationDescription,
  ndviValue: vegetationData.ndvi,
}))
```

---

## Testing Checklist

Ketika test upload ZIP file:

- [ ] Area field populated dengan correct hectare value
- [ ] Coordinates field populated dengan latitude,longitude
- [ ] Dominant Species field populated (bukan vegetation description)
- [ ] Average Tree Height populated (numeric value, bukan descriptive)
- [ ] Vegetation Description field populated (detailed, mengandung canopy info)
- [ ] NDVI value calculated/extracted
- [ ] All fields dapat di-edit setelah import
- [ ] Form validation pass sebelum submit

---

## Common Issues & Solutions

### Issue 1: Field "Dominant Species" kosong
**Cause**: GeoJSON tidak memiliki property untuk dominant species
**Solution**: Use satellite data parser untuk detect dari NDVI/vegetation indices, atau input default "Mixed tropical species"

### Issue 2: "Average Tree Height" berisi text panjang
**Cause**: Height data di-mix dengan vegetation description
**Solution**: Extract HANYA numeric value (e.g., "25-30" dari "average height 25-30 meters with dense canopy")

### Issue 3: Area field mismatch antara form dan polygon
**Cause**: Area calculation method berbeda
**Solution**: Always use geodetic formula (spherical excess) untuk accuracy, store raw polygon coordinates di ZIP

### Issue 4: Coordinates tidak auto-populate
**Cause**: Coordinates array format salah atau missing
**Solution**: Ensure ZIP contains `coordinates` array dengan `latitude` dan `longitude` properties

---

## Technical Notes

### Why Geodetic Calculation?
- Regular Shoelace formula: akurat untuk area kecil (< 1 km²)
- Geodetic (spherical excess): akurat untuk area besar karena account untuk Earth's curvature
- Implementation di: `lib/satellite-data-parser.ts` → `calculateGeodesicArea()`

### IPCC Carbon Defaults
- Used when satellite-based estimates tidak available
- Tropical Forest: 140 tC/ha (conservative estimate)
- Temperate Forest: 100 tC/ha
- Boreal Forest: 60 tC/ha

### Satellite Data Sources (di ZIP)
- Sentinel-2 (10m resolution)
- Landsat (30m resolution)
- MODIS (250m resolution)
- Stored dalam `dataSource` array

---

## Integration Points

1. **Upload Flow**: `app/upload/page.tsx` 
   - Detects `.zip` files dengan `verification_data.json`
   - Parses dengan `parseSatelliteDataFile()`

2. **Form Population**: `components/forms/green-carbon-form.tsx`
   - Handler: `handleSatelliteDataUpload()`
   - Auto-fills fields sesuai mapping di atas

3. **Data Export**: `lib/geojson-to-form-data.ts`
   - Generates ZIP dengan structure ini
   - Used saat export dari satellite page

4. **ZIP Creation**: `lib/satellite-data-exporter.ts`
   - Creates proper ZIP format
   - Includes all required files dan metadata
