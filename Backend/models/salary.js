const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  employeeName: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  pan: {
    type: String,
    required: true
  },
  accountNumber: {
    type: String,
    required: true
  },
  workingDays: {
    type: Number,
    required: true,
    default: 30
  },
  lopDays: {
    type: Number,
    required: true,
    default: 0
  },
  basicPay: {
    type: Number,
    required: true
  },
  specialAllowance: {
    type: Number,
    required: true
  },
  taxDeduction: {
    type: Number,
    required: true,
    default: 0
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate salary records for same employee in same month/year
salarySchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Salary', salarySchema);