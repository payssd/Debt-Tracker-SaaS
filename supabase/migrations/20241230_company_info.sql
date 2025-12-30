-- =====================================================
-- ADD COMPANY INFO FIELDS TO PROFILES
-- =====================================================

-- Add company info columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_address TEXT;

-- Update existing profiles to use user email as company email if not set
UPDATE profiles p
SET company_email = p.email
WHERE company_email IS NULL AND email IS NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_company_name ON profiles(company_name);
