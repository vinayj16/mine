import express from 'express';
import scheduleController from '../controllers/scheduleController.js';
const {
  getSchedules,
  getScheduleById,
  getUserSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  setReminder,
  addParticipant,
  removeParticipant,
  getUpcomingSchedules
} = scheduleController;

import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import {
  getSchedulesValidation,
  getScheduleByIdValidation,
  getUserSchedulesValidation,
  createScheduleValidation,
  updateScheduleValidation,
  deleteScheduleValidation,
  setReminderValidation,
  addParticipantValidation,
  removeParticipantValidation,
  getUpcomingSchedulesValidation
} from '../validators/scheduleValidators.js';

const router = express.Router();

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get schedules (TESTED & VERIFIED)
router.get(
  '/',
  getSchedulesValidation,
  getSchedules
);  

router.get(
  '/upcoming',
  getUpcomingSchedulesValidation,
  getUpcomingSchedules
);  

router.get(
  '/user/:userId',
  getUserSchedulesValidation,
  getUserSchedules
);  

router.get(
  '/:id',
  getScheduleByIdValidation,
  getScheduleById
);  

// Create schedule (TESTED & VERIFIED)
router.post(
  '/',
  authorize(['admin', 'teacher', 'principal']),
  createScheduleValidation,
  createSchedule
);  

// Update schedule (TESTED & VERIFIED)
router.put(
  '/:id',
  authorize(['admin', 'teacher', 'principal']),
  updateScheduleValidation,
  updateSchedule
);  

// Delete schedule (TESTED & VERIFIED)
router.delete(
  '/:id',
  authorize(['admin', 'teacher', 'principal']),
  deleteScheduleValidation,
  deleteSchedule
);  

// Set reminder (TESTED & VERIFIED)
router.post(
  '/:id/reminder',
  setReminderValidation,
  setReminder
);  

// Participant management (TESTED & VERIFIED)
router.post(
  '/:id/participants',
  authorize(['admin', 'teacher', 'principal']),
  addParticipantValidation,
  addParticipant
);  

router.delete(
  '/:id/participants/:userId',
  authorize(['admin', 'teacher', 'principal']),
  removeParticipantValidation,
  removeParticipant
);  

export default router;
