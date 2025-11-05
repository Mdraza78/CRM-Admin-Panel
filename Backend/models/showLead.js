const mongoose = require('mongoose');

const ShowLeadSchema = new mongoose.Schema({
    // Contact Information
    clientEmail: { type: String, required: true },
    contactName: { type: String, required: true },
    jobTitle: String,
    clientPhone: String,
    
    // Show Information
    showName: { type: String, required: true },
    showWebsite: String,
    showDate: Date,
    attendeeCount: { type: Number }, 
    
    // Company Information
    companyName: { type: String, required: true },
    companyWebsite: String,
    companyCountry: { type: String, required: true },
    companyPhone: String,
    
    // Lead Details
    leadSource: { type: String, required: true }, // email, linkedin
    leadPriority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    emailMessage: String,
    emailAttachments: [String], // store file links or file names
    keyPoints: String,
    followUpDate: Date,
    tags: [String],
    
    // System Fields
    createdDate: { type: Date, default: Date.now },
    lastModified: { type: Date, default: Date.now },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true } // Changed to match your auth structure
});

// Index for better query performance
ShowLeadSchema.index({ user: 1, createdDate: -1 });
ShowLeadSchema.index({ user: 1, showDate: -1 });
ShowLeadSchema.index({ user: 1, leadSource: 1 });

module.exports = mongoose.model('ShowLead', ShowLeadSchema);