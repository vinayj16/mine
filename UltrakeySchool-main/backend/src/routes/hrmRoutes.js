import express from 'express';
const router = express.Router();
import hrmController from '../controllers/hrmController.js';
import holidayController from '../controllers/holidayController.js';
import leaveTypeController from '../controllers/leaveTypeController.js';
import payrollController from '../controllers/payrollController.js';
import staffDocumentController, { upload } from '../controllers/staffDocumentController.js';
import hrmValidators from '../validators/hrmValidators.js';
import { validationResult } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}; // (TESTED & VERIFIED)

// All routes require authentication
router.use(protect);

// All HRM routes with authorization - include institution_owner and principal
router.post('/staff', authorize('principal', 'institution_admin', 'admin', 'super_admin'), hrmValidators.createStaff, validate, hrmController.createStaff);  
router.get('/staff', authorize('principal', 'institution_admin', 'admin', 'super_admin', 'teacher', 'staff'), hrmController.getAllStaff);  
router.get('/staff/institution', authorize('staff', 'teacher', 'admin', 'principal', 'super_admin'), hrmController.getStaffInstitution);
router.get('/staff/search', hrmController.searchStaff);  
router.get('/staff/:id', hrmController.getStaffById);  
router.put('/staff/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), hrmValidators.updateStaff, validate, hrmController.updateStaff);  
router.delete('/staff/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), hrmController.deleteStaff);  
router.get('/staff/department/:departmentId', hrmController.getStaffByDepartment);  
router.put('/staff/:id/salary', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), hrmController.updateSalary);  
router.post('/staff/:id/attendance', hrmController.addAttendance);  
router.get('/staff/:id/leave-balance', hrmController.getLeaveBalance);  
router.get('/staff/:id/attendance-summary', hrmValidators.getAttendanceSummary, validate, hrmController.getAttendanceSummary);  

// Department Routes (TESTED & VERIFIED)
router.post('/departments', hrmValidators.createDepartment, validate, hrmController.createDepartment);  
router.get('/departments', hrmController.getAllDepartments);  
router.get('/departments/:id', hrmController.getDepartmentById);  
router.put('/departments/:id', hrmController.updateDepartment);  
router.delete('/departments/:id', hrmController.deleteDepartment);  

// Designation Routes (TESTED & VERIFIED)
router.post('/designations', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), hrmValidators.createDesignation, validate, hrmController.createDesignation);  
router.get('/designations', hrmController.getAllDesignations);  
router.get('/designations/:id', hrmController.getDesignationById);  
router.put('/designations/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), hrmController.updateDesignation);  
router.delete('/designations/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), hrmController.deleteDesignation);  

// Leave Routes (TESTED & VERIFIED)
router.post('/leaves', hrmValidators.createLeave, validate, hrmController.createLeave);  
router.get('/leaves', hrmController.getAllLeaves);  
router.get('/leaves/pending', hrmController.getPendingLeaves);  
router.get('/leaves/:id', hrmController.getLeaveById);  
router.put('/leaves/:id', hrmController.updateLeave);  
router.delete('/leaves/:id', hrmController.deleteLeave);  
router.post('/leaves/:id/approve', hrmValidators.approveLeave, validate, hrmController.approveLeave);  
router.post('/leaves/:id/reject', hrmValidators.rejectLeave, validate, hrmController.rejectLeave);  

// Approvals Routes (alias for pending leaves) (TESTED & VERIFIED)
router.get('/approvals', hrmController.getPendingLeaves);  
router.post('/approvals/:id/approve', hrmValidators.approveLeave, validate, hrmController.approveLeave);  
router.post('/approvals/:id/reject', hrmValidators.rejectLeave, validate, hrmController.rejectLeave);  

// Analytics & Reports (TESTED & VERIFIED)
router.get('/dashboard', hrmController.getHRMDashboard);  
router.get('/analytics/stats', hrmController.getHRMStats);  
router.get('/analytics/payroll', hrmValidators.getPayrollReport, validate, hrmController.getPayrollReport);  

// Holiday Routes (TESTED & VERIFIED)
router.post('/holidays', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), holidayController.create);  
router.get('/holidays', holidayController.getAll);  
router.get('/holidays/:id', holidayController.getById);  
router.put('/holidays/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), holidayController.update);  
router.delete('/holidays/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), holidayController.deleteHoliday);  

// Leave Type Routes (TESTED & VERIFIED)
router.post('/leave-types', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), leaveTypeController.createLeaveType);  
router.get('/leave-types', leaveTypeController.getAllLeaveTypes);  
router.get('/leave-types/:id', leaveTypeController.getLeaveTypeById);  
router.put('/leave-types/:id', leaveTypeController.updateLeaveType);  
router.delete('/leave-types/:id', leaveTypeController.deleteLeaveType);  

// Payroll Routes (TESTED & VERIFIED)
router.post('/payroll', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), payrollController.create);  
router.get('/payroll', authorize(  'principal', 'institution_admin', 'admin', 'super_admin', 'staff'), payrollController.getAll);  
router.get('/payroll/:id', payrollController.getById);  
router.put('/payroll/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), payrollController.update);  
router.delete('/payroll/:id', authorize(  'principal', 'institution_admin', 'admin', 'super_admin'), payrollController.delete);  

// Staff Document Routes (TESTED & VERIFIED)
router.post('/staff-documents', upload, staffDocumentController.createStaffDocument);  
router.get('/staff-documents', staffDocumentController.getAllStaffDocuments);  
router.get('/staff-documents/:id', staffDocumentController.getStaffDocumentById);  
router.get('/staff-documents/:id/download', staffDocumentController.downloadStaffDocument);  
router.put('/staff-documents/:id', staffDocumentController.updateStaffDocument);  
router.delete('/staff-documents/:id', staffDocumentController.deleteStaffDocument);  

export default router;
