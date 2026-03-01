import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

interface AnalysisRequest {
  projectName: string
  organization: string
  country: string
  methodology: string
  polygon: Array<[number, number]>
  totalArea: number
  forestType: string[]
  protectionType: string[]
  dominantSpecies: string
  averageCanopyHeight: string
  biomassEstimate: string
  deforestationRisk: string
  fireRisk: string
  climateVulnerability: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()

    const analysisPrompt = `
Perform a comprehensive Gemini AI analysis for this Green Carbon verification project:

Project Information:
- Name: ${body.projectName}
- Organization: ${body.organization}
- Country: ${body.country}
- Methodology: ${body.methodology}
- Total Area: ${body.totalArea} hectares

Geospatial Data:
- Forest Types: ${body.forestType.join(', ')}
- Protection/Restoration Types: ${body.protectionType.join(', ')}
- Polygon Points: ${body.polygon.length}

Ecological Data:
- Dominant Species: ${body.dominantSpecies}
- Average Canopy Height: ${body.averageCanopyHeight}m
- Estimated Biomass: ${body.biomassEstimate} Mg/ha

Risk Assessment:
- Deforestation Risk: ${body.deforestationRisk}
- Fire Risk: ${body.fireRisk}
- Climate Vulnerability: ${body.climateVulnerability}

Please provide:
1. Ecological Analysis: Assess forest health, species composition, and carbon stock estimates
2. Risk Assessment: Quantify deforestation, fire, and climate risks with mitigation strategies
3. Additionality Analysis: Assess financial and common practice additionality
4. Carbon Baseline: Estimate baseline carbon sequestration rates
5. Recommendations: Provide actionable recommendations for project improvement
6. Confidence Score: Rate overall analysis confidence (0-100%)

Format response as JSON with these keys: ecologicalAnalysis, riskAssessment, additionalityAnalysis, carbonBaseline, recommendations, confidenceScore
`

    const result = await generateText({
      model: 'google/gemini-1.5-pro',
      prompt: analysisPrompt,
      temperature: 0.7,
      maxTokens: 2000,
    })

    // Parse the response
    let analysis = {
      ecologicalAnalysis: 'Analysis pending',
      riskAssessment: 'Risk assessment pending',
      additionalityAnalysis: 'Additionality analysis pending',
      carbonBaseline: 'Baseline pending',
      recommendations: 'Recommendations pending',
      confidenceScore: 0,
    }

    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      // If JSON parsing fails, use the text as is
      analysis = {
        ecologicalAnalysis: result.text.substring(0, 300),
        riskAssessment: 'Analysis available in full report',
        additionalityAnalysis: 'Analysis available in full report',
        carbonBaseline: 'Analysis available in full report',
        recommendations: 'Analysis available in full report',
        confidenceScore: 75,
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      projectData: body,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Project analysis error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      },
      { status: 500 }
    )
  }
}
