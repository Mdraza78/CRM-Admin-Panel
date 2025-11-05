const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Register API
router.post('/register', async (req, res) => {
    const { name, username, email, password } = req.body;
    try {
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }
        user = new User({ name, username, email, password: await bcrypt.hash(password, 10) });
        await user.save();
        res.json({ msg: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login API - FIXED VERSION
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({
            $or: [{ email: username }, { username }]
        });
        if (!user) return res.status(400).json({ msg: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

        // FIX: Use simple, clean payload structure
        const payload = { 
            user: { 
                id: user.id
            } 
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // FIX: Send clean response
        res.json({ 
            token, 
            user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;