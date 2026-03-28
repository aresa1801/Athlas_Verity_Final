# Admin System Setup Guide

## Overview

The admin system provides three levels of access control:
- **User**: Standard user who can submit verifications
- **Admin**: Can review submissions, approve/reject, and publish to catalog
- **Super Admin**: Can manage users, assign roles, and configure system settings

## Database Schema

The system uses these core tables:

### users
Stores user information with role-based access:
- `id` (UUID): Primary key, references auth.users
- `email` (TEXT): User email
- `full_name` (TEXT): User's full name
- `organization` (TEXT): Organization name
- `role` (user_role): 'user', 'admin', or 'super_admin'
- `is_active` (BOOLEAN): Account status
- `created_at`, `updated_at`, `last_login` (TIMESTAMP)

### Verification Tables
Three separate tables for different verification types:

#### green_carbon_verifications
- `id`, `user_id`, `status`
- Project details: `project_name`, `project_location`, `project_description`
- Carbon data: `carbon_credits_issued`, `carbon_credit_standard`, `vegetation_type`, `area_hectares`
- Timestamps: `created_at`, `updated_at`, `submitted_at`

#### blue_carbon_verifications
- Similar structure to green carbon
- Additional fields: `ecosystem_type`, `water_body_name`

#### renewable_energy_verifications
- Similar structure to green carbon
- Additional fields: `energy_type`, `installed_capacity_mw`, `energy_generated_mwh`, `co2_avoided_tonnes`

### verification_images
Stores images uploaded with verifications:
- `id` (UUID): Primary key
- `verification_id` (UUID): Foreign key to verification
- `verification_type` (enum): Type of verification
- `image_url` (TEXT): URL to uploaded image
- `storage_path` (TEXT): Path in Supabase Storage
- `image_type` (TEXT): Type of image
- `uploaded_at` (TIMESTAMP)

### admin_review_history
Tracks all admin actions on submissions:
- `id` (UUID): Primary key
- `verification_id` (UUID): Verification being reviewed
- `verification_type` (enum): Type of verification
- `admin_id` (UUID): Admin who took action
- `action` (TEXT): Action taken (review, approve, reject, etc.)
- `comments` (TEXT): Admin comments
- `created_at` (TIMESTAMP)

### verified_catalog
Stores approved projects for public display:
- `id` (UUID): Primary key
- `verification_id` (UUID): Original submission ID
- `verification_type` (enum): Type of verification
- `user_id` (UUID): Project owner
- Project info: `project_name`, `project_location`, `project_description`
- Metrics: `carbon_credits_issued`, `energy_generated_mwh`, `co2_avoided_tonnes`
- Images: `primary_image_url`
- Approval: `approved_by`, `approved_at`
- `published_at` (TIMESTAMP)

## API Endpoints

### User Management (`/api/admin/users`)

**GET**: List users
- Query params: `role` (optional), `page`, `limit`
- Response: `PaginatedResponse<User>`

**PATCH**: Update user
- Body:
  ```json
  {
    "user_id": "uuid",
    "action": "update_role" | "toggle_status",
    "role": "user" | "admin" | "super_admin" (for update_role),
    "is_active": boolean (for toggle_status)
  }
  ```

### Submissions (`/api/admin/submissions`)

**GET**: List submissions
- Query params: `status` (optional), `type` (optional), `page`, `limit`, `id` (for specific submission)
- Response: `PaginatedResponse<Verification>` or single `Verification`

**PATCH**: Update submission status
- Body:
  ```json
  {
    "submission_id": "uuid",
    "verification_type": "green_carbon" | "blue_carbon" | "renewable_energy",
    "action": "update_status" | "approve_and_publish" | "reject",
    "status": "under_review" | "pending_revision" | "approved" | "rejected",
    "comments": "optional review comments",
    "admin_id": "current user id (for approve_and_publish)",
    "catalog_data": { "primary_image_url": "url" } (for approve_and_publish)
  }
  ```

### Dashboard Stats (`/api/admin/stats`)

**GET**: Get dashboard statistics
- Response: `AdminDashboardStats`
  ```json
  {
    "total_users": number,
    "total_submissions": number,
    "submissions_by_type": {
      "green_carbon": number,
      "blue_carbon": number,
      "renewable_energy": number
    },
    "submissions_by_status": {
      "draft": number,
      "submitted": number,
      "under_review": number,
      "pending_revision": number,
      "approved": number,
      "rejected": number
    }
  }
  ```

