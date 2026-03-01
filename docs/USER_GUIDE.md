# Satellite Verification User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Drawing Polygons](#drawing-polygons)
3. [Uploading Data](#uploading-data)
4. [Configuring Satellite Analysis](#configuring-satellite-analysis)
5. [Understanding Results](#understanding-results)
6. [Exporting Reports](#exporting-reports)
7. [Troubleshooting](#troubleshooting)

## Getting Started

### First Steps

1. Navigate to the Satellite Verification page
2. Click "Start Verification" button
3. Choose your project type (Green Carbon, Blue Carbon, or Renewable Energy)
4. Begin drawing polygon or import existing shapefile

### Project Types

**Green Carbon**
- Forest and land-based projects
- Tropical, temperate, and peat forests
- Standalone trees and agroforestry

**Blue Carbon**
- Coastal ecosystem projects
- Mangrove forests, seagrass beds, salt marshes
- Includes belowground biomass

**Renewable Energy**
- Solar farms, wind turbines, hydroelectric
- Grid connection and emission factor analysis

## Drawing Polygons

### Creating a Polygon

1. Click "Draw Polygon" button on the map
2. Select drawing tool:
   - **Rectangle**: Click two corners
   - **Circle**: Click center, then drag radius
   - **Freehand**: Click to add points, double-click to finish

3. Minimum 3 points required
4. Real-time area calculation displays in hectares (ha)
5. Click "Done Drawing" to finish

### Editing Polygons

- **Move vertex**: Click and drag any point
- **Add point**: Right-click on edge, select "Add point"
- **Delete point**: Right-click point, select "Delete"
- **Clear**: Click "Clear Polygon" to start over

### Import Polygon

1. Click "Import Polygon"
2. Select file format:
   - GeoJSON (.geojson, .json)
   - Shapefile (.shp, .zip)
   - KML (.kml)
   - WKT (text)
   - CSV (lat,lng columns)

3. Upload file (max 50MB)
4. Polygon auto-loads on map

### Tips

- Keep polygons under 10,000 vertices for optimal performance
- Ensure polygon doesn't self-intersect
- Use realistic, non-overlapping areas
- Save coordinates for record-keeping

## Uploading Data

### File Upload Requirements

**Supported Formats:**
- GeoJSON - Most common, web-friendly
- Shapefile - Standard GIS format (include .dbf, .shx, .prj)
- KML - Google Earth format
- DXF - AutoCAD format
- ZIP - Compressed multi-file archives

**File Size:** Max 50MB

**Coordinate System:** WGS84 (EPSG:4326) recommended

### Upload Steps

1. Click "Upload File" button
2. Select or drag-drop file
3. File auto-validates
4. Choose action:
   - **Use as polygon**: Loads boundary on map
   - **Attach to project**: Stores reference
   - **Replace existing**: Overwrites current polygon

## Configuring Satellite Analysis

### Location Setup

1. Select **Country** from dropdown
2. Choose **Province/State** (auto-filtered)
3. Enter **City/District** (optional)
4. Coordinates auto-populate from map
5. Or click "Use Map Center" to set from map

### Date Range

1. Choose **Start Date**
2. Choose **End Date**
3. Select **Season** (Wet, Dry, or All)
4. Toggle "Use most recent cloud-free" for auto-selection

Available scenes display once dates selected.

### Satellite Source

Choose data source:
- **Google Earth Engine** - Free, comprehensive, recommended
- **Sentinel-2 (AWS)** - 10m resolution, frequent updates
- **Microsoft Planetary** - Curated global dataset

**Processing Level:**
- L1C - Raw reflectance
- L2A - Atmospherically corrected

### Cloud Cover Threshold

1. Drag slider (0-100%)
2. Default: 25%
3. Lower = clearer images, fewer options
4. Enable "Auto-filter clouds" for automatic masking

### Resolution Selection

Choose imagery resolution:
- **10m** - Best for small areas, highest detail
- **30m** - Good balance, most flexible
- **100m** - Large areas, broadscale analysis
- **250m** - Global coverage, fastest processing

### Band & Index Selection

**Bands** (automatically combined):
- Red (B4), Green (B3), Blue (B2) - Natural color
- NIR (B8) - Vegetation analysis
- SWIR (B11) - Moisture content
- Thermal (B10) - Temperature

**Indices** (auto-calculated):
- **NDVI** - Vegetation health (default)
- **EVI** - Enhanced vegetation index
- **SAVI** - Soil-adjusted VI
- **NDMI** - Moisture index
- **NBR** - Burn ratio

### Vegetation Classification

Select primary vegetation type:
- Tropical Rainforest
- Mangrove (Blue Carbon)
- Peat Swamp Forest
- Temperate Forest
- Mixed/Unknown

## Understanding Results

### Carbon Estimation

**AGB (Above-Ground Biomass)**
- Measured in tons per hectare (t/ha)
- Converted to carbon content (tC/ha)
- Final CO2 equivalent (tCO2e/ha)

**Uncertainty Range**
- Minimum 15% uncertainty floor
- Higher at edges of maps
- Reflects model confidence

### Data Quality Metrics

- **Cloud Cover %**: Lower is better
- **Data Points**: More = higher confidence
- **Temporal Coverage**: Longer = better trend
- **Model Agreement**: % consensus across AI models

### Vegetation Health

- **NDVI Score**: 0-1, higher = healthier
- **Health Status**: Poor, Fair, Good, Excellent
- **Confidence**: % certainty of assessment
- **Trend**: Improving, Stable, Declining

### Risk Assessment

- **Disturbance Risk**: Low, Medium, High
- **Legal Protection**: Protected, Unprotected
- **Accessibility**: Difficult, Moderate, Easy
- **Validation Grade**: A-D scale

## Exporting Reports

### PDF Report

1. Click "Export PDF"
2. Customization options:
   - Include charts
   - Include coordinates
   - Include methodology
   - Digital signature

3. Download automatically starts
4. File: `verification-YYYY-MM-DD.pdf`

**Report Contents:**
- Executive summary
- Carbon analysis results
- Satellite imagery samples
- Methodology and assumptions
- Recommendations
- Audit trail

### Excel Export

1. Click "Export Excel"
2. Multi-sheet workbook includes:
   - **Summary** - Key metrics
   - **Analysis** - Detailed calculations
   - **Satellite** - Imagery metadata
   - **Recommendations** - Actions items
   - **Coordinates** - Boundary points

### CSV Export

Simple CSV format for data integration:
- Polygon coordinates
- Metrics summary
- Timestamps

## Troubleshooting

### Common Issues

**"No satellite data available"**
- Dates may be outside satellite coverage
- Try broader date range
- Check for permanent cloud cover (coastal areas)
- Select different satellite source

**"Polygon too complex"**
- Simplify boundary (reduce vertices)
- Split into multiple polygons
- Use auto-simplification tool

**"Cloud cover exceeds threshold"**
- Lower threshold in settings
- Choose different date range
- Select different satellite (Sentinel-2 fresher)

**"Coordinates out of bounds"**
- Check lat/lng format (-90 to 90, -180 to 180)
- Use map picker instead of manual entry
- Verify location on map preview

### API Errors

**Rate limit exceeded**
- Wait 1 hour before retry
- Upgrade to Pro plan
- Contact support for enterprise access

**Authentication failed**
- Check API keys in settings
- Verify account permissions
- Regenerate keys if needed

**Processing timeout**
- Request too large - reduce area
- Too many indices - select fewer
- Try again later during low-traffic

### Performance Tips

- Keep polygons under 1000 vertices
- Use appropriate resolution for area size
- Avoid multiple parallel requests
- Cache results locally between exports

### Getting Help

- Email: support@athlas-verity.com
- Discord: discord.gg/athlas-verity
- Status page: status.athlas-verity.com
- Knowledge base: docs.athlas-verity.com
