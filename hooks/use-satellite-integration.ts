'use client'

import { useCallback, useEffect, useState } from 'react'
import type { SatelliteVerificationData } from '@/components/satellite/satellite-form-integration'

export function useSatelliteIntegration() {
  const [satelliteData, setSatelliteData] = useState<SatelliteVerificationData | null>(null)
  const [isIntegrated, setIsIntegrated] = useState(false)

  // Listen for satellite data integration events
  useEffect(() => {
    function handleIntegration(event: Event) {
      if (event instanceof CustomEvent) {
        const data = event.detail as SatelliteVerificationData
        setSatelliteData(data)
        setIsIntegrated(true)
      }
    }

    window.addEventListener('satelliteDataIntegrated', handleIntegration)
    return () => window.removeEventListener('satelliteDataIntegrated', handleIntegration)
  }, [])

  // Auto-populate form fields with satellite data
  const populateFormFields = useCallback((formData: Record<string, any>) => {
    if (!satelliteData) return formData

    return {
      ...formData,
      // Area field
      area: satelliteData.areaHa,

      // Carbon estimates
      estimatedAGB: satelliteData.biomassEstimate,
      estimatedCarbon: satelliteData.carbonEstimate,
      estimatedCO2e: satelliteData.carbonEstimate * 1.467,

      // Vegetation health
      ndviScore: satelliteData.ndvi,
      vegetationHealth: satelliteData.vegetationHealth * 100,

      // Data quality
      dataQuality: satelliteData.dataQuality,

      // Satellite reference
      satelliteImageId: satelliteData.imageId,
      satelliteTimestamp: satelliteData.timestamp,
      cloudCover: satelliteData.cloudCover,

      // Add satellite data source note
      notes: `Data verified with satellite imagery (${satelliteData.timestamp}). Cloud cover: ${satelliteData.cloudCover}%. Data quality: ${satelliteData.dataQuality}.`,
    }
  }, [satelliteData])

  // Validate satellite data quality
  const isDataQualityGood = useCallback((): boolean => {
    if (!satelliteData) return false

    return (
      satelliteData.dataQuality !== 'Low' &&
      satelliteData.cloudCover < 30 &&
      satelliteData.vegetationHealth > 0.5
    )
  }, [satelliteData])

  // Get satellite data summary
  const getSummary = useCallback((): string => {
    if (!satelliteData) return ''

    return `
      Satellite Verification Summary:
      - Area: ${satelliteData.areaHa.toLocaleString()} hectares
      - Carbon Estimate: ${(satelliteData.carbonEstimate / 1000).toFixed(1)} tC
      - Vegetation Health: ${(satelliteData.vegetationHealth * 100).toFixed(0)}%
      - Data Quality: ${satelliteData.dataQuality}
      - Cloud Cover: ${satelliteData.cloudCover}%
      - Analysis Date: ${new Date(satelliteData.timestamp).toLocaleDateString()}
    `
  }, [satelliteData])

  // Clear integration
  const clearIntegration = useCallback(() => {
    setSatelliteData(null)
    setIsIntegrated(false)
  }, [])

  return {
    satelliteData,
    isIntegrated,
    populateFormFields,
    isDataQualityGood,
    getSummary,
    clearIntegration,
  }
}
