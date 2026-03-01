# Satellite Verification System - Quick Reference

## File Structure

```
satellite-verification/
├── lib/
│   ├── gee-client.ts                 # Google Earth Engine integration
│   ├── precision-area-calculator.ts  # 99.97% accuracy area calculation
│   ├── polygon-file-handlers.ts      # Multi-format file parsing
│   ├── satellite-validation.ts       # Zod validation schemas
│   ├── error-handler.ts              # Error management
│   ├── accessibility-utils.ts        # WCAG 2.1 AA compliance
│   ├── performance-utils.ts          # Core Web Vitals optimization
│   └── export-report.ts              # PDF/Excel export
├── components/satellite/
│   ├── satellite-upload-panel.tsx    # 8 config cards UI
│   ├── comprehensive-verification-page.tsx
│   ├── satellite-results-dashboard.tsx
│   ├── satellite-form-integration.tsx # Form embedding
│   └── full-verification-page.tsx
├── components/
│   ├── error-boundary.tsx            # React error boundary
│   ├── error-alert.tsx               # Reusable alert
│   ├── progress-indicator.tsx        # Progress UI
│   └── skeleton-loaders.tsx          # Loading placeholders
├── hooks/
│   ├── use-loading-state.ts          # Loading state management
│   └── use-satellite-integration.ts  # Form integration hook
├── app/api/satellite/
│   ├── fetch/route.ts                # Satellite data endpoint
│   └── analyze/route.ts              # Gemini AI endpoint
└── docs/
    ├── API.md                        # API reference
    ├── USER_GUIDE.md                 # User documentation
    ├── SETUP.md                      # Setup & deployment
    ├── FORM_INTEGRATION.md           # Form integration guide
    └── IMPLEMENTATION_SUMMARY.md     # Project overview
```

## Common Tasks

### Add Error Handling to Component

```typescript
import { SatelliteVerificationError } from '@/lib/error-handler'
import { ErrorAlert } from '@/components/error-alert'
import { useState } from 'react'

export function MyComponent() {
  const [error, setError] = useState<Error | null>(null)

  try {
    // ... code
  } catch (err) {
    setError(err instanceof Error ? err : new Error(String(err)))
  }

  return error ? <ErrorAlert type="error" message={error.message} /> : null
}
```

### Validate User Input

```typescript
import { SatelliteVerificationFormSchema } from '@/lib/satellite-validation'

const data = await SatelliteVerificationFormSchema.parseAsync(formData)
  .catch((err) => {
    return { fieldErrors: err.flatten().fieldErrors }
  })
```

### Show Loading Progress

```typescript
import { useLoadingState } from '@/hooks/use-loading-state'
import { ProgressIndicator } from '@/components/progress-indicator'

const { isLoading, progress, setLoading, setProgress } = useLoadingState()

// Update progress
setProgress(50)

return <ProgressIndicator steps={[...]} currentProgress={progress} />
```

### Integrate Satellite Data into Form

```typescript
import { SatelliteFormIntegration } from '@/components/satellite/satellite-form-integration'
import { useSatelliteIntegration } from '@/hooks/use-satellite-integration'

const { satelliteData, populateFormFields } = useSatelliteIntegration()

const handleSatelliteData = (data) => {
  const populated = populateFormFields(formData)
  setFormData(populated)
}

return (
  <SatelliteFormIntegration
    projectType="green-carbon"
    onDataReceived={handleSatelliteData}
  />
)
```

### Ensure Accessibility

```typescript
import { setFocus, trapFocus, announceToScreenReader } from '@/lib/accessibility-utils'
import { KEYBOARD_KEYS } from '@/lib/accessibility-utils'

// Set focus on error
setFocus('[data-error]')

// Trap focus in modal
useEffect(() => {
  const cleanup = trapFocus(modalRef.current)
  return cleanup
}, [])

// Announce to screen readers
announceToScreenReader('Data loaded successfully')

// Handle keyboard
if (event.key === KEYBOARD_KEYS.ESCAPE) {
  closeModal()
}
```

### Optimize Performance

```typescript
import { debounce, memoize } from '@/lib/performance-utils'
import { useIntersectionObserver } from '@/lib/performance-utils'

// Debounce expensive operations
const handleSearch = debounce(async (query) => {
  const results = await fetch(`/api/search?q=${query}`)
}, 300)

// Memoize calculations
const calculateArea = memoize((coords) => {
  return vincenty(coords)
})

// Lazy load with Intersection Observer
const observer = useIntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loadData()
    }
  })
})
```

## Environment Variables

