const jwt = require('jsonwebtoken');
const supabase = require('../lib/supabase');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is active
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', decoded.id)
      .single();

    if (error || !profile) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (!profile.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = profile;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// ── Role helpers ──────────────────────────────────────────────────────────────
const isAdmin          = authorize('admin');
const isManagerOrAdmin = authorize('admin', 'manager');
const isFinanceOrAdmin = authorize('admin', 'finance');
const isTeamMember     = authorize('admin', 'manager', 'finance', 'member');

// Finance can read invoices/payments; manager can see payment status
const canViewFinance   = authorize('admin', 'manager', 'finance');
const canManageFinance = authorize('admin', 'finance');

// Payslip access: admin full, finance create/send, member own-only (handled in route)
const canViewPayslips  = authorize('admin', 'finance', 'member');

module.exports = {
  authenticate,
  authorize,
  isAdmin,
  isManagerOrAdmin,
  isFinanceOrAdmin,
  isTeamMember,
  canViewFinance,
  canManageFinance,
  canViewPayslips,
};
