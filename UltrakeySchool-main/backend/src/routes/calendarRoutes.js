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
router.get('/schools/:institutionId', getCalendarEvents);  
router.get('/schools/:institutionId/analytics', authorize(['admin', 'principal']), getCalendarAnalytics);  
router.get('/schools/:institutionId/upcoming', getUpcomingEvents);  
router.get('/schools/:institutionId/export', authorize(['admin', 'principal']), exportCalendarEvents);  
router.get('/schools/:institutionId/conflicts', authorize(['admin', 'principal']), getCalendarConflicts);  

// Calendar event CRUD operations (TESTED & VERIFIED)
router.post('/schools/:institutionId/events', authorize(['admin', 'teacher', 'principal']), createCalendarEvent);  
router.get('/schools/:institutionId/events/:eventId', getCalendarEventById);  
router.put('/schools/:institutionId/events/:eventId', authorize(['admin', 'teacher', 'principal']), updateCalendarEvent);  
router.delete('/schools/:institutionId/events/:eventId', authorize(['admin', 'principal']), deleteCalendarEvent);  

export default router;