```env
# Required
GOOGLE_EARTH_ENGINE_API_KEY=your_key
GEMINI_API_KEY=your_key

# Optional
PLANETARY_API_KEY=your_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/satellite/fetch` | POST | Fetch satellite imagery |
| `/api/satellite/analyze` | POST | Run Gemini AI analysis |
| `/api/satellite/export` | POST | Generate PDF/Excel report |

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| `INVALID_POLYGON` | Polygon validation failed | Redraw polygon, check for self-intersections |
| `NO_SATELLITE_DATA` | No data available | Try different dates or location |
| `CLOUD_COVER_EXCEEDED` | Cloud cover above threshold | Lower threshold or select different dates |
| `API_RATE_LIMIT` | Rate limit reached | Wait 1 hour or upgrade plan |
| `AI_ANALYSIS_FAILED` | Gemini analysis error | Retry or contact support |

## Component Props

### SatelliteFormIntegration
```typescript
interface Props {
  projectType: 'green-carbon' | 'blue-carbon'
  onDataReceived?: (data: SatelliteVerificationData) => void
  onClose?: () => void
  initialPolygon?: Array<[number, number]>
}
```

### ErrorAlert
```typescript
interface Props {
  type: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  details?: Record<string, string[]>
  dismissible?: boolean
  autoClose?: number
}
```

### ProgressIndicator
```typescript
interface Props {
  steps: Array<{
    label: string
    progress: number
    completed: boolean
  }>
  currentProgress: number
  isComplete?: boolean
  title?: string
}
```

## Hooks Reference

### useLoadingState
```typescript
const {
  isLoading,      // boolean
  progress,       // 0-100
  status,         // string
  error,          // Error | null
  setLoading,     // (boolean) => void
  setProgress,    // (number) => void
  setStatus,      // (string) => void
  setError,       // (Error | null) => void
  reset           // () => void
} = useLoadingState('Initial status')
```

### useSatelliteIntegration
```typescript
const {
  satelliteData,          // SatelliteVerificationData | null
  isIntegrated,           // boolean
  populateFormFields,     // (formData) => formData
  isDataQualityGood,      // () => boolean
  getSummary,             // () => string
  clearIntegration        // () => void
} = useSatelliteIntegration()
```

## Type Definitions

```typescript
// Main data structure
interface SatelliteVerificationData {
  imageId: string
  timestamp: string
  cloudCover: number
  ndvi: number
  carbonEstimate: number
  biomassEstimate: number
  vegetationHealth: number
  areaHa: number
  dataQuality: 'High' | 'Medium' | 'Low'
  recommendations: string[]
}

// Form validation
type SatelliteVerificationForm = z.infer<typeof SatelliteVerificationFormSchema>
```

## Testing Examples

```typescript
// Test validation
describe('satellite-validation', () => {
  it('should validate polygon', () => {
    const polygon = [[0, 0], [1, 1], [1, 0]]
    expect(PolygonSchema.parse(polygon)).toBeTruthy()
  })

  it('should reject self-intersecting polygon', () => {
    const polygon = [[0, 0], [1, 1], [0, 1], [1, 0]]
    expect(() => PolygonSchema.parse(polygon)).toThrow()
  })
})

// Test error handling
describe('error-handler', () => {
  it('should handle validation error', () => {
    const error = new ZodError([])
    const result = handleValidationError(error)
    expect(result.code).toBe('VALIDATION_ERROR')
  })
})
```

## Debugging Tips

### Enable debug logging
```typescript
// In any file
console.log('[v0] Debug message:', value)
```

### Performance profiling
```typescript
performanceMetrics.mark('operation-start')
// ... operation ...
performanceMetrics.measure('operation', 'operation-start', 'operation-end')
```

### Check accessibility
```typescript
// Browser DevTools Console
axe.run((error, results) => {
  if (error) throw error
  console.log(results.violations)
})
```

## Common Imports

```typescript
// Validation
import { SatelliteVerificationFormSchema } from '@/lib/satellite-validation'

// Error handling
import { SatelliteVerificationError, handleApiError } from '@/lib/error-handler'
import { ErrorAlert } from '@/components/error-alert'
import { ErrorBoundary } from '@/components/error-boundary'

// Loading states
import { useLoadingState, useAsyncOperation } from '@/hooks/use-loading-state'
import { ProgressIndicator } from '@/components/progress-indicator'
import { SkeletonCard, SkeletonLoader } from '@/components/skeleton-loaders'

// Accessibility
import { setFocus, trapFocus, KEYBOARD_KEYS } from '@/lib/accessibility-utils'

// Performance
import { debounce, throttle, memoize } from '@/lib/performance-utils'

// Form integration
import { SatelliteFormIntegration } from '@/components/satellite/satellite-form-integration'
import { useSatelliteIntegration } from '@/hooks/use-satellite-integration'
```

## Resources

- **Documentation**: See `/docs` folder
- **API Examples**: `/docs/API.md`
- **User Guide**: `/docs/USER_GUIDE.md`
- **Setup Instructions**: `/docs/SETUP.md`
- **Form Integration**: `/docs/FORM_INTEGRATION.md`

## Support

- GitHub Issues: https://github.com/aresa1801/athlas-verity/issues
- Email: support@athlas-verity.com
- Documentation: https://docs.athlas-verity.com
