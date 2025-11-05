const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Call', 'Email', 'Meeting', 'Follow-up', 'Proposal', 'Deal Won', 'Deal Lost', 'Deal Created'] // Add 'Deal Created'
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  isPast: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const dealSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  stage: {
    type: String,
    required: true,
    enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'],
    default: 'Prospecting'
  },
  closeDate: {
    type: Date,
    required: true
  },
  assignedOwner: {
    type: String,
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  primaryContact: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  secondaryContacts: [String],
  winProbability: {
    type: Number,
    min: 0,
    max: 100
  },
  grossMargin: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [String],
  activities: [activitySchema],
// In models/deal.js, update the createdBy field:
createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User',
  required: true,
  set: function(value) {
    // Convert string to ObjectId if needed
    return mongoose.Types.ObjectId.isValid(value) ? value : new mongoose.Types.ObjectId(value);
  }
}
}, {
  timestamps: true
});

// Index for better query performance
dealSchema.index({ title: 'text', companyName: 'text', primaryContact: 'text' });
dealSchema.index({ stage: 1, priority: 1, closeDate: 1 });
dealSchema.index({ createdBy: 1 });

// Virtual for days since created
dealSchema.virtual('daysSinceCreated').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days in current stage
dealSchema.virtual('daysInStage').get(function() {
  return Math.floor((Date.now() - this.updatedAt) / (1000 * 60 * 60 * 24));
});

// Method to update stage
dealSchema.methods.updateStage = function(newStage) {
  this.stage = newStage;
  return this.save();
};

// Static method to get deals by user
dealSchema.statics.findByUser = function(userId) {
  return this.find({ createdBy: userId }).populate('createdBy', 'name email');
};

module.exports = mongoose.model('Deal', dealSchema);