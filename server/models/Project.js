const mongoose = require('mongoose');

const ProjectSchema = mongoose.Schema({
    name : { type : String, required : true, trim : true},
    description : { type : String },
    status : { type : String, enum:['active', 'cancelled', 'onhold', 'completed'] },
    startDate : { type : Date , required : true},
    endDate : { type : Date },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // projectId: { type : String }
}, { timestamps: true })

module.exports = mongoose.model("Project", ProjectSchema);