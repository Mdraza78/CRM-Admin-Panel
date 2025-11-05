const mongoose = require('mongoose');

const IndustryLeadSchema = new mongoose.Schema({
    contactName: {
        type: String,
        required: true,
        trim: true
    },
    clientEmail: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    jobTitle: {
        type: String,
        trim: true
    },
    companyName: {
        type: String,
        required: true,
        trim: true
    },
    companyWebsite: {
        type: String,
        trim: true
    },
    companyCountry: {
        type: String,
        trim: true
    },
    clientPhone: {
        type: String,
        trim: true
    },
    companyPhone: {
        type: String,
        trim: true
    },
    showName: {
        type: String,
        trim: true
    },
    showWebsite: {
        type: String,
        trim: true
    },
    showDate: {
        type: Date
    },
    attendeeCount: {
        type: Number,
        default: 0
    },
    leadSource: {
        type: String,
        required: true,
        enum: ['email', 'linkedin', 'website', 'referral', 'event', 'cold-call', 'other']
    },
    leadStatus: {
        type: String,
        default: 'new',
        enum: ['new', 'contacted', 'qualified', 'proposal', 'converted', 'lost']
    },
    isProspect: {
        type: Boolean,
        default: false
    },
    emailMessage: {
        type: String,
        trim: true
    },
    leadNotes: {
        type: String,
        trim: true
    },
    attachments: [{
        fileName: String,
        filePath: String,
        fileSize: Number,
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastContactDate: {
        type: Date
    }
}, {
    timestamps: true
});

// Index for better query performance
IndustryLeadSchema.index({ contactName: 'text', companyName: 'text', clientEmail: 'text' });
IndustryLeadSchema.index({ leadStatus: 1 });
IndustryLeadSchema.index({ leadSource: 1 });
IndustryLeadSchema.index({ companyCountry: 1 });
IndustryLeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('IndustryLead', IndustryLeadSchema);