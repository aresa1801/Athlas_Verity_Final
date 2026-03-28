-- Cleanup existing tables and types if they exist
-- Drop tables in order of dependency
DROP TABLE IF EXISTS public.verified_catalog CASCADE;
DROP TABLE IF EXISTS public.admin_review_history CASCADE;
DROP TABLE IF EXISTS public.verification_images CASCADE;
DROP TABLE IF EXISTS public.renewable_energy_verifications CASCADE;
DROP TABLE IF EXISTS public.blue_carbon_verifications CASCADE;
DROP TABLE IF EXISTS public.green_carbon_verifications CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop types
DROP TYPE IF EXISTS public.verification_status CASCADE;
DROP TYPE IF EXISTS public.verification_type CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop any indexes that might be lingering
DROP INDEX IF EXISTS public.idx_verification_images_green_carbon CASCADE;
DROP INDEX IF EXISTS public.idx_verification_images_blue_carbon CASCADE;
DROP INDEX IF EXISTS public.idx_verification_images_renewable_energy CASCADE;
DROP INDEX IF EXISTS public.idx_admin_review_history_verification CASCADE;
DROP INDEX IF EXISTS public.idx_admin_review_history_admin CASCADE;
DROP INDEX IF EXISTS public.idx_green_carbon_user CASCADE;
DROP INDEX IF EXISTS public.idx_blue_carbon_user CASCADE;
DROP INDEX IF EXISTS public.idx_renewable_energy_user CASCADE;
