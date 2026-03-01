# Satellite Verification Form Integration Guide

## Overview

The satellite verification system can be integrated into Green Carbon and Blue Carbon verification forms to automatically populate project data with verified satellite imagery analysis.

## Quick Start

### 1. Import Components

```tsx
import { SatelliteFormIntegration } from '@/components/satellite/satellite-form-integration'
import { useSatelliteIntegration } from '@/hooks/use-satellite-integration'
```

### 2. Add to Form

```tsx
export function GreenCarbonForm() {
  const { satelliteData, populateFormFields } = useSatelliteIntegration()
  const [formData, setFormData] = useState({})

  const handleSatelliteData = (data) => {
    const populated = populateFormFields(data)
    setFormData(populated)
  }

  return (
    <div className="space-y-6">
      {/* Satellite Integration Component */}
      <SatelliteFormIntegration
        projectType="green-carbon"
        onDataReceived={handleSatelliteData}
      />

      {/* Rest of form fields */}
      <input value={formData.area} placeholder="Project Area (ha)" />
      <input value={formData.estimatedCarbon} placeholder="Carbon Estimate" />
      {/* ... more fields */}
    </div>
  )
}
```

## Integration Pattern

### Full Example: Green Carbon Form

```tsx
'use client'

import { useState } from 'react'
import { SatelliteFormIntegration } from '@/components/satellite/satellite-form-integration'
import { useSatelliteIntegration } from '@/hooks/use-satellite-integration'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/error-alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function GreenCarbonForm() {
  const { satelliteData, isIntegrated, populateFormFields, isDataQualityGood } =
    useSatelliteIntegration()

  const [formData, setFormData] = useState({
    projectName: '',
    location: '',
    area: '',
    estimatedAGB: '',
    estimatedCarbon: '',
    vegetationType: '',
    // ... other fields
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Update form when satellite data arrives
  const handleSatelliteDataReceived = (data) => {
    const populated = populateFormFields(data)
    setFormData((prev) => ({ ...prev, ...populated }))
  }

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.projectName.trim()) {
      errors.projectName = 'Project name is required'
    }

    if (!formData.area || parseFloat(formData.area) <= 0) {
      errors.area = 'Valid area required'
    }

    // If using satellite data, check quality
    if (isIntegrated && !isDataQualityGood()) {
      errors.dataQuality = 'Satellite data quality is insufficient. Please verify manually.'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      // Submit form with populated data
      const response = await fetch('/api/verification/green-carbon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          satelliteVerified: isIntegrated,
        }),
      })

      if (response.ok) {
        // Success - redirect or show confirmation
        console.log('Form submitted successfully')
      }
    } catch (error) {
      console.error('Form submission failed:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <Tabs defaultValue="satellite" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="satellite">Satellite Data</TabsTrigger>
          <TabsTrigger value="project">Project Info</TabsTrigger>
          <TabsTrigger value="review">Review</TabsTrigger>
        </TabsList>

        {/* Satellite Tab */}
        <TabsContent value="satellite" className="space-y-4">
          <SatelliteFormIntegration
            projectType="green-carbon"
            onDataReceived={handleSatelliteDataReceived}
          />

          {isIntegrated && (
            <Card className="border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-sm text-emerald-700">
                ✓ Satellite data integrated successfully. Review below fields are auto-populated.
              </p>
            </Card>
          )}
        </TabsContent>

        {/* Project Info Tab */}
        <TabsContent value="project" className="space-y-4">
          <Card className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Project Name</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="Enter project name"
              />
              {validationErrors.projectName && (
                <ErrorAlert
                  type="error"
                  message={validationErrors.projectName}
                  dismissible={false}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="Project location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Project Area (hectares)
              </label>
              <input
                type="number"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
                placeholder="e.g., 1250"
              />
              {validationErrors.area && (
                <ErrorAlert
                  type="error"
                  message={validationErrors.area}
                  dismissible={false}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Vegetation Type</label>
              <select
                value={formData.vegetationType}
                onChange={(e) => setFormData({ ...formData, vegetationType: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg"
              >
                <option value="">Select vegetation type</option>
                <option value="tropical">Tropical Rainforest</option>
                <option value="temperate">Temperate Forest</option>
                <option value="peat">Peat Swamp Forest</option>
                <option value="mixed">Mixed Forest</option>
              </select>
            </div>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold">Estimated Carbon Credits</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Carbon</p>
                <p className="text-2xl font-bold">
                  {formData.estimatedCarbon
                    ? (formData.estimatedCarbon / 1000).toFixed(1)
                    : '0'}
                  {' '}tC
                </p>
              </div>

              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">CO2 Equivalent</p>
                <p className="text-2xl font-bold">
                  {formData.estimatedCO2e
                    ? (formData.estimatedCO2e / 1000).toFixed(1)
                    : '0'}
                  {' '}tCO2e
                </p>
              </div>

              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Data Source</p>
                <p className="text-sm font-semibold">
                  {isIntegrated ? 'Satellite Verified' : 'Manual Entry'}
                </p>
              </div>

              <div className="bg-background/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-sm font-semibold">
                  {isIntegrated ? (
                    <span className="text-emerald-500">
                      {formData.dataQuality || 'High'}
                    </span>
                  ) : (
                    'Not Verified'
                  )}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Submit Verification
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
```

