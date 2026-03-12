"use client"

import { Badge } from "@/components/ui/badge"

import React from "react"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Trash2, Download, Upload, Copy, Check, Maximize2, Minimize2 } from "lucide-react"
import { calculateAndFormatArea } from "@/lib/polygon-area-calculator"

interface EnhancedMapProps {
  polygon: Array<[number, number]>
  setPolygon: (polygon: Array<[number, number]>) => void
  location: { latitude: string; longitude: string; radius: string }
  onAreaCalculated?: (areaResult: any) => void
}

interface CoordinatePoint {
  lat: number
  lng: number
  index: number
}

interface AreaResult {
  areaM2: number
  areaHa: number
  areaKm2: number
  display: string
}

interface HoverCoordinate {
  lat: number
  lng: number
}

export function EnhancedMapInterface({ polygon, setPolygon, location, onAreaCalculated }: EnhancedMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempPoints, setTempPoints] = useState<Array<[number, number]>>([])
  const [areaResult, setAreaResult] = useState<AreaResult | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hoverCoordinate, setHoverCoordinate] = useState<HoverCoordinate | null>(null)

  // Initialize map
  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current) return
    
    // If map already exists, don't reinitialize
    if (mapRef.current) return

    import("leaflet").then((L) => {
      // Check again if map already exists (race condition protection)
      if (mapRef.current) return

      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      const centerLat = location.latitude ? Number.parseFloat(location.latitude) : -2.5
      const centerLng = location.longitude ? Number.parseFloat(location.longitude) : 118.0

      const map = L.map(mapContainerRef.current!, {
        center: [centerLat, centerLng],
        zoom: 8,
      })

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      setMapReady(true)

      // Map click handler for drawing
      const handleClickEvent = (e: any) => {
        if (isDrawing) {
          const { lat, lng } = e.latlng
          setTempPoints((prev) => [...prev, [lat, lng]])
        }
      }
      
      map.on("click", handleClickEvent)

      // Map hover handler for coordinate display
      const handleMouseMove = (e: any) => {
        if (isDrawing) {
          const { lat, lng } = e.latlng
          setHoverCoordinate({ lat, lng })
        }
      }
      
      map.on("mousemove", handleMouseMove)

      // Clear hover on mouse leave
      const handleMouseOut = () => {
        setHoverCoordinate(null)
      }
      
      mapContainerRef.current?.addEventListener("mouseout", handleMouseOut)

      return () => {
        map.off("click", handleClickEvent)
        map.off("mousemove", handleMouseMove)
        mapContainerRef.current?.removeEventListener("mouseout", handleMouseOut)
        map.remove()
        mapRef.current = null
      }
    })
  }, [])

  // Render polygon on map
  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    import("leaflet").then((L) => {
      // Clear existing layers
      mapRef.current.eachLayer((layer: any) => {
        if (layer._isPolygonOrMarker) {
          mapRef.current.removeLayer(layer)
        }
      })

      // Draw polygon
      if (polygon.length > 0) {
        const polygonLatLngs = polygon.map(([lat, lng]) => [lat, lng])
        
        const polyline = L.polyline(polygonLatLngs, {
          color: "#10b981",
          weight: 2,
          opacity: 0.8,
          dashArray: "5, 5",
        }).addTo(mapRef.current)
        polyline._isPolygonOrMarker = true

        // Close polygon if more than 2 points
        if (polygon.length > 2) {
          const closedLine = L.polyline([...polygonLatLngs, polygonLatLngs[0]], {
            color: "#10b981",
            weight: 2,
            opacity: 0.7,
            fill: true,
            fillColor: "#10b981",
            fillOpacity: 0.1,
          }).addTo(mapRef.current)
          closedLine._isPolygonOrMarker = true
        }

        // Draw markers
        polygon.forEach(([lat, lng], idx) => {
          const marker = L.circleMarker([lat, lng], {
            radius: 6,
            fillColor: "#10b981",
            color: "#059669",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(mapRef.current)
          marker._isPolygonOrMarker = true

          // Bind popup with coordinates
          marker.bindPopup(`
            <div class="p-2 text-sm">
              <div class="font-semibold mb-1">Point ${idx + 1}</div>
              <div>Lat: ${lat.toFixed(6)}</div>
              <div>Lng: ${lng.toFixed(6)}</div>
            </div>
          `)
        })

        // Calculate area if polygon is closed
        if (polygon.length > 2) {
          calculateArea()
        }
      }

      // Draw temp points while drawing
      tempPoints.forEach(([lat, lng]) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 4,
          fillColor: "#f59e0b",
          color: "#d97706",
          weight: 1,
          opacity: 0.7,
          fillOpacity: 0.6,
        }).addTo(mapRef.current)
        marker._isPolygonOrMarker = true
      })
    })
  }, [polygon, tempPoints, mapReady])



  const startDrawing = () => {
    setIsDrawing(true)
    setTempPoints([])
  }

  const finishDrawing = () => {
    if (tempPoints.length < 3) {
      setFileError("Polygon must have at least 3 points")
      return
    }
    setPolygon([...tempPoints])
    setTempPoints([])
    setIsDrawing(false)
  }

  const cancelDrawing = () => {
    setTempPoints([])
    setIsDrawing(false)
  }

  const clearPolygon = () => {
    setPolygon([])
    setAreaResult(null)
  }

  const calculateArea = async () => {
    if (polygon.length < 3) return

    const result = calculateAndFormatArea(polygon)
    setAreaResult(result)
    onAreaCalculated?.(result)
  }

  const handleShapefileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)

    try {
      // Check file extension
      const extension = file.name.split(".").pop()?.toLowerCase()
      const supportedFormats = ["shp", "geojson", "json", "kml", "gpkg"]

      if (!extension || !supportedFormats.includes(extension)) {
        setFileError(`Unsupported format. Supported: ${supportedFormats.join(", ")}`)
        return
      }

      const text = await file.text()

      if (extension === "geojson" || extension === "json") {
        const geojson = JSON.parse(text)
        
        if (geojson.features && geojson.features[0]?.geometry?.coordinates) {
          const coords = geojson.features[0].geometry.coordinates[0]
          const polygon = coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
          setPolygon(polygon)
          calculateArea()
        } else if (geojson.geometry?.coordinates) {
          const coords = geojson.geometry.coordinates[0]
          const polygon = coords.map((coord: number[]) => [coord[1], coord[0]] as [number, number])
          setPolygon(polygon)
          calculateArea()
        }
      } else {
        setFileError("File format requires conversion. Please ensure it's in GeoJSON or GPKG format.")
      }
    } catch (error) {
      setFileError("Failed to parse file. Ensure it's a valid geospatial format.")
      console.error("[v0] File upload error:", error)
    }
  }

  const exportPolygon = () => {
    if (polygon.length === 0) return

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [[...polygon.map(([lat, lng]) => [lng, lat]), polygon.length > 0 ? [polygon[0][1], polygon[0][0]] : []]],
          },
          properties: {
            area_ha: areaResult?.areaHa || 0,
            area_km2: areaResult?.areaKm2 || 0,
          },
        },
      ],
    }

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "polygon.geojson"
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyCoordinate = (lat: number, lng: number, index: number) => {
    const text = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const toggleFullscreen = () => {
    if (!mapContainerRef.current?.parentElement) return

    if (!document.fullscreenElement) {
      setIsFullscreen(true)
      document.body.style.overflow = "hidden"
      mapContainerRef.current.parentElement.requestFullscreen().catch(() => {
        // Fallback for browsers that don't support fullscreen
        setIsFullscreen(true)
      })
      // Trigger map resize
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize()
      }, 100)
    } else {
      setIsFullscreen(false)
      document.body.style.overflow = ""
      document.exitFullscreen()
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize()
      }, 100)
    }
  }

  return (
    <div className="space-y-6">
      {/* Map Container */}
      <div className={isFullscreen ? "fixed inset-0 z-50 bg-background" : ""}>
        <Card className={`border-border/50 bg-card/30 overflow-hidden relative ${isFullscreen ? "w-full h-full rounded-none border-0" : ""}`}>
          {/* Hover Coordinate Display */}
          {isDrawing && hoverCoordinate && (
            <div className="absolute top-4 left-4 bg-background/95 border border-border/50 rounded-lg p-3 text-sm font-mono z-40 backdrop-blur-sm shadow-lg">
              <div className="text-muted-foreground text-xs mb-1 font-sans">Cursor Position</div>
              <div className="text-foreground font-semibold">
                {hoverCoordinate.lat.toFixed(6)}, {hoverCoordinate.lng.toFixed(6)}
              </div>
            </div>
          )}

          {/* Fullscreen Toggle Button */}
          <Button
            onClick={toggleFullscreen}
            size="sm"
            variant="outline"
            className="absolute top-4 right-4 z-40 gap-2 bg-background/80 hover:bg-accent/10 backdrop-blur-sm border-border/50"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                Exit
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                Fullscreen
              </>
            )}
          </Button>

          <div
            ref={mapContainerRef}
            className={isFullscreen ? "w-full h-full" : "h-96 w-full bg-slate-900"}
            style={{ zIndex: 1 }}
          />
        </Card>
      </div>

      {/* Coordinate Display Table */}
      {!isFullscreen && polygon.length > 0 && (
        <Card className="border-border/50 bg-card/50 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Polygon Coordinates</h3>
              <Badge variant="outline">{polygon.length} points</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Latitude</th>
                    <th className="text-left py-2 px-2 text-muted-foreground font-medium">Longitude</th>
                    <th className="text-center py-2 px-2 text-muted-foreground font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {polygon.map(([lat, lng], idx) => (
                    <tr key={idx} className="border-b border-border/20 hover:bg-accent/5">
                      <td className="py-2 px-2 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 px-2 font-mono text-xs">{lat.toFixed(6)}</td>
                      <td className="py-2 px-2 font-mono text-xs">{lng.toFixed(6)}</td>
                      <td className="py-2 px-2 text-center">
                        <button
                          onClick={() => copyCoordinate(lat, lng, idx)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-accent/20 transition-colors"
                        >
                          {copiedIndex === idx ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Area Display */}
      {areaResult && (
        <Card className="border-border/50 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10 p-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Area (Hectares)</div>
              <div className="text-lg font-semibold text-foreground">
                {typeof areaResult.areaHa === 'number' ? areaResult.areaHa.toLocaleString() : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Area (km²)</div>
              <div className="text-lg font-semibold text-foreground">
                {typeof areaResult.areaKm2 === 'number' ? areaResult.areaKm2.toLocaleString(undefined, { maximumFractionDigits: 2 }) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Area (m²)</div>
              <div className="text-lg font-semibold text-foreground">
                {typeof areaResult.areaM2 === 'number' ? areaResult.areaM2.toLocaleString() : 'N/A'}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* File Error */}
      {fileError && (
        <Card className="border-border/50 bg-destructive/10 p-3 text-sm text-destructive">
          {fileError}
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        {!isDrawing ? (
          <Button onClick={startDrawing} variant="default" size="sm" className="gap-2">
            <MapPin className="w-4 h-4" />
            Draw Polygon
          </Button>
        ) : (
          <>
            <Button onClick={finishDrawing} variant="default" size="sm" className="gap-2">
              <Check className="w-4 h-4" />
              Finish ({tempPoints.length})
            </Button>
            <Button onClick={cancelDrawing} variant="outline" size="sm">
              Cancel
            </Button>
          </>
        )}

        <label className="cursor-pointer">
          <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
            <span>
              <Upload className="w-4 h-4" />
              Upload Shapefile
            </span>
          </Button>
          <input
            type="file"
            accept=".shp,.geojson,.json,.kml,.gpkg"
            onChange={handleShapefileUpload}
            className="hidden"
          />
        </label>

        {polygon.length > 0 && (
          <>
            <Button onClick={exportPolygon} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Download className="w-4 h-4" />
              Export GeoJSON
            </Button>
            <Button onClick={clearPolygon} variant="outline" size="sm" className="gap-2 bg-transparent">
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
