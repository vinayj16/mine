import express from 'express';
import teacherController from '../controllers/teacherController.js';
const {
  getAllTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherDetails,
  getTeacherRoutine,
  getTeacherLeaves,
  applyLeave,
  reviewLeave,
  getTeacherAttendance,
  getTeacherSalary,
  createSalary,
  updateSalaryStatus,
  getTeacherLibraryRecords,
  getTeacherDashboardData,
  getTeacherSidebarData,
  getTeachersByDepartment,
  getTeachersBySubject,
  updateTeacherStatus,
  assignSubjects,
  assignClasses,
  bulkUpdateStatus,
  bulkDeleteTeachers,
  exportTeachers,
  getTeacherStatistics,
  searchTeachers,
  getTeacherPerformanceAnalytics
} = teacherController;

import {
  validateTeacherId,
  validateLeaveApplication,
  validateLeaveReview,
  validateRoutineQuery,
  validateAttendanceQuery,
  validateSalaryQuery,
  validateSalaryCreation,
  validateSalaryStatusUpdate,
  validateLibraryQuery,
  validateLeaveQuery
} from '../validators/teacherValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';

const resolveTeacherId = async (req, res, next) => {
  try {
    const id = req.params.teacherId || req.params.id;
    if (id && id.length === 24) {
      const Teacher = (await import('../models/Teacher.js')).default;
      const teacher = await Teacher.findOne({ $or: [{ _id: id }, { userId: id }] });
      if (teacher) {
        if (req.params.teacherId) req.params.teacherId = teacher._id.toString();
        if (req.params.id) req.params.id = teacher._id.toString();
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

const router = express.Router();

// Authentication and tenant validation (TESTED & VERIFIED)
router.use(protect);  
router.use(validateTenantAccess);  

// CRUD Routes - Basic teacher operations (TESTED & VERIFIED)
router.get('/', getAllTeachers);  

// Institution-specific teacher data endpoint (MUST be before /:id route)
router.get('/institution', async (req, res, next) => {
  try {
    const { institutionId } = req.query;
    
    const query = {};
    if (institutionId) query.institutionId = institutionId;
    
    const Teacher = (await import('../models/Teacher.js')).default;
    const teachers = await Teacher.find(query)
      .populate('departmentId', 'name')
      .populate('subjects', 'name')
      .sort({ createdAt: -1 })
      .limit(100); // Limit for performance
    
    res.json({
      success: true,
      data: teachers,
      count: teachers.length
    });
  } catch (error) {
    next(error);
  }
});

// Static routes MUST be before /:id to avoid being captured as an ID param
router.get('/department/:departmentId', getTeachersByDepartment);  
router.get('/subject/:subjectId', getTeachersBySubject);  
router.get('/search', searchTeachers);  
router.get('/stats', getTeacherStatistics);
router.get('/statistics', getTeacherStatistics);  
router.get('/export', exportTeachers);

// Accept department/designation filters on listing endpoint
router.get('/filter', async (req, res, next) => {
  try {
    const { institutionId: queryInstitutionId, department, designation, status, search, page = 1, limit = 20 } = req.query;
    const institutionId = queryInstitutionId || req.user?.institutionId || req.tenantId;
    
    const query = { institutionId };
    if (department) query.department = { $regex: department, $options: 'i' };
    if (designation) query['userId.designation'] = { $regex: designation, $options: 'i' };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } }
      ];
    }
    
    const Teacher = (await import('../models/Teacher.js')).default;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [teachers, total] = await Promise.all([
      Teacher.find(query)
        .populate('userId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Teacher.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: teachers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get teacher by ID (MUST be after /institution and static routes)
router.get('/:id', resolveTeacherId, getTeacherById);  
router.post('/', createTeacher);  
router.put('/:id', resolveTeacherId, updateTeacher);  
router.delete('/:id', resolveTeacherId, deleteTeacher);  

// Teacher-specific operations (with teacherId parameter) (TESTED & VERIFIED)
router.use('/:teacherId', resolveTeacherId);

router.get(  
  '/:teacherId/details',
  validateTeacherId,
  getTeacherDetails
);

router.get(  
  '/:teacherId/routine',
  validateTeacherId,
  validateRoutineQuery,
  getTeacherRoutine
);

router.get(  
  '/:teacherId/leaves',
  validateTeacherId,
  validateLeaveQuery,
  getTeacherLeaves
);

router.post(  
  '/:teacherId/leaves',
  validateTeacherId,
  validateLeaveApplication,
  applyLeave
);

router.put(  
  '/leaves/:leaveId/review',
  validateLeaveReview,
  reviewLeave
);

router.get(  
  '/:teacherId/attendance',
  validateTeacherId,
  validateAttendanceQuery,
  getTeacherAttendance
);

router.get(  
  '/:teacherId/salary',
  validateTeacherId,
  validateSalaryQuery,
  getTeacherSalary
);

router.post(  
  '/:teacherId/salary',
  validateTeacherId,
  validateSalaryCreation,
  createSalary
);

router.put(  
  '/salary/:salaryId/status',
  validateSalaryStatusUpdate,
  updateSalaryStatus
);

router.get(  
  '/:teacherId/library',
  validateTeacherId,
  validateLibraryQuery,
  getTeacherLibraryRecords
);

router.get(  
  '/:teacherId/dashboard',
  validateTeacherId,
  getTeacherDashboardData
);

router.get(  
  '/:teacherId/sidebar',
  validateTeacherId,
  getTeacherSidebarData
);

// Timetable alias (frontend calls /timetable, backend uses /routine)
router.get(  
  '/:teacherId/timetable',
  validateTeacherId,
  validateRoutineQuery,
  getTeacherRoutine
);

// Get teacher's assigned classes array
router.get(  
  '/:teacherId/classes',
  validateTeacherId,
  async (req, res, next) => {
    try {
      const Teacher = (await import('../models/Teacher.js')).default;
      const teacher = await Teacher.findById(req.params.teacherId)
        .populate('classes.classId', 'name grade')
        .populate('classes.sectionId', 'name')
        .populate('classes.subjectId', 'name code')
        .lean();
      res.json({ success: true, data: teacher?.classes || [] });
    } catch (error) {
      next(error);
    }
  }
);

// Get teacher's assigned subjects array
router.get(  
  '/:teacherId/subjects',
  validateTeacherId,
  async (req, res, next) => {
    try {
      const Teacher = (await import('../models/Teacher.js')).default;
      const teacher = await Teacher.findById(req.params.teacherId)
        .populate('subjects', 'name code')
        .lean();
      res.json({ success: true, data: teacher?.subjects || [] });
    } catch (error) {
      next(error);
    }
  }
);

// Teacher management routes (TESTED & VERIFIED)
router.patch('/:id/status', updateTeacherStatus);  
router.post('/:id/subjects', assignSubjects);  
router.post('/:id/classes', assignClasses);  

// Bulk operations (TESTED & VERIFIED)
router.post('/bulk-update-status', bulkUpdateStatus);  
router.post('/bulk-delete', bulkDeleteTeachers);  

// Performance analytics (TESTED & VERIFIED)
router.get('/:teacherId/performance', getTeacherPerformanceAnalytics);  

export default router;
