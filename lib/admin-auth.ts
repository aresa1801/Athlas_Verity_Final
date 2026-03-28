import { createClient } from '@supabase/supabase-js'
import { UserRole } from '@/lib/types/admin'

/**
 * Check if user has admin or super_admin role
 */
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return false
    return data.role === 'admin' || data.role === 'super_admin'
  } catch {
    return false
  }
}

/**
 * Check if user has super_admin role
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return false
    return data.role === 'super_admin'
  } catch {
    return false
  }
}

/**
 * Get user role
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    return data.role as UserRole
  } catch {
    return null
  }
}

/**
 * Server-side function to check admin access
 * Use in API routes and server actions
 */
export async function requireAdminAccess(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  return isAdmin(userId)
}

/**
 * Server-side function to check super admin access
 * Use in API routes and server actions
 */
export async function requireSuperAdminAccess(userId: string | undefined): Promise<boolean> {
  if (!userId) return false
  return isSuperAdmin(userId)
}
