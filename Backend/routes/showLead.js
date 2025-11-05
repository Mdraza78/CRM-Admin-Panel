const express = require('express');
const router = express.Router();
const ShowLead = require('../models/showLead');
const auth = require('./authMiddleware'); // Use your existing auth middleware

// Create a show lead
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating new show lead with data:', req.body);
        console.log('User ID:', req.user.id);
        
        // Add basic validation for required fields
        const requiredFields = ['clientEmail', 'contactName', 'showName', 'companyName', 'companyCountry', 'leadSource'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Missing required fields',
                missingFields: missingFields 
            });
        }
        
        // Check if email already exists for this user
        const existingLead = await ShowLead.findOne({
            clientEmail: req.body.clientEmail.toLowerCase(),
            user: req.user.id
        });

        if (existingLead) {
            return res.status(400).json({
                success: false,
                message: 'A lead with this email already exists'
            });
        }
        
        const leadData = {
            ...req.body,
            user: req.user.id, // Use user field to match your auth structure
            createdDate: new Date(),
            lastModified: new Date()
        };
        
        const lead = new ShowLead(leadData);
        await lead.save();
        
        console.log('Successfully created lead:', lead);
        res.status(201).json({
            success: true,
            message: 'Show lead created successfully',
            data: lead
        });
    } catch (error) {
        console.error('Error creating show lead:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to create show lead',
            details: error.message 
        });
    }
});

// In your showLead.js routes, update the stats calculation:

// Get all show leads (with optional filters)
router.get('/', auth, async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search,
            source, 
            showName, 
            companyCountry, 
            leadPriority, 
            dateFilter,
            sortBy = 'createdDate',
            sortOrder = 'desc'
        } = req.query;
        
        let filter = { user: req.user.id };
        
        // Search functionality
        if (search) {
            filter.$or = [
                { contactName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { clientEmail: { $regex: search, $options: 'i' } },
                { showName: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (source) filter.leadSource = source;
        if (showName) filter.showName = new RegExp(showName, 'i');
        if (companyCountry) filter.companyCountry = companyCountry;
        if (leadPriority) filter.leadPriority = leadPriority;
        
        // Handle date filters
        if (dateFilter) {
            const now = new Date();
            switch (dateFilter) {
                case 'upcoming':
                    filter.showDate = { $gte: now };
                    break;
                case 'past':
                    filter.showDate = { $lt: now };
                    break;
                case 'this_month':
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    filter.showDate = { $gte: startOfMonth, $lte: endOfMonth };
                    break;
                case 'this_year':
                    const startOfYear = new Date(now.getFullYear(), 0, 1);
                    const endOfYear = new Date(now.getFullYear(), 11, 31);
                    filter.showDate = { $gte: startOfYear, $lte: endOfYear };
                    break;
            }
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const leads = await ShowLead.find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get total count for pagination
        const total = await ShowLead.countDocuments(filter);

        // Calculate accurate stats - FIXED VERSION
        const totalShowLeads = await ShowLead.countDocuments({ user: req.user.id });
        const emailLeads = await ShowLead.countDocuments({ 
            user: req.user.id, 
            leadSource: 'email' 
        });
        const linkedinLeads = await ShowLead.countDocuments({ 
            user: req.user.id, 
            leadSource: 'linkedin' 
        });
        
        // Get unique active shows (shows with leads)
        const activeShows = await ShowLead.distinct('showName', { user: req.user.id });

        const statsData = {
            totalShowLeads,
            activeShows: activeShows.length,
            emailLeads,
            linkedinLeads
        };

        console.log('Calculated Stats:', statsData);

        res.json({
            success: true,
            data: leads,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalLeads: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            },
            stats: statsData
        });
    } catch (error) {
        console.error('Error fetching show leads:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Get single show lead by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const lead = await ShowLead.findOne({
            _id: req.params.id,
            user: req.user.id // Use user field
        });
        
        if (!lead) {
            return res.status(404).json({ 
                success: false,
                msg: 'Show lead not found' 
            });
        }
        
        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Error fetching show lead:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Update a show lead
router.put('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { 
            ...req.body, 
            lastModified: new Date() 
        };
        
        console.log('Updating lead ID:', id);
        console.log('User ID:', req.user.id);
        console.log('Update data received:', updateData);
        
        // Find lead and verify ownership
        let lead = await ShowLead.findOne({
            _id: id,
            user: req.user.id // Use user field
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                msg: 'Show lead not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (updateData.clientEmail && updateData.clientEmail !== lead.clientEmail) {
            const existingLead = await ShowLead.findOne({
                clientEmail: updateData.clientEmail.toLowerCase(),
                user: req.user.id,
                _id: { $ne: id }
            });

            if (existingLead) {
                return res.status(400).json({
                    success: false,
                    message: 'A lead with this email already exists'
                });
            }
        }
        
        // Remove any undefined or null values but keep empty strings for some fields
        const allowedEmptyFields = ['jobTitle', 'clientPhone', 'showWebsite', 'companyWebsite', 'companyPhone', 'emailMessage', 'keyPoints'];
        Object.keys(updateData).forEach(key => {
            if (updateData[key] === undefined || updateData[key] === null) {
                delete updateData[key];
            } else if (updateData[key] === '' && !allowedEmptyFields.includes(key)) {
                delete updateData[key];
            }
        });
        
        // Handle tags conversion if it's a string
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = updateData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        }
        
        // Handle number conversion for attendeeCount
        if (updateData.attendeeCount) {
            updateData.attendeeCount = parseInt(updateData.attendeeCount);
            if (isNaN(updateData.attendeeCount)) {
                delete updateData.attendeeCount;
            }
        }
        
        console.log('Processed update data:', updateData);
        
        lead = await ShowLead.findByIdAndUpdate(
            id,
            { $set: updateData },
            { 
                new: true, // Return updated document
                runValidators: true, // Run model validations
                context: 'query'
            }
        );
        
        console.log('Successfully updated lead:', lead);
        
        res.json({
            success: true,
            message: 'Show lead updated successfully',
            data: lead
        });
    } catch (error) {
        console.error('Error updating show lead:', error);
        res.status(500).json({ 
            success: false,
            error: 'Failed to update show lead',
            details: error.message 
        });
    }
});

