const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../lib/supabase');

// Fresh admin client to bypass global session state
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, role = 'client', company, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, company, phone },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // Manual profile creation (backup in case trigger fails)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ 
        id: authData.user.id, 
        email, 
        full_name, 
        role, 
        company, 
        phone,
        is_active: true 
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation/update error:', profileError);
    } else {
      console.log('Profile ready:', profile);
      
      // Auto-create client record if role is client
      if (role === 'client') {
        const { error: clientError } = await supabaseAdmin.from('clients').upsert({
          user_id: authData.user.id,
          name: full_name,
          email: email,
          company: company,
          phone: phone,
        });
        if (clientError) console.error('Failed to auto-create client record:', clientError);
      }
    }

    const token = signToken({ id: authData.user.id, email, role });

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: profile || { id: authData.user.id, email, full_name, role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Authenticate with Supabase using a fresh client so we don't taint the global one
    const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Debug: fetch all profiles
    const { data: allProfiles } = await supabase.from('profiles').select('id, email');
    console.log('DEBUG - All profiles in DB:', allProfiles);
    console.log('DEBUG - Looking for ID:', authData.user.id);

    // Get profile using admin client
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Login profile fetch error:', profileError);
    }
    console.log('Login profile found:', profile);

    if (!profile) {
      return res.status(403).json({ error: 'Profile not found. Please ensure database schema is initialized.' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const token = signToken(profile);
    res.json({ token, user: profile });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', require('../middleware/auth').authenticate, async (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const { data, error } = await supabase.auth.refreshSession({ refresh_token });
    if (error) return res.status(401).json({ error: 'Invalid refresh token' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const token = signToken(profile);
    res.json({ token, user: profile });
  } catch (err) {
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.APP_URL}/auth/reset-password`,
    });
    if (error) return res.status(400).json({ error: error.message });
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

module.exports = router;
