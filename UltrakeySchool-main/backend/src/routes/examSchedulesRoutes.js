import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import ExamSchedule from '../models/ExamSchedule.js';
import User from '../models/User.js';

const router = express.Router();

// All exam schedules routes require authentication
router.use(protect);

// Get all exam schedules with filtering
router.get('/', async (req, res) => {
  try {
    const { classId, subjectId, examDate, status, academicYear, page = 1, limit = 20 } = req.query;
    
    // Build query
    const query = { isDeleted: false };
    
    if (classId) {
      query.classId = classId;
    }
    if (subjectId) {
      query.subjectId = subjectId;
    }
    if (examDate) {
      query.examDate = new Date(examDate);
    }
    if (status) {
      query.status = status;
    }
    if (academicYear) {
      query.academicYear = academicYear;
    }

    // Apply pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [schedules, total] = await Promise.all([
      ExamSchedule.find(query)
        .populate('classId', 'name section')
        .populate('subjectId', 'name code')
        .populate('invigilatorId', 'name email')
        .sort({ examDate: 1, startTime: 1 })
        .skip(skip)
        .limit(limitNum),
      ExamSchedule.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: schedules,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam schedules', error: error.message });
  }
});

// Get exam schedules by date range
router.get('/by-date-range', async (req, res) => {
  try {
    const { startDate, endDate, schoolId, classId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and end date are required' });
    }

    const query = { isDeleted: false };
    if (schoolId) query.schoolId = schoolId;
    if (classId) query.classId = classId;
    query.examDate = { $gte: new Date(startDate), $lte: new Date(endDate) };

    const schedules = await ExamSchedule.find(query)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilatorId', 'name email')
      .sort({ examDate: 1, startTime: 1 });

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam schedules by date range', error: error.message });
  }
});

// Get exam schedule statistics
router.get('/statistics', async (req, res) => {
  try {
    const { academicYear } = req.query;
    
    const query = { isDeleted: false };
    if (academicYear) query.academicYear = academicYear;
    
    const [
      total,
      active,
      inactive,
      completed,
      cancelled,
      upcoming,
      past,
      subjectStats,
      classStats
    ] = await Promise.all([
      ExamSchedule.countDocuments(query),
      ExamSchedule.countDocuments({ ...query, status: 'active' }),
      ExamSchedule.countDocuments({ ...query, status: 'inactive' }),
      ExamSchedule.countDocuments({ ...query, status: 'completed' }),
      ExamSchedule.countDocuments({ ...query, status: 'cancelled' }),
      ExamSchedule.countDocuments({ ...query, examDate: { $gt: new Date() } }),
      ExamSchedule.countDocuments({ ...query, examDate: { $lte: new Date() } }),
      ExamSchedule.aggregate([
        { $match: query },
        { $group: { _id: '$subject', count: { $sum: 1 } } }
      ]),
      ExamSchedule.aggregate([
        { $match: query },
        { $group: { _id: '$className', count: { $sum: 1 } } }
      ])
    ]);

    const bySubject = subjectStats.reduce((acc, subject) => {
      acc[subject._id] = subject.count;
      return acc;
    }, {});

    const byClass = classStats.reduce((acc, className) => {
      acc[className._id] = className.count;
      return acc;
    }, {});

    const stats = {
      total,
      active,
      inactive,
      completed,
      cancelled,
      upcoming,
      past,
      bySubject,
      byClass
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch statistics', error: error.message });
  }
});

// Get single exam schedule
router.get('/:id', async (req, res) => {
  try {
    const schedule = await ExamSchedule.findOne({ scheduleId: req.params.id, isDeleted: false })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilatorId', 'name email');
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch exam schedule', error: error.message });
  }
});

// Create new exam schedule
router.post('/', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const { examId, examName, classId, className, section, subject, subjectId, examDate, startTime, endTime, duration, roomNo, maxMarks, minMarks, status, academicYear, institutionId, invigilator, invigilatorId, instructions } = req.body;
    
    const scheduleData = {
      examId,
      examName,
      classId,
      className,
      section,
      subject,
      subjectId,
      examDate,
      startTime,
      endTime,
      duration,
      roomNo,
      maxMarks,
      minMarks,
      status: status || 'active',
      academicYear,
      institutionId,
      invigilator,
      invigilatorId,
      instructions,
      metadata: {
        createdBy: req.user.id,
        updatedBy: req.user.id
      }
    };

    const newSchedule = new ExamSchedule(scheduleData);
    await newSchedule.save();
    
    // Populate references
    await newSchedule.populate('classId', 'name section');
    await newSchedule.populate('subjectId', 'name code');
    await newSchedule.populate('invigilatorId', 'name email');

    res.status(201).json({
      success: true,
      data: newSchedule,
      message: 'Exam schedule created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create exam schedule', error: error.message });
  }
});

// Update exam schedule
router.put('/:id', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const schedule = await ExamSchedule.findOneAndUpdate(
      { scheduleId: req.params.id, isDeleted: false },
      { 
        ...req.body, 
        'metadata.updatedBy': req.user.id 
      },
      { new: true, runValidators: true }
    )
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilatorId', 'name email');
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    res.json({
      success: true,
      data: schedule,
      message: 'Exam schedule updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update exam schedule', error: error.message });
  }
});

// Delete exam schedule
router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const schedule = await ExamSchedule.findOneAndUpdate(
      { scheduleId: req.params.id, isDeleted: false },
      { isDeleted: true, 'metadata.updatedBy': req.user.id },
      { new: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    res.json({
      success: true,
      message: 'Exam schedule deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete exam schedule', error: error.message });
  }
});

// Update exam schedule status
router.patch('/:id/status', authorize(['admin', 'principal', 'institution_admin', 'teacher']), async (req, res) => {
  try {
    const { status } = req.body;
    
    const schedule = await ExamSchedule.findOneAndUpdate(
      { scheduleId: req.params.id, isDeleted: false },
      { 
        status, 
        'metadata.updatedBy': req.user.id 
      },
      { new: true }
    )
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilatorId', 'name email');
    
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Exam schedule not found' });
    }

    res.json({
      success: true,
      data: schedule,
      message: 'Exam schedule status updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update exam schedule status', error: error.message });
  }
});

export default router;
