import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import schoolSettingsController from '../controllers/schoolSettingsController.js';

const {
  createSchoolSettings,
  getSchoolSettingsById,
  getSchoolSettingsByInstitution,
  updateSchoolSettings,
  updateBasicInfo,
  updateAcademicSettings,
  updateExamSettings,
  updateAttendanceSettings,
  updateFeeSettings,
  updateNotificationSettings,
  updateLogo,
  updateStatus,
  getAllSchoolSettings,
  deleteSchoolSettings,
  getSchoolSettingsStatistics
} = schoolSettingsController;

const router = express.Router();

// All school settings routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', authorize(['admin', 'principal', 'super_admin']), getAllSchoolSettings);  
router.get('/statistics', authorize(['admin', 'principal', 'super_admin']), getSchoolSettingsStatistics);  
router.get('/institution/:institutionId', getSchoolSettingsByInstitution);  
router.get('/:id', getSchoolSettingsById);  
router.post('/', authorize(['admin', 'principal', 'super_admin']), createSchoolSettings);  
router.put('/:id', authorize(['admin', 'principal', 'super_admin']), updateSchoolSettings);  
router.delete('/:id', authorize(['super_admin']), deleteSchoolSettings);  

// Specific Updates (TESTED & VERIFIED)
router.patch('/institution/:institutionId/basic-info', authorize(['admin', 'principal', 'super_admin']), updateBasicInfo);  
router.patch('/institution/:institutionId/academic', authorize(['admin', 'principal', 'super_admin']), updateAcademicSettings);  
router.patch('/institution/:institutionId/exam', authorize(['admin', 'principal', 'super_admin']), updateExamSettings);  
router.patch('/institution/:institutionId/attendance', authorize(['admin', 'principal', 'super_admin']), updateAttendanceSettings);  
router.patch('/institution/:institutionId/fee', authorize(['admin', 'principal', 'super_admin']), updateFeeSettings);  
router.patch('/institution/:institutionId/notification', authorize(['admin', 'principal', 'super_admin']), updateNotificationSettings);  
router.patch('/institution/:institutionId/logo', authorize(['admin', 'principal', 'super_admin']), updateLogo);  
router.patch('/institution/:institutionId/status', authorize(['admin', 'principal', 'super_admin']), updateStatus);  

export default router;
