const express = require('express');
const router = express.Router();
const Salary = require('../models/salary');
const authMiddleware = require('./authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get payslips with pagination and filtering
router.get('/payslips/table', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '',
      month = '',
      year = ''
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { employeeName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (month) {
      filter.month = month;
    }
    
    if (year) {
      filter.year = parseInt(year);
    }

    // Get payslips with pagination
    const payslips = await Salary.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('employeeId employeeName title month year basicPay specialAllowance taxDeduction workingDays lopDays createdAt');

    // Get total count for pagination
    const total = await Salary.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Calculate additional fields for each payslip
    const payslipsWithCalculations = payslips.map(payslip => {
      const totalEarnings = payslip.basicPay + payslip.specialAllowance;
      const dailyPay = payslip.workingDays > 0 ? payslip.basicPay / payslip.workingDays : 0;
      const lopDeduction = dailyPay * payslip.lopDays;
      const totalDeductions = payslip.taxDeduction + lopDeduction;
      const netPay = totalEarnings - totalDeductions;

      return {
        ...payslip.toObject(),
        totalEarnings,
        lopDeduction,
        totalDeductions,
        netPay
      };
    });

    res.json({
      success: true,
      data: payslipsWithCalculations,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalRecords: total,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching payslips table:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payslips'
    });
  }
});

// Generate new payslip
router.post('/generate', async (req, res) => {
  try {
    const {
      employeeId,
      employeeName,
      title,
      email,
      pan,
      accountNumber,
      workingDays,
      lopDays,
      basicPay,
      specialAllowance,
      taxDeduction
    } = req.body;

    // Validate required fields
    if (!employeeId || !employeeName || !basicPay || !specialAllowance) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const currentDate = new Date();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    // Check if payslip already exists for this month
    const existingPayslip = await Salary.findOne({
      employeeId,
      month,
      year
    });

    if (existingPayslip) {
      return res.status(400).json({
        success: false,
        message: 'Payslip already generated for this month'
      });
    }

    // Create new salary record
    const salary = new Salary({
      employeeId,
      employeeName,
      title,
      email,
      pan,
      accountNumber,
      workingDays: workingDays || 30,
      lopDays: lopDays || 0,
      basicPay,
      specialAllowance,
      taxDeduction: taxDeduction || 0,
      month,
      year
    });

    await salary.save();

    res.status(201).json({
      success: true,
      message: 'Payslip generated successfully',
      data: salary
    });

  } catch (error) {
    console.error('Error generating payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all payslips
router.get('/payslips', async (req, res) => {
  try {
    const payslips = await Salary.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: payslips
    });
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payslips'
    });
  }
});

// Get payslip by ID
router.get('/payslip/:id', async (req, res) => {
  try {
    const payslip = await Salary.findById(req.params.id);
    
    if (!payslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    res.json({
      success: true,
      data: payslip
    });
  } catch (error) {
    console.error('Error fetching payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payslip'
    });
  }
});

// Get payslips by employee ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    const payslips = await Salary.find({ employeeId: req.params.employeeId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: payslips
    });
  } catch (error) {
    console.error('Error fetching employee payslips:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching employee payslips'
    });
  }
});

// Update payslip
router.put('/payslip/:id', async (req, res) => {
  try {
    const updatedPayslip = await Salary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedPayslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    res.json({
      success: true,
      message: 'Payslip updated successfully',
      data: updatedPayslip
    });
  } catch (error) {
    console.error('Error updating payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating payslip',
      error: error.message
    });
  }
});

// Delete payslip
router.delete('/payslip/:id', async (req, res) => {
  try {
    const deletedPayslip = await Salary.findByIdAndDelete(req.params.id);

    if (!deletedPayslip) {
      return res.status(404).json({
        success: false,
        message: 'Payslip not found'
      });
    }

    res.json({
      success: true,
      message: 'Payslip deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payslip:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting payslip'
    });
  }
});

// Calculate salary summary
router.get('/summary', async (req, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();

    const summary = await Salary.aggregate([
      {
        $match: {
          month: currentMonth,
          year: currentYear
        }
      },
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          totalBasicPay: { $sum: '$basicPay' },
          totalAllowance: { $sum: '$specialAllowance' },
          totalTax: { $sum: '$taxDeduction' },
          totalNetPay: {
            $sum: {
              $subtract: [
                { $add: ['$basicPay', '$specialAllowance'] },
                { $add: ['$taxDeduction', { $multiply: [{ $divide: ['$basicPay', '$workingDays'] }, '$lopDays'] }] }
              ]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: summary[0] || {
        totalEmployees: 0,
        totalBasicPay: 0,
        totalAllowance: 0,
        totalTax: 0,
        totalNetPay: 0
      }
    });
  } catch (error) {
    console.error('Error calculating summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating salary summary'
    });
  }
});

module.exports = router;