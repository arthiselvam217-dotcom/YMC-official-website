const { sendEmail, formatYmcEmail } = require('../config/mailer');

/**
 * @desc    Submit contact us inquiry
 * @route   POST /api/contact
 * @access  Public
 */
const submitContactMessage = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields',
      });
    }

    const emailHtml = formatYmcEmail({
      title: 'New Website Inquiry',
      bodyHtml: `
        <p>A new message has been submitted from the <b>YMC Website Contact Page</b>:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; width: 120px;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Subject:</td>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${subject || 'General Inquiry'}</td>
          </tr>
        </table>
        <p><b>Message Content:</b></p>
        <div style="background: #f8fafc; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; white-space: pre-wrap;">
          ${message}
        </div>
      `,
    });

    await sendEmail({
      to: process.env.EMAIL_USER || 'admin@ymcgct.org',
      subject: `YMC Contact Inquiry: ${subject || 'New Message from ' + name}`,
      html: emailHtml,
    });

    res.status(200).json({
      success: true,
      message: 'Your message has been sent successfully. Thank you for reaching out to YMC!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get club contact information
 * @route   GET /api/contact
 * @access  Public
 */
const getContactInfo = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      club: 'Youth Media Club (YMC GCT)',
      institution: 'Government College of Technology',
      address: 'Thadagam Road, Coimbatore - 641013, Tamil Nadu, India',
      email: process.env.EMAIL_USER || 'youthclubgct@gmail.com',
      website: 'https://ymcgct.org',
    },
  });
};

module.exports = {
  submitContactMessage,
  getContactInfo,
};
