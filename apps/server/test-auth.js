require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function test() {
  console.log("URL:", process.env.SUPABASE_URL);
  console.log("KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) + "...");
  
  console.log("Trying to create user...");
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'test_admin_script2@demo.com',
    password: 'Password123!',
    email_confirm: false,
  });

  if (error) {
    console.error("Error creating user:", error);
  } else {
    console.log("Success! User:", data.user.id);
  }
}

test();
