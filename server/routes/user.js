const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken')

const userService = require('../services/userService');
const User = require('../models/User');
const OTP = require('../models/Otp');
const Organization = require('../models/Organization');
const adminAuth = require('../middlewares/adminAuth');
const userAuth = require('../middlewares/auth')
const InviteToken = require('../models/InviteToken')
const mongoose = require('mongoose');
const emailService = require('../services/emailService');


router.post('/sendSignupOTP' ,async (req, res) => {
    try {
        const email = req.body.email;

        if(!email) {
            return res.status(401).send({ success: false, message: 'Error while sending OTP' })
        }

        const sendSignupOTP = await userService.sendSignupOTP(email);

        return res.send({ success: true, message: sendSignupOTP.message || 'OTP successfully send to the email address' });
    } catch (error) {
        return res.send({ success: false, message: error.message || 'Error while sending OTP' })
    }
    
});

router.post('/signUpOrgAndAdmin' ,async (req, res) => {
    try {
        const { orgData, userData, otp} = req.body

        if(!orgData || !userData || !otp) {
            return res.send({ success: false, message: 'Invalid inputs' })
        }
        const existUser = await User.findOne({ email : userData.email});
        if(existUser) {
            return res.send({ success: false, message: 'User with this email address already exist' });
        }

        const existOrg = await Organization.findOne({ name : orgData.orgname});
        if(existOrg) {
            return res.send({ success: false, message: 'Organization with this name is already exist' });
        }

        const hashedInputOtp = await crypto.createHash('sha256').update(otp).digest('hex');

        const otpDoc = await OTP.findOne({
                            email: userData.email,
                            verified: false,
                            type: 'adminsignup'
                        });

        if (!otpDoc || otpDoc.otp !== hashedInputOtp) {
            return res.send({ success: false, message: 'Invalid OTP or OTP expired' });
        }

        otpDoc.verified = true;
        await otpDoc.save();

        const registerOrg = await userService.createOrganization(orgData);

        if(!registerOrg.success) {
            return res.send({ success: false, message: registerOrg.message || 'Error while creating organization' });
        }

        const orgId = registerOrg.org._id;
        const registerUser = await userService.createUser(userData, orgId);

        if(!registerUser.success) {
            return res.send({ success: false, message: registerUser.message || 'Error while creating user' });
        }
        await emailService.sendWelcomeEmail(registerUser);

        return res.send({ success: true, message: registerUser.message || 'Successfully created User, Please login to continue' });
    } catch (error) {
        console.log(error);
        
        return res.send({ success: false, message: error.message || 'Something went wrong' })
    }
    
});

router.post('/checkForMultipleOrgs', async (req, res) => {
  try {
    const email = req.body.email;

    const orgs = await User.find({email: email}).select('organization').populate('organization');

    return res.send({ success: true, organizations : orgs });
  } catch (err) {
    return res.send({ success: false, organizations : null });
  }
});

router.post('/onLogin', async (req, res) => {
    try {
        const loginData = req.body;

        if(!loginData) return res.send({ success: false, message: 'Something went wrong' });
        let query = {
            email : loginData.email
        }
        if(loginData.organization) {
            query.organization = loginData.organization
        }

        const user =  await User.findOne(query);

        if(!user) return res.send({ success: false, message: 'User not found !!!' });

        if (user.isLocked()) {
            const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.send({
                success: false,
                message: `Account is locked. Try again in ${minutes} minute(s)`
            });
        }

        const isMatch = await user.comparePasswords(loginData.password);

        if (!isMatch) {
            const remainingAttempts = parseInt(5 - parseInt(user.failedLoginAttempts));
            
            await user.incrementFailedLogin();
            return res.send({ success: false, message: `Incorrect password, ${remainingAttempts} attempts are remaining` });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        organization: user.organization
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        return res.send({ success: true, user: {id: user._id, email: user.email, role: user.role}, token : token})
    } catch (error) {
        return res.send({ success: false, message:error.message || 'Incorrect password' });
    }
})

router.post('/getUser', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.send({ success: false, message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) return res.send({ success: false, message: 'User not found' });

    return res.send({ success: true, user });
  } catch (err) {
    return res.send({ success: false, message: 'Invalid token' });
  }
});

