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


router.post('/sendSignupOTP' ,async (req, res) => {
    try {
        const email = req.body.email;

        
        if(!email) {
            res.status(401).send({ success: false, message: 'Error while sending OTP' })
        }

        const sendSignupOTP = await userService.sendSignupOTP(email);

        res.send({ success: true, message: sendSignupOTP.message || 'OTP successfully send to the email address' });
    } catch (error) {
        res.send({ success: false, message: error.message || 'Error while sending OTP' })
    }
    
});

router.post('/signUpOrgAndAdmin' ,async (req, res) => {
    try {
        const { orgData, userData, otp} = req.body

        if(!orgData || !userData || !otp) {
            res.send({ success: false, message: 'Invalid inputs' })
        }
        const existUser = await User.findOne({ email : userData.email});
        if(existUser) {
            res.send({ success: false, message: 'User with this email address already exist' });
        }

        const existOrg = await Organization.findOne({ name : orgData.orgname});
        if(existOrg) {
            res.send({ success: false, message: 'Organization with this name is already exist' });
        }

        const hashedInputOtp = await crypto.createHash('sha256').update(otp).digest('hex');

        const otpDoc = await OTP.findOne({
                            email: userData.email,
                            verified: false
                        });

        if (!otpDoc || otpDoc.otp !== hashedInputOtp) {
            res.send({ success: false, message: 'Invalid OTP or OTP expired' });
        }

        otpDoc.verified = true;
        await otpDoc.save();

        const registerOrg = await userService.createOrganization(orgData);

        if(!registerOrg.success) {
            res.send({ success: false, message: registerOrg.message || 'Error while creating organization' });
        }

        const orgId = registerOrg.org._id;
        const registerUser = await userService.createUser(userData, orgId);

        if(!registerUser.success) {
            res.send({ success: false, message: registerUser.message || 'Error while creating user' });
        }

        res.send({ success: true, message: registerUser.message || 'Successfully created User, Please login to continue' });
    } catch (error) {
        console.log(error);
        
        res.send({ success: false, message: error.message || 'Something went wrong' })
    }
    
});

router.post('/onLogin', async (req, res) => {
    try {
        const loginData = req.body;

        if(!loginData) res.send({ success: false, message: 'Something went wrong' });

        const user =  await User.findOne({ email : loginData.email});

        if(!user) res.send({ success: false, message: 'User not found !!!' });

        if (user.isLocked) {
            const minutes = Math.ceil((user.lockUntil - Date.now()) / 60000);
            return res.send({
                success: false,
                message: `Account is locked. Try again in ${minutes} minute(s)`
            });
        }

        const isMatch = await user.comparePasswords(loginData.password);

        if (!isMatch) {
            await user.incrementFailedLogin();
            res.send({ success: false, message: 'Incorrect password' });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
        org: Organization
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.send({ success: true, user: {id: user._id, email: user.email, role: user.role}, token : token})
    } catch (error) {
        res.send({ success: false, message:error.message || 'Incorrect password' });
    }
})

router.post('/getUser', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) res.send({ success: false, message: 'Token missing' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) res.send({ success: false, message: 'User not found' });

    res.send({ success: true, user });
  } catch (err) {
    res.send({ success: false, message: 'Invalid token' });
  }
});

router.post('/inviteUser',adminAuth, async (req, res) => {
  try {
    const email = req.body.email;
    const projectId = req.body.projectId
    const user = req.user;
    console.log("email > ", email);
    console.log("user > ", user);
    if(!user) {
        return res.send({success: false, message: 'Authentication failed'});
    }

    existUser = await User.findOne({email : email, adminRef: req.user._id, projects: projectId});
    console.log("existUser > ", existUser);
    
    if(existUser) {
        console.log("insideee");
        
        return res.send({success: false, message: 'User already exist in this project'});
    }

    const inviteUser =await userService.inviteUser(email, user, projectId);
    console.log("inviteUser > ", inviteUser);
    
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
    console.log("validateToken > ", validateToken);
    
    if(!validateToken) {
        res.send({success: false, message: 'Session Expired'});
    }
    res.send({success: true, message: 'Token verified'});
  } catch (err) {
    res.send({ success: false, message: 'Error while sending Email' });
  }
});

router.post('/signUpUser' ,async (req, res) => {
    try {
        const userData = req.body;
        console.log("Req-body > ", req.body);
        

        const regUser = await userService.registerNewUser(userData);
        if(regUser.success) {
            res.send({ success: true, message: regUser.message || 'Successfully created User' });
        } else {
            res.send({ success: false, message: regUser.message || 'Unable to Register, Please contact admin' });
        }
    } catch (error) {
        console.log(error);
        res.send({ success: false, message: error.message || 'Something went wrong' })
    }
    
});

