require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing SMTP Configuration...');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('From:', process.env.EMAIL_FROM);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Optional debug flag to show detailed SMTP logs
    debug: true,
    logger: true
  });

  try {
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Billora Test" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to yourself
      subject: "Test Email from Billora",
      text: "If you are reading this, your SMTP configuration is correct!",
    });

    console.log('✅ Test email sent! Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ SMTP Error:', error);
  }
}

testEmail();
