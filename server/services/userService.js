const Organization = require('../models/Organization');
const User = require('../models/User');
const OTP = require('../models/Otp');
const otpGenerator = require('otp-generator');
const emailService = require('../services/emailService');
const crypto = require('crypto');
const InviteToken = require('../models/InviteToken');
const Project = require('../models/Project');
const mongoose = require('mongoose');


var sendSignupOTP = async function(email) {
    try {

        const generatedOtp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            alphabets: false
        });

        const hashedOtp = await crypto.createHash('sha256').update(generatedOtp).digest('hex');

        await OTP.deleteMany({ email: email, type: 'adminsignup'});

        const createdOtp = await new OTP({
            email : email,
            otp : hashedOtp,
            type : 'adminsignup'
        })

        await createdOtp.save();
        
        const sendOtpEmail = await emailService.sendSignUpOtp(email, generatedOtp)

        if(!sendOtpEmail.success) {
            return { success: false, message: 'Error while sending OTP' };
        }
        return { success: true, message: 'OTP successfully send to the email address' };
    } catch (error) {
        console.error('Error creating organization:', error);
        return { success: false, message: error.message || 'error while saving organization' };
    }
}

var createOrganization = async function(orgData) {
    try {
        const newOrg = new Organization({
            name: orgData.orgname,
            description: orgData.desc
        });

        const savedOrg = await newOrg.save();
        return { success: true, org: savedOrg, message: 'organization saved successfully' };
    } catch (error) {
        console.error('Error creating organization:', error);
        return { success: false, message: error.message || 'error while saving organization' };
    }
}

var createUser = async function(userData, orgId) {
    try {

        const newUser = new User({
            firstname : userData.firstname,
            lastname : userData.lastname,
            email : userData.email,
            phone : userData.phone,
            role : userData.role,
            password : userData.password,
            organization : orgId
        })

        const savedUser = await newUser.save();

        if(savedUser) {
            await emailService.sendWelcomeEmail(savedUser);
        }

        return { success: true, user : savedUser, message: 'User created successfully, Please login to continue' }
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'error while saving User' };
    }
}

var inviteUser = async function(email, user) {
    try {
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const expires = Date.now() + 1000 * 60 * 60 * 24;

        await InviteToken.create({
            email,
            token: hashedToken,
            expiresAt: new Date(expires),
            adminref: user._id,
            org: user.org
        });
        const inviteLink = `https://workflow-management-lilac.vercel.app/register-user?token=${token}`;

        await emailService.sendInvitationEmail(email, inviteLink)
        return { success: true, message: 'An user invitation mail has been sent' };
    } catch (error) {
        console.error('Error ', error);
        return { success: false, message: error.message || 'error while sending invitation mail' };
    }
}

var registerNewUser = async function(userData) {
    try {
        const hashedToken = crypto.createHash('sha256').update(userData.token).digest('hex');

        const validateToken = await InviteToken.findOne({ token : hashedToken, verified : false });

        if(!validateToken) {
            return { success : false, message : 'Token validation failed'}
        }

        if( userData.email !== validateToken.email) {
            return { success : false, message : 'Invalid email address provided'}
        }

        validateToken.verified = true;
        await validateToken.save();

        const adminUser = await User.findOne({ '_id' : new mongoose.Types.ObjectId(validateToken.adminref), 'role' : 'admin'});

        if(!adminUser) {
            return { success : false, message : 'Authentication failed'}
        }

        const newUser = new User({
            firstname : userData.firstname,
            lastname : userData.lastname,
            email : userData.email,
            phone : userData.phone,
            role : userData.role,
            password : userData.password,
            organization : adminUser.organization,
            adminRef : adminUser._id
        })

        newUser.save();

        return { success: true, message: 'User created successfully' }
    } catch (error) {
        return { success: false, message: error.message || 'error while saving User' };
    }
}

var getUsersByProject = async function(projectId) {
    try {
        const projectFound = await Project.findOne({ _id : projectId})
        if(!projectFound) {
            return { success: false, message: 'Project not found or expired' };
        }

        const users = await User.find({ projects: projectId });
        return { success: true, message: 'User created successfully', users }
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'error while saving User' };
    }
}

var getUserDetails = async function(userData) {
    try {

        const user = await User.findOne({ _id: userData._id}).select('-password').populate('projects');

        return { success: true, user : user, message: 'User fetched successfully' }
    } catch (error) {
        return { success: false, message: error.message || 'error while fetching User', user : null };
    }
}