router.post('/getUsersByProject' ,async (req, res) => {
    try {
        const projectId = req.body.projectId;
        console.log("Req-body > ", req.body);
        if(!projectId) {
            res.send({ success: false, message: 'Invalid project data' });
        }

        const getUsers = await userService.getUsersByProject(projectId);
        if(getUsers.success) {
            res.send({ success: true, message: getUsers.message || 'Users found', users: getUsers.users });
        } else {
            res.send({ success: false, message: getUsers.message || 'No users found', users: getUsers.users });
        }
    } catch (error) {
        console.log(error);
        res.send({ success: false, message: error.message || 'Something went wrong', users:[] })
    }
    
});

router.get('/getUserDetails', userAuth ,async (req, res) => {
    try {
        const userData = req.user;
        console.log("Req-body > ", req.body);

        const userDetails = await userService.getUserDetails(userData);
        if(userDetails.success) {
            res.send({ success: true, message: userDetails.message || 'Successfully fetched User', user :userDetails.user });
        } else {
            res.send({ success: false, message: userDetails.message || 'Unable to fetch user', user :userDetails.user });
        }
    } catch (error) {
        console.log(error);
        res.send({ success: false, message: error.message || 'Unable to fetch user', user:null });
    }
    
});

router.post('/changePassword', userAuth ,async (req, res) => {
    try {
        const userData = req.user;
        const paswordData = req.body.passwordData
        console.log("Req-body > ", req.body);

        if(!userData) {
            return res.send({ success: false, message: 'Authorization failed'})
        }

        const changePassword = await userService.changePassword(paswordData,userData);
        if(changePassword.success) {
            res.send({ success: true, message: changePassword.message || 'Successfully changedPassword' });
        } else {
            res.send({ success: false, message: changePassword.message || 'Unable to change password' });
        }
    } catch (error) {
        console.log(error);
        res.send({ success: false, message: error.message || 'Unable to change password'});
    }
    
});

router.post('/sendForgotPasswordOTP' ,async (req, res) => {
    try {
        const email = req.body.email;

        if(!email) {
            res.status(401).send({ success: false, message: 'Error while sending OTP' })
        }

        const sendForgotPasswordOTP = await userService.sendForgotPasswordOTP(email);

        res.send({ success: true, message: sendForgotPasswordOTP.message || 'OTP successfully send to the email address' });
    } catch (error) {
        res.send({ success: false, message: error.message || 'Error while sending OTP' })
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
            res.send({ success: false, message: 'User with this email is not found' });
        }

        const hashedInputOtp = await crypto.createHash('sha256').update(otp).digest('hex');

        const otpDoc = await OTP.findOne({
                            email: userData.email,
                            verified: false,
                            type: 'forgotpassword'
                        });

        console.log("OTP > ", otpDoc);
        

        if (!otpDoc || otpDoc.otp !== hashedInputOtp) {
            res.send({ success: false, message: 'Invalid OTP or OTP expired' });
        }

        otpDoc.verified = true;
        await otpDoc.save();

        const forgotPassword = await userService.forgotPassword(userData, existUser);

        if(!forgotPassword.success) {
            res.send({ success: false, message: forgotPassword.message || 'Error while changing password' });
        }

        res.send({ success: true, message: forgotPassword.message || 'Password changed successfully, Please login to continue' });
    } catch (error) {
        console.log(error);
        
        res.send({ success: false, message: error.message || 'Something went wrong' })
    }
    
});

router.get('/getUsersByAdmin', adminAuth ,async (req, res) => {
    try {

        const user = req.user;
        if(!user && user.role !== 'admin') {
            res.send({ success: false, message: 'Authorization failed' })
        }

        const getUsersByAdmin = await userService.getUsersByAdmin(user);

        res.send({ success: true, message: getUsersByAdmin.message || 'Users fetched successfully', users : getUsersByAdmin.users });
    } catch (error) {
        res.send({ success: false, message: error.message || 'Error while fetching users', users: [] })
    }
    
});

router.post('/getUserDetailsForAdmin', adminAuth ,async (req, res) => {
    try {

        const user = req.user;
        const userId = req.body.userId;
        if(!user && user.role !== 'admin') {
            res.send({ success: false, message: 'Authorization failed' })
        }

        const getUserDetailsForAdmin = await userService.getUserDetailsForAdmin(user, userId);

        res.send({ success: true, message: getUserDetailsForAdmin.message || 'User fetched successfully', user : getUserDetailsForAdmin.user });
    } catch (error) {
        res.send({ success: false, message: error.message || 'Error while fetching user', user: [] })
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

module.exports = router;