// Auto-generated types from Supabase database schema
// Run `npx supabase gen types typescript --linked > lib/database.types.ts` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'super_admin' | 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'super_admin' | 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'super_admin' | 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      green_carbon_verifications: {
        Row: {
          id: string
          user_id: string
          project_name: string
          project_location: string
          project_description: string | null
          area_hectares: number
          agb_per_hectare: number
          carbon_stock_tc: number
          carbon_stock_tco2: number
          co2_baseline_tco2: number
          co2_gross_reduction_tco2: number
          co2_net_reduction_tco2: number
          carbon_loss_percent: number
          verification_status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data: Json | null
          geojson_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_name: string
          project_location: string
          project_description?: string | null
          area_hectares: number
          agb_per_hectare: number
          carbon_stock_tc: number
          carbon_stock_tco2: number
          co2_baseline_tco2: number
          co2_gross_reduction_tco2: number
          co2_net_reduction_tco2: number
          carbon_loss_percent: number
          verification_status?: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data?: Json | null
          geojson_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_name?: string
          project_location?: string
          project_description?: string | null
          area_hectares?: number
          agb_per_hectare?: number
          carbon_stock_tc?: number
          carbon_stock_tco2?: number
          co2_baseline_tco2?: number
          co2_gross_reduction_tco2?: number
          co2_net_reduction_tco2?: number
          carbon_loss_percent?: number
          verification_status?: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data?: Json | null
          geojson_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      blue_carbon_verifications: {
        Row: {
          id: string
          user_id: string
          project_name: string
          project_location: string
          project_description: string | null
          area_hectares: number
          blue_carbon_stock_tc: number
          blue_carbon_stock_tco2: number
          co2_sequestration_annual_tco2: number
          co2_baseline_tco2: number
          co2_net_reduction_tco2: number
          verification_status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data: Json | null
          geojson_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_name: string
          project_location: string
          project_description?: string | null
          area_hectares: number
          blue_carbon_stock_tc: number
          blue_carbon_stock_tco2: number
          co2_sequestration_annual_tco2: number
          co2_baseline_tco2: number
          co2_net_reduction_tco2: number
          verification_status?: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data?: Json | null
          geojson_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_name?: string
          project_location?: string
          project_description?: string | null
          area_hectares?: number
          blue_carbon_stock_tc?: number
          blue_carbon_stock_tco2?: number
          co2_sequestration_annual_tco2?: number
          co2_baseline_tco2?: number
          co2_net_reduction_tco2?: number
          verification_status?: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data?: Json | null
          geojson_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      renewable_energy_verifications: {
        Row: {
          id: string
          user_id: string
          project_name: string
          project_location: string
          project_description: string | null
          energy_capacity_mw: number
          energy_generated_mwh: number
          co2_offset_annual_tco2: number
          co2_baseline_tco2: number
          co2_net_reduction_tco2: number
          verification_status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data: Json | null
          geojson_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_name: string
          project_location: string
          project_description?: string | null
          energy_capacity_mw: number
          energy_generated_mwh: number
          co2_offset_annual_tco2: number
          co2_baseline_tco2: number
          co2_net_reduction_tco2: number
          verification_status?: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data?: Json | null
          geojson_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_name?: string
          project_location?: string
          project_description?: string | null
          energy_capacity_mw?: number
          energy_generated_mwh?: number
          co2_offset_annual_tco2?: number
          co2_baseline_tco2?: number
          co2_net_reduction_tco2?: number
          verification_status?: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
          satellite_data?: Json | null
          geojson_data?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      verification_images: {
        Row: {
          id: string
          verification_id: string
          verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          image_url: string
          storage_path: string
          image_type: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          image_url: string
          storage_path: string
          image_type?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          verification_type?: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          image_url?: string
          storage_path?: string
          image_type?: string | null
          uploaded_at?: string
        }
      }
      admin_review_history: {
        Row: {
          id: string
          verification_id: string
          verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          admin_id: string | null
          action: string
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          verification_id: string
          verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          admin_id?: string | null
          action: string
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          verification_id?: string
          verification_type?: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          admin_id?: string | null
          action?: string
          comments?: string | null
          created_at?: string
        }
      }
      verified_catalog: {
        Row: {
          id: string
          verification_id: string
          verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          user_id: string
          project_name: string
          project_location: string
          project_description: string | null
          carbon_credits_issued: number | null
          energy_generated_mwh: number | null
          co2_avoided_tonnes: number | null
          primary_image_url: string | null
          published_at: string
          approved_by: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          verification_id: string
          verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          user_id: string
          project_name: string
          project_location: string
          project_description?: string | null
          carbon_credits_issued?: number | null
          energy_generated_mwh?: number | null
          co2_avoided_tonnes?: number | null
          primary_image_url?: string | null
          published_at?: string
          approved_by?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          verification_id?: string
          verification_type?: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
          user_id?: string
          project_name?: string
          project_location?: string
          project_description?: string | null
          carbon_credits_issued?: number | null
          energy_generated_mwh?: number | null
          co2_avoided_tonnes?: number | null
          primary_image_url?: string | null
          published_at?: string
          approved_by?: string | null
          approved_at?: string | null
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      user_role: 'super_admin' | 'admin' | 'user'
      verification_status: 'submitted' | 'review' | 'pending' | 'approved' | 'rejected'
      verification_type: 'green_carbon' | 'blue_carbon' | 'renewable_energy'
    }
  }
}
