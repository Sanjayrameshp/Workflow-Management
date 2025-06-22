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

module.exports.sendSignUpOtp = sendSignUpOtp;
module.exports.sendInvitationEmail = sendInvitationEmail;
module.exports.sendForgotPasswordOTP = sendForgotPasswordOTP;