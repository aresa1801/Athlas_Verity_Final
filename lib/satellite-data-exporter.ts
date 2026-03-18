/**
 * Satellite data exporter for geospatial verification
 * Generates PDF reports and ZIP packages with satellite analysis data
 */

export interface SatelliteExportData {
  projectName: string
  timestamp: string
  analysisVersion?: string
  area: { hectares: number; km2: number }
  forestType: string
  dominantSpecies?: string
  averageTreeHeight?: string
  vegetationDescription?: string
  polygonCoordinates: Array<[number, number]>
  centerCoordinates?: { latitude: number; longitude: number }
  multiPolygons?: Array<{
    outerRing: Array<[number, number]>
    innerRings: Array<Array<[number, number]>>
  }>
  polygonInfo?: { count: number; holes: number }
  dateRange?: { startDate?: string; endDate?: string }
  location?: string
  satelliteSource?: string
  uploadedFile?: string
  uploadedFileName?: string
  satellite: {
    ndvi: number
    cloudCover: number
    vegetationClass: string
    biomass: number | string
    carbonEstimate: number | string
    unit?: string
    methodology?: string
    confidence?: number
  }
  carbonData?: {
    agb: number | string
    agbUnit?: string
    totalCarbonStock: number | string
    totalCarbonStockUnit?: string
    co2e?: string
    co2eUnit?: string
    methodology?: string
    confidence?: number
  }
}

/**
 * Generate PDF report (mock implementation - would use pdfmake in production)
 */
export async function generateSatellitePDF(data: SatelliteExportData): Promise<Blob> {
  const biomassValue = typeof data.satellite.biomass === 'number' ? data.satellite.biomass : parseFloat(String(data.satellite.biomass))
  const carbonValue = typeof data.satellite.carbonEstimate === 'number' ? data.satellite.carbonEstimate : parseFloat(String(data.satellite.carbonEstimate))
  const unit = data.satellite.unit || 'Ton CO2e/Ha'
  
  const pdfContent = `
SATELLITE ANALYSIS REPORT
=========================

Project: ${data.projectName}
Generated: ${data.timestamp}

AREA CALCULATION
----------------
Hectares: ${data.area.hectares.toFixed(2)} ha
Km²: ${data.area.km2.toFixed(4)} km²
${data.polygonInfo ? `Polygon Count: ${data.polygonInfo.count}\nHoles: ${data.polygonInfo.holes}` : ''}

FOREST CHARACTERISTICS
---------------------
Forest Type: ${data.forestType}
Vegetation Class: ${data.satellite.vegetationClass}
Canopy Height: Classified

SPECTRAL ANALYSIS
-----------------
NDVI (Vegetation Index): ${data.satellite.ndvi.toFixed(3)}
Cloud Cover: ${data.satellite.cloudCover.toFixed(1)}%
Biomass (AGB): ${biomassValue.toFixed(2)} ${unit}

CARBON ANALYSIS
---------------
Estimated Carbon Stock: ${carbonValue.toFixed(2)} ${unit}
Total Project Carbon: ${(carbonValue * data.area.hectares).toFixed(2)} tCO2e

POLYGON COORDINATES
------------------
${data.polygonCoordinates.map(([lat, lng]) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`).join("\n")}
  `

  return new Blob([pdfContent], { type: "application/pdf" })
}

/**
 * Generate ZIP package with complete satellite data for form population
 * Includes all processed data needed for green carbon and blue carbon verification
 * Uses jszip for proper ZIP file generation
 */
export async function generateSatelliteDataZIP(data: SatelliteExportData): Promise<Blob> {
  try {
    // Try to use JSZip if available
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()

    // Generate all file contents
    const csvContent = generateCSV(data)
    const jsonContent = JSON.stringify(data, null, 2)
    const coordinatesContent = generateCoordinatesFile(data)
    const geojsonContent = generateGeoJSONFile(data)
    const manifestContent = generateManifest(data)

    // Add files to ZIP
    zip.file('README.txt', manifestContent)
    zip.file('satellite_analysis.json', jsonContent)
    zip.file('satellite_analysis.csv', csvContent)
    zip.file('polygon_coordinates.geojson', geojsonContent)
    zip.file('polygon_coordinates.txt', coordinatesContent)

    // Generate and return ZIP blob
    const blob = await zip.generateAsync({ type: 'blob' })
    return blob
  } catch (error) {
    console.error('[v0] JSZip not available, using fallback format')
    // Fallback: return data as JSON blob if ZIP not available
    const data_stringified = JSON.stringify({
      projectName: data.projectName,
      timestamp: data.timestamp,
      area: data.area,
      polygonCoordinates: data.polygonCoordinates,
      multiPolygons: data.multiPolygons,
      satellite: data.satellite,
    }, null, 2)
    
    return new Blob([data_stringified], { type: 'application/json' })
  }
}

/**
 * Generate manifest/README content
 */
function generateManifest(data: SatelliteExportData): string {
  return `SATELLITE DATA PACKAGE
======================
Project: ${data.projectName}
Generated: ${data.timestamp}

CONTENTS:
1. satellite_analysis.json - Complete processed satellite analysis data
2. satellite_analysis.csv - Summary table format
3. polygon_coordinates.geojson - Polygon geometry in GeoJSON format
4. polygon_coordinates.txt - Plain text coordinate list
5. README.txt - This file

DATA FIELDS INCLUDED:
- Project metadata (name, date range, location)
- Area calculations (hectares, km2, polygon count)
- Satellite data (NDVI, cloud cover, vegetation type)
- Carbon estimation (AGB, carbon stock, total carbon)
- Analysis methodology and confidence scores
- Polygon coordinates and geometry (outer rings + inner holes)
- Satellite source information

