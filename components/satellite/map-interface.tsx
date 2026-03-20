"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Trash2, Download, Layers } from "lucide-react"
import { calculateAndFormatArea } from "@/lib/polygon-area-calculator"

interface MultiPolygonData {
  outerRing: Array<[number, number]>
  innerRings: Array<Array<[number, number]>>
}

interface MapInterfaceProps {
  polygon: Array<[number, number]>
  setPolygon: (polygon: Array<[number, number]>) => void
  multiPolygons?: MultiPolygonData[]
  location: { latitude: string; longitude: string; radius: string }
  onAreaCalculated?: (areaResult: any) => void
}

type MapLayer = "streets" | "satellite" | "terrain" | "topo"

interface AreaResult {
  areaM2: number
  areaHa: number
  areaKm2: number
  display: string
  epsg: number
  zone: number
  warning?: string
  geometryHash?: string
}

export function MapInterface({ polygon, setPolygon, multiPolygons, location, onAreaCalculated }: MapInterfaceProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const polygonLayerRef = useRef<any>(null)
  const markerLayerRef = useRef<any>(null)
  const tileLayerRef = useRef<any>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tempPoints, setTempPoints] = useState<Array<[number, number]>>([])
  const [mapReady, setMapReady] = useState(false)
  const [currentLayer, setCurrentLayer] = useState<MapLayer>("streets")
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [areaResult, setAreaResult] = useState<AreaResult | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !mapContainerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      // Check if map already exists
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
        zoom: 6,
        zoomControl: true,
      })

      const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapRef.current = map
      tileLayerRef.current = tileLayer
      setMapReady(true)

      return () => {
        map.remove()
      }
    })
  }, [])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    import("leaflet").then((L) => {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current)
      }

      let tileLayer
      switch (currentLayer) {
        case "satellite":
          tileLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            {
              attribution:
                "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
              maxZoom: 19,
            },
          )
          break
        case "terrain":
          tileLayer = L.tileLayer(
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
            {
              attribution: "Tiles &copy; Esri &mdash; Source: USGS, Esri, TANA, DeLorme, and NPS",
              maxZoom: 13,
            },
          )
          break
        case "topo":
          tileLayer = L.tileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png", {
            attribution:
              'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
            maxZoom: 17,
          })
          break
        default: // streets
          tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          })
      }

      tileLayer.addTo(mapRef.current)
      tileLayerRef.current = tileLayer
    })
  }, [currentLayer, mapReady])

  useEffect(() => {
    if (!mapRef.current || !location.latitude || !location.longitude) return

    import("leaflet").then((L) => {
      const lat = Number.parseFloat(location.latitude)
      const lng = Number.parseFloat(location.longitude)
      const radius = Number.parseFloat(location.radius || "5") * 1000

      mapRef.current.setView([lat, lng], 12)

      if (markerLayerRef.current) {
        mapRef.current.removeLayer(markerLayerRef.current)
      }

      const marker = L.marker([lat, lng]).addTo(mapRef.current)
      const circle = L.circle([lat, lng], {
        radius: radius,
        color: "#3DD68C",
        fillColor: "#3DD68C",
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(mapRef.current)

      const group = L.layerGroup([marker, circle])
      markerLayerRef.current = group
    })
  }, [location.latitude, location.longitude, location.radius])

  useEffect(() => {
    if (!mapRef.current || !mapReady) return

    import("leaflet").then((L) => {
      if (polygonLayerRef.current) {
        mapRef.current.removeLayer(polygonLayerRef.current)
      }

      const layerGroup = L.featureGroup()

      // Render multi-polygon with holes if available
      if (multiPolygons && multiPolygons.length > 0) {
        let allCoords: Array<[number, number]> = []
        
        multiPolygons.forEach((polygonData) => {
          // Create polygon with outer ring and holes
          const outerRing = polygonData.outerRing.map(([lat, lng]) => [lat, lng] as [number, number])
          allCoords = allCoords.concat(outerRing)
          
          const latlngs: any[] = [outerRing]
          
          // Add inner rings (holes)
          if (polygonData.innerRings && polygonData.innerRings.length > 0) {
            polygonData.innerRings.forEach((innerRing) => {
              const mappedRing = innerRing.map(([lat, lng]) => [lat, lng] as [number, number])
              allCoords = allCoords.concat(mappedRing)
              latlngs.push(mappedRing)
            })
          }
          
          const poly = L.polygon(latlngs, {
            color: "#3DD68C",
            fillColor: "#3DD68C",
            fillOpacity: 0.2,
            weight: 3,
          }).addTo(layerGroup)
        })

        layerGroup.addTo(mapRef.current)
        polygonLayerRef.current = layerGroup
        
        // Calculate bounds from all coordinates
        if (allCoords.length > 0) {
          const bounds = L.latLngBounds(allCoords)
          mapRef.current.fitBounds(bounds)
        }
      }
      // Fallback to single polygon from prop
      else if (polygon.length > 0) {
        const latLngs = polygon.map(([lat, lng]) => [lat, lng] as [number, number])
        const polygonLayer = L.polygon(latLngs, {
          color: "#3DD68C",
          fillColor: "#3DD68C",
          fillOpacity: 0.2,
          weight: 3,
        }).addTo(mapRef.current)

        polygonLayerRef.current = polygonLayer
        mapRef.current.fitBounds(polygonLayer.getBounds())
      }

      if (isDrawing && tempPoints.length > 0) {
        tempPoints.forEach(([lat, lng]) => {
          L.circleMarker([lat, lng], {
            radius: 5,
            color: "#3DD68C",
            fillColor: "#3DD68C",
            fillOpacity: 1,
          }).addTo(mapRef.current)
        })

        if (tempPoints.length > 1) {
          L.polyline(tempPoints, {
            color: "#3DD68C",
            weight: 2,
            dashArray: "5, 5",
          }).addTo(mapRef.current)
        }
      }
    })
  }, [polygon, multiPolygons, tempPoints, isDrawing, mapReady])

  const handleStartDrawing = () => {
    if (!mapRef.current) return
    setIsDrawing(true)
    setTempPoints([])

    import("leaflet").then((L) => {
      const map = mapRef.current
      map.getContainer().style.cursor = "crosshair"

      const clickHandler = (e: any) => {
        const { lat, lng } = e.latlng
        setTempPoints((prev) => [...prev, [lat, lng]])
      }

      map.on("click", clickHandler)
      map._clickHandler = clickHandler
    })
  }

  const handleFinishDrawing = () => {
    if (tempPoints.length >= 3) {
      setPolygon(tempPoints)
      // Calculate area for the drawn polygon
      calculateAreaViaBackend(tempPoints, multiPolygons)
    }
    setIsDrawing(false)
    setTempPoints([])

    if (mapRef.current && mapRef.current._clickHandler) {
      mapRef.current.off("click", mapRef.current._clickHandler)
      mapRef.current.getContainer().style.cursor = ""
    }
  }

  const handleClearPolygon = () => {
    setPolygon([])
    setTempPoints([])
    setAreaResult(null)
    setIsDrawing(false)

    if (mapRef.current && mapRef.current._clickHandler) {
      mapRef.current.off("click", mapRef.current._clickHandler)
      mapRef.current.getContainer().style.cursor = ""
    }

    if (polygonLayerRef.current) {
      mapRef.current.removeLayer(polygonLayerRef.current)
      polygonLayerRef.current = null
    }
  }

  const handleExportCoordinates = () => {
    if (polygon.length === 0) return
    const coordsText = polygon.map(([lat, lng]) => `${lat.toFixed(6)}, ${lng.toFixed(6)}`).join("\n")
    const blob = new Blob([coordsText], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "polygon-coordinates.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  const calculatePolygonArea = (coordinates: Array<[number, number]>): string => {
    if (coordinates.length < 3) return "0 km²"

    const coords = coordinates.map(([lat, lng]) => ({
      latitude: lat,
      longitude: lng,
    }))

    const { display } = calculateAndFormatArea(coords)
    return display
  }

  const calculateAreaViaBackend = async (polygonCoords: Array<[number, number]>, multiPolygonData?: MultiPolygonData[]) => {
    if (polygonCoords.length < 3 && (!multiPolygonData || multiPolygonData.length === 0)) return

    setIsCalculating(true)
    try {
      // Prepare request body with support for multi-polygon with holes
      const requestBody = multiPolygonData && multiPolygonData.length > 0
        ? { multiPolygons: multiPolygonData }
        : { polygon: polygonCoords }

      const response = await fetch("/api/geo/calculate-area", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) throw new Error("Area calculation failed")

      const data: AreaResult = await response.json()
      setAreaResult(data)
      if (onAreaCalculated) {
        onAreaCalculated(data)
      }
      console.log("[v0] Area calculation result:", data)
    } catch (error) {
      console.error("[v0] Error calculating area:", error)
      setAreaResult({
        areaM2: 0,
        areaHa: 0,
        areaKm2: 0,
        display: "Calculation error - please try again",
        epsg: 0,
        zone: 0,
      })
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"
        integrity="sha512-h9FcoyWjHcOcmEVkxOfTLnmZFWIH0iZhZT1H2TbOq55xssQGEJHEaIm+PgoUaZbRvQTNTluNOEfb1ZRy6D3BOw=="
        crossOrigin="anonymous"
      />

      <Card className="bg-card border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent" />
            <h3 className="font-semibold">Map Interface</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Button size="sm" variant="outline" onClick={() => setShowLayerMenu(!showLayerMenu)}>
                <Layers className="w-4 h-4 mr-1" />
                {currentLayer.charAt(0).toUpperCase() + currentLayer.slice(1)}
              </Button>
              {showLayerMenu && (
                <div className="absolute top-full right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-50">
                  <button
                    onClick={() => {
                      setCurrentLayer("streets")
                      setShowLayerMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-accent/10 ${currentLayer === "streets" ? "bg-accent/20" : ""}`}
                  >
                    Streets
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLayer("satellite")
                      setShowLayerMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-accent/10 ${currentLayer === "satellite" ? "bg-accent/20" : ""}`}
                  >
                    Satellite
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLayer("terrain")
                      setShowLayerMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-accent/10 ${currentLayer === "terrain" ? "bg-accent/20" : ""}`}
                  >
                    Terrain
                  </button>
                  <button
                    onClick={() => {
                      setCurrentLayer("topo")
                      setShowLayerMenu(false)
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-accent/10 ${currentLayer === "topo" ? "bg-accent/20" : ""}`}
                  >
                    Topographic
                  </button>
                </div>
              )}
            </div>
            {!isDrawing && polygon.length === 0 && (
              <Button
                size="sm"
                onClick={handleStartDrawing}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Draw Polygon
              </Button>
            )}
            {isDrawing && (
              <Button size="sm" onClick={handleFinishDrawing} className="bg-accent hover:bg-accent/90">
                Finish Polygon
              </Button>
            )}
            {polygon.length > 0 && (
              <>
                <Button size="sm" variant="outline" onClick={handleExportCoordinates}>
                  <Download className="w-4 h-4 mr-1" />
                  Export Coords
                </Button>
                <Button size="sm" variant="outline" onClick={handleClearPolygon}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </>
            )}
          </div>
        </div>

        <div ref={mapContainerRef} className="w-full h-[500px] border border-border rounded-lg" style={{ zIndex: 0 }} />

        <div className="mt-4 text-sm text-muted-foreground">
          {isDrawing ? (
            <p className="text-accent">
              Click on the map to add points to your polygon. Click "Finish Polygon" when done (minimum 3 points).
              Current points: {tempPoints.length}
            </p>
          ) : polygon.length > 0 ? (
            <div className="space-y-2">
              <p>
                {isCalculating ? "Calculating area..." : areaResult ? areaResult.display : "Polygon defined"}
                {areaResult?.warning && (
                  <span className="block text-yellow-500 text-xs mt-1">⚠️ {areaResult.warning}</span>
                )}
              </p>
              {areaResult && (
                <div className="text-xs bg-card-foreground/10 p-2 rounded border border-border">
                  <p>
                    <strong>EPSG:</strong> {areaResult.epsg} (UTM Zone {areaResult.zone})
                  </p>
                  <p>
                    <strong>Geometry Hash:</strong> {areaResult.geometryHash?.slice(0, 16)}...
                  </p>
                  <p className="text-accent font-semibold mt-1">
                    {areaResult.areaHa.toFixed(2)} ha = {areaResult.areaKm2.toFixed(4)} km²
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p>Click "Draw Polygon" to start defining your area of interest on the map.</p>
          )}
        </div>
      </Card>
    </>
  )
}
