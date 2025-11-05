const express = require('express');
const router = express.Router();
const IndustryLead = require('../models/IndustryLead');
const auth = require('./authMiddleware');

// @desc    Get all industry leads with filtering and pagination
// @route   GET /api/industry-leads
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            leadSource,
            leadStatus,
            companyCountry,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        // Build filter object
        let filter = { createdBy: req.user.id };
        
        if (search) {
            filter.$or = [
                { contactName: { $regex: search, $options: 'i' } },
                { companyName: { $regex: search, $options: 'i' } },
                { clientEmail: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (leadSource) {
            filter.leadSource = leadSource;
        }
        
        if (leadStatus) {
            filter.leadStatus = leadStatus;
        }
        
        if (companyCountry) {
            filter.companyCountry = companyCountry;
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const leads = await IndustryLead.find(filter)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get total count for pagination
        const total = await IndustryLead.countDocuments(filter);

        // Calculate stats - FIXED VERSION
        const allLeads = await IndustryLead.find(filter).lean();
        
        const totalLeads = allLeads.length;
        const qualifiedLeads = allLeads.filter(lead => 
            lead.leadStatus === 'qualified' || lead.isProspect === true
        ).length;
        const convertedLeads = allLeads.filter(lead => 
            lead.leadStatus === 'converted'
        ).length;
        
        const conversionRate = totalLeads > 0 
            ? ((convertedLeads / totalLeads) * 100).toFixed(1)
            : 0;

        const statsData = {
            totalLeads,
            qualifiedLeads,
            convertedLeads,
            conversionRate
        };

        console.log('Calculated Stats:', statsData); // Debug log

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
        console.error('Get industry leads error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error while fetching leads' 
        });
    }
});

// @desc    Get single industry lead
// @route   GET /api/industry-leads/:id
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const lead = await IndustryLead.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Industry lead not found'
            });
        }

        res.json({
            success: true,
            data: lead
        });
    } catch (error) {
        console.error('Get industry lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching lead'
        });
    }
});

// @desc    Create new industry lead
// @route   POST /api/industry-leads
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const {
            contactName,
            clientEmail,
            jobTitle,
            companyName,
            companyWebsite,
            companyCountry,
            clientPhone,
            companyPhone,
            showName,
            showWebsite,
            showDate,
            attendeeCount,
            leadSource,
            leadStatus,
            isProspect,
            emailMessage,
            leadNotes,
            attachments
        } = req.body;

        // Validation
        if (!contactName || !clientEmail || !companyName || !leadSource) {
            return res.status(400).json({
                success: false,
                message: 'Contact name, email, company name, and lead source are required'
            });
        }

        // Check if email already exists for this user
        const existingLead = await IndustryLead.findOne({
            clientEmail: clientEmail.toLowerCase(),
            createdBy: req.user.id
        });

        if (existingLead) {
            return res.status(400).json({
                success: false,
                message: 'A lead with this email already exists'
            });
        }

        // Create new lead
        const lead = new IndustryLead({
            contactName,
            clientEmail: clientEmail.toLowerCase(),
            jobTitle,
            companyName,
            companyWebsite,
            companyCountry,
            clientPhone,
            companyPhone,
            showName,
            showWebsite,
            showDate,
            attendeeCount: attendeeCount || 0,
            leadSource,
            leadStatus: leadStatus || 'new',
            isProspect: isProspect || false,
            emailMessage,
            leadNotes,
            attachments: attachments || [],
            createdBy: req.user.id
        });

        await lead.save();

        res.status(201).json({
            success: true,
            message: 'Industry lead created successfully',
            data: lead
        });
    } catch (error) {
        console.error('Create industry lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating lead'
        });
    }
});

