-- Create users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  organization TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Create enum types for verification status
CREATE TYPE verification_status AS ENUM ('draft', 'submitted', 'under_review', 'approved', 'rejected');
CREATE TYPE verification_type AS ENUM ('green_carbon', 'blue_carbon', 'renewable_energy');

-- Green Carbon Verification Submissions
CREATE TABLE IF NOT EXISTS public.green_carbon_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  area_hectares DECIMAL(10, 2),
  baseline_emissions DECIMAL(15, 2),
  projected_reduction DECIMAL(15, 2),
  
  -- Calculation data
  carbon_stock_data JSONB,
  satellite_data JSONB,
  
  -- Status workflow
  status verification_status DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Review info
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Images and attachments
  images JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT project_name_not_empty CHECK (length(project_name) > 0)
);

-- Blue Carbon Verification Submissions
CREATE TABLE IF NOT EXISTS public.blue_carbon_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  area_hectares DECIMAL(10, 2),
  ecosystem_type TEXT,
  
  -- Blue carbon specific data
  agb_tpha DECIMAL(10, 2),
  bgb_tpha DECIMAL(10, 2),
  soc_tpha DECIMAL(10, 2),
  total_carbon_stock DECIMAL(15, 2),
  annual_sequestration_rate DECIMAL(10, 4),
  
  -- Calculation data
  carbon_pool_data JSONB,
  satellite_data JSONB,
  
  -- Status workflow
  status verification_status DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Review info
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Images and attachments
  images JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT project_name_not_empty CHECK (length(project_name) > 0)
);

-- Renewable Energy Verification Submissions
CREATE TABLE IF NOT EXISTS public.renewable_energy_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  technology_type TEXT,
  capacity_mw DECIMAL(10, 2),
  expected_annual_production DECIMAL(15, 2),
  
  -- Calculation data
  energy_data JSONB,
  emission_reduction_data JSONB,
  satellite_data JSONB,
  
  -- Status workflow
  status verification_status DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Review info
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  review_notes TEXT,
  rejection_reason TEXT,
  
  -- Images and attachments
  images JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT project_name_not_empty CHECK (length(project_name) > 0)
);

-- Catalog of approved projects (derived from approved verifications)
CREATE TABLE IF NOT EXISTS public.project_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL UNIQUE,
  verification_type verification_type NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  project_name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  
  -- Key metrics
  total_credits DECIMAL(15, 2),
  credit_type TEXT,
  
  -- Project details (denormalized from verification)
  project_data JSONB,
  
  -- Listing status
  listed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log for admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_green_carbon_user_id ON public.green_carbon_verifications(user_id);
CREATE INDEX idx_green_carbon_status ON public.green_carbon_verifications(status);
CREATE INDEX idx_green_carbon_submitted_at ON public.green_carbon_verifications(submitted_at);

CREATE INDEX idx_blue_carbon_user_id ON public.blue_carbon_verifications(user_id);
CREATE INDEX idx_blue_carbon_status ON public.blue_carbon_verifications(status);
CREATE INDEX idx_blue_carbon_submitted_at ON public.blue_carbon_verifications(submitted_at);

CREATE INDEX idx_renewable_energy_user_id ON public.renewable_energy_verifications(user_id);
CREATE INDEX idx_renewable_energy_status ON public.renewable_energy_verifications(status);
CREATE INDEX idx_renewable_energy_submitted_at ON public.renewable_energy_verifications(submitted_at);

CREATE INDEX idx_project_catalog_user_id ON public.project_catalog(user_id);
CREATE INDEX idx_project_catalog_verification_id ON public.project_catalog(verification_id);

CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_status ON public.users(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_carbon_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blue_carbon_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewable_energy_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Super admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- RLS Policies for green_carbon_verifications
CREATE POLICY "Users can view their own verifications" ON public.green_carbon_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all verifications" ON public.green_carbon_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own verifications" ON public.green_carbon_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verifications" ON public.green_carbon_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar RLS Policies for blue_carbon_verifications
CREATE POLICY "Users can view their own blue carbon verifications" ON public.blue_carbon_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all blue carbon verifications" ON public.blue_carbon_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own blue carbon verifications" ON public.blue_carbon_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blue carbon verifications" ON public.blue_carbon_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Similar RLS Policies for renewable_energy_verifications
CREATE POLICY "Users can view their own renewable energy verifications" ON public.renewable_energy_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all renewable energy verifications" ON public.renewable_energy_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own renewable energy verifications" ON public.renewable_energy_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own renewable energy verifications" ON public.renewable_energy_verifications
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for project_catalog
CREATE POLICY "Everyone can view approved projects" ON public.project_catalog
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can view their own catalog entries" ON public.project_catalog
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage catalog entries" ON public.project_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for admin_audit_log
CREATE POLICY "Only admins can view audit logs" ON public.admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Only admins can insert audit logs" ON public.admin_audit_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