router.post('/inviteUser', adminAuth, async (req, res) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = req.user;
    if(!user) {
        return res.send({success: false, message: 'Authentication failed'});
    }

    const existUser = await User.findOne({email : email, organization: user.organization});
    
    if(existUser) {
        return res.send({success: false, message: 'User already exist'});
    }

    const inviteUser =await userService.inviteUser(email, user);

    if(inviteUser.success) {
        return res.send({ success: true, message: 'Invite has been sent' });
    } else {
        return res.send({ success: false, message: 'Error while sending Email' });
    }
  } catch (err) {
    return res.send({ success: false, message: 'Error while sending Email' });
  }
});

router.post('/validateInvitationToken', async (req, res) => {
  try {
    const token = req.body.token;
    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const validateToken = InviteToken.findOne({ token: hashed, expiresAt: { $gt: Date.now() }, verified: false});
    
    if(!validateToken) {
        return res.send({success: false, message: 'Session Expired'});
    }
    return res.send({success: true, message: 'Token verified'});
  } catch (err) {
    return res.send({ success: false, message: 'Error while sending Email' });
  }
});

router.post('/signUpUser' ,async (req, res) => {
    try {
        const userData = req.body;
        const regUser = await userService.registerNewUser(userData);
        if(regUser.success) {
            res.send({ success: true, message: regUser.message || 'Successfully created User' });
        } else {
            return res.send({ success: false, message: regUser.message || 'Unable to Register, Please contact admin' });
        }
    } catch (error) {
        console.log(error);
        return res.send({ success: false, message: error.message || 'Something went wrong' })
    }
    
});

router.post('/getUsersByProject' ,async (req, res) => {
    try {
        const projectId = req.body.projectId;
        if(!projectId) {
            return res.send({ success: false, message: 'Invalid project data' });
        }

        const getUsers = await userService.getUsersByProject(projectId);
        if(getUsers.success) {
            return res.send({ success: true, message: getUsers.message || 'Users found', users: getUsers.users });
        } else {
            return res.send({ success: false, message: getUsers.message || 'No users found', users: getUsers.users });
        }
    } catch (error) {
        console.log(error);
        return res.send({ success: false, message: error.message || 'Something went wrong', users:[] })
    }
    
});

router.get('/getUserDetails', userAuth ,async (req, res) => {
    try {
        const userData = req.user;

        const userDetails = await userService.getUserDetails(userData);
        if(userDetails.success) {
            return res.send({ success: true, message: userDetails.message || 'Successfully fetched User', user :userDetails.user });
        } else {
            return res.send({ success: false, message: userDetails.message || 'Unable to fetch user', user :userDetails.user });
        }
    } catch (error) {
        console.log(error);
        return res.send({ success: false, message: error.message || 'Unable to fetch user', user:null });
    }
    
});

router.post('/changePassword', userAuth ,async (req, res) => {
    try {
        const userData = req.user;
        const paswordData = req.body.passwordData;
        if(!userData) {
            return res.send({ success: false, message: 'Authorization failed'})
        }

        const changePassword = await userService.changePassword(paswordData,userData);
        if(changePassword.success) {
            return res.send({ success: true, message: changePassword.message || 'Successfully changedPassword' });
        } else {
           return  res.send({ success: false, message: changePassword.message || 'Unable to change password' });
        }
    } catch (error) {
        console.log(error);
        return res.send({ success: false, message: error.message || 'Unable to change password'});
    }
    
});

router.post('/sendForgotPasswordOTP' ,async (req, res) => {
    try {
        const email = req.body.email;

        if(!email) {
            return res.status(401).send({ success: false, message: 'Error while sending OTP' })
        }

        const sendForgotPasswordOTP = await userService.sendForgotPasswordOTP(email);

        return res.send({ success: true, message: sendForgotPasswordOTP.message || 'OTP successfully send to the email address' });
    } catch (error) {
        return res.send({ success: false, message: error.message || 'Error while sending OTP' })
    }
    
});


