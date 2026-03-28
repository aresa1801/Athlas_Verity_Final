import { createClient } from '@supabase/supabase-js';
import {
  User,
  VerificationType,
  VerificationStatus,
  AdminDashboardStats,
  PaginatedResponse,
  Verification,
  VerifiedCatalogItem,
  AdminReviewHistory,
} from '@/lib/types/admin';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ USER MANAGEMENT ============

export async function getUsers(
  role?: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<User>> {
  let query = supabase.from('users').select('*', { count: 'exact' });

  if (role) {
    query = query.eq('role', role);
  }

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return {
    success: true,
    data: data || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateUserRole(
  userId: string,
  newRole: string
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleUserStatus(
  userId: string,
  isActive: boolean
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============ VERIFICATION SUBMISSION QUERIES ============

export async function getSubmissionsByStatus(
  status: VerificationStatus,
  verificationType?: VerificationType,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<any>> {
  let query = supabase.from('green_carbon_verifications').select('*', { count: 'exact' });

  // Determine which table to query based on verification type
  if (verificationType === 'blue_carbon') {
    query = supabase.from('blue_carbon_verifications').select('*', { count: 'exact' });
  } else if (verificationType === 'renewable_energy') {
    query = supabase.from('renewable_energy_verifications').select('*', { count: 'exact' });
  }

  query = query.eq('verification_status', status);

  const { data, count, error } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return {
    success: true,
    data: data || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

export async function getAllSubmissions(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<any>> {
  // Get all verifications across all types
  const [greenResults, blueResults, renewableResults] = await Promise.all([
    supabase
      .from('green_carbon_verifications')
      .select('*, user:users(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1),
    supabase
      .from('blue_carbon_verifications')
      .select('*, user:users(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1),
    supabase
      .from('renewable_energy_verifications')
      .select('*, user:users(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1),
  ]);

  const allData = [
    ...(greenResults.data || []).map(d => ({ ...d, verification_type: 'green_carbon' })),
    ...(blueResults.data || []).map(d => ({ ...d, verification_type: 'blue_carbon' })),
    ...(renewableResults.data || []).map(d => ({ ...d, verification_type: 'renewable_energy' })),
  ];

  return {
    success: true,
    data: allData,
    total: (greenResults.count || 0) + (blueResults.count || 0) + (renewableResults.count || 0),
    page,
    limit,
    total_pages: Math.ceil(
      ((greenResults.count || 0) + (blueResults.count || 0) + (renewableResults.count || 0)) /
        limit
    ),
  };
}

export async function getSubmissionById(
  submissionId: string,
  verificationType: VerificationType
): Promise<any> {
  const tableMap = {
    green_carbon: 'green_carbon_verifications',
    blue_carbon: 'blue_carbon_verifications',
    renewable_energy: 'renewable_energy_verifications',
  };

  const { data, error } = await supabase
    .from(tableMap[verificationType])
    .select('*, user:users(*), images:verification_images(*)')
    .eq('id', submissionId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

// ============ REVIEW WORKFLOW ============

export async function updateSubmissionStatus(
  submissionId: string,
  verificationType: VerificationType,
  newStatus: VerificationStatus,
  reviewerComments?: string
): Promise<void> {
  const tableMap = {
    green_carbon: 'green_carbon_verifications',
    blue_carbon: 'blue_carbon_verifications',
    renewable_energy: 'renewable_energy_verifications',
  };

  const { error } = await supabase
    .from(tableMap[verificationType])
    .update({
      verification_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) throw error;

  // Log the review action
  if (reviewerComments || newStatus !== 'review') {
    await logAdminAction(
      submissionId,
      verificationType,
      'review_status_changed',
      reviewerComments
    );
  }
}

// ============ ADMIN REVIEW HISTORY ============

export async function logAdminAction(
  verificationId: string,
  verificationType: VerificationType,
  action: string,
  comments?: string,
  adminId?: string
): Promise<AdminReviewHistory> {
  const { data, error } = await supabase
    .from('admin_review_history')
    .insert({
      verification_id: verificationId,
      verification_type: verificationType,
      admin_id: adminId,
      action,
      comments,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getReviewHistory(
  verificationId: string
): Promise<AdminReviewHistory[]> {
  const { data, error } = await supabase
    .from('admin_review_history')
    .select('*')
    .eq('verification_id', verificationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ============ CATALOG MANAGEMENT ============

export async function addToCatalog(
  verificationId: string,
  verificationType: VerificationType,
  catalogData: Partial<VerifiedCatalogItem>,
  approvedByUserId: string
): Promise<VerifiedCatalogItem> {
  const { data, error } = await supabase
    .from('verified_catalog')
    .insert({
      verification_id: verificationId,
      verification_type: verificationType,
      ...catalogData,
      approved_by: approvedByUserId,
      approved_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getApprovedCatalog(
  page = 1,
  limit = 10
): Promise<PaginatedResponse<VerifiedCatalogItem>> {
  const { data, count, error } = await supabase
    .from('verified_catalog')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return {
    success: true,
    data: data || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

export async function getCatalogByType(
  verificationType: VerificationType,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<VerifiedCatalogItem>> {
  const { data, count, error } = await supabase
    .from('verified_catalog')
    .select('*', { count: 'exact' })
    .eq('verification_type', verificationType)
    .order('published_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (error) throw error;

  return {
    success: true,
    data: data || [],
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

// ============ DASHBOARD ANALYTICS ============

export async function getDashboardStats(): Promise<AdminDashboardStats> {
  const [users, greenCount, blueCount, renewableCount, statusCounts] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact' }),
    supabase.from('green_carbon_verifications').select('*', { count: 'exact' }),
    supabase.from('blue_carbon_verifications').select('*', { count: 'exact' }),
    supabase.from('renewable_energy_verifications').select('*', { count: 'exact' }),
    getStatusCounts(),
  ]);

  return {
    total_users: users.count || 0,
    total_submissions: (greenCount.count || 0) + (blueCount.count || 0) + (renewableCount.count || 0),
    submissions_by_type: {
      green_carbon: greenCount.count || 0,
      blue_carbon: blueCount.count || 0,
      renewable_energy: renewableCount.count || 0,
    },
    submissions_by_status: statusCounts,
  };
}

async function getStatusCounts() {
  const [green, blue, renewable] = await Promise.all([
    supabase.from('green_carbon_verifications').select('status', { count: 'exact' }),
    supabase.from('blue_carbon_verifications').select('status', { count: 'exact' }),
    supabase.from('renewable_energy_verifications').select('status', { count: 'exact' }),
  ]);

  return {
    draft: 0,
    submitted: 0,
    under_review: 0,
    pending_revision: 0,
    approved: 0,
    rejected: 0,
  };
}

// ============ IMAGE MANAGEMENT ============

export async function getVerificationImages(
  verificationId: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('verification_images')
    .select('*')
    .eq('verification_id', verificationId);

  if (error) throw error;
  return data || [];
}

export async function uploadVerificationImage(
  verificationId: string,
  verificationType: VerificationType,
  imageUrl: string,
  storagePath: string,
  imageType?: string
): Promise<any> {
  const { data, error } = await supabase
    .from('verification_images')
    .insert({
      verification_id: verificationId,
      verification_type: verificationType,
      image_url: imageUrl,
      storage_path: storagePath,
      image_type: imageType,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
