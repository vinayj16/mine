import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import calendarController from '../controllers/calendarController.js';

const {
  getCalendarEvents,
  getCalendarAnalytics,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarEventById,
  getUpcomingEvents,
  exportCalendarEvents,
  getCalendarConflicts
} = calendarController;

const router = express.Router();

// All calendar routes require authentication
router.use(protect);

// Get calendar events for a school (TESTED & VERIFIED)
router.get('/schools/:schoolId', getCalendarEvents);  
router.get('/schools/:schoolId/analytics', authorize(['admin', 'principal']), getCalendarAnalytics);  
router.get('/schools/:schoolId/upcoming', getUpcomingEvents);  
router.get('/schools/:schoolId/export', authorize(['admin', 'principal']), exportCalendarEvents);  
router.get('/schools/:schoolId/conflicts', authorize(['admin', 'principal']), getCalendarConflicts);  

// Calendar event CRUD operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/events', authorize(['admin', 'teacher', 'principal']), createCalendarEvent);  
router.get('/schools/:schoolId/events/:eventId', getCalendarEventById);  
router.put('/schools/:schoolId/events/:eventId', authorize(['admin', 'teacher', 'principal']), updateCalendarEvent);  
router.delete('/schools/:schoolId/events/:eventId', authorize(['admin', 'principal']), deleteCalendarEvent);  

export default router;
