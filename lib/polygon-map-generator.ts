import { createCanvas } from 'canvas'

/**
 * Generate a base64 encoded map image from polygon coordinates
 * Shows the polygon area with proper bounds and markers
 */
export async function generatePolygonMapImage(
  coordinates: string,
  projectName: string,
  centerLat: number,
  centerLon: number,
  areaHa: number
): Promise<string> {
  try {
    // Parse coordinates - can be "lat, lon" or comma-separated pairs
    const coordParts = coordinates.split(',').map(c => parseFloat(c.trim()))
    
    // If only center coordinates provided
    if (coordParts.length === 2) {
      return generateSimpleMap(projectName, centerLat, centerLon, areaHa)
    }

    // Generate map with polygon
    return generatePolygonMap(projectName, centerLat, centerLon, areaHa, coordinates)
  } catch (error) {
    console.error('[v0] Map generation error:', error)
    // Return a placeholder map on error
    return generatePlaceholderMap(projectName, centerLat, centerLon, areaHa)
  }
}

/**
 * Generate a simple map with center point marker
 */
function generateSimpleMap(
  projectName: string,
  centerLat: number,
  centerLon: number,
  areaHa: number
): string {
  try {
    const canvas = createCanvas(600, 400)
    const ctx = canvas.getContext('2d')

    // Background - light blue for water/sky effect
    ctx.fillStyle = '#e8f4f8'
    ctx.fillRect(0, 0, 600, 400)

    // Grid background
    ctx.strokeStyle = '#d0e8f2'
    ctx.lineWidth = 1
    for (let i = 0; i < 600; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 400)
      ctx.stroke()
    }
    for (let i = 0; i < 400; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(600, i)
      ctx.stroke()
    }

    // Draw center point marker
    const markerX = 300
    const markerY = 200

    // Marker circle
    ctx.fillStyle = '#0EA5E9'
    ctx.beginPath()
    ctx.arc(markerX, markerY, 8, 0, Math.PI * 2)
    ctx.fill()

    // Marker outline
    ctx.strokeStyle = '#0284C7'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(markerX, markerY, 8, 0, Math.PI * 2)
    ctx.stroke()

    // Marker label
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(projectName, 300, 50)

    // Coordinates text
    ctx.fillStyle = '#64748b'
    ctx.font = '12px Arial'
    ctx.fillText(`Latitude: ${centerLat.toFixed(6)}°`, 300, 70)
    ctx.fillText(`Longitude: ${centerLon.toFixed(6)}°`, 300, 90)
    ctx.fillText(`Area: ${areaHa.toFixed(2)} ha`, 300, 110)

    return canvas.toDataURL()
  } catch (error) {
    console.error('[v0] Simple map generation error:', error)
    return generatePlaceholderMap(projectName, centerLat, centerLon, areaHa)
  }
}

/**
 * Generate a map with polygon visualization
 */
function generatePolygonMap(
  projectName: string,
  centerLat: number,
  centerLon: number,
  areaHa: number,
  coordinates: string
): string {
  try {
    const canvas = createCanvas(600, 400)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#e8f4f8'
    ctx.fillRect(0, 0, 600, 400)

    // Grid
    ctx.strokeStyle = '#d0e8f2'
    ctx.lineWidth = 1
    for (let i = 0; i < 600; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 400)
      ctx.stroke()
    }
    for (let i = 0; i < 400; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(600, i)
      ctx.stroke()
    }

    // Draw polygon (simplified - fit within canvas)
    const coordPairs = coordinates.split(',').reduce((acc: number[][], val, i) => {
      if (i % 2 === 0) {
        acc.push([parseFloat(val.trim())])
      } else {
        acc[acc.length - 1].push(parseFloat(val.trim()))
      }
      return acc
    }, [])

    if (coordPairs.length > 2) {
      // Normalize coordinates to canvas
      const lats = coordPairs.map(p => p[0])
      const lons = coordPairs.map(p => p[1])
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)
      const minLon = Math.min(...lons)
      const maxLon = Math.max(...lons)

      const latRange = maxLat - minLat || 0.01
      const lonRange = maxLon - minLon || 0.01
      const padding = 30

      // Draw polygon fill
      ctx.fillStyle = 'rgba(14, 165, 233, 0.2)'
      ctx.beginPath()
      for (let i = 0; i < coordPairs.length; i++) {
        const x = padding + ((coordPairs[i][1] - minLon) / lonRange) * (600 - 2 * padding)
        const y = 400 - padding - ((coordPairs[i][0] - minLat) / latRange) * (400 - 2 * padding)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.fill()

      // Draw polygon border
      ctx.strokeStyle = '#0284C7'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw vertices
      for (const pair of coordPairs) {
        const x = padding + ((pair[1] - minLon) / lonRange) * (600 - 2 * padding)
        const y = 400 - padding - ((pair[0] - minLat) / latRange) * (400 - 2 * padding)

        ctx.fillStyle = '#0EA5E9'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()
      }

      // Draw center marker
      const centerX = padding + ((centerLon - minLon) / lonRange) * (600 - 2 * padding)
      const centerY = 400 - padding - ((centerLat - minLat) / latRange) * (400 - 2 * padding)

      ctx.fillStyle = '#059669'
      ctx.beginPath()
      ctx.arc(centerX, centerY, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#047857'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Title
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(projectName, 300, 25)

    // Legend
    ctx.fillStyle = '#64748b'
    ctx.font = '11px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Lat: ${centerLat.toFixed(6)}°`, 15, 385)
    ctx.fillText(`Lon: ${centerLon.toFixed(6)}°`, 250, 385)
    ctx.fillText(`Area: ${areaHa.toFixed(2)} ha`, 450, 385)

    return canvas.toDataURL()
  } catch (error) {
    console.error('[v0] Polygon map generation error:', error)
    return generatePlaceholderMap(projectName, centerLat, centerLon, areaHa)
  }
}

/**
 * Generate a placeholder map when actual polygon data is unavailable
 */
function generatePlaceholderMap(
  projectName: string,
  centerLat: number,
  centerLon: number,
  areaHa: number
): string {
  try {
    const canvas = createCanvas(600, 400)
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#e8f4f8'
    ctx.fillRect(0, 0, 600, 400)

    // Center point
    const markerX = 300
    const markerY = 200

    ctx.fillStyle = '#0EA5E9'
    ctx.beginPath()
    ctx.arc(markerX, markerY, 10, 0, Math.PI * 2)
    ctx.fill()

    // Title
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(projectName, 300, 50)

    // Info
    ctx.fillStyle = '#64748b'
    ctx.font = '12px Arial'
    ctx.fillText(`Location: ${centerLat.toFixed(4)}°, ${centerLon.toFixed(4)}°`, 300, 150)
    ctx.fillText(`Area: ${areaHa.toFixed(2)} hectares`, 300, 180)
    ctx.fillText('Map generated from project center point', 300, 250)

    return canvas.toDataURL()
  } catch (error) {
    console.error('[v0] Placeholder map error:', error)
    // Return empty string on critical error - PDF will still work without image
    return ''
  }
}
