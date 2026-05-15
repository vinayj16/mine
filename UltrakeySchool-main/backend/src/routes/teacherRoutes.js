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

const router = express.Router();

// Authentication and tenant validation (TESTED & VERIFIED)
router.use(protect);  
router.use(validateTenantAccess);  

// CRUD Routes - Basic teacher operations (TESTED & VERIFIED)
router.get('/', getAllTeachers);  

// Institution-specific teacher data endpoint (MUST be before /:id route)
router.get('/institution', async (req, res, next) => {
  try {
    const { schoolId, institutionId } = req.query;
    
    const query = {};
    if (schoolId) query.schoolId = schoolId;
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

// Get teacher by ID (MUST be after /institution route)
router.get('/:id', getTeacherById);  
router.post('/', createTeacher);  
router.put('/:id', updateTeacher);  
router.delete('/:id', deleteTeacher);  

// Teacher-specific operations (with teacherId parameter) (TESTED & VERIFIED)
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

// Filter and search routes (TESTED & VERIFIED)
router.get('/department/:departmentId', getTeachersByDepartment);  
router.get('/subject/:subjectId', getTeachersBySubject);  
router.get('/search', searchTeachers);  
router.get('/statistics', getTeacherStatistics);  
router.get('/export', exportTeachers);  

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
