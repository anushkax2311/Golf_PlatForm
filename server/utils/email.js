const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER) {
    console.log(`[Email Mock] To: ${to} | Subject: ${subject}`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Golf Platform <noreply@golfplatform.com>',
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};
