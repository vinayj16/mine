import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import StudentResult from '../models/StudentResult.js';
import User from '../models/User.js';

const router = express.Router();

// All results routes require authentication
router.use(protect);

// Get results by school
router.get('/schools/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { academicYear, status, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { schoolId };
    
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

    const [results, total] = await Promise.all([
      StudentResult.find(query)
        .populate('studentId', 'name rollNumber')
        .populate('examId', 'name type')
        .populate('classId', 'name section')
        .populate('subjects.subjectId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      StudentResult.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch school results', error: error.message });
  }
});

// Get all results with filtering
router.get('/', async (req, res) => {
  try {
    const { studentId, classId, examId, academicYear, term, status, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = {};
    
    if (studentId) {
      query.studentId = studentId;
    }
    if (classId) {
      query.classId = classId;
    }
    if (examId) {
      query.examId = examId;
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (term) {
      query.term = term;
    }
    if (status) {
      query.status = status;
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [results, total] = await Promise.all([
      StudentResult.find(query)
        .populate('studentId', 'name rollNumber')
        .populate('examId', 'name type')
        .populate('classId', 'name section')
        .populate('subjects.subjectId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      StudentResult.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: results,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch results', error: error.message });
  }
});

// Get result statistics
router.get('/statistics', async (req, res) => {
  try {
    const { classId, examId, academicYear } = req.query;
    
    const query = {};
    if (classId) query.classId = classId;
    if (examId) query.examId = examId;
    if (academicYear) query.academicYear = academicYear;
    
    const [
      total,
      published,
      draft,
      archived,
      percentageStats,
      gradeStats
    ] = await Promise.all([
      StudentResult.countDocuments(query),
      StudentResult.countDocuments({ ...query, status: 'published' }),
      StudentResult.countDocuments({ ...query, status: 'draft' }),
      StudentResult.countDocuments({ ...query, status: 'archived' }),
      StudentResult.aggregate([
        { $match: query },
        { $group: { _id: null, avgPercentage: { $avg: '$percentage' }, maxPercentage: { $max: '$percentage' }, minPercentage: { $min: '$percentage' } } }
      ]),
      StudentResult.aggregate([
        { $match: query },
        { $group: { _id: '$overallGrade', count: { $sum: 1 } } }
      ])
    ]);

    const stats = percentageStats.length > 0 ? percentageStats[0] : { avgPercentage: 0, maxPercentage: 0, minPercentage: 0 };
    
    const gradeDistribution = gradeStats.reduce((acc, grade) => {
      acc[grade._id || 'N/A'] = grade.count;
      return acc;
    }, {});

    const result = {
      total,
      published,
      draft,
      archived,
      averagePercentage: stats.avgPercentage,
      highestPercentage: stats.maxPercentage,
      lowestPercentage: stats.minPercentage,
      gradeDistribution
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single result
router.get('/:id', async (req, res) => {
  try {
    const result = await StudentResult.findById(req.params.id)
      .populate('studentId', 'name rollNumber')
      .populate('examId', 'name type')
      .populate('classId', 'name section')
      .populate('subjects.subjectId', 'name code');
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch result', error: error.message });
  }
});

// Create new result
router.post('/', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const { schoolId, studentId, classId, examId, academicYear, term, subjects, totalMarksObtained, totalMaxMarks, percentage, overallGrade, rank, attendance, teacherRemarks, principalRemarks } = req.body;
    
    const resultData = {
      schoolId,
      studentId,
      classId,
      examId,
      academicYear,
      term,
      subjects: subjects || [],
      totalMarksObtained,
      totalMaxMarks,
      percentage,
      overallGrade,
      rank,
      attendance: attendance || { present: 0, total: 0, percentage: 0 },
      teacherRemarks,
      principalRemarks,
      status: 'draft'
    };

    const newResult = new StudentResult(resultData);
    await newResult.save();
    
    // Populate references
    await newResult.populate('studentId', 'name rollNumber');
    await newResult.populate('examId', 'name type');
    await newResult.populate('classId', 'name section');
    await newResult.populate('subjects.subjectId', 'name code');

    res.status(201).json({
      success: true,
      data: newResult,
      message: 'Result created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create result', error: error.message });
  }
});

// Update result
router.put('/:id', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const result = await StudentResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('studentId', 'name rollNumber')
      .populate('examId', 'name type')
      .populate('classId', 'name section')
      .populate('subjects.subjectId', 'name code');
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({
      success: true,
      data: result,
      message: 'Result updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update result', error: error.message });
  }
});

// Delete result
router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const result = await StudentResult.findByIdAndDelete(req.params.id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete result', error: error.message });
  }
});

// Publish result
router.patch('/:id/publish', async (req, res) => {
  try {
    const result = await StudentResult.findByIdAndUpdate(
      req.params.id,
      { status: 'published', publishedDate: new Date() },
      { new: true }
    )
      .populate('studentId', 'name rollNumber')
      .populate('examId', 'name type')
      .populate('classId', 'name section')
      .populate('subjects.subjectId', 'name code');
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    res.json({
      success: true,
      data: result,
      message: 'Result published successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to publish result', error: error.message });
  }
});

export default router;
