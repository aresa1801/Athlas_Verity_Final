-- Cleanup existing tables and types if they exist
DROP TABLE IF EXISTS public.verified_catalog CASCADE;
DROP TABLE IF EXISTS public.admin_review_history CASCADE;
DROP TABLE IF EXISTS public.verification_images CASCADE;
DROP TABLE IF EXISTS public.renewable_energy_verifications CASCADE;
DROP TABLE IF EXISTS public.blue_carbon_verifications CASCADE;
DROP TABLE IF EXISTS public.green_carbon_verifications CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.verification_status CASCADE;
DROP TYPE IF EXISTS public.verification_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
