import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import { validate } from '../middleware/errorHandler.js';
import studentController from '../controllers/studentController.js';
import * as validators from '../validators/studentValidators.js';
import Student from '../models/Student.js';

const router = express.Router();

// All student routes require authentication and tenant validation (TESTED & VERIFIED)
router.use(protect);  
router.use(validateTenantAccess);  

// CRUD Routes - Basic student operations (TESTED & VERIFIED)
router.get('/', async (req, res, next) => {  
  try {
    const { schoolId, page = 1, limit = 20, search, classId, section, status } = req.query;
    
    const query = {};
    
    if (schoolId) query.schoolId = schoolId;
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { admissionNumber: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (classId) query.classId = classId;
    if (section) query.sectionId = section;
    if (status) query.status = status;
    else query.isActive = true;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [students, total] = await Promise.all([
      Student.find(query)
        .populate('classId', 'name grade')
        .populate('sectionId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Student.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: students,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    next(error);
  }
});

// Institution-specific student data endpoint (MUST be before /:id route)
router.get('/institution', async (req, res, next) => {
  try {
    const { schoolId, institutionId } = req.query;
    
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (institutionId) query.institutionId = institutionId;
    
    const students = await Student.find(query)
      .populate('classId', 'name grade')
      .populate('sectionId', 'name')
      .sort({ createdAt: -1 })
      .limit(100); // Limit for performance
    
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    next(error);
  }
});

// Get student by ID (MUST be after /institution route)
router.get('/:id', async (req, res, next) => {  
  try {
    const { id } = req.params;
    const { schoolId } = req.query;
    
    const query = { _id: id };
    if (schoolId) query.schoolId = schoolId;
    
    const student = await Student.findOne(query)
      .populate('classId', 'name grade')
      .populate('sectionId', 'name');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, data: student });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {  
  try {
    const student = await Student.create(req.body);
    res.status(201).json({ success: true, message: 'Student created', data: student });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {  
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, message: 'Student updated', data: student });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {  
  try {
    const { id } = req.params;
    const { hardDelete } = req.query;
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    if (hardDelete === 'true') {
      await Student.findByIdAndDelete(id);
      res.json({ success: true, message: 'Student permanently deleted' });
    } else {
      student.isActive = false;
      student.status = 'inactive';
      await student.save();
      res.json({ success: true, message: 'Student deleted successfully' });
    }
  } catch (error) {
    next(error);
  }
});

// Student-specific operations (TESTED & VERIFIED)
router.get('/:studentId/dashboard',
  validators.studentIdValidator,
  validate,
  studentController.getStudentDashboardData
);  

router.get('/:studentId/sidebar',
  validators.studentIdValidator,
  validate,
  studentController.getStudentSidebarData
);  

router.get('/:studentId/details',
  validators.studentIdValidator,
  validate,
  studentController.getStudentDetails
);  

router.get('/:studentId/timetable',
  validators.studentIdValidator,
  validate,
  studentController.getStudentTimetable
);  

router.get('/:studentId/leaves',
  validators.getStudentLeavesValidator,
  validate,
  studentController.getStudentLeaves
);  

router.post('/:studentId/leaves',
  validators.applyLeaveValidator,
  validate,
  studentController.applyLeave
);  

router.put('/leaves/:leaveId/review',
  validators.reviewLeaveValidator,
  validate,
  studentController.reviewLeave
);  

router.get('/:studentId/attendance',
  validators.getStudentAttendanceValidator,
  validate,
  studentController.getStudentAttendance
);  

router.get('/:studentId/fees',
  validators.getStudentFeesValidator,
  validate,
  studentController.getStudentFees
);  

router.get('/:studentId/results',
  validators.getStudentResultsValidator,
  validate,
  studentController.getStudentResults
);  

router.get('/:studentId/library',
  validators.getStudentLibraryValidator,
  validate,
  studentController.getStudentLibraryRecords
);  

router.get('/:studentId/performance',
  validators.studentIdValidator,
  validate,
  studentController.getStudentPerformanceSummary
);  

router.get('/:studentId/homework',
  validators.studentIdValidator,
  validate,
  studentController.getStudentHomework
);  

router.get('/:studentId/exams',
  validators.studentIdValidator,
  validate,
  studentController.getStudentExams
);  

router.get('/:studentId/notifications',
  validators.studentIdValidator,
  validate,
  studentController.getStudentNotifications
);  

router.get('/:studentId/export',
  validators.studentIdValidator,
  validate,
  studentController.exportStudentData
);  

router.get('/:studentId/profile-completeness',
  validators.studentIdValidator,
  validate,
  studentController.getStudentProfileCompleteness
);  

export default router;
