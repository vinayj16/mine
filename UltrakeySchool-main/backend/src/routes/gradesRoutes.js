import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Grade from '../models/Grade.js';
import User from '../models/User.js';

const router = express.Router();

// All grades routes require authentication
router.use(protect);

// Get all grades with filtering
router.get('/', async (req, res) => {
  try {
    const { academicYear, status, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { isDeleted: false };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (status) {
      query.status = status;
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [grades, total] = await Promise.all([
      Grade.find(query)
        .sort({ points: -1, displayOrder: 1 })
        .skip(skip)
        .limit(limitNum),
      Grade.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: grades,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch grades', error: error.message });
  }
});

// Get grade by percentage
router.get('/by-percentage', async (req, res) => {
  try {
    const { percentage, academicYear } = req.query;
    
    if (!percentage) {
      return res.status(400).json({ success: false, message: 'Percentage is required' });
    }

    let applicableGrades = await Grade.find({ isDeleted: false });

    if (academicYear) {
      applicableGrades = applicableGrades.filter(grade => grade.academicYear === academicYear);
    }

    const grade = applicableGrades.find(g => 
      parseFloat(percentage) >= g.marksFrom && 
      parseFloat(percentage) <= g.marksTo
    );

    if (!grade) {
      return res.status(404).json({ success: false, message: 'No grade found for given percentage' });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get grade by percentage', error: error.message });
  }
});

// Get grade statistics
router.get('/statistics', async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const query = { isDeleted: false };
    if (academicYear) query.academicYear = academicYear;
    
    const [
      total,
      active,
      inactive,
      gradeStats,
      avgPoints
    ] = await Promise.all([
      Grade.countDocuments(query),
      Grade.countDocuments({ ...query, status: 'active' }),
      Grade.countDocuments({ ...query, status: 'inactive' }),
      Grade.find(query).select('grade points marksFrom marksTo').sort({ points: -1 }),
      Grade.aggregate([
        { $match: query },
        { $group: { _id: null, avgPoints: { $avg: '$points' } } }
      ])
    ]);

    const stats = {
      total,
      active,
      inactive,
      gradeDistribution: gradeStats.map(g => ({
        grade: g.grade,
        points: g.points,
        range: `${g.marksFrom}% - ${g.marksTo}%`
      })),
      averagePoints: avgPoints.length > 0 ? avgPoints[0].avgPoints : 0
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single grade
router.get('/:id', async (req, res) => {
  try {
    const grade = await Grade.findOne({ gradeId: req.params.id, isDeleted: false });
    
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    res.json({
      success: true,
      data: grade
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch grade', error: error.message });
  }
});

// Create new grade
router.post('/', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const { grade, marksFrom, marksTo, percentage, points, status, description, academicYear, institutionId, displayOrder } = req.body;
    
    const gradeData = {
      grade,
      marksFrom,
      marksTo,
      percentage,
      points: points || 0,
      status: status || 'active',
      description,
      academicYear,
      institutionId,
      displayOrder: displayOrder || 0,
      metadata: {
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    };

    const newGrade = new Grade(gradeData);
    await newGrade.save();

    res.status(201).json({
      success: true,
      data: newGrade,
      message: 'Grade created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create grade', error: error.message });
  }
});

// Update grade
router.put('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const grade = await Grade.findOneAndUpdate(
      { gradeId: req.params.id, isDeleted: false },
      { 
        ...req.body, 
        'metadata.updatedBy': req.user.id 
      },
      { new: true, runValidators: true }
    );
    
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    res.json({
      success: true,
      data: grade,
      message: 'Grade updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update grade', error: error.message });
  }
});

// Delete grade
router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const grade = await Grade.findOneAndUpdate(
      { gradeId: req.params.id, isDeleted: false },
      { isDeleted: true, 'metadata.updatedBy': req.user.id },
      { new: true }
    );
    
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    res.json({
      success: true,
      message: 'Grade deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete grade', error: error.message });
  }
});

// Update grade status
router.patch('/:id/status', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const grade = await Grade.findOneAndUpdate(
      { gradeId: req.params.id, isDeleted: false },
      { 
        status, 
        'metadata.updatedBy': req.user.id 
      },
      { new: true }
    );
    
    if (!grade) {
      return res.status(404).json({ success: false, message: 'Grade not found' });
    }

    res.json({
      success: true,
      data: grade,
      message: 'Grade status updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update grade status', error: error.message });
  }
});

export default router;