### Catalog (`/api/admin/catalog`)

**GET**: Get approved projects
- Query params: `type` (optional), `page`, `limit`
- Response: `PaginatedResponse<VerifiedCatalogItem>`

## Dashboard Routes

### Super Admin Dashboard
**Route**: `/super-admin`

Features:
- User Management: View, filter, and manage user roles
- System Stats: View system-wide metrics and health
- Settings: Configure system-wide verification and security settings

### Admin Dashboard
**Route**: `/admin`

Features:
- Submissions List: View all submissions with filtering by status and type
- Submission Detail: Review detailed submission information
- Review Workflow: Update status, add comments, approve, reject, or request revisions
- Auto-Publish: Approved submissions automatically get added to verified_catalog
- Dashboard Stats: View submissions and approval statistics

### Catalog Page
**Route**: `/catalog`

Features:
- Display all approved projects from verified_catalog
- Filter by verification type
- Paginated grid view with project details
- Search and explore verified projects

## File Storage

Verifications can include images stored in Supabase Storage with organized buckets:

```
verification-images/
  ├── green_carbon/
  │   ├── {verification_id}/
  │   │   └── {image_uuid}.(jpg|png)
  ├── blue_carbon/
  │   ├── {verification_id}/
  │   │   └── {image_uuid}.(jpg|png)
  └── renewable_energy/
      ├── {verification_id}/
          └── {image_uuid}.(jpg|png)
```

## Row Level Security (RLS)

The system uses Supabase RLS policies to ensure:
- Users can only view/modify their own submissions
- Admins can view all submissions
- Super admins have full system access
- Review history and catalog are read-only for non-admins

## Review Workflow

1. **User submits verification** → Status: `submitted`
2. **Admin reviews submission** → Status: `under_review`
3. Admin can:
   - **Request revision** → Status: `pending_revision` (user must resubmit)
   - **Reject submission** → Status: `rejected` (final)
   - **Approve and publish** → Status: `approved` (added to catalog)
4. **Approved projects appear in /catalog** for public viewing

## Integration with Authentication

The admin system integrates with Supabase Auth:

1. Users sign up through Supabase Auth
2. First login creates a user record with `role: 'user'`
3. Super Admin assigns roles via User Management dashboard
4. Role-based access control enforced via:
   - Middleware on protected routes
   - RLS policies on database tables
   - Frontend components check user role

## Helper Functions

All helper functions are in `lib/supabase/admin-helpers.ts`:

- `getUsers()` - List users
- `getUserById()` - Get specific user
- `updateUserRole()` - Change user role
- `toggleUserStatus()` - Activate/deactivate user
- `getSubmissionsByStatus()` - Filter submissions by status
- `getAllSubmissions()` - Get all submissions
- `getSubmissionById()` - Get detailed submission
- `updateSubmissionStatus()` - Change submission status
- `logAdminAction()` - Log admin action
- `getReviewHistory()` - Get review history for submission
- `addToCatalog()` - Publish approved submission to catalog
- `getApprovedCatalog()` - Get all approved projects
- `getCatalogByType()` - Filter catalog by type
- `getDashboardStats()` - Get system statistics

## TypeScript Types

All types defined in `lib/types/admin.ts`:

- `UserRole` - 'user' | 'admin' | 'super_admin'
- `VerificationType` - 'green_carbon' | 'blue_carbon' | 'renewable_energy'
- `VerificationStatus` - 'draft' | 'submitted' | 'under_review' | 'pending_revision' | 'approved' | 'rejected'
- `User` - User information
- `Verification` types - Green, Blue, Renewable verification data
- `VerifiedCatalogItem` - Approved project data
- `AdminReviewHistory` - Review action record
- `PaginatedResponse<T>` - Paginated API responses
- `AdminDashboardStats` - System statistics

## Next Steps

1. **Setup Authentication**: Integrate Supabase Auth with login/signup
2. **Create Initial Admin User**: Use Supabase dashboard to set first super_admin role
3. **Setup Storage Buckets**: Create Supabase Storage buckets for verification images
4. **Configure RLS Policies**: Ensure all RLS policies are properly enabled
5. **Add Error Handling**: Implement comprehensive error handling in components
6. **Add Notifications**: Implement email/in-app notifications for admin actions
7. **Add Audit Trail**: Extend admin_review_history with more detailed tracking
8. **Performance Optimization**: Add caching and indexing as needed
