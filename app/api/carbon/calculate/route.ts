import { type NextRequest, NextResponse } from "next/server"
import { estimateBiomass } from "@/lib/ai-carbon/biomass-estimation"
import { applyIntegrityDiscount } from "@/lib/ai-carbon/carbon-conversion"
import { buildFeatureCube } from "@/lib/ai-carbon/feature-engineering"

interface SatelliteData {
  bands?: {
    B02?: number
    B03?: number
    B04?: number
    B08?: number
    B11?: number
    B12?: number
  }
  location: {
    latitude: number
    longitude: number
  }
  area_ha: number
  polygon_area_ha?: number
  carbonOffsetType: string
  aura_score?: number
  integrity_class?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SatelliteData = await request.json()

    const latitude = body.location.latitude
    const longitude = body.location.longitude
    const area_ha =
      body.polygon_area_ha !== undefined && body.polygon_area_ha > 0 ? body.polygon_area_ha : body.area_ha || 87

    console.log(
      "[v0] Carbon Calculation - Using area_ha:",
      area_ha,
      "from polygon_area_ha:",
      body.polygon_area_ha,
      "area_ha:",
      body.area_ha,
    )

    // Default band values if not provided
    const bands = {
      B02: body.bands?.B02 || 0.08,
      B03: body.bands?.B03 || 0.12,
      B04: body.bands?.B04 || 0.05,
      B08: body.bands?.B08 || 0.35,
      B11: body.bands?.B11 || 0.15,
      B12: body.bands?.B12 || 0.12,
    }

    // Build feature cube from satellite data
    const featureCube = buildFeatureCube(bands, { latitude, longitude }, area_ha)

    // Estimate biomass using AI model
    const biomassEstimate = estimateBiomass(featureCube)

    const carbon_fraction = 0.47 // IPCC standard
    const agb_per_ha = biomassEstimate.agb_mean
    const agb_p10 = biomassEstimate.agb_p10

    // Step 1: Convert AGB → Carbon per hectare (tC/ha)
    const tC_per_ha = agb_per_ha * carbon_fraction
    const tC_per_ha_p10 = agb_p10 * carbon_fraction

    // Step 2: Convert Carbon → CO2 per hectare (tCO2/ha) using IPCC ratio 44/12
    const tCO2_per_ha = tC_per_ha * (44 / 12)
    const tCO2_per_ha_p10 = tC_per_ha_p10 * (44 / 12)

    // Step 3: Calculate TOTAL tCO2 by multiplying tCO2/Ha × Area in Ha
    const tCO2_total = tCO2_per_ha * area_ha
    const tCO2_total_p10 = tCO2_per_ha_p10 * area_ha

    console.log(
      "[v0] Verified Carbon Calculation:",
      "| AGB/Ha: " +
        agb_per_ha.toFixed(2) +
        "| tC/Ha: " +
        tC_per_ha.toFixed(2) +
        "| tCO2/Ha: " +
        tCO2_per_ha.toFixed(2) +
        "| Area Ha: " +
        area_ha +
        "| tCO2/Ha × Area Ha = " +
        tCO2_per_ha.toFixed(2) +
        " × " +
        area_ha +
        " = " +
        tCO2_total.toFixed(2),
    )

    // Apply integrity discount based on validator consensus
    const aura_score = body.aura_score || 0.91
    const integrity_class = body.integrity_class || "IC-A"
    const adjusted_tCO2 = applyIntegrityDiscount(tCO2_total, aura_score, integrity_class)

    return NextResponse.json({
      success: true,
      carbon_estimation: {
        project_id: `proj_${Date.now()}`,
        area_ha,
        agb_mean: Math.round(agb_per_ha * 100) / 100,
        agb_p10: Math.round(biomassEstimate.agb_p10 * 100) / 100,
        agb_p90: Math.round(biomassEstimate.agb_p90 * 100) / 100,
        carbon_fraction,
        tC_per_ha: Math.round(tC_per_ha * 100) / 100,
        tC_total: Math.round(tC_per_ha * area_ha * 100) / 100,
        tCO2_per_ha: Math.round(tCO2_per_ha * 100) / 100,
        tCO2_per_ha_p10: Math.round(tCO2_per_ha_p10 * 100) / 100,
        co2_tCO2: Math.round(tCO2_total * 100) / 100,
        co2_tCO2_p10: Math.round(tCO2_total_p10 * 100) / 100,
        net_verified_co2: Math.round(adjusted_tCO2 * 100) / 100,
        uncertainty_range: {
          lower_bound: Math.round(tCO2_total_p10 * 100) / 100,
          upper_bound: Math.round(biomassEstimate.agb_p90 * carbon_fraction * (44 / 12) * area_ha * 100) / 100,
        },
        integrity_class,
        aura_score,
        methodology: "Satellite + AI + IPCC",
        features: featureCube,
        vegetation_indices: featureCube.vegetation,
      },
    })
  } catch (error) {
    console.error("[v0] Carbon calculation error:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 400 })
  }
}
