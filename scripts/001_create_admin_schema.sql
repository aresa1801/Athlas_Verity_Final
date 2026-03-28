-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'super_admin');
CREATE TYPE verification_type AS ENUM ('green_carbon', 'blue_carbon', 'renewable_energy');
CREATE TYPE verification_status AS ENUM ('draft', 'submitted', 'under_review', 'pending_revision', 'approved', 'rejected');

-- Users table with roles
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  organization TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Green Carbon Verification table
CREATE TABLE IF NOT EXISTS public.green_carbon_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status verification_status DEFAULT 'draft' NOT NULL,
  
  -- Form data
  project_name TEXT NOT NULL,
  project_location TEXT NOT NULL,
  project_description TEXT,
  carbon_credits_issued DECIMAL(10, 2),
  carbon_credit_standard TEXT,
  vegetation_type TEXT,
  area_hectares DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT name_user_unique UNIQUE(user_id, project_name)
);

-- Blue Carbon Verification table
CREATE TABLE IF NOT EXISTS public.blue_carbon_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status verification_status DEFAULT 'draft' NOT NULL,
  
  -- Form data
  project_name TEXT NOT NULL,
  project_location TEXT NOT NULL,
  project_description TEXT,
  carbon_credits_issued DECIMAL(10, 2),
  carbon_credit_standard TEXT,
  ecosystem_type TEXT,
  area_hectares DECIMAL(10, 2),
  water_body_name TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT name_user_unique UNIQUE(user_id, project_name)
);

-- Renewable Energy Verification table
CREATE TABLE IF NOT EXISTS public.renewable_energy_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status verification_status DEFAULT 'draft' NOT NULL,
  
  -- Form data
  project_name TEXT NOT NULL,
  project_location TEXT NOT NULL,
  project_description TEXT,
  energy_generated_mwh DECIMAL(10, 2),
  energy_type TEXT,
  installed_capacity_mw DECIMAL(10, 2),
  co2_avoided_tonnes DECIMAL(10, 2),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT name_user_unique UNIQUE(user_id, project_name)
);

-- Verification Images table
CREATE TABLE IF NOT EXISTS public.verification_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL,
  verification_type verification_type NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  image_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Add foreign key constraints based on verification_type
  CONSTRAINT fk_green_carbon FOREIGN KEY (verification_id)
    REFERENCES public.green_carbon_verifications(id) ON DELETE CASCADE
    MATCH SIMPLE
);

-- Create indexes for verification_type to properly route foreign keys
CREATE INDEX idx_verification_images_green_carbon ON public.verification_images(verification_id)
WHERE verification_type = 'green_carbon';

CREATE INDEX idx_verification_images_blue_carbon ON public.verification_images(verification_id)
WHERE verification_type = 'blue_carbon';

CREATE INDEX idx_verification_images_renewable_energy ON public.verification_images(verification_id)
WHERE verification_type = 'renewable_energy';

-- Admin Review History table
CREATE TABLE IF NOT EXISTS public.admin_review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL,
  verification_type verification_type NOT NULL,
  admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_admin_review_green FOREIGN KEY (verification_id)
    REFERENCES public.green_carbon_verifications(id) ON DELETE CASCADE
    MATCH SIMPLE
);

CREATE INDEX idx_admin_review_history_verification ON public.admin_review_history(verification_id);
CREATE INDEX idx_admin_review_history_admin ON public.admin_review_history(admin_id);

-- Verified Catalog table (for approved projects)
CREATE TABLE IF NOT EXISTS public.verified_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL,
  verification_type verification_type NOT NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Project info
  project_name TEXT NOT NULL,
  project_location TEXT NOT NULL,
  project_description TEXT,
  
  -- Carbon/Energy metrics
  carbon_credits_issued DECIMAL(10, 2),
  energy_generated_mwh DECIMAL(10, 2),
  co2_avoided_tonnes DECIMAL(10, 2),
  
  -- Images and media
  primary_image_url TEXT,
  
  -- Metadata
  published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT fk_catalog_green FOREIGN KEY (verification_id)
    REFERENCES public.green_carbon_verifications(id) ON DELETE CASCADE
    MATCH SIMPLE
);

