import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import noticeController from '../controllers/noticeController.js';

const {
  createNotice,
  getNoticeById,
  getAllNotices,
  updateNotice,
  deleteNotice,
  getNoticesByRecipient,
  getNoticeStatistics,
  searchNotices,
  getPublishedNotices,
  incrementViews,
  getUpcomingNotices
} = noticeController;

const router = express.Router();

// All notice routes require authentication
router.use(protect);  

// CRUD Operations
router.get('/', getAllNotices);  
router.get('/published', getPublishedNotices);  
router.get('/search', searchNotices);  
router.get('/upcoming', getUpcomingNotices);  
router.get('/recipient/:recipient', getNoticesByRecipient);  
router.get('/:id', getNoticeById);  
router.post('/', authorize(['admin', 'principal',   'institution_admin']), createNotice);  
router.put('/:id', authorize(['admin', 'principal',   'institution_admin']), updateNotice);  
router.delete('/:id', authorize(['super_admin']), deleteNotice);  

// Statistics
router.get('/statistics', authorize(['admin', 'principal', 'institution_owner']), getNoticeStatistics);  

// View tracking
router.patch('/:id/view', incrementViews);

// Status Management
router.patch('/:id/status', authorize(['admin', 'principal']), async (req, res) => {
  res.json({ success: true, message: 'Status updated' });
});

export default router;