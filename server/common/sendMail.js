const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendOtp(toMail,otp, subject, message) {
  console.log("inide mail> ", toMail, message);
  
  const mailOptions = {
    from: `"Verification" <${process.env.EMAIL_USER}>`,
    to : toMail,
    subject: subject,
    text: message,
    html: `<h2>Your OTP is:</h2><p>${otp}</p>`,
  };

  return transporter.sendMail(mailOptions);
}

async function sendInviteMail(toMail, subject, registerUrl) {
  console.log("Sending invitation to:", toMail);

  const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
    <h2 style="color: #333;">You're Invited to Join Our Platform</h2>
    <p>Hello,</p>
    <p>You have been invited to register on our platform. Please click the button to complete your registration:</p>

    <a href="${registerUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">
      Complete Registration
    </a>

    <p style="margin-top: 20px;">Or you can copy and paste this link in your browser:</p>
    <p><a href="${registerUrl}" style="color: #007bff;">${registerUrl}</a></p>

    <p style="margin-top: 30px; font-size: 12px; color: #999;">This link will expire in 24 hours. If you didn't expect this email, you can safely ignore it.</p>
  </div>
  `;

  const mailOptions = {
    from: `"Invitation" <${process.env.EMAIL_USER}>`,
    to: toMail,
    subject: subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

module.exports.sendOtp = sendOtp;
module.exports.sendInviteMail = sendInviteMail;