## Data Flow

```
User Form Page
    ↓
[Satellite Integration Component]
    ↓ (User launches verification)
[Google Earth Engine API]
    ↓ (Fetch satellite data)
[Gemini AI Analysis]
    ↓ (Process imagery)
[useSatelliteIntegration Hook]
    ↓ (Emit event with data)
[Form Fields Auto-Populated]
    ↓
[User Reviews & Submits]
    ↓
[API Route with Satellite Data]
```

## Populated Fields

When satellite data is integrated, these form fields are automatically populated:

### Area & Measurements
- `area` - Project area in hectares
- `estimatedAGB` - Above-ground biomass (t/ha)
- `estimatedCarbon` - Total carbon content (tC)
- `estimatedCO2e` - CO2 equivalent (tCO2e)

### Vegetation Metrics
- `ndviScore` - Vegetation index score (0-1)
- `vegetationHealth` - Health percentage (0-100%)
- `biomassEstimate` - Calculated biomass per hectare

### Data Quality
- `dataQuality` - High/Medium/Low
- `cloudCover` - Cloud coverage percentage
- `satelliteImageId` - Reference to satellite image
- `satelliteTimestamp` - Date of satellite capture

### Notes
- `notes` - Auto-generated summary of satellite analysis

## Event Listeners

Listen for satellite integration events:

```typescript
window.addEventListener('satelliteDataIntegrated', (event: CustomEvent) => {
  const data = event.detail
  console.log('Satellite data received:', data)
})
```

## Validation Integration

Validate satellite data before accepting:

```typescript
const { isDataQualityGood } = useSatelliteIntegration()

if (!isDataQualityGood()) {
  // Show warning or require manual verification
}
```

## Best Practices

1. **Always validate** - Check data quality before using
2. **Show user confirmation** - Let users review populated data
3. **Allow overrides** - Users should be able to edit populated fields
4. **Track source** - Note when data is satellite-verified
5. **Archive imagery** - Save satellite image references for audit trails

## Testing Integration

```typescript
// Mock satellite data for testing
const mockData = {
  imageId: 'LANDSAT_TEST',
  timestamp: new Date().toISOString(),
  cloudCover: 12.5,
  ndvi: 0.68,
  carbonEstimate: 245000,
  biomassEstimate: 520.8,
  vegetationHealth: 0.82,
  areaHa: 1250.5,
  dataQuality: 'High',
  recommendations: ['Excellent conditions']
}

// Dispatch test event
window.dispatchEvent(new CustomEvent('satelliteDataIntegrated', { detail: mockData }))
```

## Troubleshooting

### Data not populating
- Check that `useSatelliteIntegration` hook is called in same component
- Verify event listener is attached to window
- Check browser console for errors

### Validation errors
- Ensure all required fields are in form data object
- Validate coordinate systems match (WGS84)
- Check area calculations for negative/zero values

### Performance issues
- Lazy load satellite component with React.lazy()
- Debounce form field updates
- Use virtualization for large datasets
