# Athlas Verity Setup Guide

## Environment Setup

### Prerequisites

- Node.js 18+ or 20+
- npm, yarn, pnpm, or bun
- Git
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone repository:
```bash
git clone https://github.com/aresa1801/athlas-verity.git
cd athlas-verity
```

2. Install dependencies:
```bash
pnpm install
# or npm install, yarn install, bun install
```

3. Create `.env.local` file with required API keys

4. Run development server:
```bash
pnpm dev
```

5. Open http://localhost:3000

## Google Earth Engine Setup

### Step 1: Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a Project" → "New Project"
3. Enter project name: "Athlas Verity"
4. Click "Create"

### Step 2: Enable Earth Engine API

1. Search "Earth Engine API" in APIs search
2. Click "Earth Engine API"
3. Click "Enable"
4. Wait for activation (5-10 minutes)

### Step 3: Create Service Account

1. Go to "Credentials" in left menu
2. Click "Create Credentials" → "Service Account"
3. Fill form:
   - Service account name: `athlas-verity`
   - Click "Create and Continue"
4. Skip optional steps
5. Click "Create Key" → "JSON"
6. Save JSON file to project (backup securely)

### Step 4: Get API Key

1. Select created service account
2. Go to "Keys" tab
3. Copy key ID
4. Add to `.env.local`:
```
GOOGLE_EARTH_ENGINE_API_KEY=<your-api-key>
GOOGLE_EARTH_ENGINE_PROJECT=<your-project-id>
GOOGLE_CLOUD_CREDENTIALS_PATH=./secrets/gee-credentials.json
```

### Step 5: Initialize Earth Engine

```javascript
// lib/gee-client.ts
import ee from '@google/earthengine';

export async function initializeEarthEngine() {
  const credentials = require('../secrets/gee-credentials.json');
  await ee.authenticate({
    credentials: credentials
  });
  ee.initialize();
}
```

## Gemini API Setup

### Step 1: Create Google Account

Use existing Google account or create new one

### Step 2: Get Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com)
2. Click "Get API Key"
3. Create new API key in Google Cloud Console
4. Copy key
5. Add to `.env.local`:
```
GEMINI_API_KEY=<your-api-key>
```

### Step 3: Enable Required APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable:
   - Generative Language API
   - Vision AI API (for image analysis)

## Vercel Deployment

### Step 1: Create Vercel Account

1. Visit [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Authorize Vercel

### Step 2: Connect GitHub Repository

1. Dashboard → Import Project
2. Select GitHub repository
3. Configure settings:
   - Framework: Next.js
   - Root directory: ./
   - Env variables (see below)

### Step 3: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
GOOGLE_EARTH_ENGINE_API_KEY=<value>
GOOGLE_EARTH_ENGINE_PROJECT=<value>
GEMINI_API_KEY=<value>
NEXT_PUBLIC_APP_URL=https://yourdomain.vercel.app
```

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build completion
3. Access deployed site

## Environment Variables

### Required

```env
# Google Earth Engine
GOOGLE_EARTH_ENGINE_API_KEY=
GOOGLE_EARTH_ENGINE_PROJECT=
GOOGLE_CLOUD_CREDENTIALS_PATH=./secrets/gee-credentials.json

# Gemini AI
GEMINI_API_KEY=

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Optional

```env
# Optional satellite sources
PLANETARY_API_KEY=
SENTINEL_API_KEY=

# Email notifications
RESEND_API_KEY=
CONTACT_EMAIL=support@athlas-verity.com

# Analytics
NEXT_PUBLIC_ANALYTICS_ID=
POSTHOG_API_KEY=

# Stripe (if implementing payments)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Database Setup (Optional)

### PostgreSQL/Neon

```env
DATABASE_URL=postgresql://user:password@host:5432/athlas_verity
```

Run migrations:
```bash
pnpm db:migrate
pnpm db:seed
```

### Supabase

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
```

## Docker Setup (Optional)

### Build Image

```bash
docker build -t athlas-verity:latest .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e GOOGLE_EARTH_ENGINE_API_KEY=<value> \
  -e GEMINI_API_KEY=<value> \
  athlas-verity:latest
```

### docker-compose

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      GOOGLE_EARTH_ENGINE_API_KEY: ${GOOGLE_EARTH_ENGINE_API_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      DATABASE_URL: ${DATABASE_URL}
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: athlas_verity
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```bash
docker-compose up -d
```

## Development Workflow

### Code Style

```bash
# Format code
pnpm format

# Lint
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

### Build

```bash
# Production build
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Build Errors

**"Module not found"**
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Clear cache: `pnpm store prune`

**Type errors in TypeScript**
- Regenerate types: `pnpm db:generate`
- Clear cache: `.next` folder

### API Connection Issues

**Earth Engine authentication fails**
- Verify API key has access to Earth Engine API
- Check service account permissions
- Regenerate credentials JSON

**Gemini API errors**
- Verify API key is active
- Check API quota limits
- Ensure Vision API is enabled

### Performance Issues

**Slow satellite data fetching**
- Reduce polygon complexity
- Use coarser resolution (30m, 100m)
- Select smaller date ranges
- Reduce number of indices

**Large memory usage**
- Set `NODE_OPTIONS=--max-old-space-size=2048`
- Use Web Workers for processing
- Implement lazy loading

## Production Checklist

- [ ] All environment variables set
- [ ] API keys have IP whitelisting
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Error logging configured
- [ ] Analytics enabled
- [ ] SSL certificate valid
- [ ] Database backed up
- [ ] Monitoring alerts set up
- [ ] Incident response plan ready

## Support & Resources

- Documentation: https://docs.athlas-verity.com
- API Reference: https://docs.athlas-verity.com/api
- GitHub Issues: https://github.com/aresa1801/athlas-verity/issues
- Email: support@athlas-verity.com
- Status: https://status.athlas-verity.com
