"use client"

import { useEffect, useRef, useState } from 'react'

interface MapInterfaceProps {
  polygon: Array<[number, number]>
  setPolygon: (polygon: Array<[number, number]>) => void
  location?: {
    latitude: string
    longitude: string
    radius: string
  }
  multiPolygons?: Array<Array<[number, number]>>
}

export function MapInterface({ polygon, setPolygon, location, multiPolygons }: MapInterfaceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Get map bounds from polygon and multi-polygons
  const getBounds = () => {
    let points = [...polygon]
    if (multiPolygons) {
      multiPolygons.forEach(poly => {
        points = [...points, ...poly]
      })
    }

    if (points.length === 0) {
      const centerLat = parseFloat(location?.latitude || '-2.5')
      const centerLng = parseFloat(location?.longitude || '118.0')
      return {
        minLat: centerLat - 1,
        maxLat: centerLat + 1,
        minLng: centerLng - 1,
        maxLng: centerLng + 1,
      }
    }

    const lats = points.map(p => p[0])
    const lngs = points.map(p => p[1])
    const padding = 0.1

    return {
      minLat: Math.min(...lats) - padding,
      maxLat: Math.max(...lats) + padding,
      minLng: Math.min(...lngs) - padding,
      maxLng: Math.max(...lngs) + padding,
    }
  }

  // Convert lat/lng to canvas coordinates
  const latLngToCanvas = (lat: number, lng: number, bounds: any, width: number, height: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width
    const y = height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height
    return { x, y }
  }

  // Draw the map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const bounds = getBounds()

    // Clear canvas with light background
    ctx.fillStyle = '#f0f9ff'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i
      const y = (height / 10) * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Draw multi-polygons
    if (multiPolygons) {
      multiPolygons.forEach((poly, idx) => {
        if (poly.length > 1) {
          ctx.strokeStyle = '#3b82f6'
          ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
          ctx.lineWidth = 2

          ctx.beginPath()
          const start = latLngToCanvas(poly[0][0], poly[0][1], bounds, width, height)
          ctx.moveTo(start.x, start.y)

          for (let i = 1; i < poly.length; i++) {
            const point = latLngToCanvas(poly[i][0], poly[i][1], bounds, width, height)
            ctx.lineTo(point.x, point.y)
          }

          ctx.closePath()
          ctx.fill()
          ctx.stroke()
        }
      })
    }

    // Draw main polygon
    if (polygon.length > 1) {
      ctx.strokeStyle = '#10b981'
      ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'
      ctx.lineWidth = 3

      ctx.beginPath()
      const start = latLngToCanvas(polygon[0][0], polygon[0][1], bounds, width, height)
      ctx.moveTo(start.x, start.y)

      for (let i = 1; i < polygon.length; i++) {
        const point = latLngToCanvas(polygon[i][0], polygon[i][1], bounds, width, height)
        ctx.lineTo(point.x, point.y)
      }

      if (polygon.length > 2) {
        ctx.closePath()
      }
      ctx.fill()
      ctx.stroke()
    }

    // Draw points
    polygon.forEach((point, idx) => {
      const canvasPoint = latLngToCanvas(point[0], point[1], bounds, width, height)
      ctx.fillStyle = '#10b981'
      ctx.beginPath()
      ctx.arc(canvasPoint.x, canvasPoint.y, 6, 0, Math.PI * 2)
      ctx.fill()

      // Draw point number
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText((idx + 1).toString(), canvasPoint.x, canvasPoint.y)
    })
  }, [polygon, multiPolygons, location])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const bounds = getBounds()
    const width = canvas.width
    const height = canvas.height

    // Convert canvas coordinates back to lat/lng
    const lng = bounds.minLng + (x / width) * (bounds.maxLng - bounds.minLng)
    const lat = bounds.maxLat - (y / height) * (bounds.maxLat - bounds.minLat)

    setPolygon([...polygon, [lat, lng] as [number, number]])
  }

  const handleClearPolygon = () => {
    setPolygon([])
  }

  return (
    <div className="w-full">
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        onClick={handleCanvasClick}
        className="w-full border border-blue-300 rounded cursor-crosshair bg-blue-50 hover:bg-blue-100 transition-colors"
        style={{ aspectRatio: '16/10' }}
      />
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 mb-3">
          Click on the map to add polygon points. Current points: <strong>{polygon.length}</strong>
        </p>
        {polygon.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={handleClearPolygon}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
            >
              Clear Polygon
            </button>
            {polygon.length >= 3 && (
              <div className="text-xs text-green-700 flex items-center gap-1">
                ✓ Valid polygon ({polygon.length} points)
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
