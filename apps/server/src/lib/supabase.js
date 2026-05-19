const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ CRITICAL ERROR: SUPABASE_URL is not defined in environment variables.');
}
if (!supabaseServiceRoleKey) {
  console.error('❌ CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables.');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

module.exports = supabase;

