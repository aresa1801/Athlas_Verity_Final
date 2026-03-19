# Verification Flow Fix - Run Verification → Validation Report

## Problem Fixed

When clicking "Run Verification" button in `/verification/green-carbon/create`, the application was not navigating to the Validation Report page (`/results`).

## Root Cause

The `handleRunVerification` function in `components/forms/green-carbon-form.tsx` was incomplete:
- It only logged data and had a comment `// Submit to verification API`
- It didn't collect the form data
- It didn't navigate to the results page
- No router was initialized

## Solution Implemented

### 1. Added Router Import & State Management
```typescript
const router = useRouter()
const [isSubmitting, setIsSubmitting] = useState(false)
```

### 2. Implemented Complete Verification Handler
The `handleRunVerification` function now:
- Validates form completeness with error alert
- Prepares comprehensive verification data structure
- Stores form data and verification data in sessionStorage using correct key: `projectFormData`
- Shows loading state during processing
- Navigates to `/results` page after storing data

### 3. Updated Run Verification Button
- Added loading state with visual indicator
- Button shows "Processing Verification..." text during submission
- Disabled state prevents double submissions

## Data Flow

```
User clicks "Run Verification"
  ↓
checkCompleteness() validates all required fields
  ↓
Verification data prepared with all form sections
  ↓
Data stored in sessionStorage with key "projectFormData"
  ↓
router.push('/results') navigates to validation report
  ↓
/results page loads verification data from sessionStorage
  ↓
Validation Report PDF generated with all data
```

## Files Modified

1. **components/forms/green-carbon-form.tsx**
   - Added `useRouter` import
   - Added `isSubmitting` state
   - Implemented complete `handleRunVerification` function
   - Updated button with loading state

## Verification Data Structure

The following data is now properly stored for the validation report:

```javascript
{
  type: "green_carbon_verification",
  timestamp: ISO string,
  
  // Section A
  projectName,
  country,
  baselineYear,
  methodologyRef,
  
  // Section B - Geospatial
  geospatial: {
    area_hectares,
    coordinates,
    forestType,
    protectionRestorationType
  },
  
  // Section C - Vegetation
  vegetation: {
    dominantSpecies,
    averageTreeHeight,
    vegetationClassification,
    vegetationDescription,
    ndviValue
  },
  
  // Section D - Risk & Legal
  riskAssessment: {
    deforestationRiskLevel,
    legalProtectionStatus
  }
}
```

## Testing

To verify the fix works:
1. Navigate to `/verification/green-carbon/create`
2. Upload satellite data file
3. Fill all form sections (A-D)
4. Confirm Section E shows 100% completion
5. Click "Run Verification"
6. Expected: Page should navigate to `/results` showing Validation Report with 9 pages

## Results Page Integration

The `/results` page now reads data from sessionStorage key `projectFormData` which contains:
- Form data for all sections
- Verification metadata
- Satellite analysis data
- Carbon estimation results

All this data is used to populate the Validation Report PDF.

## Session Storage Keys Used

- `projectFormData` - Contains all form data (Section A-D) and satellite data
- `verificationData` - Contains structured verification metadata

## Error Handling

If any error occurs during verification:
- Error is logged to console
- User is shown alert with error message
- Form remains accessible for corrections
- Submission state is reset
