const express = require('express');
const router = express.Router();
const auth = require('./authMiddleware');
const User = require('../models/user');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/profile-pictures/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'user-' + req.user.id + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Update user profile with image
router.put('/update', auth, upload.single('profilePicture'), async (req, res) => {
    const { name, username, email, currentPassword, newPassword } = req.body;
    
    console.log('PUT /update - Request body:', req.body);
    console.log('PUT /update - User ID:', req.user.id);
    console.log('PUT /update - File:', req.file);
    
    try {
        let user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Build update object
        const updateFields = {};
        
        // Update basic fields if provided
        if (name) updateFields.name = name;
        if (username) updateFields.username = username;
        if (email) updateFields.email = email;

        // Handle profile picture upload
        if (req.file) {
            updateFields.profilePicture = {
                url: `/uploads/profile-pictures/${req.file.filename}`,
                publicId: req.file.filename
            };
        }

        console.log('Update fields:', updateFields);

        // Check if username or email already exists (excluding current user)
        if (username && username !== user.username) {
            const existingUser = await User.findOne({ 
                username, 
                _id: { $ne: req.user.id } 
            });
            if (existingUser) {
                return res.status(400).json({ msg: 'Username already exists' });
            }
        }

        if (email && email !== user.email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: req.user.id } 
            });
            if (existingUser) {
                return res.status(400).json({ msg: 'Email already exists' });
            }
        }

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ msg: 'Current password is required to set new password' });
            }
            
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Current password is incorrect' });
            }
            
            // Validate new password
            if (newPassword.length < 6) {
                return res.status(400).json({ msg: 'Password must be at least 6 characters long' });
            }
            
            updateFields.password = await bcrypt.hash(newPassword, 10);
        }

        // Update user
        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).select('-password');

        console.log('User updated successfully:', user);

        res.json({
            msg: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ msg: 'Server error: ' + error.message });
    }
});

// Get user profile
router.get('/me', auth, async (req, res) => {
    try {
        console.log('GET /me - User ID:', req.user.id);
        const user = await User.findById(req.user.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;