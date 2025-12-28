import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ldwrsrrhfanhvvjmtrjn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxkd3JzcnJoZmFuaHZ2am10cmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MjM4MjEsImV4cCI6MjA4MjM5OTgyMX0.oo-xa89yVIlb9JjxrC0G92NDaFFmdHFqU3UhdRuPrTA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});
