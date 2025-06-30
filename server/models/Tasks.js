const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['started', 'inprogress', 'blocked', 'completed'],
    default: 'started',
  },
  progress: {
    type: Number,
    enum: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  startDate: {
    type: Date,
    default: Date.now()
  },
  endDate: {
    type: Date
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  customMessage: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);