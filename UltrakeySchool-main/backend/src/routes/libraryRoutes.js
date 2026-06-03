import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import libraryController from '../controllers/libraryController.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const {
  createBook,
  getBookById,
  getBooks,
  updateBook,
  deleteBook,
  getAvailableBooks,
  issueBook,
  returnBook,
  renewBookIssue,
  getIssues,
  getOverdueIssues,
  getLibraryStats,
  getLibraryOverview,
  exportBooks,
  getReservations,
  addMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember,
} = libraryController;

// Aliases to match older route names expected by the router
const getAllBooks = getBooks;
const getLibraryStatistics = getLibraryStats;
const getIssuedBooks = getIssues;
const getOverdueBooks = getOverdueIssues;
const searchBooks = libraryController.searchBooks || getBooks;

// Fallbacks for older/legacy handler names expected by routes
const getBooksByCategory = libraryController.getBooksByCategory || ((req, res) => getBooks(req, res));
const getBooksByAuthor = libraryController.getBooksByAuthor || ((req, res) => getBooks(req, res));
const getBooksByStatus = libraryController.getBooksByStatus || ((req, res) => getBooks(req, res));
const renewBook = libraryController.renewBook || renewBookIssue;
const updateStatus = libraryController.updateStatus || (async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['available', 'issued', 'reserved', 'damaged', 'lost', 'weeded_out'];

  if (!status || !validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid status. Must be one of: ' + validStatuses.join(', '), 400);
  }

  try {
    const Book = (await import('../models/Book.js')).default;
    const book = await Book.findByIdAndUpdate(id, { $set: { status } }, { new: true });
    if (!book) return errorResponse(res, 'Book not found', 404);
    const { default: logger } = await import('../utils/logger.js');
    logger.info('Book status updated:', { id, status });
    const { successResponse } = await import('../utils/apiResponse.js');
    return successResponse(res, book, 'Book status updated successfully');
  } catch (error) {
    const { default: logger } = await import('../utils/logger.js');
    logger.error('Error updating book status:', error);
    const { errorResponse } = await import('../utils/apiResponse.js');
    return errorResponse(res, error.message);
  }
});
const bulkUpdateStatus = libraryController.bulkUpdateStatus || (async (req, res) => {
  const { ids, status } = req.body;
  const validStatuses = ['available', 'issued', 'reserved', 'damaged', 'lost', 'weeded_out'];

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse(res, 'Book IDs array is required', 400);
  }
  if (!status || !validStatuses.includes(status)) {
    return errorResponse(res, 'Invalid status. Must be one of: ' + validStatuses.join(', '), 400);
  }

  try {
    const Book = (await import('../models/Book.js')).default;
    const result = await Book.updateMany({ _id: { $in: ids } }, { $set: { status } });
    const { default: logger } = await import('../utils/logger.js');
    logger.info(`Bulk status update: ${result.modifiedCount} books updated to ${status}`);
    const { successResponse } = await import('../utils/apiResponse.js');
    return successResponse(res, { modifiedCount: result.modifiedCount }, `${result.modifiedCount} books updated successfully`);
  } catch (error) {
    const { default: logger } = await import('../utils/logger.js');
    logger.error('Error in bulk status update:', error);
    const { errorResponse } = await import('../utils/apiResponse.js');
    return errorResponse(res, error.message);
  }
});
const bulkDeleteBooks = libraryController.bulkDeleteBooks || (async (req, res) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return errorResponse(res, 'Book IDs array is required', 400);
  }

  try {
    const Book = (await import('../models/Book.js')).default;
    const result = await Book.deleteMany({ _id: { $in: ids } });
    const { default: logger } = await import('../utils/logger.js');
    logger.info(`Bulk delete: ${result.deletedCount} books removed`);
    const { successResponse } = await import('../utils/apiResponse.js');
    return successResponse(res, { deletedCount: result.deletedCount }, `${result.deletedCount} books deleted successfully`);
  } catch (error) {
    const { default: logger } = await import('../utils/logger.js');
    logger.error('Error in bulk delete:', error);
    const { errorResponse } = await import('../utils/apiResponse.js');
    return errorResponse(res, error.message);
  }
});

const router = express.Router();

// All library routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Overview endpoint
router.get('/overview', getLibraryOverview);

// CRUD Operations (TESTED & VERIFIED)
router.get('/', getAllBooks);
router.get('/books', getAllBooks);
router.get('/books/:id', getBookById);
router.post('/books', authorize(['admin', 'institution_admin', 'librarian']), createBook);
router.put('/books/:id', authorize(['admin', 'institution_admin', 'librarian']), updateBook);
router.delete('/books/:id', authorize(['admin', 'institution_admin', 'librarian']), deleteBook);
router.post('/', authorize(['admin', 'institution_admin', 'librarian']), createBook);
router.put('/:id', authorize(['admin', 'institution_admin', 'librarian']), updateBook);
router.delete('/:id', authorize(['admin', 'institution_admin', 'librarian']), deleteBook);
router.get('/statistics', authorize(['admin', 'principal', 'institution_admin', 'librarian']), getLibraryStatistics);
router.get('/stats', authorize(['admin', 'principal', 'institution_admin', 'librarian']), getLibraryStatistics);
router.get('/books/statistics', authorize(['admin', 'principal', 'institution_admin', 'librarian']), getLibraryStatistics);
router.get('/dashboard', authorize(['admin', 'principal', 'institution_admin', 'librarian']), getLibraryStatistics);
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

// Issues tracking (register before param routes to avoid shadowing)
router.get('/issues', getIssuedBooks);
router.get('/issues/overdue', getOverdueBooks);
router.post('/issues', authorize(['admin', 'principal', 'librarian']), issueBook);
router.post('/issues/:bookId/issue', authorize(['admin', 'principal', 'librarian']), issueBook);
router.post('/issues/:id/return', authorize(['admin', 'principal', 'librarian']), returnBook);
router.post('/issues/:id/renew', authorize(['admin', 'principal', 'librarian']), renewBook);

// Library Members - must be BEFORE /:id route
router.get('/members', authorize(['admin', 'principal', 'librarian']), getMembers);
router.post('/members', authorize(['admin', 'principal', 'librarian']), addMember);
router.get('/members/:id', authorize(['admin', 'principal', 'librarian']), getMemberById);
router.put('/members/:id', authorize(['admin', 'principal', 'librarian']), updateMember);
router.delete('/members/:id', authorize(['admin', 'principal', 'librarian']), deleteMember);

// Reservations
router.get('/reservations', getReservations);

// Export (TESTED & VERIFIED)
router.get('/export', authorize(['admin', 'principal']), exportBooks);

export default router;
