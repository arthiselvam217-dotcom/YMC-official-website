const nodemailer = require('nodemailer');

/**
 * Checks whether valid SMTP credentials have been configured in environment variables.
 */
const isSmtpConfigured = () => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) return false;
  if (user === 'your_email@gmail.com' || pass === 'your_email_app_password') return false;
  return true;
};

/**
 * Create Nodemailer transporter if configured
 */
let transporter = null;

if (isSmtpConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

/**
 * Standard YMC Branded Email Wrapper
 */
const formatYmcEmail = ({ title, bodyHtml, actionButton }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; color: #333; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e1e8ed; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #1e3a8a; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 30px; line-height: 1.6; font-size: 15px; }
          .btn { display: inline-block; background: #1e3a8a; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
          .footer { background: #f8fafc; padding: 16px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>YMC GCT</h1>
            <p style="margin: 4px 0 0; font-size: 13px; opacity: 0.9;">Youth Media Club</p>
          </div>
          <div class="content">
            <h2 style="color: #1e3a8a; font-size: 18px; margin-top: 0;">${title}</h2>
            ${bodyHtml}
            ${actionButton ? `<div style="text-align: center;"><a href="${actionButton.url}" class="btn">${actionButton.text}</a></div>` : ''}
          </div>
          <div class="footer">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} YMC GCT. All rights reserved.</p>
            <p style="margin: 4px 0 0;">Government College of Technology, Coimbatore</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

/**
 * Universal email dispatcher
 * Safe architecture: Does not attempt real transmission if SMTP credentials are not configured.
 */
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  if (!isSmtpConfigured()) {
    console.log('\x1b[36m%s\x1b[0m', '📧 [Nodemailer - Mock Mode Active]:');
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Attachments: ${attachments.length}`);
    console.log('   (Email not sent because SMTP credentials are not yet configured in .env)');
    return { success: true, mocked: true };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"YMC GCT" <noreply@ymcgct.org>',
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log('\x1b[32m%s\x1b[0m', `✅ [Email Sent]: Message ID: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `❌ [Email Send Error]: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmail,
  formatYmcEmail,
  isSmtpConfigured,
};
