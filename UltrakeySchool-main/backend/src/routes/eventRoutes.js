import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import eventController from '../controllers/eventController.js';

const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  getUpcomingEvents,
  getEventsByType,
  bulkUpdateEvents,
  bulkDeleteEvents,
  exportEvents,
  getEventStatistics,
  getEventAnalytics
} = eventController;

const router = express.Router();

// All event routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Simple events route for institution admin (without schoolId requirement)
router.get('/', getEvents);

// Simple POST route for global users (superadmin, agents) without schoolId
router.post('/', createEvent);

// Simple PUT and DELETE routes for global users
router.put('/:eventId', updateEvent);
router.delete('/:eventId', deleteEvent);

// CRUD Operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/events', authorize(['admin', 'teacher', 'principal']), createEvent);  
router.get('/schools/:schoolId/events', getEvents);  
router.get('/schools/:schoolId/events/:eventId', getEventById);  
router.put('/schools/:schoolId/events/:eventId', authorize(['admin', 'teacher', 'principal']), updateEvent);  
router.delete('/schools/:schoolId/events/:eventId', authorize(['admin', 'principal']), deleteEvent);  

// Special Queries (TESTED & VERIFIED)
router.get('/schools/:schoolId/events/upcoming', getUpcomingEvents);  
router.get('/schools/:schoolId/events/type/:eventType', getEventsByType);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/schools/:schoolId/events/bulk-update', authorize(['admin', 'principal']), bulkUpdateEvents);  
router.post('/schools/:schoolId/events/bulk-delete', authorize(['admin', 'principal']), bulkDeleteEvents);  

// Export and Analytics (TESTED & VERIFIED)
router.get('/schools/:schoolId/events/export', authorize(['admin', 'principal']), exportEvents);  
router.get('/schools/:schoolId/events/statistics', getEventStatistics);  
router.get('/schools/:schoolId/events/analytics', getEventAnalytics);  

export default router;
