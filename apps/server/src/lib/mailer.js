const nodemailer = require('nodemailer');

/**
 * Build transporter — reuses env vars already defined in .env
 */
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Whether SMTP is configured (non-placeholder values in env)
 */
function isSmtpConfigured() {
  return (
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    !process.env.SMTP_USER.includes('your_gmail')
  );
}

/**
 * Send welcome / onboarding email to a new employee
 */
async function sendWelcomeEmail(to, { name, employeeId, email, password, role, department, appUrl }) {
  if (!isSmtpConfigured()) {
    console.warn('[Mailer] SMTP not configured — skipping welcome email to', to);
    return { skipped: true, reason: 'SMTP not configured' };
  }

  const transport = createTransport();
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
  const deptLabel = department ? ` · ${department}` : '';
  const loginUrl  = `${appUrl || process.env.APP_URL || 'http://localhost:3000'}/auth/login`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body { margin:0; padding:0; background:#050814; font-family:'Segoe UI',Arial,sans-serif; }
  .wrapper { max-width:560px; margin:32px auto; }
  .header { background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#06b6d4 100%); border-radius:16px 16px 0 0; padding:36px 40px 28px; text-align:center; }
  .header h1 { margin:0; color:#fff; font-size:26px; font-weight:900; letter-spacing:-0.5px; }
  .header p { margin:6px 0 0; color:rgba(255,255,255,0.75); font-size:14px; }
  .body { background:#0a0e25; border-radius:0 0 16px 16px; border:1px solid rgba(99,102,241,0.15); border-top:0; padding:36px 40px; }
  .badge { display:inline-block; background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.3); border-radius:99px; font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; padding:4px 12px; margin-bottom:20px; }
  .greeting { color:#e2e8f0; font-size:18px; font-weight:700; margin:0 0 8px; }
  .sub { color:#64748b; font-size:14px; margin:0 0 28px; }
  .cred-box { background:#0f1331; border:1px solid rgba(99,102,241,0.2); border-radius:12px; padding:24px; margin-bottom:24px; }
  .cred-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .cred-row:last-child { border-bottom:0; padding-bottom:0; }
  .cred-label { color:#64748b; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.06em; }
  .cred-value { color:#e2e8f0; font-size:14px; font-weight:700; font-family:'Courier New',monospace; }
  .emp-id { color:#818cf8; }
  .btn { display:block; text-align:center; background:linear-gradient(135deg,#6366f1,#8b5cf6); color:#fff; font-weight:800; font-size:15px; text-decoration:none; border-radius:12px; padding:14px 32px; margin:28px 0 0; }
  .footer { color:#334155; font-size:12px; text-align:center; margin-top:24px; }
  .warning { background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:10px; padding:12px 16px; margin-top:20px; color:#fbbf24; font-size:12px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>Welcome to Billora.ai ✨</h1>
    <p>Your workspace account is ready</p>
  </div>
  <div class="body">
    <div class="badge">${roleLabel}${deptLabel}</div>
    <p class="greeting">Hi ${name},</p>
    <p class="sub">Your account has been created. Use the credentials below to sign in to your dashboard.</p>

    <div class="cred-box">
      <div class="cred-row">
        <span class="cred-label">Employee ID</span>
        <span class="cred-value emp-id">${employeeId}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Email</span>
        <span class="cred-value">${email}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Password</span>
        <span class="cred-value">${password}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Role</span>
        <span class="cred-value">${roleLabel}</span>
      </div>
      ${department ? `<div class="cred-row">
        <span class="cred-label">Department</span>
        <span class="cred-value">${department}</span>
      </div>` : ''}
    </div>

    <a class="btn" href="${loginUrl}">Login to your Dashboard →</a>

    <div class="warning">
      ⚠️ Please change your password after your first login for security.
    </div>
  </div>
  <div class="footer">
    This email was sent by Billora.ai · Do not reply to this email.
  </div>
</div>
</body>
</html>
  `.trim();

  const info = await transport.sendMail({
    from: `"Billora.ai" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject: `Welcome to Billora.ai — Your credentials (${employeeId})`,
    html,
  });

  console.log('[Mailer] Welcome email sent to', to, '— messageId:', info.messageId);
  return { sent: true, messageId: info.messageId };
}

/**
 * Send email when payslip is approved or paid
 */
async function sendPayslipEmail(to, { name, month, year, netSalary, status, appUrl }) {
  if (!isSmtpConfigured()) {
    console.warn('[Mailer] SMTP not configured — skipping payslip email to', to);
    return { skipped: true, reason: 'SMTP not configured' };
  }

  const transport = createTransport();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthName = monthNames[month - 1];
  
  let subject = '';
  let title = '';
  let message = '';
  
  if (status === 'approved') {
    subject = `Your payslip for ${monthName} ${year} has been approved`;
    title = 'Payslip Approved';
    message = `Your payslip for ${monthName} ${year} has been successfully reviewed and approved by Finance. The net salary is ₹${netSalary}.`;
  } else if (status === 'paid') {
    subject = `Payment Processed: Payslip for ${monthName} ${year}`;
    title = 'Salary Processed';
    message = `Good news! Your salary for ${monthName} ${year} (₹${netSalary}) has been processed and paid.`;
  }

  const loginUrl = `${appUrl || process.env.APP_URL || 'http://localhost:3000'}/dashboard/payslips`;

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: sans-serif; background: #f4f4f5; padding: 20px; }
  .box { background: white; padding: 30px; border-radius: 8px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  h2 { color: #4f46e5; margin-top: 0; }
  .btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
</style>
</head>
<body>
<div class="box">
  <h2>${title}</h2>
  <p>Hi ${name},</p>
  <p>${message}</p>
  <p>You can view and download your full payslip from the dashboard.</p>
  <a class="btn" href="${loginUrl}">View Payslip</a>
</div>
</body>
</html>
  `.trim();

  const info = await transport.sendMail({
    from: `"Billora HR" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  console.log('[Mailer] Payslip email sent to', to, '— messageId:', info.messageId);
  return { sent: true, messageId: info.messageId };
}

module.exports = { sendWelcomeEmail, sendPayslipEmail, isSmtpConfigured };
