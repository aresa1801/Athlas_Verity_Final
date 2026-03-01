# Satellite Verification API Documentation

## Overview

The Satellite Verification API provides endpoints for satellite imagery analysis, carbon estimation, and data export. The API supports multiple satellite sources (Google Earth Engine, Sentinel-2, Planetary Labs) and integrates AI-powered analysis via Gemini.

## Base URL

```
https://athlas-verity.vercel.app/api/satellite
```

## Authentication

Include API keys in environment variables:
- `GOOGLE_EARTH_ENGINE_API_KEY` - For Earth Engine access
- `GEMINI_API_KEY` - For AI analysis
- `PLANETARY_API_KEY` - Optional, for Planetary Labs

## Endpoints

### 1. Fetch Satellite Data

**Endpoint:** `POST /satellite/fetch`

**Description:** Retrieve satellite imagery for a specified location and date range.

**Request Body:**
```json
{
  "polygon": [[lng, lat], [lng, lat], [lng, lat]],
  "dateRange": {
    "startDate": "2023-01-01",
    "endDate": "2023-12-31"
  },
  "satelliteSource": "google|sentinel|planetary",
  "cloudCover": {
    "maxCloudCover": 25,
    "autoFilter": true
  },
  "resolution": "10m|30m|100m|250m",
  "indices": ["ndvi", "evi", "savi"]
}
```

**Response:**
```json
{
  "imageId": "LANDSAT/LC09/C02/T1_L2/LC09_187026_20230615",
  "timestamp": "2023-06-15T00:00:00Z",
  "cloudCover": 2.3,
  "ndvi": [0.45, 0.52, ...],
  "bounds": {
    "north": 45.123,
    "south": 45.115,
    "east": -122.456,
    "west": -122.465
  }
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request parameters
- `401` - Authentication failed
- `429` - Rate limit exceeded
- `503` - Service unavailable

### 2. Analyze with Gemini AI

**Endpoint:** `POST /satellite/analyze`

**Description:** Perform AI-powered analysis on satellite data.

**Request Body:**
```json
{
  "satelliteData": {
    "imageId": "...",
    "ndvi": [...],
    "cloudCover": 2.3,
    "vegetationType": "tropical|mangrove|peat|temperate|mixed"
  },
  "areaHa": 1250.5
}
```

**Response:**
```json
{
  "carbonEstimate": {
    "agbPerHectare": 185.4,
    "totalAGB": 231,875,
    "carbonContent": 109,084,
    "co2Equivalent": 400,000
  },
  "vegetationHealth": {
    "ndviMean": 0.52,
    "healthStatus": "Excellent",
    "confidence": 0.92
  },
  "recommendations": [
    "Optimal conditions for carbon sequestration",
    "Monitor for disturbance signals"
  ],
  "dataQuality": "High"
}
```

### 3. Export Report

**Endpoint:** `POST /satellite/export`

**Description:** Generate PDF or Excel reports.

**Request Body:**
```json
{
  "format": "pdf|excel|csv",
  "analysisResults": {...},
  "includeCharts": true,
  "includeCoordinates": true
}
```

**Response:**
Binary file (PDF/Excel/CSV)

## Validation Schemas

### Polygon Validation
- Minimum 3 points required
- Valid lat/lng coordinates
- No self-intersections

### Date Range Validation
- Start date <= End date
- Within last 30 years
- Sufficient satellite data available

### Cloud Cover Validation
- 0-100 percentage
- Affects data quality
- Auto-filtering recommended

## Error Handling

All errors follow this format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "field": ["error1", "error2"]
  },
  "statusCode": 400
}
```

### Common Error Codes

- `INVALID_POLYGON` - Polygon validation failed
- `INVALID_COORDINATES` - Lat/lng out of bounds
- `NO_SATELLITE_DATA` - No data available for location
- `CLOUD_COVER_EXCEEDED` - Cloud cover above threshold
- `API_RATE_LIMIT` - Rate limit reached
- `AI_ANALYSIS_FAILED` - Gemini analysis error

## Rate Limiting

- Free tier: 10 requests/hour
- Pro tier: 100 requests/hour
- Enterprise: Unlimited

Rate limit headers:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Pagination

Satellite imagery results support pagination:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 85,
    "hasMore": true,
    "nextCursor": "abc123"
  }
}
```

## Caching

API responses are cached for 24 hours. Use cache headers:
- `Cache-Control: max-age=86400`
- `ETag` for conditional requests

## Webhooks

Subscribe to analysis completion events:

```javascript
POST /webhooks/subscribe
{
  "url": "https://your-domain.com/webhook",
  "events": ["analysis.complete", "analysis.failed"]
}
```

## Example Requests

### JavaScript/Node.js

```javascript
const response = await fetch('/api/satellite/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    polygon: [[-122.456, 45.123], [-122.445, 45.123], [-122.445, 45.115]],
    dateRange: { startDate: '2023-01-01', endDate: '2023-12-31' },
    satelliteSource: 'google',
    cloudCover: { maxCloudCover: 25 },
    resolution: '10m',
    indices: ['ndvi']
  })
})

const data = await response.json()
```

### Python

```python
import requests

response = requests.post('/api/satellite/fetch', json={
    'polygon': [[-122.456, 45.123], [-122.445, 45.123], [-122.445, 45.115]],
    'dateRange': {'startDate': '2023-01-01', 'endDate': '2023-12-31'},
    'satelliteSource': 'google',
    'cloudCover': {'maxCloudCover': 25},
    'resolution': '10m',
    'indices': ['ndvi']
})
```

## Support

For API issues, contact support@athlas-verity.com or check status page at status.athlas-verity.com