CREATE INDEX idx_verified_catalog_user ON public.verified_catalog(user_id);
CREATE INDEX idx_verified_catalog_type ON public.verified_catalog(verification_type);
CREATE INDEX idx_verified_catalog_published ON public.verified_catalog(published_at DESC);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_carbon_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blue_carbon_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewable_energy_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_review_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verified_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Super admins can update users" ON public.users
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );

CREATE POLICY "Super admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) = 'super_admin'
  );

-- RLS Policies for Green Carbon Verifications
CREATE POLICY "Users can view own submissions" ON public.green_carbon_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.green_carbon_verifications
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can insert own submissions" ON public.green_carbon_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.green_carbon_verifications
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'pending_revision'));

CREATE POLICY "Admins can update status" ON public.green_carbon_verifications
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- RLS Policies for Blue Carbon Verifications
CREATE POLICY "Users can view own submissions" ON public.blue_carbon_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.blue_carbon_verifications
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can insert own submissions" ON public.blue_carbon_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.blue_carbon_verifications
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'pending_revision'));

CREATE POLICY "Admins can update status" ON public.blue_carbon_verifications
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- RLS Policies for Renewable Energy Verifications
CREATE POLICY "Users can view own submissions" ON public.renewable_energy_verifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all submissions" ON public.renewable_energy_verifications
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can insert own submissions" ON public.renewable_energy_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions" ON public.renewable_energy_verifications
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('draft', 'pending_revision'));

CREATE POLICY "Admins can update status" ON public.renewable_energy_verifications
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- RLS Policies for Verification Images
CREATE POLICY "Users can view own images" ON public.verification_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.green_carbon_verifications
      WHERE id = verification_images.verification_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.blue_carbon_verifications
      WHERE id = verification_images.verification_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.renewable_energy_verifications
      WHERE id = verification_images.verification_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all images" ON public.verification_images
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Users can insert images" ON public.verification_images
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.green_carbon_verifications WHERE id = verification_id
      UNION
      SELECT user_id FROM public.blue_carbon_verifications WHERE id = verification_id
      UNION
      SELECT user_id FROM public.renewable_energy_verifications WHERE id = verification_id
    )
  );

-- RLS Policies for Admin Review History
CREATE POLICY "Users can view reviews of their submissions" ON public.admin_review_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.green_carbon_verifications
      WHERE id = admin_review_history.verification_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.blue_carbon_verifications
      WHERE id = admin_review_history.verification_id AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.renewable_energy_verifications
      WHERE id = admin_review_history.verification_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all reviews" ON public.admin_review_history
  FOR SELECT USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can insert reviews" ON public.admin_review_history
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- RLS Policies for Verified Catalog
CREATE POLICY "Anyone can view public catalog" ON public.verified_catalog
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own projects in catalog" ON public.verified_catalog
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert to catalog" ON public.verified_catalog
  FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can update catalog" ON public.verified_catalog
  FOR UPDATE USING (
    (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Create Supabase Storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('verification-images', 'verification-images', false, 5242880, '{"image/jpeg","image/png","image/webp"}'),
  ('documents', 'documents', false, 10485760, '{"application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"}'),
  ('catalog-images', 'catalog-images', true, 5242880, '{"image/jpeg","image/png","image/webp"}')
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Storage
CREATE POLICY "Users can upload verification images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'verification-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own verification images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all verification images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'verification-images'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

CREATE POLICY "Anyone can view catalog images" ON storage.objects
  FOR SELECT USING (bucket_id = 'catalog-images');

CREATE POLICY "Admins can upload catalog images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'catalog-images'
    AND (SELECT role FROM public.users WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

-- Add updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to update updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
    ON public.users FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_green_carbon_updated_at BEFORE UPDATE
    ON public.green_carbon_verifications FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blue_carbon_updated_at BEFORE UPDATE
    ON public.blue_carbon_verifications FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_renewable_energy_updated_at BEFORE UPDATE
    ON public.renewable_energy_verifications FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
