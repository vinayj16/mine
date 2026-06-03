import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { validateTenantAccess } from '../middleware/multiTenant.js';
import {
  getPTMSlots, getPTMSlotById, createPTMSlots, updatePTMSlot,
  deletePTMSlot, bulkDeletePTMSlots, bookPTMSlot, cancelPTMBooking,
  reschedulePTMSlot, completePTMSlot, sendPTMReminder, scheduleVideoMeeting,
  getPTMStatistics, getPTMSlotsByTeacher, getPTMBookingsByParent,
  getAvailablePTMSlots, exportPTMData, getPTMAttendanceReport,
  assignPTMToParent,
} from '../controllers/ptmController.js';

const router = express.Router();

router.use(protect);
router.use(validateTenantAccess);

router.get('/stats', getPTMStatistics);
router.get('/available', getAvailablePTMSlots);
router.get('/export', exportPTMData);
router.get('/report/attendance', getPTMAttendanceReport);
router.get('/teacher/:teacherId', getPTMSlotsByTeacher);
router.get('/parent/:parentId', getPTMBookingsByParent);

router.get('/', getPTMSlots);
router.get('/:id', getPTMSlotById);
router.post('/', createPTMSlots);
router.put('/:id', updatePTMSlot);
router.delete('/bulk', bulkDeletePTMSlots);
router.delete('/:id', deletePTMSlot);
router.post('/:id/book', bookPTMSlot);
router.post('/:id/assign', assignPTMToParent);
router.post('/:id/cancel', cancelPTMBooking);
router.post('/:id/reschedule', reschedulePTMSlot);
router.post('/:id/complete', completePTMSlot);
router.post('/:id/reminder', sendPTMReminder);
router.post('/:id/meeting', scheduleVideoMeeting);

export default router;
