import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// All library routes require authentication
router.use(protect);  

// Books endpoints with mock data
router.get('/books', async (req, res) => {
  try {
    res.json({
      success: true,
      data: mockBooks,
      pagination: {
        total: mockBooks.length,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch books', error: error.message });
  }
});

// Issues endpoints with mock data
router.get('/issues', async (req, res) => {
  try {
    res.json({
      success: true,
      data: filteredIssues,
      pagination: {
        total: filteredIssues.length,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch issues', error: error.message });
  }
});

// Members endpoint
router.get('/members', async (_req, res) => {
  res.json({
    success: true,
    data: [],
    pagination: { total: 0, page: 1, pages: 0 },
    message: 'Library members retrieved successfully'
  });
});

router.post('/members', async (req, res) => {
  res.json({ success: true, data: { ...req.body, _id: Date.now().toString() }, message: 'Member added successfully' });
});

// Stats endpoint
router.get('/stats', async (_req, res) => {
  res.json({
    success: true,
    data: {
      totalBooks: 0,
      issuedBooks: 0,
      availableBooks: 0,
      overdueBooks: 0,
      totalMembers: 0,
      activeMembers: 0,
      totalFines: 0,
      collectedFines: 0
    },
    message: 'Library stats retrieved successfully'
  });
});

// Return book endpoint
router.post('/issues/:id/return', async (req, res) => {
  res.json({ success: true, data: { _id: req.params.id, status: 'Returned' }, message: 'Book returned successfully' });
});

// Root endpoint for backward compatibility
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        page: 1,
        pages: 1
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch library data', error: error.message });
  }
});

export default router;
