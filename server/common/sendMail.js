const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const transporter = nodemailer.createTransport({
  service: 'smtp.gmail.com',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


async function sendOtp(toMail,otp, subject, message) {

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title>OTP Verification - Quantivio</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
              <tr>
                <td style="background-color: #673ab7; padding: 30px 20px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px;">Quantivio</h1>
                  <p style="margin: 10px 0 0;">Secure Your Account</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px; color: #333333;">
                  <p style="font-size: 16px;">${message}</p>

                  <div style="margin: 30px 0; text-align: center;">
                    <p style="font-size: 18px; margin-bottom: 10px;">Your One-Time Password (OTP):</p>
                    <div style="display: inline-block; padding: 15px 25px; font-size: 24px; letter-spacing: 4px; font-weight: bold; background-color: #f3f0ff; color: #673ab7; border-radius: 8px; border: 2px dashed #c6baff;">
                      ${otp}
                    </div>
                  </div>

                  <p style="font-size: 14px; color: #555;">This OTP is valid for the next 10 minutes. Please do not share it with anyone.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                  &copy; ${new Date().getFullYear()} Quantivio • Task Manager Platform<br>
                  Need help? Reply to this email or contact support.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to : toMail,
    subject: subject,
    html: htmlContent,
  };
  try {
    await sgMail.send(mailOptions);
    console.log('Email sent successfully to', toMail);
  } catch (error) {
    console.error('Email send failed:', error.response ? error.response.body : error.message);
  }

  // return transporter.sendMail(mailOptions);
}

async function sendInviteMail(toMail, subject, registerUrl) {
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>You're Invited to Join Quantivio</title>
      </head>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr>
                  <td style="background-color: #673ab7; padding: 30px; color: #ffffff; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px;">You're Invited to <span style="color: #ffc107;">Quantivio</span></h1>
                    <p style="margin: 10px 0 0; font-size: 16px;">Join us and manage your tasks smarter!</p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 30px; text-align: left; color: #333333;">
                    <h2 style="font-size: 22px;">Hello ,</h2>
                    <p style="font-size: 16px; line-height: 1.6;">
                      You have been invited to register on our platform. Please click the button below to complete your registration:
                    </p>

                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${registerUrl}" target="_blank" style="background-color: #673ab7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                        Complete Registration
                      </a>
                    </div>

                    <p style="font-size: 16px; line-height: 1.6;">
                      Or copy and paste this link in your browser:
                    </p>
                    <p style="font-size: 16px; line-height: 1.6; color: #007bff; word-break: break-word;">
                      <a href="${registerUrl}" style="color: #007bff;">${registerUrl}</a>
                    </p>

                    <p style="margin-top: 30px; font-size: 14px; color: #555;">
                      This link will expire in 24 hours. If you didn’t expect this email, you can safely ignore it.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #eeeeee; text-align: center; padding: 20px; font-size: 12px; color: #888;">
                    &copy; ${new Date().getFullYear()} Quantivio. All rights reserved.<br />
                    123 Productivity Ave, Task City, World 45678
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
    `;

  const mailOptions = {
    from: `"Invitation" <${process.env.EMAIL_USER}>`,
    to: toMail,
    subject: subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

async function sendWelcomeEmail(toMail, subject) {

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8">
      <title style="color: #8736d3;";>Welcome to Quantivio</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <tr>
                <td style="background-color: #673ab7; padding: 30px; color: #ffffff; text-align: center;">
                  <h1 style="margin: 0; font-size: 28px;">Welcome to <span style="color: #ffc107;">Quantivio</span>!</h1>
                  <p style="margin: 10px 0 0; font-size: 16px;">Your smart task management companion.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; text-align: left; color: #333333;">
                  <h2 style="font-size: 22px;">Hi there 👋,</h2>
                  <p style="font-size: 16px; line-height: 1.6;">
                    We're thrilled to have you on board with <strong>Quantivio</strong> — your all-in-one platform to manage tasks, boost productivity, and stay organized.
                  </p>
                  <p style="font-size: 16px; line-height: 1.6;">
                    Here’s what you can do:
                    <ul style="line-height: 1.6; font-size: 16px;">
                      <li>Create, edit, and track tasks easily</li>
                      <li>Collaborate with your team</li>
                      <li>Visualize progress with intuitive dashboards</li>
                      <li>Get real-time reminders</li>
                    </ul>
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://workflow-management-lilac.vercel.app" target="_blank" style="background-color: #673ab7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
                      Get Started
                    </a>
                  </div>
                  <p style="font-size: 14px; color: #555;">If you have any questions, feel free to reply to this email. We’re here to help!</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #eeeeee; text-align: center; padding: 20px; font-size: 12px; color: #888;">
                  &copy; ${new Date().getFullYear()} Quantivio. All rights reserved.<br>
                  123 Productivity Ave, Task City, World 45678
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toMail,
    subject: subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

async function sendProjectCreationEmail(project, user, subject) {

  const formattedStartDate = new Date(project.startDate).toLocaleDateString();
  const formattedEndDate = project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A';
  const capitalizedStatus = project.status.charAt(0).toUpperCase() + project.status.slice(1);

  const htmlContent = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Project Created - Quantivio</title>
    </head>
    <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding: 30px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
              <tr>
                <td style="background-color: #673ab7; padding: 30px 20px; text-align: center; color: #ffffff;">
                  <h1 style="margin: 0; font-size: 24px;">Quantivio</h1>
                  <p style="margin: 10px 0 0;">A new project has been created</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px; color: #333333;">
                  <p>Hi <strong>${user.name || 'User'}</strong>,</p>
                  <p>The following project has been successfully created in <strong>Quantivio</strong>:</p>

                  <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; font-size: 15px;">
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Project Name:</td>
                      <td>${project.name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Description:</td>
                      <td>${project.description || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Start Date:</td>
                      <td>${formattedStartDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">End Date:</td>
                      <td>${formattedEndDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-weight: bold;">Status:</td>
                      <td style="text-transform: capitalize;">${capitalizedStatus}</td>
                    </tr>
                  </table>

                  <p>We hope this project leads to great productivity and results.</p>
                  <p style="font-size: 14px; color: #555;">You can manage this project in your dashboard.</p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #888;">
                  &copy; ${new Date().getFullYear()} Quantivio — Task Management Platform<br>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: subject,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
}

module.exports.sendOtp = sendOtp;
module.exports.sendInviteMail = sendInviteMail;
module.exports.sendWelcomeEmail = sendWelcomeEmail;
module.exports.sendProjectCreationEmail = sendProjectCreationEmail;