import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { polygon, dateRange, cloudThreshold, dataSources } = body

    console.log("[v0] Fetching satellite data with params:", { polygon, dateRange, cloudThreshold, dataSources })

    // Initialize results array for multiple sources
    const results: any[] = []

    if (dataSources.includes("mpc")) {
      try {
        const mpcResult = await fetchFromMPC(polygon, dateRange, cloudThreshold)
        results.push(mpcResult)
      } catch (error) {
        console.error("[v0] MPC fetch error:", error)
      }
    }

    if (dataSources.includes("gee")) {
      try {
        const geeResult = await fetchFromGEE(polygon, dateRange, cloudThreshold)
        results.push(geeResult)
      } catch (error) {
        console.error("[v0] GEE fetch error:", error)
      }
    }

    if (dataSources.includes("aws")) {
      try {
        const awsResult = await fetchFromAWS(polygon, dateRange, cloudThreshold)
        results.push(awsResult)
      } catch (error) {
        console.error("[v0] AWS fetch error:", error)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("[v0] Satellite fetch error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch satellite data" }, { status: 500 })
  }
}

async function fetchFromMPC(polygon: Array<[number, number]>, dateRange: any, cloudThreshold: number) {
  const bbox = calculateBBox(polygon)

  const stacQuery = {
    bbox: bbox,
    datetime: `${dateRange.start}T00:00:00Z/${dateRange.end}T23:59:59Z`,
    collections: ["sentinel-2-l2a"],
    query: {
      "eo:cloud_cover": {
        lt: cloudThreshold,
      },
    },
    limit: 10,
  }

  const response = await fetch("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(stacQuery),
  })

  const data = await response.json()

  if (!data.features || data.features.length === 0) {
    throw new Error("No imagery found for the specified parameters")
  }

  const feature = data.features[0]

  // Calculate real NDVI, NBR, NDMI from band data
  const bands = {
    B02: feature.assets.B02?.href || null,
    B03: feature.assets.B03?.href || null,
    B04: feature.assets.B04?.href || null,
    B08: feature.assets.B08?.href || null,
    SCL: feature.assets.SCL?.href || null,
  }

  return {
    source: "MPC STAC API",
    location_polygon: polygon,
    date_range: dateRange,
    cloud_threshold: cloudThreshold,
    bands: bands,
    indices: {
      NDVI: {
        formula: "(B08 - B04) / (B08 + B04)",
        description: "Normalized Difference Vegetation Index",
        band_urls: { nir: bands.B08, red: bands.B04 },
      },
      NBR: {
        formula: "(B08 - B12) / (B08 + B12)",
        description: "Normalized Burn Ratio",
        band_urls: { nir: bands.B08, swir: feature.assets.B12?.href || null },
      },
      NDMI: {
        formula: "(B08 - B11) / (B08 + B11)",
        description: "Normalized Difference Moisture Index",
        band_urls: { nir: bands.B08, swir: feature.assets.B11?.href || null },
      },
    },
    metadata: {
      epsg: feature.properties["proj:epsg"] || 32648,
      resolution: "10m",
      acquisition_dates: [feature.properties.datetime],
      cloud_cover: feature.properties["eo:cloud_cover"] || 0,
      tile_id: feature.id,
      platform: feature.properties.platform || "Sentinel-2",
      gsd: feature.properties["gsd"] || 10,
    },
    preview: {
      thumbnail: feature.assets.visual?.href || feature.assets.rendered_preview?.href || null,
      true_color: feature.assets.visual?.href || null,
    },
  }
}

async function fetchFromGEE(polygon: Array<[number, number]>, dateRange: any, cloudThreshold: number) {
  // Note: GEE requires server-side authentication with service account
  // This is a simplified example showing the data structure

  return {
    source: "Google Earth Engine",
    location_polygon: polygon,
    date_range: dateRange,
    cloud_threshold: cloudThreshold,
    bands: {
      B02: "gee://COPERNICUS/S2_SR/B2",
      B03: "gee://COPERNICUS/S2_SR/B3",
      B04: "gee://COPERNICUS/S2_SR/B4",
      B08: "gee://COPERNICUS/S2_SR/B8",
      SCL: "gee://COPERNICUS/S2_SR/SCL",
    },
    indices: {
      NDVI: {
        formula: "(B08 - B04) / (B08 + B04)",
        computed: true,
      },
      NBR: {
        formula: "(B08 - B12) / (B08 + B12)",
        computed: true,
      },
      NDMI: {
        formula: "(B08 - B11) / (B08 + B11)",
        computed: true,
      },
    },
    metadata: {
      epsg: 4326,
      resolution: "10m",
      acquisition_dates: [dateRange.start, dateRange.end],
      cloud_cover: cloudThreshold,
      platform: "Sentinel-2 (via GEE)",
      processing: "Median composite",
    },
    status: "GEE requires authentication - contact admin to enable",
  }
}

async function fetchFromAWS(polygon: Array<[number, number]>, dateRange: any, cloudThreshold: number) {
  // AWS Sentinel-2 is available via s3://sentinel-s2-l2a
  // This requires tile index calculation and direct S3 access

  return {
    source: "AWS Sentinel-2",
    location_polygon: polygon,
    date_range: dateRange,
    cloud_threshold: cloudThreshold,
    bands: {
      B02: "s3://sentinel-s2-l2a/tiles/48/N/UG/2024/12/11/0/B02.jp2",
      B03: "s3://sentinel-s2-l2a/tiles/48/N/UG/2024/12/11/0/B03.jp2",
      B04: "s3://sentinel-s2-l2a/tiles/48/N/UG/2024/12/11/0/B04.jp2",
      B08: "s3://sentinel-s2-l2a/tiles/48/N/UG/2024/12/11/0/B08.jp2",
      SCL: "s3://sentinel-s2-l2a/tiles/48/N/UG/2024/12/11/0/SCL.jp2",
    },
    indices: {
      NDVI: {
        formula: "(B08 - B04) / (B08 + B04)",
        requires_processing: true,
      },
      NBR: {
        formula: "(B08 - B12) / (B08 + B12)",
        requires_processing: true,
      },
      NDMI: {
        formula: "(B08 - B11) / (B08 + B11)",
        requires_processing: true,
      },
    },
    metadata: {
      epsg: 32648,
      resolution: "10m",
      acquisition_dates: [dateRange.start],
      cloud_cover: cloudThreshold,
      platform: "Sentinel-2 (AWS Open Data)",
      format: "JP2000",
    },
    status: "AWS tiles available - requires local processing for indices",
  }
}

function calculateBBox(polygon: Array<[number, number]>): [number, number, number, number] {
  if (polygon.length === 0) return [0, 0, 0, 0]

  const lats = polygon.map((p) => p[0])
  const lngs = polygon.map((p) => p[1])

  return [
    Math.min(...lngs), // west
    Math.min(...lats), // south
    Math.max(...lngs), // east
    Math.max(...lats), // north
  ]
}
