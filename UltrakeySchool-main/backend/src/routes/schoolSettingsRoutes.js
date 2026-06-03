import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getByInstitution,
  updateBasicInfo,
  updateAcademicSettings,
  updateExamSettings,
  updateAttendanceSettings,
  updateFeeSettings,
  updateNotificationSettings
} from '../controllers/schoolSettingsController.js';

const router = express.Router();

router.use(protect);

router.get('/institution/:institutionId', getByInstitution);
router.patch('/institution/:institutionId/basic-info', updateBasicInfo);
router.patch('/institution/:institutionId/academic', updateAcademicSettings);
router.patch('/institution/:institutionId/exam', updateExamSettings);
router.patch('/institution/:institutionId/attendance', updateAttendanceSettings);
router.patch('/institution/:institutionId/fee', updateFeeSettings);
router.patch('/institution/:institutionId/notification', updateNotificationSettings);

export default router;
