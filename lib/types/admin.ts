// Admin and Verification Types

export type UserRole = 'user' | 'admin' | 'super_admin';
export type VerificationType = 'green_carbon' | 'blue_carbon' | 'renewable_energy';
export type VerificationStatus = 'draft' | 'submitted' | 'under_review' | 'pending_revision' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  organization: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
}

export interface GreenCarbonVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  project_name: string;
  project_location: string;
  project_description: string | null;
  carbon_credits_issued: number | null;
  carbon_credit_standard: string | null;
  vegetation_type: string | null;
  area_hectares: number | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface BlueCarbonVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  project_name: string;
  project_location: string;
  project_description: string | null;
  carbon_credits_issued: number | null;
  carbon_credit_standard: string | null;
  ecosystem_type: string | null;
  area_hectares: number | null;
  water_body_name: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface RenewableEnergyVerification {
  id: string;
  user_id: string;
  status: VerificationStatus;
  project_name: string;
  project_location: string;
  project_description: string | null;
  energy_generated_mwh: number | null;
  energy_type: string | null;
  installed_capacity_mw: number | null;
  co2_avoided_tonnes: number | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export type Verification = GreenCarbonVerification | BlueCarbonVerification | RenewableEnergyVerification;

export interface VerificationImage {
  id: string;
  verification_id: string;
  verification_type: VerificationType;
  image_url: string;
  storage_path: string;
  image_type: string | null;
  uploaded_at: string;
}

export interface AdminReviewHistory {
  id: string;
  verification_id: string;
  verification_type: VerificationType;
  admin_id: string;
  action: string;
  comments: string | null;
  created_at: string;
}

export interface VerifiedCatalogItem {
  id: string;
  verification_id: string;
  verification_type: VerificationType;
  user_id: string;
  project_name: string;
  project_location: string;
  project_description: string | null;
  carbon_credits_issued: number | null;
  energy_generated_mwh: number | null;
  co2_avoided_tonnes: number | null;
  primary_image_url: string | null;
  published_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Admin Dashboard Types
export interface SubmissionStats {
  total_submissions: number;
  pending_review: number;
  pending_revision: number;
  approved: number;
  rejected: number;
}

export interface AdminDashboardStats {
  total_users: number;
  total_submissions: number;
  submissions_by_type: {
    green_carbon: number;
    blue_carbon: number;
    renewable_energy: number;
  };
  submissions_by_status: {
    draft: number;
    submitted: number;
    under_review: number;
    pending_revision: number;
    approved: number;
    rejected: number;
  };
}
