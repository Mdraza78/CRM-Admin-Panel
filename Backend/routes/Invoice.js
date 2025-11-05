const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const auth = require('./authMiddleware');

// GET /api/invoices - Get all invoices with optional filtering
router.get('/', auth, async (req, res) => {
    try {
        const { 
            status, 
            client, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 10 
        } = req.query;

        let filter = {};

        // Status filter
        if (status && status !== 'all') {
            filter.status = status;
        }

        // Client name filter
        if (client) {
            filter.clientName = { $regex: client, $options: 'i' };
        }

        // Date range filter
        if (startDate || endDate) {
            filter.invoiceDate = {};
            if (startDate) filter.invoiceDate.$gte = new Date(startDate);
            if (endDate) filter.invoiceDate.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;

        const invoices = await Invoice.find(filter)
            .sort({ invoiceDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('createdBy', 'name email');

        const total = await Invoice.countDocuments(filter);
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: invoices,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalInvoices: total,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch invoices',
            details: error.message 
        });
    }
});

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const totalInvoices = await Invoice.countDocuments();
        const paidInvoices = await Invoice.countDocuments({ status: 'paid' });
        const overdueInvoices = await Invoice.countDocuments({ status: 'overdue' });
        const draftInvoices = await Invoice.countDocuments({ status: 'draft' });
        
        // Calculate total revenue from paid invoices
        const revenueResult = await Invoice.aggregate([
            { $match: { status: 'paid' } },
            { $group: { _id: null, totalRevenue: { $sum: '$price' } } }
        ]);
        
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        res.json({
            success: true,
            data: {
                totalInvoices,
                paidInvoices,
                overdueInvoices,
                draftInvoices,
                totalRevenue,
                pendingInvoices: totalInvoices - paidInvoices
            }
        });
    } catch (error) {
        console.error('Error fetching invoice stats:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch invoice statistics',
            details: error.message 
        });
    }
});

// GET /api/invoices/:id - Get single invoice
router.get('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate('createdBy', 'name email');
        
        if (!invoice) {
            return res.status(404).json({ 
                success: false,
                msg: 'Invoice not found' 
            });
        }
        
        res.json({
            success: true,
            data: invoice
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to fetch invoice',
            details: error.message 
        });
    }
});

// POST /api/invoices - Create new invoice
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating new invoice with data:', req.body);
        
        // Generate invoice code if not provided
        let invoiceCode = req.body.invoiceCode;
        if (!invoiceCode) {
            invoiceCode = await Invoice.generateInvoiceCode();
        }

        const invoiceData = {
            ...req.body,
            invoiceCode,
            createdBy: req.user.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Validate required fields
        const requiredFields = ['clientName', 'clientCompany', 'clientAddress', 'price'];
        const missingFields = requiredFields.filter(field => !invoiceData[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields',
                missingFields 
            });
        }

        const invoice = new Invoice(invoiceData);
        await invoice.save();

        // Populate createdBy field for response
        await invoice.populate('createdBy', 'name email');

        console.log('Successfully created invoice:', invoice);
        res.status(201).json({
            success: true,
            data: invoice,
            message: 'Invoice created successfully'
        });
    } catch (error) {
        console.error('Error creating invoice:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Invoice code already exists' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Failed to create invoice',
            details: error.message 
        });
    }
});

// PUT /api/invoices/:id - Update invoice
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { 
            ...req.body, 
            updatedAt: new Date() 
        };

        console.log('Updating invoice ID:', id);
        console.log('Update data:', updateData);

        // Remove fields that shouldn't be updated
        delete updateData.invoiceCode;
        delete updateData.createdBy;
        delete updateData.createdAt;

        const invoice = await Invoice.findByIdAndUpdate(
            id,
            { $set: updateData },
            { 
                new: true, // Return updated document
                runValidators: true 
            }
        ).populate('createdBy', 'name email');

        if (!invoice) {
            return res.status(404).json({ 
                success: false,
                msg: 'Invoice not found' 
            });
        }

        console.log('Successfully updated invoice:', invoice);
        res.json({
            success: true,
            data: invoice,
            message: 'Invoice updated successfully'
        });
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update invoice',
            details: error.message 
        });
    }
});

// DELETE /api/invoices/:id - Delete invoice
router.delete('/:id', auth, async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        
        if (!invoice) {
            return res.status(404).json({ 
                success: false,
                msg: 'Invoice not found' 
            });
        }
        
        res.json({ 
            success: true,
            message: 'Invoice deleted successfully',
            data: invoice 
        });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to delete invoice',
            details: error.message 
        });
    }
});

// PATCH /api/invoices/:id/status - Update invoice status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({ 
                success: false,
                error: 'Status is required' 
            });
        }

        const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false,
                error: 'Invalid status' 
            });
        }

        const invoice = await Invoice.findByIdAndUpdate(
            req.params.id,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true }
        ).populate('createdBy', 'name email');

        if (!invoice) {
            return res.status(404).json({ 
                success: false,
                msg: 'Invoice not found' 
            });
        }

        res.json({
            success: true,
            data: invoice,
            message: 'Invoice status updated successfully'
        });
    } catch (error) {
        console.error('Error updating invoice status:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update invoice status',
            details: error.message 
        });
    }
});

// GET /api/invoices/code/next - Get next invoice code
router.get('/code/next', auth, async (req, res) => {
    try {
        const nextCode = await Invoice.generateInvoiceCode();
        res.json({ 
            success: true,
            nextInvoiceCode: nextCode 
        });
    } catch (error) {
        console.error('Error generating next invoice code:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to generate invoice code',
            details: error.message 
        });
    }
});

module.exports = router;