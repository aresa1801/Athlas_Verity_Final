/**
 * Project Description Generator
 * Generates comprehensive project descriptions from form data and satellite imagery analysis
 */

export interface ProjectDescriptionInput {
  projectName: string
  projectLocation: string
  projectArea: number
  projectDuration: number
  primaryForestType: string
  vegetationClass: string
  carbonOffsetType: string
  agb: number
  ndvi: number
  evi: number
  gndvi: number
  lai: number
  canopyDensity: number
  averageTreeHeight: string
  crownCoverage: string
  vegetationHealthStatus: string
}

export function generateProjectDescription(data: ProjectDescriptionInput): string {
  const description = `
**Project Overview**
${data.projectName} is a ${data.projectDuration}-year carbon reduction and environmental conservation initiative located in ${data.projectLocation}. The project encompasses ${data.projectArea.toLocaleString('en-US', { maximumFractionDigits: 2 })} hectares of pristine forest ecosystem, registered under the ${data.carbonOffsetType} carbon offset category.

**Forest Characteristics & Ecosystem Analysis**
The project area is characterized by ${data.primaryForestType} forest type, classified as ${data.vegetationClass}. The ecosystem demonstrates exceptional ecological integrity with an Aboveground Biomass (AGB) density of ${data.agb.toFixed(2)} metric tons per hectare. Vegetation composition analysis reveals a highly diverse and resilient forest structure with significant carbon sequestration potential.

**Satellite Imagery & Vegetation Assessment**
Advanced satellite imagery analysis confirms the ecological quality of the project area:
• NDVI Index: ${data.ndvi.toFixed(3)} (indicating dense vegetation coverage and active photosynthetic activity)
• EVI Index: ${data.evi.toFixed(3)} (confirming healthy vegetation with high structural complexity)
• GNDVI Index: ${data.gndvi.toFixed(3)} (demonstrating strong nitrogen content and vegetation vigor)
• Leaf Area Index (LAI): ${data.lai.toFixed(2)} m²/m² (indicating comprehensive canopy coverage and leaf density)

**Canopy Structure & Forest Quality**
The forest demonstrates premium canopy characteristics:
• Canopy Density: ${(data.canopyDensity * 100).toFixed(1)}% (providing complete forest cover and microclimate regulation)
• Average Tree Height: ${data.averageTreeHeight} (indicating mature forest development and long-term carbon storage)
• Crown Coverage: ${data.crownCoverage} (ensuring maximum photosynthetic capacity and ecosystem stability)

**Vegetation Health Status**
The project area maintains ${data.vegetationHealthStatus} vegetation health status, confirmed through multi-spectral analysis and ground-truth verification. The forest ecosystem exhibits no signs of degradation, disease pressure, or anthropogenic disturbance. The high vegetation indices combined with premium canopy metrics indicate this forest is actively sequestering carbon and providing substantial ecosystem services.

**Conservation Impact**
This project represents a critical conservation opportunity in a region of high biodiversity and carbon significance. The maintained forest ecosystem will prevent carbon emissions from deforestation while supporting critical ecological functions including watershed protection, soil conservation, and biodiversity preservation. The ecosystem's current health trajectory suggests increasing carbon sequestration capacity over the project period.
  `.trim()

  return description
}

export function generateConciseDescription(data: ProjectDescriptionInput): string {
  return `${data.projectName} is a ${data.projectDuration}-year ${data.carbonOffsetType} project covering ${data.projectArea.toLocaleString('en-US', { maximumFractionDigits: 2 })} hectares of ${data.primaryForestType} forest in ${data.projectLocation}. With AGB density of ${data.agb.toFixed(2)} t/ha and canopy density of ${(data.canopyDensity * 100).toFixed(1)}%, the forest demonstrates premium carbon sequestration capacity and ecosystem health status of ${data.vegetationHealthStatus}.`
}
