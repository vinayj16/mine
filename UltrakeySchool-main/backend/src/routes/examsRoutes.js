import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';

const router = express.Router();

// All exams routes require authentication
router.use(protect);

// Get all exams with filtering
router.get('/', async (req, res) => {
  try {
    const { classId, subjectId, type, status, academicYear, term, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (classId) {
      query.classId = classId;
    }
    if (subjectId) {
      query.subjectId = subjectId;
    }
    if (type) {
      query.type = type;
    }
    if (status) {
      query.status = status;
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }
    if (term) {
      query.term = term;
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .populate('classId', 'name section')
        .populate('subjectId', 'name code')
        .populate('invigilator', 'name email')
        .sort({ examDate: 1 })
        .skip(skip)
        .limit(limitNum),
      Exam.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: exams,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exams', error: error.message });
  }
});

// Get exam statistics
router.get('/statistics', async (req, res) => {
  try {
    const { classId, academicYear, term } = req.query;
    
    const query = { isActive: true };
    if (classId) query.classId = classId;
    if (academicYear) query.academicYear = academicYear;
    if (term) query.term = term;
    
    const [
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      typeStats,
      upcoming,
      past
    ] = await Promise.all([
      Exam.countDocuments(query),
      Exam.countDocuments({ ...query, status: 'scheduled' }),
      Exam.countDocuments({ ...query, status: 'in_progress' }),
      Exam.countDocuments({ ...query, status: 'completed' }),
      Exam.countDocuments({ ...query, status: 'cancelled' }),
      Exam.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Exam.countDocuments({ ...query, examDate: { $gt: new Date() } }),
      Exam.countDocuments({ ...query, examDate: { $lte: new Date() } })
    ]);

    const byType = typeStats.reduce((acc, type) => {
      acc[type._id] = type.count;
      return acc;
    }, {});

    const stats = {
      total,
      scheduled,
      inProgress,
      completed,
      cancelled,
      byType,
      upcoming,
      past
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single exam
router.get('/:id', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilator', 'name email')
      .populate('attendance.studentId', 'name rollNumber');
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam', error: error.message });
  }
});

// Create new exam
router.post('/', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const { schoolId, classId, subjectId, title, type, examDate, startTime, endTime, duration, totalMarks, passingMarks, instructions, roomNumber, invigilator, academicYear, term } = req.body;
    
    const examData = {
      schoolId,
      classId,
      subjectId,
      title,
      type: type || 'written',
      examDate,
      startTime,
      endTime,
      duration,
      totalMarks,
      passingMarks,
      instructions,
      roomNumber,
      invigilator,
      attendance: [],
      academicYear,
      term,
      status: 'scheduled'
    };

    const newExam = new Exam(examData);
    await newExam.save();
    
    // Populate references
    await newExam.populate('classId', 'name section');
    await newExam.populate('subjectId', 'name code');
    await newExam.populate('invigilator', 'name email');

    res.status(201).json({
      success: true,
      data: newExam,
      message: 'Exam created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
  }
});

// Update exam
router.put('/:id', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilator', 'name email');
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({
      success: true,
      data: exam,
      message: 'Exam updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update exam', error: error.message });
  }
});

// Delete exam
router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete exam', error: error.message });
  }
});

// Update exam attendance
router.patch('/:id/attendance', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const { attendance } = req.body;
    
    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      { attendance: attendance || [] },
      { new: true }
    )
      .populate('attendance.studentId', 'name rollNumber');
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    res.json({
      success: true,
      data: exam,
      message: 'Exam attendance updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update exam attendance', error: error.message });
  }
});

export default router;
