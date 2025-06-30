const sendmail = require('../common/sendMail');

var sendSignUpOtp = async function(email, otp) {

    try {
        const subject = 'Email Verfication';
        const message = 'Please find the verification OTP below'
        const sendOtp = await sendmail.sendOtp(email, otp, subject, message);

        console.log("sendOTP > ", sendOtp);
        return { success: true, message: 'An OTP has been sent to your email' };
    } catch (error) {
        return{ success: false, message: 'Error while sending the OTP' };
    }
}
var sendInvitationEmail = async function(email, url) {

    try {
        const subject = 'project Invitation';
        await sendmail.sendInviteMail(email, subject, url);

        return { success: true, message: 'Invite email sent successfully' };
    } catch (error) {
        return{ success: false, message: 'Error while sending the invite email' };
    }
}

var sendForgotPasswordOTP = async function(email, otp) {

    try {
        const subject = 'Forgot Password';
        const message = 'Please find the verification OTP below'
        const sendOtp = await sendmail.sendOtp(email, otp, subject, message);

        console.log("sendOTP > ", sendOtp);
        return { success: true, message: 'An OTP has been sent to your email' };
    } catch (error) {
        return{ success: false, message: 'Error while sending the OTP' };
    }
}

var sendWelcomeEmail = async function (user) {
    try {
        const subject = 'Welcome to Quantivio-';
        const message = 'Please find the verification OTP below'
        const sendOtp = await sendmail.sendWelcomeEmail(user.email, subject);

        console.log("sendOTP > ", sendOtp);
        return { success: true, message: 'An OTP has been sent to your email' };
    } catch (error) {
        return{ success: false, message: 'Error while sending the OTP' };
    }
}

var sendProjectCreationEmail = async function (project, user) {
    try {
        const subject = 'New Project Created';
        const sendOtp = await sendmail.sendProjectCreationEmail(project, user, subject);

        console.log("sendOTP > ", sendOtp);
        return { success: true, message: 'An OTP has been sent to your email' };
    } catch (error) {
        return{ success: false, message: 'Error while sending the OTP' };
    }
}

module.exports.sendSignUpOtp = sendSignUpOtp;
module.exports.sendInvitationEmail = sendInvitationEmail;
module.exports.sendForgotPasswordOTP = sendForgotPasswordOTP;
module.exports.sendWelcomeEmail = sendWelcomeEmail;
module.exports.sendProjectCreationEmail = sendProjectCreationEmail;