// Delete a show lead
router.delete('/:id', auth, async (req, res) => {
    try {
        const lead = await ShowLead.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id // Use user field
        });
        
        if (!lead) {
            return res.status(404).json({ 
                success: false,
                msg: 'Show lead not found' 
            });
        }
        
        res.json({ 
            success: true,
            msg: 'Show lead deleted successfully',
            deletedLead: lead 
        });
    } catch (error) {
        console.error('Error deleting show lead:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

// Bulk delete leads
router.delete('/bulk/delete', auth, async (req, res) => {
    try {
        const { leadIds } = req.body;

        if (!leadIds || !Array.isArray(leadIds)) {
            return res.status(400).json({
                success: false,
                message: 'Lead IDs array is required'
            });
        }

        const result = await ShowLead.deleteMany({
            _id: { $in: leadIds },
            user: req.user.id // Use user field
        });

        res.json({
            success: true,
            message: `${result.deletedCount} leads deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk delete leads error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while bulk deleting leads'
        });
    }
});

// Export leads to CSV
router.get('/export/csv', auth, async (req, res) => {
    try {
        const leads = await ShowLead.find({ user: req.user.id }) // Use user field
            .select('contactName clientEmail jobTitle companyName companyCountry clientPhone showName showDate leadSource leadPriority createdDate')
            .sort({ createdDate: -1 });

        // Convert to CSV
        const headers = [
            'Contact Name',
            'Email',
            'Job Title',
            'Company',
            'Country',
            'Phone',
            'Show Name',
            'Show Date',
            'Source',
            'Priority',
            'Created Date'
        ];

        const csvData = leads.map(lead => [
            `"${lead.contactName}"`,
            `"${lead.clientEmail}"`,
            `"${lead.jobTitle || ''}"`,
            `"${lead.companyName}"`,
            `"${lead.companyCountry || ''}"`,
            `"${lead.clientPhone || ''}"`,
            `"${lead.showName}"`,
            `"${new Date(lead.showDate).toLocaleDateString()}"`,
            `"${lead.leadSource}"`,
            `"${lead.leadPriority}"`,
            `"${new Date(lead.createdDate).toLocaleDateString()}"`
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.join(','))
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=show_leads.csv');
        res.send(csvContent);
    } catch (error) {
        console.error('Export leads error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting leads'
        });
    }
});

module.exports = router;