# Admin Dashboard Implementation Guide

## Overview

Implementasi admin dashboard sistem Athlas Verity mencakup tiga tingkat pengguna dengan akses berbeda:

1. **Super Admin** - Mengelola pengguna dan setting sistem
2. **Admin** - Review dan approve verifikasi submissions
3. **User** - Submit verifikasi karbon/energi

## Database Schema

### Tables

#### users
- `id` (UUID) - User ID
- `email` (TEXT) - Email address
- `name` (TEXT) - User name
- `role` (ENUM) - 'super_admin' | 'admin' | 'user'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### green_carbon_verifications
- `id` (UUID) - Verification ID
- `user_id` (UUID) - Reference to users.id
- `project_name` (TEXT)
- `project_location` (TEXT)
- `area_hectares` (NUMERIC)
- `agb_per_hectare` (NUMERIC)
- `carbon_stock_tc` (NUMERIC) - Carbon stock in tonnes carbon
- `carbon_stock_tco2` (NUMERIC) - Carbon stock in tonnes CO2
- `verification_status` (ENUM) - 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
- `satellite_data` (JSONB) - Satellite imagery data
- `geojson_data` (JSONB) - Geographic data
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

#### blue_carbon_verifications & renewable_energy_verifications
Similar structure dengan fields yang spesifik untuk tipe verifikasi

#### verification_images
- `id` (UUID)
- `verification_id` (UUID)
- `verification_type` (ENUM)
- `image_url` (TEXT) - Public URL dari Supabase Storage
- `storage_path` (TEXT) - Path di storage
- `image_type` (TEXT) - MIME type
- `uploaded_at` (TIMESTAMP)

#### admin_review_history
- `id` (UUID)
- `verification_id` (UUID)
- `verification_type` (ENUM)
- `admin_id` (UUID) - Reference to users.id
- `action` (TEXT) - 'review_started' | 'marked_pending' | 'approved' | 'rejected'
- `comments` (TEXT)
- `created_at` (TIMESTAMP)

#### verified_catalog
- `id` (UUID)
- `verification_id` (UUID)
- `verification_type` (ENUM)
- `user_id` (UUID)
- `project_name` (TEXT)
- `project_location` (TEXT)
- `carbon_credits_issued` (NUMERIC)
- `energy_generated_mwh` (NUMERIC)
- `co2_avoided_tonnes` (NUMERIC)
- `primary_image_url` (TEXT)
- `published_at` (TIMESTAMP)
- `approved_by` (UUID)
- `approved_at` (TIMESTAMP)

## File Structure

```
app/
├── admin/
│   └── page.tsx                 # Admin dashboard
├── super-admin/
│   └── page.tsx                 # Super admin dashboard
├── catalog/
│   └── page.tsx                 # Public catalog of approved projects
├── api/
│   ├── admin/
│   │   ├── submissions/route.ts # Get/update submissions
│   │   ├── users/route.ts       # Manage users
│   │   ├── stats/route.ts       # Dashboard stats
│   │   └── catalog/route.ts     # Catalog management
│   └── upload/
│       └── verification-image/route.ts  # Image uploads

lib/
├── database.types.ts            # Supabase database types
├── supabase-helpers.ts          # Database helper functions
├── admin-utils.ts               # Admin workflow utilities
├── admin-auth.ts                # Admin authentication checks
├── file-upload-utils.ts         # File upload utilities

components/
├── admin/
│   ├── super-admin/
│   │   └── users-management.tsx # User management component
│   ├── admin-dashboard/
│   │   ├── submissions-list.tsx # List of submissions
│   │   └── submission-detail.tsx # Submission review detail
└── catalog/
    └── catalog-projects-grid.tsx # Display approved projects
```

## API Routes

### Admin Submissions API
**GET /api/admin/submissions**
- Query params: `status`, `type`, `page`, `limit`
- Returns list of submissions with filtering and pagination

**PATCH /api/admin/submissions**
- Body: `submission_id`, `verification_type`, `action`, `status`, `comments`
- Actions:
  - `update_status` - Update submission status
  - `approve_and_publish` - Approve and add to catalog
  - `reject` - Reject submission

### Admin Users API
**GET /api/admin/users**
- Query params: `role`, `page`, `limit`
- Returns list of users

**PATCH /api/admin/users**
- Body: `user_id`, `action`, `role`
- Actions:
  - `update_role` - Change user role
  - `toggle_status` - Activate/deactivate user

### Admin Statistics API
**GET /api/admin/stats**
- Returns dashboard statistics

### Catalog API
**GET /api/admin/catalog**
- Query params: `type`, `limit`
- Returns approved projects for catalog

