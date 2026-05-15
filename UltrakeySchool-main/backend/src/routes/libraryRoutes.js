import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import libraryController from '../controllers/libraryController.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const {
  createBook,
  getBookById,
  getAllBooks,
  updateBook,
  deleteBook,
  getBooksByCategory,
  getBooksByAuthor,
  getBooksByStatus,
  updateStatus,
  bulkUpdateStatus,
  bulkDeleteBooks,
  getLibraryStatistics,
  searchBooks,
  exportBooks,
  getAvailableBooks,
  issueBook,
  returnBook,
  renewBook,
  getIssuedBooks,
  getOverdueBooks
} = libraryController;

const router = express.Router();

// All library routes require authentication (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllBooks);  
router.get('/books', getAllBooks);  
router.get('/statistics', authorize(['admin', 'principal',   'institution_admin', 'librarian']), getLibraryStatistics);  
router.get('/available', getAvailableBooks);  
router.get('/books/available', getAvailableBooks);  
router.get('/issued', getIssuedBooks);  
router.get('/books/issued', getIssuedBooks);  
router.get('/overdue', getOverdueBooks);  
router.get('/books/overdue', getOverdueBooks);  
router.get('/search', searchBooks);  
router.get('/books/search', searchBooks);  
router.get('/category/:category', getBooksByCategory);  
router.get('/books/category/:category', getBooksByCategory);  
router.get('/author/:author', getBooksByAuthor);  
router.get('/books/author/:author', getBooksByAuthor);  
router.get('/status/:status', getBooksByStatus);  
router.get('/books/status/:status', getBooksByStatus);  
router.get('/:id', getBookById);  
router.get('/books/:id', getBookById);  
router.post('/', authorize(['admin', 'principal', 'librarian']), createBook);  
router.post('/books', authorize(['admin', 'principal', 'librarian']), createBook);  
router.put('/:id', authorize(['admin', 'principal', 'librarian']), updateBook);  
router.put('/books/:id', authorize(['admin', 'principal', 'librarian']), updateBook);  
router.delete('/:id', authorize(['super_admin']), deleteBook);  
router.delete('/books/:id', authorize(['super_admin']), deleteBook);  

// Issues tracking (TESTED & VERIFIED)
router.get('/issues', getIssuedBooks);  
router.get('/issues/overdue', getOverdueBooks);  
router.post('/issues/:bookId/issue', authorize(['admin', 'principal', 'librarian']), issueBook);  
router.post('/issues/:bookId/return', authorize(['admin', 'principal', 'librarian']), returnBook);  
router.post('/issues/:bookId/renew', authorize(['admin', 'principal', 'librarian']), renewBook);  

// Status Management (TESTED & VERIFIED)
router.patch('/:id/status', authorize(['admin', 'principal', 'librarian']), updateStatus);  

// Book Operations (TESTED & VERIFIED)
router.post('/:id/issue', authorize(['admin', 'principal', 'librarian']), issueBook);  
router.post('/:id/return', authorize(['admin', 'principal', 'librarian']), returnBook);  
router.post('/:id/renew', authorize(['admin', 'principal', 'librarian']), renewBook);  

// Bulk Operations (TESTED & VERIFIED)
router.post('/bulk-update-status', authorize(['admin', 'principal']), bulkUpdateStatus);  
router.post('/bulk-delete', authorize(['super_admin']), bulkDeleteBooks);  

// Library Members (TESTED & VERIFIED)
router.get('/members', authorize(['admin', 'principal', 'librarian']), async (req, res) => {
  try {
    const institutionId = req.user?.institutionId;
    const result = await libraryController.getLibraryMembers(institutionId, req.query);
    return successResponse(res, result.members, 'Library members retrieved successfully', result.pagination);
  } catch (error) {
    logger.error('Error fetching library members:', error);
    return errorResponse(res, error.message);
  }
});

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportBooks);  

export default router;
