const express = require('express');
const Contact = require('../models/Contacts');
const router = express.Router();

// Simple user identification middleware
const userMiddleware = (req, res, next) => {
    // Get user ID from header (sent from frontend)
    const userId = req.headers['user-id'];
    
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: 'User ID is required'
        });
    }
    
    req.userId = userId;
    next();
};

// Apply user middleware to all routes
router.use(userMiddleware);

// @desc    Get all contacts for current user
// @route   GET /api/contacts
// @access  Private (by user ID)
router.get('/', async (req, res) => {
    try {
        const {
            search,
            status,
            owner,
            page = 1,
            limit = 50,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        console.log("🔍 Fetching contacts for user:", req.userId);

        // Build query - only get contacts for current user
        let query = { createdBy: req.userId, isActive: true };

        // Search in multiple fields
        if (search && search.trim() !== '') {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { company: searchRegex },
                { jobTitle: searchRegex }
            ];
        }

        // Filter by status
        if (status && status !== '') {
            query.status = status;
        }

        // Filter by owner
        if (owner && owner !== '') {
            query.owner = owner;
        }

        // Sort configuration
        const sortConfig = {};
        let sortField = sortBy;
        
        if (sortBy === 'name') {
            sortField = 'lastName';
        }
        
        sortConfig[sortField] = sortOrder === 'desc' ? -1 : 1;

        // Execute query with pagination
        const contacts = await Contact.find(query)
            .sort(sortConfig)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        // Get total count for pagination
        const total = await Contact.countDocuments(query);

        console.log(`✅ Found ${contacts.length} contacts for user ${req.userId}`);

        res.json({
            success: true,
            count: contacts.length,
            total,
            pagination: {
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            },
            data: contacts
        });
    } catch (error) {
        console.error('❌ Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contacts',
            error: error.message
        });
    }
});

// @desc    Get single contact
// @route   GET /api/contacts/:id
// @access  Private
router.get('/:id', async (req, res) => {
    try {
        const contact = await Contact.findOne({ 
            _id: req.params.id, 
            createdBy: req.userId 
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        res.json({
            success: true,
            data: contact
        });
    } catch (error) {
        console.error('❌ Get contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching contact',
            error: error.message
        });
    }
});

// @desc    Create new contact
// @route   POST /api/contacts
// @access  Private
router.post('/', async (req, res) => {
    try {
        console.log("📝 Creating contact for user:", req.userId);
        console.log("Contact data:", req.body);
        
        // Add createdBy field from user ID
        const contactData = {
            ...req.body,
            createdBy: req.userId
        };

        // Set default values for required fields if not provided
        if (!contactData.status) {
            contactData.status = 'Lead';
        }
        if (!contactData.owner) {
            contactData.owner = 'Unassigned';
        }

        const contact = await Contact.create(contactData);
        console.log("✅ Contact created successfully:", contact._id);

        res.status(201).json({
            success: true,
            message: 'Contact created successfully',
            data: contact
        });
    } catch (error) {
        console.error('❌ Create contact error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Contact with this email already exists'
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating contact',
            error: error.message
        });
    }
});

// @desc    Update contact
// @route   PUT /api/contacts/:id
// @access  Private
router.put('/:id', async (req, res) => {
    try {
        console.log("✏️ Updating contact:", req.params.id, "for user:", req.userId);
        console.log("Update data:", req.body);
        
        let contact = await Contact.findOne({ 
            _id: req.params.id, 
            createdBy: req.userId 
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        contact = await Contact.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.userId },
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        console.log("✅ Contact updated successfully");

        res.json({
            success: true,
            message: 'Contact updated successfully',
            data: contact
        });
    } catch (error) {
        console.error('❌ Update contact error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Contact with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error updating contact',
            error: error.message
        });
    }
});

// @desc    Delete contact (soft delete)
// @route   DELETE /api/contacts/:id
// @access  Private
router.delete('/:id', async (req, res) => {
    try {
        console.log("🗑️ Deleting contact:", req.params.id, "for user:", req.userId);
        
        const contact = await Contact.findOne({ 
            _id: req.params.id, 
            createdBy: req.userId 
        });

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact not found'
            });
        }

        // Soft delete by setting isActive to false
        await Contact.findOneAndUpdate(
            { _id: req.params.id, createdBy: req.userId },
            { isActive: false }
        );
        
        console.log("✅ Contact deleted successfully");

        res.json({
            success: true,
            message: 'Contact deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting contact',
            error: error.message
        });
    }
});

// @desc    Get available owners for dropdown
// @route   GET /api/contacts/owners/list
// @access  Private
router.get('/owners/list', async (req, res) => {
    try {
        const owners = await Contact.distinct('owner', { 
            createdBy: req.userId, 
            isActive: true 
        });
        
        console.log("👥 Available owners for user:", owners);
        
        res.json({
            success: true,
            data: owners.filter(owner => owner).sort()
        });
    } catch (error) {
        console.error('❌ Get owners error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching owners list',
            error: error.message
        });
    }
});

module.exports = router;