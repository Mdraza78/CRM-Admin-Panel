const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
    invoiceCode: { 
        type: String, 
        required: true, 
        unique: true 
    },
    invoiceDate: { 
        type: Date, 
        required: true,
        default: Date.now 
    },
    clientName: { 
        type: String, 
        required: true 
    },
    clientCompany: { 
        type: String, 
        required: true 
    },
    clientAddress: { 
        type: String, 
        required: true 
    },
    scope: { 
        type: String, 
        required: true,
        default: "Data enrichment services" 
    },
    totalRecords: { 
        type: String, 
        required: true,
        default: "10,000" 
    },
    price: { 
        type: Number, 
        required: true 
    },
    currency: {
        type: String,
        default: "USD"
    },
    status: {
        type: String,
        enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
        default: 'draft'
    },
    paymentDetails: {
        accountName: { type: String, default: "Global Datasys Group" },
        accountNumber: { type: String, default: "00000000000000" },
        bankName: { type: String, default: "Lorem Ipsum" },
        routingNumber: { type: String, default: "" }
    },
    terms: {
        deliveryFormat: { type: String, default: "Excel spreadsheet or .CSV" },
        dataAccuracy: { type: String, default: "95% guarantee on email deliverability" },
        projectTimeline: { type: String, default: "3-5 business days" },
        usageTerms: { type: String, default: "Unlimited (File for your perpetual usage)" }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    }
});

// Update the updatedAt field before saving
InvoiceSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Static method to generate invoice code
// Static method to generate invoice code
InvoiceSchema.statics.generateInvoiceCode = async function() {
    try {
        const currentYear = new Date().getFullYear();
        const prefix = 'GDG';
        
        // Find the latest invoice for this year
        const latestInvoice = await this.findOne({
            invoiceCode: new RegExp(`^${prefix}${currentYear}`)
        }).sort({ invoiceCode: -1 });
        
        let newNumber;
        
        if (!latestInvoice) {
            newNumber = '0001';
        } else {
            // Extract the number and increment
            const latestCode = latestInvoice.invoiceCode;
            const numberPart = latestCode.slice(-4);
            const latestNumber = parseInt(numberPart);
            
            if (isNaN(latestNumber)) {
                newNumber = '0001';
            } else {
                newNumber = (latestNumber + 1).toString().padStart(4, '0');
            }
        }
        
        return `${prefix}${currentYear}${newNumber}`;
    } catch (error) {
        console.error('Error generating invoice code:', error);
        // Fallback code generation
        const currentYear = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `GDG${currentYear}${randomNum}`;
    }
};

module.exports = mongoose.model('Invoice', InvoiceSchema);