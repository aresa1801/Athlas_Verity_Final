import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

// Create Supabase client
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}

// User management helpers
export const userHelpers = {
  async getUser(userId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserByEmail(email: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    
    if (error) throw error
    return data
  },

  async createUser(user: Database['public']['Tables']['users']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUser(userId: string, updates: Database['public']['Tables']['users']['Update']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateUserRole(userId: string, role: 'super_admin' | 'admin' | 'user') {
    return userHelpers.updateUser(userId, { role })
  },

  async getAllUsers() {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Green Carbon Verification helpers
export const greenCarbonHelpers = {
  async getSubmission(id: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('green_carbon_verifications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserSubmissions(userId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('green_carbon_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createSubmission(submission: Database['public']['Tables']['green_carbon_verifications']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('green_carbon_verifications')
      .insert([submission])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateSubmission(id: string, updates: Database['public']['Tables']['green_carbon_verifications']['Update']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('green_carbon_verifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected') {
    return greenCarbonHelpers.updateSubmission(id, { verification_status: status })
  }
}

// Blue Carbon Verification helpers
export const blueCarbonHelpers = {
  async getSubmission(id: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('blue_carbon_verifications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserSubmissions(userId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('blue_carbon_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createSubmission(submission: Database['public']['Tables']['blue_carbon_verifications']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('blue_carbon_verifications')
      .insert([submission])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateSubmission(id: string, updates: Database['public']['Tables']['blue_carbon_verifications']['Update']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('blue_carbon_verifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected') {
    return blueCarbonHelpers.updateSubmission(id, { verification_status: status })
  }
}

// Renewable Energy Verification helpers
export const renewableEnergyHelpers = {
  async getSubmission(id: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('renewable_energy_verifications')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getUserSubmissions(userId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('renewable_energy_verifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async createSubmission(submission: Database['public']['Tables']['renewable_energy_verifications']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('renewable_energy_verifications')
      .insert([submission])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateSubmission(id: string, updates: Database['public']['Tables']['renewable_energy_verifications']['Update']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('renewable_energy_verifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateStatus(id: string, status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected') {
    return renewableEnergyHelpers.updateSubmission(id, { verification_status: status })
  }
}

// Admin Review helpers
export const adminReviewHelpers = {
  async addReview(review: Database['public']['Tables']['admin_review_history']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('admin_review_history')
      .insert([review])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getReviewHistory(verificationId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('admin_review_history')
      .select('*')
      .eq('verification_id', verificationId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getAdminReviews(adminId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('admin_review_history')
      .select('*')
      .eq('admin_id', adminId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Verified Catalog helpers
export const catalogHelpers = {
  async addToCatalog(entry: Database['public']['Tables']['verified_catalog']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verified_catalog')
      .insert([entry])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getCatalogEntry(id: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verified_catalog')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  async getVerificationInCatalog(verificationId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verified_catalog')
      .select('*')
      .eq('verification_id', verificationId)
      .single()
    
    if (error) throw error
    return data
  },

  async getAllCatalogEntries() {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verified_catalog')
      .select('*')
      .order('published_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async getCatalogByType(verificationType: 'green_carbon' | 'blue_carbon' | 'renewable_energy') {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verified_catalog')
      .select('*')
      .eq('verification_type', verificationType)
      .order('published_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async updateCatalogEntry(id: string, updates: Database['public']['Tables']['verified_catalog']['Update']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verified_catalog')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// Verification Images helpers
export const imageHelpers = {
  async uploadImage(image: Database['public']['Tables']['verification_images']['Insert']) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verification_images')
      .insert([image])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getVerificationImages(verificationId: string) {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('verification_images')
      .select('*')
      .eq('verification_id', verificationId)
      .order('uploaded_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async deleteImage(imageId: string) {
    const supabase = createSupabaseClient()
    const { error } = await supabase
      .from('verification_images')
      .delete()
      .eq('id', imageId)
    
    if (error) throw error
  }
}

// Generic submission query helpers for admin dashboard
export const submissionHelpers = {
  async getAllSubmissions() {
    const supabase = createSupabaseClient()
    
    // Get all submissions from all three verification types
    const [greenCarbon, blueCarbon, renewableEnergy] = await Promise.all([
      supabase.from('green_carbon_verifications').select('*').order('created_at', { ascending: false }),
      supabase.from('blue_carbon_verifications').select('*').order('created_at', { ascending: false }),
      supabase.from('renewable_energy_verifications').select('*').order('created_at', { ascending: false })
    ])

    const submissions = [
      ...(greenCarbon.data?.map(s => ({ ...s, type: 'green_carbon' })) || []),
      ...(blueCarbon.data?.map(s => ({ ...s, type: 'blue_carbon' })) || []),
      ...(renewableEnergy.data?.map(s => ({ ...s, type: 'renewable_energy' })) || [])
    ]

    return submissions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  async getSubmissionsByStatus(status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected') {
    const supabase = createSupabaseClient()
    
    const [greenCarbon, blueCarbon, renewableEnergy] = await Promise.all([
      supabase.from('green_carbon_verifications').select('*').eq('verification_status', status),
      supabase.from('blue_carbon_verifications').select('*').eq('verification_status', status),
      supabase.from('renewable_energy_verifications').select('*').eq('verification_status', status)
    ])

    return [
      ...(greenCarbon.data?.map(s => ({ ...s, type: 'green_carbon' })) || []),
      ...(blueCarbon.data?.map(s => ({ ...s, type: 'blue_carbon' })) || []),
      ...(renewableEnergy.data?.map(s => ({ ...s, type: 'renewable_energy' })) || [])
    ]
  }
}
