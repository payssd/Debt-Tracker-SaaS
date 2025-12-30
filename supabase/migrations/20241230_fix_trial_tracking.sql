-- =====================================================
-- FIX TRIAL TRACKING - Set trial_start automatically
-- =====================================================

-- Create trigger function to set trial_start on insert
CREATE OR REPLACE FUNCTION set_trial_start_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set trial_start if it's NULL and status is 'trialing'
  IF NEW.trial_start IS NULL AND NEW.status = 'trialing' THEN
    NEW.trial_start := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_subscriptions
DROP TRIGGER IF EXISTS trigger_set_trial_start ON user_subscriptions;
CREATE TRIGGER trigger_set_trial_start
  BEFORE INSERT ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION set_trial_start_on_insert();

-- Update existing records that don't have trial_start but are trialing
UPDATE user_subscriptions
SET trial_start = created_at
WHERE trial_start IS NULL 
  AND status = 'trialing'
  AND created_at IS NOT NULL;

-- For users without subscription records, create them based on auth.users created_at
INSERT INTO user_subscriptions (user_id, status, trial_start, trial_end)
SELECT 
  u.id,
  'trialing' as status,
  u.created_at as trial_start,
  (u.created_at + INTERVAL '7 days') as trial_end
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_subscriptions us WHERE us.user_id = u.id
)
AND u.created_at >= NOW() - INTERVAL '30 days'; -- Only for recent users

-- Update trial_end for existing trialing users if NULL
UPDATE user_subscriptions
SET trial_end = trial_start + INTERVAL '7 days'
WHERE trial_end IS NULL 
  AND trial_start IS NOT NULL
  AND status = 'trialing';
