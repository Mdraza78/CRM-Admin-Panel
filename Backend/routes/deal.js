const express = require('express');
const router = express.Router();
const Deal = require('../models/deal');
const auth = require('./authMiddleware')
const mongoose = require('mongoose');

// Get all deals for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      stage,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { createdBy: req.user.id };
    
    // Apply filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { primaryContact: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (stage) query.stage = stage;
    if (priority) query.priority = priority;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const deals = await Deal.find(query)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'name email');

    const total = await Deal.countDocuments(query);

    res.json({
      deals,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single deal
router.get('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findOne({ 
      _id: new mongoose.Types.ObjectId(req.params.id), 
      createdBy: new mongoose.Types.ObjectId(req.user.id) 
    }).populate('createdBy', 'name email');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete deal
router.delete('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findOneAndDelete({ 
      _id: new mongoose.Types.ObjectId(req.params.id), 
      createdBy: new mongoose.Types.ObjectId(req.user.id) 
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new deal
router.post('/', auth, async (req, res) => {
  try {
    console.log('Received deal data:', req.body);

    const dealData = {
      ...req.body,
      createdBy: new mongoose.Types.ObjectId(req.user.id)
    };

    const deal = new Deal(dealData);
    await deal.save();

    // Add creation activity with a VALID enum value
    deal.activities.push({
      type: 'Proposal', // Use a valid enum value instead of 'Deal Created'
      description: 'Deal was created in the system',
      date: new Date(),
      isPast: true
    });

    await deal.save();
    await deal.populate('createdBy', 'name email');

    res.status(201).json(deal);
  } catch (error) {
    console.error('Create deal error details:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message,
          value: e.value
        }))
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update deal
router.put('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findOneAndUpdate(
      { 
        _id: new mongoose.Types.ObjectId(req.params.id), 
        createdBy: new mongoose.Types.ObjectId(req.user.id) 
      },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json(deal);
  } catch (error) {
    console.error('Update deal error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: Object.values(error.errors).map(e => ({
          field: e.path,
          message: e.message,
          value: e.value
        }))
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete deal
router.delete('/:id', auth, async (req, res) => {
  try {
    const deal = await Deal.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add activity to deal
router.post('/:id/activities', auth, async (req, res) => {
  try {
    const { type, description, date, isPast = true } = req.body;

    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    deal.activities.push({
      type,
      description,
      date: date || new Date(),
      isPast
    });

    await deal.save();
    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update deal stage
router.patch('/:id/stage', auth, async (req, res) => {
  try {
    const { stage } = req.body;

    if (!['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'].includes(stage)) {
      return res.status(400).json({ message: 'Invalid stage' });
    }

    const deal = await Deal.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    const oldStage = deal.stage;
    deal.stage = stage;

    // Add stage change activity
    deal.activities.push({
      type: stage === 'Won' ? 'Deal Won' : stage === 'Lost' ? 'Deal Lost' : 'Stage Updated',
      description: `Deal moved from ${oldStage} to ${stage}`,
      date: new Date(),
      isPast: true
    });

    await deal.save();
    await deal.populate('createdBy', 'name email');

    res.json(deal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get deal statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const stats = await Deal.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          totalValue: { $sum: '$value' },
          wonDeals: { $sum: { $cond: [{ $eq: ['$stage', 'Won'] }, 1, 0] } },
          lostDeals: { $sum: { $cond: [{ $eq: ['$stage', 'Lost'] }, 1, 0] } },
          activeDeals: { $sum: { $cond: [{ $in: ['$stage', ['Prospecting', 'Qualification', 'Proposal', 'Negotiation']] }, 1, 0] } }
        }
      }
    ]);

    const stageStats = await Deal.aggregate([
      { $match: { createdBy: mongoose.Types.ObjectId(req.user.id) } },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalValue: { $sum: '$value' }
        }
      }
    ]);

    res.json({
      overview: stats[0] || { totalDeals: 0, totalValue: 0, wonDeals: 0, lostDeals: 0, activeDeals: 0 },
      byStage: stageStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Export deals
router.get('/export/csv', auth, async (req, res) => {
  try {
    const deals = await Deal.find({ createdBy: req.user.id })
      .select('title companyName value stage closeDate priority assignedOwner contactEmail contactPhone winProbability grossMargin createdAt updatedAt')
      .sort({ createdAt: -1 });

    const csvHeaders = 'Title,Company,Value,Stage,Close Date,Priority,Owner,Contact Email,Phone,Win Probability,Gross Margin,Created,Modified\n';
    
    const csvData = deals.map(deal => 
      `"${deal.title}","${deal.companyName}",${deal.value},"${deal.stage}","${deal.closeDate.toISOString().split('T')[0]}","${deal.priority}","${deal.assignedOwner || ''}","${deal.contactEmail || ''}","${deal.contactPhone || ''}",${deal.winProbability || ''},${deal.grossMargin || ''},"${deal.createdAt.toISOString()}","${deal.updatedAt.toISOString()}"`
    ).join('\n');

    const csvContent = csvHeaders + csvData;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=deals_export_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;