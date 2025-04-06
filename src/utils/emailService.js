const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Prevents SSL errors
  },
});

// Define sendEmail before using it
const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Finance Tracker" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

// Function to send verification email
const sendVerificationEmail = async (user) => {
  try {
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    const verificationUrl = `${backendUrl}/api/auth/verify-email/${token}`;

    const subject = 'Verify Your Email';
    const text = `Click the link below to verify your email: ${verificationUrl}`;
    const html = `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`;

    await sendEmail(user.email, subject, text, html);
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    throw error;
  }
};

module.exports = { sendEmail, sendVerificationEmail };