// @desc    Update industry lead
// @route   PUT /api/industry-leads/:id
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            contactName,
            clientEmail,
            jobTitle,
            companyName,
            companyWebsite,
            companyCountry,
            clientPhone,
            companyPhone,
            showName,
            showWebsite,
            showDate,
            attendeeCount,
            leadSource,
            leadStatus,
            isProspect,
            emailMessage,
            leadNotes,
            attachments
        } = req.body;

        // Find lead and verify ownership
        let lead = await IndustryLead.findOne({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Industry lead not found'
            });
        }

        // Check if email is being changed and if it already exists
        if (clientEmail && clientEmail !== lead.clientEmail) {
            const existingLead = await IndustryLead.findOne({
                clientEmail: clientEmail.toLowerCase(),
                createdBy: req.user.id,
                _id: { $ne: req.params.id }
            });

            if (existingLead) {
                return res.status(400).json({
                    success: false,
                    message: 'A lead with this email already exists'
                });
            }
        }

        // Update lead fields
        const updateFields = {
            contactName,
            jobTitle,
            companyName,
            companyWebsite,
            companyCountry,
            clientPhone,
            companyPhone,
            showName,
            showWebsite,
            showDate,
            attendeeCount,
            leadSource,
            leadStatus,
            isProspect,
            emailMessage,
            leadNotes,
            attachments
        };

        if (clientEmail) {
            updateFields.clientEmail = clientEmail.toLowerCase();
        }

        // Update lastContactDate if status changed to contacted
        if (leadStatus === 'contacted' && lead.leadStatus !== 'contacted') {
            updateFields.lastContactDate = new Date();
        }

        lead = await IndustryLead.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            message: 'Industry lead updated successfully',
            data: lead
        });
    } catch (error) {
        console.error('Update industry lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while updating lead'
        });
    }
});

// @desc    Delete industry lead
// @route   DELETE /api/industry-leads/:id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const lead = await IndustryLead.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id
        });

        if (!lead) {
            return res.status(404).json({
                success: false,
                message: 'Industry lead not found'
            });
        }

        res.json({
            success: true,
            message: 'Industry lead deleted successfully'
        });
    } catch (error) {
        console.error('Delete industry lead error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while deleting lead'
        });
    }
});

// @desc    Bulk update lead status
// @route   PATCH /api/industry-leads/bulk-status
// @access  Private
router.patch('/bulk-status', auth, async (req, res) => {
    try {
        const { leadIds, status } = req.body;

        if (!leadIds || !Array.isArray(leadIds) || !status) {
            return res.status(400).json({
                success: false,
                message: 'Lead IDs array and status are required'
            });
        }

        const updateData = { leadStatus: status };
        
        // Update lastContactDate if status is contacted
        if (status === 'contacted') {
            updateData.lastContactDate = new Date();
        }

        const result = await IndustryLead.updateMany(
            {
                _id: { $in: leadIds },
                createdBy: req.user.id
            },
            { $set: updateData }
        );

        res.json({
            success: true,
            message: `${result.modifiedCount} leads updated successfully`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Bulk update lead status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while bulk updating leads'
        });
    }
});

// @desc    Bulk delete leads
// @route   DELETE /api/industry-leads/bulk-delete
// @access  Private
router.delete('/bulk-delete', auth, async (req, res) => {
    try {
        const { leadIds } = req.body;

        if (!leadIds || !Array.isArray(leadIds)) {
            return res.status(400).json({
                success: false,
                message: 'Lead IDs array is required'
            });
        }

        const result = await IndustryLead.deleteMany({
            _id: { $in: leadIds },
            createdBy: req.user.id
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

// @desc    Export leads to CSV
// @route   GET /api/industry-leads/export/csv
// @access  Private
router.get('/export/csv', auth, async (req, res) => {
    try {
        const leads = await IndustryLead.find({ createdBy: req.user.id })
            .select('contactName clientEmail jobTitle companyName companyCountry clientPhone leadSource leadStatus createdAt')
            .sort({ createdAt: -1 });

        // Convert to CSV
        const headers = [
            'Contact Name',
            'Email',
            'Job Title',
            'Company',
            'Country',
            'Phone',
            'Source',
            'Status',
            'Created Date'
        ];

        const csvData = leads.map(lead => [
            `"${lead.contactName}"`,
            `"${lead.clientEmail}"`,
            `"${lead.jobTitle || ''}"`,
            `"${lead.companyName}"`,
            `"${lead.companyCountry || ''}"`,
            `"${lead.clientPhone || ''}"`,
            `"${lead.leadSource}"`,
            `"${lead.leadStatus}"`,
            `"${new Date(lead.createdAt).toLocaleDateString()}"`
        ]);

        const csvContent = [headers, ...csvData]
            .map(row => row.join(','))
            .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=industry_leads.csv');
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