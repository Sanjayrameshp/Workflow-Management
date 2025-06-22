const mongoose = require('mongoose');

const OrganizationSchema = mongoose.Schema({
    name : { type : String },
    description : { type : String }
}, { timestamps: true })

module.exports = mongoose.model("Organization", OrganizationSchema);