### File Upload API
**POST /api/upload/verification-image**
- FormData: `file`, `verificationId`, `verificationType`
- Uploads image to Supabase Storage

**GET /api/upload/verification-image**
- Query params: `verificationId`
- Returns all images for a verification

## Admin Workflows

### Review Workflow States

```
Submitted
    ↓
In Review (Admin starts review)
    ├─→ Pending (Need more info from user)
    │   └─→ Submitted (User provides info)
    │       └─→ In Review
    │
    ├─→ Approved (Add to catalog)
    │
    └─→ Rejected
```

### Approval Process

1. **User submits verification** → Status: `submitted`
2. **Admin starts review** → Status: `review`
3. **Admin reviews data**
   - If needs info → Status: `pending` + add comment
   - If approved → Status: `approved` + add to catalog
   - If rejected → Status: `rejected` + add reason
4. **Approved project** → Appears in `/catalog`

## Supabase Storage Buckets

### verification-images/
Subdirectories:
- `green_carbon/` - Green carbon project images
- `blue_carbon/` - Blue carbon project images
- `renewable_energy/` - Renewable energy project images

File naming: `{verification_id}/{timestamp}-{filename}`

## Key Features

### Super Admin Dashboard
- ✅ View all users
- ✅ Change user roles (super_admin, admin, user)
- ✅ System settings
- ✅ User statistics

### Admin Dashboard
- ✅ List all submissions (with filtering by status/type)
- ✅ Review submission details
- ✅ Start review process
- ✅ Mark pending (request more info)
- ✅ Approve and publish to catalog
- ✅ Reject with comments
- ✅ View review history
- ✅ Export statistics

### Catalog
- ✅ Display approved projects
- ✅ Filter by verification type
- ✅ View project details
- ✅ Responsive grid layout

### File Management
- ✅ Upload images during verification
- ✅ Display uploaded images
- ✅ Delete images
- ✅ Secure storage with access control

## Protection & Security

### Row Level Security (RLS)
- Users can only see their own submissions
- Admins can see all submissions
- Super admins can manage all users

### Role-Based Access Control
- `/admin` routes require `admin` or `super_admin` role
- `/super-admin` routes require `super_admin` role
- File uploads require authentication

## Helper Functions

### Database Helpers (lib/supabase-helpers.ts)
```typescript
// User management
userHelpers.getUser(userId)
userHelpers.updateUserRole(userId, role)
userHelpers.getAllUsers()

// Verification submissions
greenCarbonHelpers.getSubmission(id)
greenCarbonHelpers.createSubmission(data)
greenCarbonHelpers.updateStatus(id, status)

// Admin workflow
adminReviewHelpers.addReview(review)
adminReviewHelpers.getReviewHistory(verificationId)

// Catalog
catalogHelpers.addToCatalog(entry)
catalogHelpers.getAllCatalogEntries()

// Images
imageHelpers.uploadImage(image)
imageHelpers.getVerificationImages(verificationId)
```

### Admin Utilities (lib/admin-utils.ts)
```typescript
// Workflow
adminWorkflow.startReview(verificationId, type, adminId)
adminWorkflow.setPending(verificationId, type, adminId, comments)
adminWorkflow.approve(verificationId, type, adminId, catalogEntry)
adminWorkflow.reject(verificationId, type, adminId, reason)

// Analytics
adminAnalytics.getSubmissionStats()
adminAnalytics.getCatalogStats()
```

### Auth (lib/admin-auth.ts)
```typescript
// Check roles
await isAdmin(userId)
await isSuperAdmin(userId)
await getUserRole(userId)

// Server-side protection
await requireAdminAccess(userId)
await requireSuperAdminAccess(userId)
```

## File Upload

### Client-side
```typescript
import { uploadVerificationImage } from '@/lib/file-upload-utils'

const response = await uploadVerificationImage(
  file,
  verificationId,
  'green_carbon'
)
```

### Validation
- File types: JPEG, PNG, WebP, GIF
- Max file size: 10MB
- Required fields: file, verificationId, verificationType

## Next Steps

1. **Setup Authentication**
   - Integrate Supabase Auth or Auth.js
   - Add user creation on signup
   - Add role assignment

2. **User Dashboard Updates**
   - Add navigation links to admin dashboards
   - Show admin badge for admin users
   - Protect routes with auth middleware

3. **RLS Policies**
   - Create RLS policies in Supabase
   - Test access controls

4. **Email Notifications**
   - Setup email service
   - Send notifications on submission status changes

5. **Advanced Features**
   - User activity logs
   - Automated approval rules
   - Bulk operations
   - Report generation
