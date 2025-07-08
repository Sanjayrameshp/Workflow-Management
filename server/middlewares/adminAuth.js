const jwt = require('jsonwebtoken');
const User = require('../models/User')
require('dotenv').config();

module.exports = async (req,res, next)=> {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) return res.status(401).json({ success: false, message: 'User not found' });

        if(user.role !== 'admin') {
            return res.status(401).json({ success: false, message: 'Admin access required' });
        }
        
        req.user = user;
        next();
    }
    catch(error) {
        res.send({success: false, message : 'Authentication Failed !'})
    };
    
}