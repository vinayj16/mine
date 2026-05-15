import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Leave from '../models/Leave.js';
import User from '../models/User.js';

const router = express.Router();

// All leave reports routes require authentication
router.use(protect);

// Get all leave reports with filtering
router.get('/', async (req, res) => {
  try {
    const { staffId, status, leaveType, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    // If admin, allow filtering by any staffId
    if (staffId && ['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.staffId = staffId;
    } else if (!['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      // Non-admin users can only see their own reports
      query.staffId = req.user.id;
    }
    
    if (status) {
      query.status = status;
    }
    if (leaveType) {
      query.leaveType = leaveType;
    }
    if (startDate && endDate) {
      query.startDate = { $gte: startDate };
      query.endDate = { $lte: endDate };
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [reports, total] = await Promise.all([
      Leave.find(query)
        .sort({ appliedOn: -1 })
        .skip(skip)
        .limit(limitNum),
      Leave.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: reports,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave reports', error: error.message });
  }
});

// Get leave statistics for a school
router.get('/schools/:schoolId/statistics', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYear } = req.query;
    
    let schoolReports = await Leave.find({ schoolId, academicYear });

    const stats = {
      total: schoolReports.length,
      approved: schoolReports.filter(r => r.status === 'approved').length,
      pending: schoolReports.filter(r => r.status === 'pending').length,
      rejected: schoolReports.filter(r => r.status === 'rejected').length,
      totalDays: schoolReports.reduce((sum, r) => sum + r.daysCount, 0),
      byLeaveType: {
        sick: schoolReports.filter(r => r.leaveType === 'sick').length,
        casual: schoolReports.filter(r => r.leaveType === 'casual').length,
        annual: schoolReports.filter(r => r.leaveType === 'annual').length,
        maternity: schoolReports.filter(r => r.leaveType === 'maternity').length,
        paternity: schoolReports.filter(r => r.leaveType === 'paternity').length
      },
      byEmployeeType: {
        teacher: schoolReports.filter(r => r.employeeType === 'teacher').length,
        staff: schoolReports.filter(r => r.employeeType === 'staff').length,
        admin: schoolReports.filter(r => r.employeeType === 'admin').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave statistics', error: error.message });
  }
});

// Get leave statistics
router.get('/statistics', async (req, res) => {
  try {
    const query = {};
    
    // If admin, allow filtering by any staffId
    if (req.query.staffId && ['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.staffId = req.query.staffId;
    } else if (!['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      // Non-admin users can only see their own statistics
      query.staffId = req.user.id;
    }
    
    const [
      total,
      pending,
      approved,
      rejected,
      cancelled,
      typeStats,
      totalDaysAgg,
      approvedDaysAgg
    ] = await Promise.all([
      Leave.countDocuments(query),
      Leave.countDocuments({ ...query, status: 'pending' }),
      Leave.countDocuments({ ...query, status: 'approved' }),
      Leave.countDocuments({ ...query, status: 'rejected' }),
      Leave.countDocuments({ ...query, status: 'cancelled' }),
      Leave.aggregate([
        { $match: query },
        { $group: { _id: '$leaveType', count: { $sum: 1 } } }
      ]),
      Leave.aggregate([
        { $match: query },
        { $group: { _id: null, totalDays: { $sum: '$days' } } }
      ]),
      Leave.aggregate([
        { $match: { ...query, status: 'approved' } },
        { $group: { _id: null, approvedDays: { $sum: '$days' } } }
      ])
    ]);

    const totalDays = totalDaysAgg.length > 0 ? totalDaysAgg[0].totalDays : 0;
    const approvedDays = approvedDaysAgg.length > 0 ? approvedDaysAgg[0].approvedDays : 0;
    
    const byType = typeStats.reduce((acc, type) => {
      acc[type._id] = type.count;
      return acc;
    }, {});

    const stats = {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      byType,
      totalDays,
      approvedDays
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single leave report
router.get('/:id', async (req, res) => {
  try {
    const query = { leaveId: req.params.id };
    
    // If not admin, only allow user's own reports
    if (!['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.staffId = req.user.id;
    }
    
    const report = await Leave.findOne(query);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Leave report not found' });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch leave report', error: error.message });
  }
});

// Create new leave report
router.post('/', async (req, res) => {
  try {
    const { staffId, staffName, leaveType, startDate, endDate, days, reason, documents } = req.body;
    
    const reportData = {
      leaveId: `LR${Date.now()}`,
      staffId: staffId || req.user.id,
      staffName: staffName || req.user.name,
      leaveType,
      startDate,
      endDate,
      days,
      reason,
      documents: documents || [],
      status: 'pending',
      appliedOn: new Date()
    };

    const newReport = new Leave(reportData);
    await newReport.save();

    res.status(201).json({
      success: true,
      data: newReport,
      message: 'Leave report created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create leave report', error: error.message });
  }
});

// Update leave report
router.put('/:id', async (req, res) => {
  try {
    const query = { leaveId: req.params.id };
    
    // If not admin, only allow user's own reports
    if (!['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.staffId = req.user.id;
    }
    
    const report = await Leave.findOne(query);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Leave report not found' });
    }

    // Update allowed fields
    const allowedFields = ['leaveType', 'startDate', 'endDate', 'days', 'reason', 'documents'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });
    
    await report.save();

    res.json({
      success: true,
      data: report,
      message: 'Leave report updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update leave report', error: error.message });
  }
});

// Delete leave report
router.delete('/:id', async (req, res) => {
  try {
    const query = { leaveId: req.params.id };
    
    // If not admin, only allow user's own reports
    if (!['admin', 'principal', 'institution_admin'].includes(req.user.role)) {
      query.staffId = req.user.id;
    }
    
    const report = await Leave.findOne(query);
    
    if (!report) {
      return res.status(404).json({ success: false, message: 'Leave report not found' });
    }

    await Leave.deleteOne(query);

    res.json({
      success: true,
      message: 'Leave report deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete leave report', error: error.message });
  }
});

export default router;
