# GeoJSON Upload Guide - How to Use

## Quick Start

### Uploading a GeoJSON File

1. **Go to Upload Page**: Navigate to the "Upload Ecological Dataset" page
2. **Select GeoJSON File**: Click upload or drag-and-drop your `.geojson` file
3. **Automatic Processing**: The file will be:
   - ✓ Parsed to extract polygon boundaries
   - ✓ Area calculated from coordinates
   - ✓ Carbon estimates generated
   - ✓ Form fields auto-populated
4. **Download Verification ZIP**: A ZIP file will auto-download containing:
   - `verification_data.json` - Form-compatible data
   - `polygon_coordinates.csv` - Coordinate list
   - `polygon_geometry.geojson` - GeoJSON geometry
   - `README.txt` - Documentation
5. **Continue Form**: Review and complete remaining required fields
6. **Submit**: Proceed to verification

## What Happens Behind the Scenes

```
Your GeoJSON File
      ↓
Polygon Extraction
(boundaries only, no fill patterns)
      ↓
Area Calculation
(from actual coordinates)
      ↓
Carbon Estimation
(using IPCC defaults)
      ↓
Form Auto-Population
(coordinates, area, carbon data)
```

## Supported GeoJSON Formats

### ✓ Supported:

**1. FeatureCollection (Multiple Polygons)**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
      },
      "properties": { ... }
    },
    ...
  ]
}
```

**2. Single Feature with Polygon**
```json
{
  "type": "Feature",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
  },
  "properties": { ... }
}
```

**3. Direct Polygon Geometry**
```json
{
  "type": "Polygon",
  "coordinates": [[[lng1, lat1], [lng2, lat2], ...]]
}
```

**4. MultiPolygon (Multiple Separate Areas)**
```json
{
  "type": "MultiPolygon",
  "coordinates": [
    [[[lng1, lat1], [lng2, lat2], ...]],
    [[[lng3, lat3], [lng4, lat4], ...]]
  ]
}
```

**5. Polygons with Holes**
```json
{
  "type": "Polygon",
  "coordinates": [
    [[lng1, lat1], [lng2, lat2], ...],  // Outer boundary
    [[hlng1, hlat1], [hng2, hlat2], ...]  // Inner hole
  ]
}
```

## What Data Gets Extracted

### Polygon Boundaries Only
- ✓ **Outer boundary**: The main polygon edge
- ✓ **Inner rings**: Any holes within the polygon
- ✗ **Fill patterns**: Ignored (grid patterns, hatching, etc.)
- ✗ **Styling**: Ignored (colors, stroke weights, etc.)

### Calculated Data
- **Area (hectares)**: Calculated from polygon coordinates using geodetic formulas
- **Bounds**: North, South, East, West extent
- **Center coordinates**: Latitude/longitude of polygon center
- **Polygon count**: Number of separate polygons

### Estimated Data (from IPCC defaults)
- **Biomass (Mg/ha)**: 250 Mg/ha (typical tropical forest)
- **Carbon stock (tC)**: 140 tC/ha (typical tropical forest)
- **CO₂ equivalent**: 3.667 × carbon value
- These can be refined with satellite verification later

## Auto-Populated Form Fields

After uploading your GeoJSON, these form fields are automatically filled:

| Form Field | Source | Value |
|-----------|--------|-------|
| Project Description | File name | GeoJSON file name |
| Polygon Coordinates | Extracted | From polygon boundary |
| Area (hectares) | Calculated | From coordinates |
| Estimated Carbon | Estimated | Based on area |
| Estimated Biomass | Estimated | Based on forest type |
| Satellite Data | Generated | Default values |

## Downloading the Verification ZIP

**When you upload a GeoJSON, a ZIP file automatically downloads:**

File | Purpose | Use When
-----|---------|----------
`verification_data.json` | Form import | Re-importing to another form or sharing with team
`polygon_coordinates.csv` | Spreadsheet | Analyzing coordinates in Excel/Google Sheets
`polygon_geometry.geojson` | Mapping apps | Viewing in QGIS, MapBox, Leaflet, etc.
`README.txt` | Instructions | Need help understanding the package

## Example: Using Batas Petak.geojson

**File**: Batas Petak.geojson (819 polygon features)

**What happens**:
1. All 819 polygon boundaries are extracted
2. Area is calculated from actual coordinates
3. First polygon is used for form auto-population (you can edit to choose different polygon)
4. Carbon estimates generated for the extracted area
5. Verification ZIP downloads with all 819 polygon boundaries included

**Result**: Form fields populated with:
- Area: ~12,500 ha (example)
- Coordinates: ~250 boundary points
- Carbon estimate: ~1,750,000 tC (example, based on area)

## Troubleshooting

### Issue: "No polygon coordinates found"
**Solution**: Make sure file contains valid GeoJSON with Polygon or MultiPolygon geometry

### Issue: Area seems wrong
**Solution**: 
- Check that coordinates are in [longitude, latitude] format (GeoJSON standard)
- Verify polygon is not too large (avoid wrapping around globe)
- Check that coordinates are within valid ranges: lat ±90°, lng ±180°

### Issue: Form fields are blank
**Solution**:
- Check browser console for errors (F12 → Console tab)
- Try downloading the verification ZIP manually
- Manually import using `verification_data.json` from the ZIP

### Issue: Downloaded ZIP won't open
**Solution**:
- Use 7-Zip, WinRAR, or macOS built-in Archive Utility
- Or extract files using command line: `unzip filename.zip`

## Coordinate Reference System (CRS)

All coordinates should be in **WGS84** (EPSG:4326), which is the standard for web GeoJSON:
- **Latitude**: -90° to +90° (North-South, Y-axis)
- **Longitude**: -180° to +180° (East-West, X-axis)
- **Format in GeoJSON**: [longitude, latitude] (note: reversed order!)

## What Happens After Upload

1. **Review**: Check that extracted area and coordinates are correct
2. **Refine**: Add more information about the project
3. **Verify**: Add satellite imagery verification if available
4. **Submit**: Complete the verification form
5. **Track**: Monitor your carbon project verification status

## Tips for Best Results

✓ **Use precise boundaries**: Higher polygon point count = more accurate area
✓ **Ensure valid GeoJSON**: Test file on geojson.io before uploading
✓ **Include metadata**: Add properties like forest type, year surveyed
✓ **Check coordinates**: Verify they're in [lng, lat] format
✓ **Use valid ranges**: Ensure lat ±90°, lng ±180°
✓ **No overlapping areas**: Ensure polygons don't overlap (except with holes)

## Need Help?

- See GEOJSON_FIX_SUMMARY.md for technical details
- Check FORM_INTEGRATION.md for form-specific information
- Review example GeoJSON files in the docs folder

---

**Last Updated**: 2026
**Version**: 2.0 (with GeoJSON support)
