/**
 * Satellite data exporter for geospatial verification
 * Generates PDF reports and ZIP packages with satellite analysis data
 */

export interface SatelliteExportData {
  projectName: string
  area: { hectares: number; km2: number }
  forestType: string
  polygonCoordinates: Array<[number, number]>
  multiPolygons?: Array<{
    outerRing: Array<[number, number]>
    innerRings: Array<Array<[number, number]>>
  }>
  polygonInfo?: { count: number; holes: number }
  dateRange?: { startDate?: string; endDate?: string }
  location?: string
  satelliteSource?: string
  uploadedFile?: string
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
  timestamp: string
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
 */
export async function generateSatelliteDataZIP(data: SatelliteExportData): Promise<Blob> {
  const csvContent = generateCSV(data)
  const jsonContent = JSON.stringify(data, null, 2)
  const coordinatesContent = generateCoordinatesFile(data)
  const geojsonContent = generateGeoJSONFile(data)
  
  // Create manifest with data schema
  const manifestContent = `SATELLITE DATA PACKAGE
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
`

  // Simulate ZIP content with all files
  const zipContent = `${manifestContent}

================================================================================
FILE: satellite_analysis.json
================================================================================
${jsonContent}

================================================================================
FILE: satellite_analysis.csv
================================================================================
${csvContent}

================================================================================
FILE: polygon_coordinates.geojson
================================================================================
${geojsonContent}

================================================================================
FILE: polygon_coordinates.txt
================================================================================
${coordinatesContent}
  `

  return new Blob([zipContent], { type: "application/zip" })
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
 */
function generateGeoJSONFile(data: SatelliteExportData): string {
  // Convert coordinates from [lat, lng] to [lng, lat] for GeoJSON
  const outerRing = data.polygonCoordinates.map(([lat, lng]) => [lng, lat])
  
  let coordinates: any[] = [outerRing]
  let polygonCount = 1
  
  // Add inner rings (holes) if available
  if (data.multiPolygons && data.multiPolygons.length > 0) {
    if (data.multiPolygons[0].innerRings.length > 0) {
      coordinates = [
        outerRing,
        ...data.multiPolygons[0].innerRings.map(ring => ring.map(([lat, lng]) => [lng, lat]))
      ]
    }
    
    // For multiple polygons, use MultiPolygon
    if (data.multiPolygons.length > 1) {
      polygonCount = data.multiPolygons.length
      const allPolygons = data.multiPolygons.map(poly => [
        poly.outerRing.map(([lat, lng]) => [lng, lat]),
        ...poly.innerRings.map(ring => ring.map(([lat, lng]) => [lng, lat]))
      ])
      
      const feature = {
        type: 'Feature',
        properties: {
          projectName: data.projectName,
          area: data.area.hectares,
          polygonCount,
          holeCount: data.polygonInfo?.holes || 0
        },
        geometry: {
          type: 'MultiPolygon',
          coordinates: allPolygons
        }
      }
      
      return JSON.stringify({
        type: 'FeatureCollection',
        features: [feature]
      }, null, 2)
    }
  }
  
  // Single polygon with holes
  const feature = {
    type: 'Feature',
    properties: {
      projectName: data.projectName,
      area: data.area.hectares,
      forestType: data.forestType,
      vegetationType: data.satellite.vegetationClass,
      ndvi: data.satellite.ndvi,
      cloudCover: data.satellite.cloudCover
    },
    geometry: {
      type: 'Polygon',
      coordinates
    }
  }
  
  return JSON.stringify({
    type: 'FeatureCollection',
    features: [feature]
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