var changePassword = async function(passwordData, userData) {
    try {

        const user = await User.findOne({ _id: new mongoose.Types.ObjectId(userData._id), email: passwordData.email});

        if (!user) {
            return { success: false, message: 'User not found' };
        }

        const isMatch = await user.comparePasswords(passwordData.currentPassword);
        if (!isMatch) {
            return { success: false, message: 'Current password is incorrect' };
        }

        user.password = passwordData.password;
        await user.save();

        return { success: true, message: 'Password changed successfully' };

    } catch (error) {
        console.error('error while changing password:', error);
        return { success: false, message: error.message || 'error while changing password' };
    }
}

var sendForgotPasswordOTP = async function(email) {
    try {

        const generatedOtp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            alphabets: false
        });

        const hashedOtp = await crypto.createHash('sha256').update(generatedOtp).digest('hex');

        const createdOtp = await new OTP({
            email : email,
            otp : hashedOtp,
            type : 'forgotpassword'
        })

        await createdOtp.save();
        
        const sendOtpEmail = await emailService.sendForgotPasswordOTP(email, generatedOtp)

        if(!sendOtpEmail.success) {
            return { success: false, message: 'Error while sending OTP' };
        }
        return { success: true, message: 'OTP successfully send to the email address' };
    } catch (error) {
        console.error('Error creating organization:', error);
        return { success: false, message: error.message || 'error while saving organization' };
    }
}

var forgotPassword = async function(userData, existUser) {
    try {
        const changePassword = await User.findOne({email : userData.email, organization: new mongoose.Types.ObjectId(existUser.organization)});
        changePassword.password = userData.password;
        await changePassword.save();

        if(!changePassword) {
            return { success: false, message: 'Unable to update password' }
        }

        return { success: true, message: 'Password changed successfully, Please login to continue' }
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'error while saving User' };
    }
}

var getUsersByAdmin = async function(userData) {
    try {
        const users = await User.find({ adminRef: new mongoose.Types.ObjectId(userData._id), role: 'user'}).select('-password').populate('projects').populate('organization');

        return { success: true, message: 'Users fetched successfully', users }
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'Error while fetching users', users: [] };
    }
}

var getUserDetailsForAdmin = async function(admin, userId) {
    try {
        const user = await User.findOne({_id: new mongoose.Types.ObjectId(userId),  adminRef: new mongoose.Types.ObjectId(admin._id), role: 'user'}).select('-password').populate('projects').populate('organization');

        return { success: true, message: 'User fetched successfully', user }
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'Error while fetching user', user: null };
    }
}

var deleteUser = async function(admin, userId) {
    try {
        const deletedUser = await User.findOneAndDelete({ _id: new mongoose.Types.ObjectId(userId), adminRef: new mongoose.Types.ObjectId(admin._id)});

        if (!deletedUser) {
            return { success: false, message: 'Error while deleting user' };
        }

        return { success: true, message: 'User deleted successfully' }
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'Error while deleting user' };
    }
}

var removeFromProject = async function(userId, projectId, admin) {
    try {
        const updateUser = await User.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(userId), adminRef: new mongoose.Types.ObjectId(admin._id)}, { $pull: { projects: projectId } });

        if(!updateUser) {
            return { success: false, message: 'Error while removing project' };
        }
        return { success: true, message: 'Project removed successfully' };
    } catch (error) {
        console.error('Error creating user:', error);
        return { success: false, message: error.message || 'Error while removing project' };
    }
}

const searchUserByProject = async function(searchText, projectId, admin) {
  try {
    const regex = new RegExp(searchText, 'i');

    const users = await User.find({
      organization: admin.organization,
      projects: { $ne: projectId },
      $or: [
        { email: { $regex: regex } },
        { firstname: { $regex: regex } },
        { lastname: { $regex: regex } }
      ]
    });

    return { success: true, data: users };
  } catch (error) {
    console.error('Error searching user:', error);
    return { success: false, message: error.message || 'Error while searching user', data: [] };
  }
};



module.exports.createOrganization = createOrganization;
module.exports.createUser = createUser;
module.exports.sendSignupOTP = sendSignupOTP;
module.exports.inviteUser = inviteUser;
module.exports.registerNewUser = registerNewUser;
module.exports.getUsersByProject = getUsersByProject;
module.exports.getUserDetails = getUserDetails;
module.exports.changePassword = changePassword;
module.exports.sendForgotPasswordOTP = sendForgotPasswordOTP;
module.exports.forgotPassword = forgotPassword;
module.exports.getUsersByAdmin = getUsersByAdmin;
module.exports.getUserDetailsForAdmin = getUserDetailsForAdmin;
module.exports.deleteUser = deleteUser;
module.exports.removeFromProject = removeFromProject;
module.exports.searchUserByProject = searchUserByProject;