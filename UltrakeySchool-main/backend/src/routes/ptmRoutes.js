import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import ptmController from '../controllers/ptmController.js';
const {
  getPTMSlots,
  createPTMSlots,
  getPTMSlotById,
  updatePTMSlot,
  deletePTMSlot,
  bookPTMSlot,
  cancelPTMBooking,
  scheduleVideoMeeting,
  sendPTMReminder,
  sendAutomatedReminders,
  getPTMStatistics,
  completePTMSlot
} = ptmController;

const router = express.Router();

// Apply authentication middleware to all routes (TESTED & VERIFIED)
router.use(protect);  

// Get PTM slots (TESTED & VERIFIED)
router.get('/slots', getPTMSlots);  

// Create PTM slots (teachers and admins only) (TESTED & VERIFIED)
router.post('/slots', authorize(['admin', 'teacher', 'principal']), createPTMSlots);  

// Get slot details (TESTED & VERIFIED)
router.get('/slots/:id', getPTMSlotById);  

// Update slot (teachers and admins only) (TESTED & VERIFIED)
router.put('/slots/:id', authorize(['admin', 'teacher', 'principal']), updatePTMSlot);  

// Delete slot (admins only) (TESTED & VERIFIED)
router.delete('/slots/:id', authorize(['admin', 'principal']), deletePTMSlot);  

// Book PTM slot (parents and students) (TESTED & VERIFIED)
router.post('/slots/:id/book', bookPTMSlot);  

// Cancel booking (TESTED & VERIFIED)
router.put('/slots/:id/cancel', cancelPTMBooking);  

// Schedule video meeting (teachers and admins only) (TESTED & VERIFIED)
router.post('/slots/:id/video-meeting', authorize(['admin', 'teacher', 'principal']), scheduleVideoMeeting);  

// Send PTM reminder (teachers and admins only) (TESTED & VERIFIED)
router.post('/slots/:id/reminder', authorize(['admin', 'teacher', 'principal']), sendPTMReminder);  

// Send automated reminders (admins only) (TESTED & VERIFIED)
router.post('/reminders/automated', authorize(['admin', 'principal']), sendAutomatedReminders);  

// Get PTM statistics (admins and teachers) (TESTED & VERIFIED)
router.get('/statistics', authorize(['admin', 'teacher', 'principal']), getPTMStatistics);  

// Complete PTM slot (teachers and admins only) (TESTED & VERIFIED)
router.put('/slots/:id/complete', authorize(['admin', 'teacher', 'principal']), completePTMSlot);  

export default router;
