/**
 * Satellite data exporter for geospatial verification
 * Generates PDF reports and ZIP packages with satellite analysis data
 */

export interface SatelliteExportData {
  projectName: string
  area: { hectares: number; km2: number }
  forestType: string
  polygonCoordinates: Array<[number, number]>
  polygonInfo?: { count: number; holes: number }
  satellite: {
    ndvi: number
    cloudCover: number
    vegetationClass: string
    biomass: number | string
    carbonEstimate: number | string
    unit?: string
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
 * Generate ZIP package with satellite data
 */
export async function generateSatelliteDataZIP(data: SatelliteExportData): Promise<Blob> {
  // Mock ZIP generation - would use JSZip in production
  const csvContent = generateCSV(data)
  const jsonContent = JSON.stringify(data, null, 2)

  const zipContent = `
SATELLITE_DATA_PACKAGE
=====================

FILES INCLUDED:
- satellite_data.csv (Area, vegetation, spectral data)
- satellite_data.json (Complete analysis results)
- coordinates.txt (Polygon boundary points)

CSV Data:
${csvContent}

JSON Data:
${jsonContent}
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
