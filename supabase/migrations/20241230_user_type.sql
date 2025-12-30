-- =====================================================
-- ADD USER TYPE FIELD TO PROFILES
-- =====================================================

-- Add user_type column to profiles table
-- 'landlord' or 'shop_owner'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'shop_owner';

-- Add check constraint for valid user types
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_type_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_user_type_check 
  CHECK (user_type IN ('landlord', 'shop_owner'));

-- Update existing users to default to shop_owner
UPDATE profiles SET user_type = 'shop_owner' WHERE user_type IS NULL;