All data is ready to populate:
- Green Carbon Verification form
- Blue Carbon Verification form  
- Coastal Geospatial assessments
- Sediment & Ecology assessments

Use satellite_analysis.json for programmatic access (recommended)
Use satellite_analysis.csv for spreadsheet applications
Use polygon_coordinates.geojson for mapping applications

USAGE IN VERIFICATION FORMS:
1. Download and extract this ZIP file
2. Open satellite_analysis.json in a text editor
3. Copy the polygonCoordinates array to the form's coordinate field
4. Copy area value to the area field
5. Copy other metadata as needed
`
}

/**
 * Generate CSV format data
 */
function generateCSV(data: SatelliteExportData): string {
  const biomassValue = typeof data.satellite.biomass === 'number' ? data.satellite.biomass : parseFloat(String(data.satellite.biomass))
  const carbonValue = typeof data.satellite.carbonEstimate === 'number' ? data.satellite.carbonEstimate : parseFloat(String(data.satellite.carbonEstimate))
  const unit = data.satellite.unit || 'Ton CO2e/Ha'
  
  const headers = ["Project", "Area (Ha)", "Forest Type", "NDVI", "Cloud Cover %", `Biomass (${unit})`, `Carbon (${unit})`]
  const values = [
    data.projectName,
    data.area.hectares.toFixed(2),
    data.forestType,
    data.satellite.ndvi.toFixed(3),
    data.satellite.cloudCover.toFixed(1),
    biomassValue.toFixed(2),
    carbonValue.toFixed(2),
  ]

  return `${headers.join(",")}\n${values.join(",")}`
}

/**
 * Generate GeoJSON format from polygon data
 * Properly handles single/multiple polygons with holes
 */
function generateGeoJSONFile(data: SatelliteExportData): string {
  // Convert coordinates from [lat, lng] to [lng, lat] for GeoJSON
  const outerRing = data.polygonCoordinates.map(([lat, lng]) => [lng, lat])
  
  let features: any[] = []
  let polygonCount = 1
  
  // Handle multiple polygons
  if (data.multiPolygons && data.multiPolygons.length > 1) {
    polygonCount = data.multiPolygons.length
    
    // Create a MultiPolygon feature
    const allPolygons = data.multiPolygons.map(poly => [
      poly.outerRing.map(([lat, lng]) => [lng, lat]),
      ...poly.innerRings.map(ring => ring.map(([lat, lng]) => [lng, lat]))
    ])
    
    features.push({
      type: 'Feature',
      properties: {
        projectName: data.projectName,
        area: data.area.hectares,
        area_km2: data.area.km2,
        polygonCount,
        holeCount: data.polygonInfo?.holes || 0,
        forestType: data.forestType,
        satelliteSource: data.satelliteSource || 'Unknown',
        analysisDate: data.timestamp,
        ndvi: data.satellite.ndvi,
        cloudCover: data.satellite.cloudCover,
        vegetationType: data.satellite.vegetationClass,
        biomass: data.satellite.biomass,
        carbonEstimate: data.satellite.carbonEstimate
      },
      geometry: {
        type: 'MultiPolygon',
        coordinates: allPolygons
      }
    })
  } else {
    // Single polygon (possibly with holes)
    let coordinates: any[] = [outerRing]
    
    if (data.multiPolygons && data.multiPolygons[0]?.innerRings.length > 0) {
      coordinates = [
        outerRing,
        ...data.multiPolygons[0].innerRings.map(ring => ring.map(([lat, lng]) => [lng, lat]))
      ]
    }
    
    features.push({
      type: 'Feature',
      properties: {
        projectName: data.projectName,
        area: data.area.hectares,
        area_km2: data.area.km2,
        polygonCount: 1,
        holeCount: data.multiPolygons?.[0]?.innerRings.length || 0,
        forestType: data.forestType,
        satelliteSource: data.satelliteSource || 'Unknown',
        analysisDate: data.timestamp,
        ndvi: data.satellite.ndvi,
        cloudCover: data.satellite.cloudCover,
        vegetationType: data.satellite.vegetationClass,
        biomass: data.satellite.biomass,
        carbonEstimate: data.satellite.carbonEstimate
      },
      geometry: {
        type: 'Polygon',
        coordinates
      }
    })
  }
  
  // Return as FeatureCollection for consistency
  return JSON.stringify({
    type: 'FeatureCollection',
    features,
    properties: {
      title: `Satellite Analysis for ${data.projectName}`,
      description: 'Polygon boundaries and satellite analysis data',
      generated: data.timestamp
    }
  }, null, 2)
}

/**
 * Generate plain text coordinates file
 */
function generateCoordinatesFile(data: SatelliteExportData): string {
  const lines = [
    `Project: ${data.projectName}`,
    `Polygon Count: ${data.polygonInfo?.count || 1}`,
    `Area: ${data.area.hectares.toFixed(2)} ha (${data.area.km2.toFixed(4)} km²)`,
    '',
    'OUTER RING COORDINATES (Latitude, Longitude):',
    '-------------------------------------------'
  ]
  
  data.polygonCoordinates.forEach((coord, idx) => {
    lines.push(`${idx + 1}. ${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`)
  })
  
  // Add inner rings if available
  if (data.multiPolygons && data.multiPolygons[0]?.innerRings.length > 0) {
    lines.push('')
    lines.push('INNER RINGS (HOLES):')
    lines.push('-------------------')
    
    data.multiPolygons[0].innerRings.forEach((ring, ringIdx) => {
      lines.push(`Hole ${ringIdx + 1}:`)
      ring.forEach((coord, idx) => {
        lines.push(`  ${idx + 1}. ${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`)
      })
    })
  }
  
  return lines.join('\n')
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