router.post('/submitForgotPassword' ,async (req, res) => {
    try {
        const { userData, otp} = req.body;

        if(!userData || !otp) {
            res.send({ success: false, message: 'Invalid inputs' })
        }
        const existUser = await User.findOne({ email : userData.email});
        if(!existUser) {
            return res.send({ success: false, message: 'User with this email is not found' });
        }

        const hashedInputOtp = await crypto.createHash('sha256').update(otp).digest('hex');

        const otpDoc = await OTP.findOne({
                            email: userData.email,
                            verified: false,
                            type: 'forgotpassword'
                        });

        if (!otpDoc || otpDoc.otp !== hashedInputOtp) {
            return res.send({ success: false, message: 'Invalid OTP or OTP expired' });
        }

        otpDoc.verified = true;
        await otpDoc.save();

        const forgotPassword = await userService.forgotPassword(userData, existUser);

        if(!forgotPassword.success) {
            return res.send({ success: false, message: forgotPassword.message || 'Error while changing password' });
        }

        return res.send({ success: true, message: forgotPassword.message || 'Password changed successfully, Please login to continue' });
    } catch (error) {
        console.log(error);
        
        return res.send({ success: false, message: error.message || 'Something went wrong' })
    }
    
});

router.post('/getUsersByAdmin', adminAuth ,async (req, res) => {
    try {

        const user = req.user;
        console.log("req.body", req.body);
        
        const projectId = req.body.projectId ? req.body.projectId : null;
        if(!user && user.role !== 'admin') {
            return res.send({ success: false, message: 'Authorization failed' })
        }

        const getUsersByAdmin = await userService.getUsersByAdmin(user, projectId);

        return res.send({ success: true, message: getUsersByAdmin.message || 'Users fetched successfully', users : getUsersByAdmin.users });
    } catch (error) {
       return res.send({ success: false, message: error.message || 'Error while fetching users', users: [] })
    }
    
});

router.post('/getUserDetailsForAdmin', adminAuth ,async (req, res) => {
    try {

        const user = req.user;
        const userId = req.body.userId;
        if(!user && user.role !== 'admin') {
            return res.send({ success: false, message: 'Authorization failed' })
        }

        const getUserDetailsForAdmin = await userService.getUserDetailsForAdmin(user, userId);

        return res.send({ success: true, message: getUserDetailsForAdmin.message || 'User fetched successfully', user : getUserDetailsForAdmin.user });
    } catch (error) {
        return res.send({ success: false, message: error.message || 'Error while fetching user', user: [] })
    }
    
});

router.post('/deleteUser', adminAuth ,async (req, res) => {
    try {

        const admin = req.user;
        const userId = req.body.userId;
        if(!admin && admin.role !== 'admin') {
            return res.send({ success: false, message: 'Authorization failed' })
        }

        const deleteUser = await userService.deleteUser(admin, userId);

        if(deleteUser.success) {
            return res.send({ success: true, message: deleteUser.message || 'User deleted successfully' });
        } else {
            return res.send({ success: false, message: deleteUser.message || 'Unable to delete user' });
        }
    } catch (error) {
        return res.send({ success: false, message: error.message || 'Unable to delete user' });
    }
    
});

router.post('/removeFromProject', adminAuth ,async (req, res) => {
    try {

        const admin = req.user;
        const projectId = req.body.projectId;
        const userId = req.body.userid;
        if(!admin && admin.role !== 'admin') {
            return res.send({ success: false, message: 'Authorization failed' })
        }

        const removeFromProject = await userService.removeFromProject(userId, projectId, admin);

        if(removeFromProject.success) {
            return res.send({ success: true, message: removeFromProject.message || 'Project removed successfully' });
        } else {
            return res.send({ success: false, message: removeFromProject.message || 'Unable to remove projects' });
        }
    } catch (error) {
        return res.send({ success: false, message: error.message || 'Unable to remove projects' });
    }
    
});

router.post('/searchUserByProject', adminAuth ,async (req, res) => {
    try {

        const admin = req.user;
        const projectId = req.body.projectId;
        const searchText = req.body.searchText;
        if(!admin && admin.role !== 'admin') {
            return res.send({ success: false, message: 'Authorization failed' })
        }

        const finduser = await userService.searchUserByProject(searchText, projectId, admin);

        if(finduser.success) {
            return res.send({ success: true, message: finduser.message || 'User found', users: finduser.data });
        } else {
            return res.send({ success: false, message: finduser.message || 'user not found', users: [] });
        }
    } catch (error) {
        return res.send({ success: false, message: error.message || 'user not found', users: [] });
    }
    
});

module.exports = router;