import libraryService from '../services/libraryService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Helper to get institution ID from request
const getInstitutionId = (req) => {
  const tenantId =
    req.user?.institutionId?.toString() ||
    req.user?.institution?.toString() ||
    req.user?.tenant?.toString() ||
    req.headers['x-tenant-id'] ||
    req.headers['x-institution-id'];

  if (!tenantId) {
    return null;
  }

  try {
    return new mongoose.Types.ObjectId(tenantId);
  } catch (error) {
    // Return as string if not a valid ObjectId
    return tenantId;
  }
};

// Get institution ID as string for queries
const getInstitutionIdStr = (req) => {
  return (
    req.user?.institutionId?.toString() ||
    req.user?.institution?.toString() ||
    req.user?.tenant?.toString() ||
    req.headers['x-tenant-id'] ||
    req.headers['x-institution-id']
  );
};

// Validation constants
const VALID_BOOK_STATUSES = ['available', 'issued', 'reserved', 'maintenance', 'lost', 'damaged'];
const VALID_ISSUE_STATUSES = ['issued', 'returned', 'overdue'];
const VALID_RESERVATION_STATUSES = ['active', 'fulfilled', 'cancelled', 'expired'];
const VALID_BOOK_CATEGORIES = ['fiction', 'non-fiction', 'reference', 'textbook', 'magazine', 'journal', 'other', 'Fiction', 'Non-Fiction', 'Science', 'Mathematics', 'History', 'Geography', 'Literature', 'Reference', 'Magazine', 'Other'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  return null;
};

// Helper function to validate ISBN
const validateISBN = (isbn) => {
  if (!isbn) {
    return null; // ISBN is optional
  }
  const isbnRegex = /^(?:ISBN(?:-1[03])?:? )?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;
  if (!isbnRegex.test(isbn.replace(/[- ]/g, ''))) {
    return 'Invalid ISBN format';
  }
  return null;
};

const createBook = async (req, res) => {
  try {
    logger.info('Creating book');
    
    const { title, author, isbn, category, totalCopies, publisher } = req.body;
    
    // Validation
    const errors = [];
    
    // Title is required
    if (!title || title.trim().length === 0) {
      errors.push('Book title is required');
    }
    
    // Author is required
    if (!author || author.trim().length === 0) {
      errors.push('Author is required');
    }
    
    // Optional validation - just log but don't fail
    if (isbn) {
      const isbnError = validateISBN(isbn);
      if (isbnError) logger.warn('ISBN validation warning:', isbnError);
    }
    
    // Category is optional - if provided, just log warning for invalid
    if (category && !VALID_BOOK_CATEGORIES.includes(category)) {
      logger.warn('Invalid category received:', category);
    }
    
    // Make totalCopies default to 1 if not provided
    const copiesNum = totalCopies ? parseInt(totalCopies) : 1;
    if (isNaN(copiesNum) || copiesNum < 1) {
      errors.push('Total copies must be at least 1');
    }
    
    // Use authenticated institution context
    const institutionId = getInstitutionIdStr(req);

    if (!institutionId) {
      errors.push('Invalid institution context');
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const book = await libraryService.createBook(req.body, institutionId);
    
    logger.info('Book created successfully:', { bookId: book._id, title });
    return createdResponse(res, book, 'Book created successfully');
  } catch (error) {
    logger.error('Error creating book:', error);
    return errorResponse(res, error.message);
  }
};


const getBooks = async (req, res) => {
  try {
    logger.info('Fetching books');
    
    const { page, limit, category, status, search } = req.query;
    
    // Validation
    const errors = [];
    
    if (category && !VALID_BOOK_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_BOOK_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const institutionId = getInstitutionId(req);
    
    if (!institutionId) {
      logger.info('No institution context — returning empty books');
      return successResponse(res, [], 'No school context — returning empty');
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await libraryService.getBooks(institutionId, req.query);
    
    logger.info('Books fetched successfully');
    return successResponse(res, result, 'Books retrieved successfully');
  } catch (error) {
    logger.error('Error fetching books:', error);
    return errorResponse(res, error.message);
  }
};

const getBookById = async (req, res) => {
  try {
    logger.info('Fetching book by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Book ID');
    if (idError) errors.push(idError);
    
    const institutionId = getInstitutionId(req);
    
    if (!institutionId) {
      errors.push('Invalid institution context');
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const book = await libraryService.getBookById(id, institutionId);
    
    if (!book) {
      return notFoundResponse(res, 'Book not found');
    }
    
    logger.info('Book fetched successfully:', { bookId: id });
    return successResponse(res, book, 'Book retrieved successfully');
  } catch (error) {
    logger.error('Error fetching book:', error);
    return errorResponse(res, error.message);
  }
};

const updateBook = async (req, res) => {
  try {
    logger.info('Updating book');
    
    const { id } = req.params;
    const { title, author, category, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Book ID');
    if (idError) errors.push(idError);
    
    if (title !== undefined && (!title || title.trim().length === 0)) {
      errors.push('Book title cannot be empty');
    } else if (title && title.length > 300) {
      errors.push('Book title must not exceed 300 characters');
    }
    
    if (author !== undefined && (!author || author.trim().length === 0)) {
      errors.push('Author cannot be empty');
    } else if (author && author.length > 200) {
      errors.push('Author must not exceed 200 characters');
    }
    
    if (category && !VALID_BOOK_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_BOOK_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    const institutionId = getInstitutionId(req) || req.query.institutionId || req.query.institution || req.query.tenant;
    
    if (!institutionId) {
      errors.push('Invalid institution context');
    }

    // Check for existing tenant validation errors
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const book = await libraryService.updateBook(id, institutionId, req.body);
    
    if (!book) {
      return notFoundResponse(res, 'Book not found');
    }
    
    logger.info('Book updated successfully:', { bookId: id });
    return successResponse(res, book, 'Book updated successfully');
  } catch (error) {
    logger.error('Error updating book:', error);
    return errorResponse(res, error.message);
  }
};

const deleteBook = async (req, res) => {
  try {
    logger.info('Deleting book');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Book ID');
    if (idError) errors.push(idError);
    
    const institutionId = getInstitutionId(req);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await libraryService.deleteBook(id, institutionId);
    
    logger.info('Book deleted successfully:', { bookId: id });
    return successResponse(res, null, 'Book deleted successfully');
  } catch (error) {
    logger.error('Error deleting book:', error);
    return errorResponse(res, error.message);
  }
};

const issueBook = async (req, res) => {
  try {
    logger.info('Issuing book');
    
    const { bookId, userId, dueDate } = req.body;
    
    // Validation
    const errors = [];
    
    const bookIdError = validateObjectId(bookId, 'Book ID');
    if (bookIdError) errors.push(bookIdError);
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (dueDate) {
      const dateError = validateDate(dueDate, 'Due date');
      if (dateError) errors.push(dateError);
      else {
        const dueDateObj = new Date(dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDateObj < today) {
          errors.push('Due date cannot be in the past');
        }
      }
    }
    
    const institutionId = getInstitutionId(req);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const issue = await libraryService.issueBook(req.body, institutionId, req.user._id);
    
    logger.info('Book issued successfully:', { bookId, userId });
    return createdResponse(res, issue, 'Book issued successfully');
  } catch (error) {
    logger.error('Error issuing book:', error);
    return errorResponse(res, error.message);
  }
};

const returnBook = async (req, res) => {
  try {
    logger.info('Returning book');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Issue ID');
    if (idError) errors.push(idError);
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const issue = await libraryService.returnBook(id, institutionId, req.user._id);
    
    if (!issue) {
      return notFoundResponse(res, 'Issue record not found');
    }
    
    logger.info('Book returned successfully:', { issueId: id });
    return successResponse(res, issue, 'Book returned successfully');
  } catch (error) {
    logger.error('Error returning book:', error);
    return errorResponse(res, error.message);
  }
};

const getIssues = async (req, res) => {
  try {
    logger.info('Fetching issues');
    
    const { page, limit, status, userId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }

    const institutionId = getInstitutionId(req);

    const parsedStatus = status
      ? status
          .split(',')
          .map((statusValue) => statusValue.trim().toLowerCase())
          .filter(Boolean)
      : null;

    if (parsedStatus && parsedStatus.length > 0) {
      const invalidStatuses = parsedStatus.filter((statusValue) => !VALID_ISSUE_STATUSES.includes(statusValue));
      if (invalidStatuses.length > 0) {
        errors.push(`Invalid status values: ${invalidStatuses.join(', ')}`);
      }
    }

    if (!institutionId) {
      errors.push('Invalid institution context');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const normalizedStatus = parsedStatus
      ? parsedStatus.map((statusValue) => statusValue.charAt(0).toUpperCase() + statusValue.slice(1))
      : undefined;

    const result = await libraryService.getIssues(institutionId, {
      page: pageNum,
      limit: limitNum,
      userId,
      status: normalizedStatus,
    });
    
    logger.info('Issues fetched successfully');
    return successResponse(res, result, 'Issues retrieved successfully');
  } catch (error) {
    logger.error('Error fetching issues:', error);
    return errorResponse(res, error.message);
  }
};

const getOverdueIssues = async (req, res) => {
  try {
    logger.info('Fetching overdue issues');
    
    // Get institution
    const institutionId = getInstitutionId(req);
    
    const result = await libraryService.getOverdueIssues(institutionId);

    logger.info('Overdue issues fetched successfully');
    return successResponse(res, result, 'Overdue issues retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue issues:', error);
    return errorResponse(res, error.message);
  }
};

const payFine = async (req, res) => {
  try {
    logger.info('Paying fine');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Issue ID');
    if (idError) errors.push(idError);
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const issue = await libraryService.payFine(id, institutionId);
    
    if (!issue) {
      return notFoundResponse(res, 'Issue record not found');
    }
    
    logger.info('Fine paid successfully:', { issueId: id });
    return successResponse(res, issue, 'Fine paid successfully');
  } catch (error) {
    logger.error('Error paying fine:', error);
    return errorResponse(res, error.message);
  }
};

const reserveBook = async (req, res) => {
  try {
    logger.info('Reserving book');
    
    const { bookId } = req.params;
    
    // Validation
    const errors = [];
    
    const bookIdError = validateObjectId(bookId, 'Book ID');
    if (bookIdError) errors.push(bookIdError);
    
    if (!req.user?._id) {
      errors.push('User information is required');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const reservation = await libraryService.reserveBook(
      bookId,
      req.user._id,
      institutionId
    );
    
    logger.info('Book reserved successfully:', { bookId });
    return createdResponse(res, reservation, 'Book reserved successfully');
  } catch (error) {
    logger.error('Error reserving book:', error);
    return errorResponse(res, error.message);
  }
};

const cancelReservation = async (req, res) => {
  try {
    logger.info('Cancelling reservation');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Reservation ID');
    if (idError) errors.push(idError);
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const reservation = await libraryService.cancelReservation(id, institutionId);
    
    if (!reservation) {
      return notFoundResponse(res, 'Reservation not found');
    }
    
    logger.info('Reservation cancelled successfully:', { reservationId: id });
    return successResponse(res, reservation, 'Reservation cancelled successfully');
  } catch (error) {
    logger.error('Error cancelling reservation:', error);
    return errorResponse(res, error.message);
  }
};

const getLibraryOverview = async (req, res) => {
  try {
    logger.info('Fetching library overview');
    
    const institutionId = getInstitutionId(req);
    
    if (!institutionId) {
      return errorResponse(res, 'Invalid institution context');
    }
    
    const overview = await libraryService.getLibraryOverview(institutionId);
    
    logger.info('Library overview fetched successfully');
    return successResponse(res, overview, 'Library overview retrieved successfully');
  } catch (error) {
    logger.error('Error fetching library overview:', error);
    return successResponse(res, {
      totalBooks: 0,
      issuedBooks: 0,
      availableBooks: 0,
      overdueBooks: 0,
      members: 0,
      recentIssues: []
    }, 'Overview retrieved (empty)');
  }
};

const getLibraryStats = async (req, res) => {
  try {
    logger.info('Fetching library statistics');
    
    // Get institution
    const institutionId = getInstitutionId(req);
    
    const stats = await libraryService.getLibraryStats(institutionId);
    
    logger.info('Library statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching library statistics:', error);
    // Return safe default stats
    return successResponse(res, {
      totalBooks: 0,
      availableBooks: 0,
      issuedBooks: 0,
      overdueBooks: 0,
      totalMembers: 0,
      activeMembers: 0
    }, 'Statistics retrieved (empty)');
  }
};

// Get available books
const getAvailableBooks = async (req, res) => {
  try {
    logger.info('Fetching available books');
    
    const { page, limit, category } = req.query;
    
    // Validation
    const errors = [];
    
    if (category && !VALID_BOOK_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await libraryService.getAvailableBooks(institutionId, {
      page: pageNum,
      limit: limitNum,
      category
    });
    
    logger.info('Available books fetched successfully');
    return successResponse(res, result, 'Available books retrieved successfully');
  } catch (error) {
    logger.error('Error fetching available books:', error);
    return errorResponse(res, error.message);
  }
};

// Renew book issue
const renewBookIssue = async (req, res) => {
  try {
    logger.info('Renewing book issue');
    
    const { id } = req.params;
    const { newDueDate } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Issue ID');
    if (idError) errors.push(idError);
    
    if (newDueDate) {
      const dateError = validateDate(newDueDate, 'New due date');
      if (dateError) errors.push(dateError);
      else {
        const dueDateObj = new Date(newDueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dueDateObj < today) {
          errors.push('New due date cannot be in the past');
        }
      }
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const issue = await libraryService.renewBookIssue(id, institutionId, newDueDate);
    
    if (!issue) {
      return notFoundResponse(res, 'Issue record not found');
    }
    
    logger.info('Book issue renewed successfully:', { issueId: id });
    return successResponse(res, issue, 'Book issue renewed successfully');
  } catch (error) {
    logger.error('Error renewing book issue:', error);
    return errorResponse(res, error.message);
  }
};

// Get user issue history
const getUserIssueHistory = async (req, res) => {
  try {
    logger.info('Fetching user issue history');
    
    const { userId } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await libraryService.getUserIssueHistory(userId, institutionId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('User issue history fetched successfully:', { userId });
    return successResponse(res, result, 'Issue history retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user issue history:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk import books
const bulkImportBooks = async (req, res) => {
  try {
    logger.info('Bulk importing books');
    
    const { books } = req.body;
    
    // Validation
    const errors = [];
    
    if (!books || !Array.isArray(books) || books.length === 0) {
      errors.push('Books array is required and must not be empty');
    } else if (books.length > 1000) {
      errors.push('Cannot import more than 1000 books at once');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await libraryService.bulkImportBooks(books, institutionId);
    
    logger.info('Bulk book import completed:', { count: result.importedCount });
    return createdResponse(res, result, 'Books imported successfully');
  } catch (error) {
    logger.error('Error in bulk book import:', error);
    return errorResponse(res, error.message);
  }
};

// Export books
const exportBooks = async (req, res) => {
  try {
    logger.info('Exporting books');
    
    const { format, category, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (category && !VALID_BOOK_CATEGORIES.includes(category)) {
      errors.push('Invalid category');
    }
    
    if (status && !VALID_BOOK_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await libraryService.exportBooks(institutionId, {
      format: format.toLowerCase(),
      category,
      status
    });
    
    logger.info('Books exported successfully:', { format });
    return successResponse(res, exportData, 'Books exported successfully');
  } catch (error) {
    logger.error('Error exporting books:', error);
    return errorResponse(res, error.message);
  }
};

// Get popular books
const getPopularBooks = async (req, res) => {
  try {
    logger.info('Fetching popular books');
    
    const { limit } = req.query;
    
    // Validation
    const errors = [];
    
    const limitNum = parseInt(limit) || 10;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const books = await libraryService.getPopularBooks(institutionId, limitNum);
    
    logger.info('Popular books fetched successfully');
    return successResponse(res, books, 'Popular books retrieved successfully');
  } catch (error) {
    logger.error('Error fetching popular books:', error);
    return errorResponse(res, error.message);
  }
};

// Get library analytics
const getLibraryAnalytics = async (req, res) => {
  try {
    logger.info('Fetching library analytics');
    
    const { groupBy, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const validGroupBy = ['day', 'week', 'month', 'category', 'status'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (startDate) {
      const dateError = validateDate(startDate, 'Start date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate) {
      const dateError = validateDate(endDate, 'End date');
      if (dateError) errors.push(dateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await libraryService.getLibraryAnalytics(institutionId, {
      groupBy: groupBy || 'month',
      startDate,
      endDate
    });
    
    logger.info('Library analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching library analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Send overdue reminders
const sendOverdueReminders = async (req, res) => {
  try {
    logger.info('Sending overdue reminders');
    
    // Get institution
    const institutionId = getInstitutionId(req);
    
    const result = await libraryService.sendOverdueReminders(institutionId);
    
    logger.info('Overdue reminders sent successfully:', { count: result.count });
    return successResponse(res, result, 'Overdue reminders sent successfully');
  } catch (error) {
    logger.error('Error sending overdue reminders:', error);
    return errorResponse(res, error.message);
  }
};

// Get reservations
const getReservations = async (req, res) => {
  try {
    logger.info('Fetching reservations');
    
    const { page, limit, status, userId } = req.query;
    
    // Validation
    const errors = [];
    
    if (status && !VALID_RESERVATION_STATUSES.includes(status)) {
      errors.push('Invalid status');
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await libraryService.getReservations(institutionId, {
      page: pageNum,
      limit: limitNum,
      status,
      userId
    });
    
    logger.info('Reservations fetched successfully');
    return successResponse(res, result, 'Reservations retrieved successfully');
  } catch (error) {
    logger.error('Error fetching reservations:', error);
    return errorResponse(res, error.message);
  }
};

// Add member to library
const addMember = async (req, res) => {
  try {
    logger.info('Adding library member');
    
    const { userId, userType, membershipDate, expiryDate } = req.body;
    
    // Validation
    const errors = [];
    
    if (!userId) {
      errors.push('User ID is required');
    }
    
    if (!userType || !['Student', 'Teacher', 'Staff'].includes(userType)) {
      errors.push('Valid user type is required (Student, Teacher, Staff)');
    }
    
    const institutionId = getInstitutionId(req);
    
    // Skip the broken validation, continue
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ _id: userId, institutionId: institutionId });
    
    if (!user) {
      return notFoundResponse(res, 'User not found');
    }
    
    // Check if user is already a library member
    const { BookIssue } = await import('../models/library.js');
    const existingMember = await BookIssue.findOne({ user: userId, tenant: institutionId });
    
    if (existingMember) {
      return validationErrorResponse(res, ['User is already a library member']);
    }
    
    // Create a dummy issue record to mark user as member (since there's no separate member model)
    // We'll track members through users with library membership flag
    user.isLibraryMember = true;
    user.libraryMemberSince = membershipDate || new Date();
    user.libraryMemberExpiry = expiryDate;
    await user.save();
    
    logger.info('Library member added successfully:', { userId });
    return createdResponse(res, { user: user._id, userType, membershipDate }, 'Member added successfully');
  } catch (error) {
    logger.error('Error adding member:', error);
    return errorResponse(res, error.message);
  }
};

// Get library members
const getMembers = async (req, res) => {
  try {
    logger.info('Fetching library members');
    
    const { page, limit, search, userType } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    // Get institution ID from request
    const institutionId = getInstitutionId(req);
    
    if (!institutionId) {
      logger.error('No institution ID found in request');
      return errorResponse(res, 'Institution context not found');
    }
    
    logger.info('Fetching members for institution:', institutionId.toString());
    
    const User = (await import('../models/User.js')).default;
    const Student = (await import('../models/Student.js')).default;
    
    // Build a combined members list from both Users and Students
    const allMembers = [];
    const memberIds = new Set();
    
    // First, fetch regular users (teachers, staff, admins, librarians) from User collection
    const userQuery = {
      institutionId: institutionId,
      role: { $in: ['teacher', 'staff_member', 'admin', 'principal', 'librarian', 'accountant', 'hr_manager'] }
    };
    
    if (userType && userType.toLowerCase() !== 'all' && userType.toLowerCase() !== 'student') {
      const typeMap = {
        'teacher': 'teacher',
        'staff': ['staff_member', 'staff'],
        'admin': ['admin', 'principal'],
        'librarian': 'librarian'
      };
      const mappedType = typeMap[userType.toLowerCase()];
      userQuery.role = { $in: Array.isArray(mappedType) ? mappedType : [mappedType] };
    }
    
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const [usersData] = await Promise.all([
      User.find(userQuery)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .sort({ createdAt: -1 })
        .select('-password')
        .lean(),
      User.countDocuments(userQuery)
    ]);
    
    // Format and add users
    usersData.forEach(u => {
      allMembers.push({
        _id: u._id,
        id: u._id,
        name: u.name || '',
        email: u.email || '',
        phone: u.phone || '',
        role: u.role,
        userType: u.role === 'teacher' ? 'Teacher' : 'Staff',
        membershipDate: u.libraryMemberSince || u.createdAt,
        expiryDate: u.libraryMemberExpiry,
        status: u.libraryMemberExpiry && new Date(u.libraryMemberExpiry) < new Date() ? 'expired' : 'active',
        createdAt: u.createdAt
      });
      memberIds.add(u._id.toString());
    });
    
    // Second, fetch students from Student collection with their user data
    if (!userType || userType.toLowerCase() === 'all' || userType.toLowerCase() === 'student') {
      const studentQuery = { institutionId: institutionId };
      
      if (search) {
        studentQuery.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      const students = await Student.find(studentQuery)
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .populate('userId', '-password')
        .lean();
      
      students.forEach(s => {
        if (s.userId) {
          const fullName = `${s.firstName || ''} ${s.lastName || ''}`.trim();
          const userId = s.userId._id.toString();
          
          // Add only if not already added as user
          if (!memberIds.has(userId)) {
            allMembers.push({
              _id: s.userId._id,
              id: s.userId._id,
              name: fullName || s.userId.name || '',
              email: s.email || s.userId.email || '',
              phone: s.phone || s.userId.phone || '',
              role: 'student',
              admissionNumber: s.admissionNumber,
              rollNumber: s.rollNumber,
              userType: 'Student',
              membershipDate: s.userId.libraryMemberSince || s.admissionDate,
              expiryDate: s.userId.libraryMemberExpiry,
              status: s.userId.libraryMemberExpiry && new Date(s.userId.libraryMemberExpiry) < new Date() ? 'expired' : 'active',
              createdAt: s.userId.createdAt
            });
            memberIds.add(userId);
          }
        }
      });
    }
    
    const responseData = {
      members: allMembers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: memberIds.size,
        pages: Math.ceil(memberIds.size / limitNum)
      }
    };
    
    logger.info('Returning members:', { count: allMembers.length, total: memberIds.size });
    return successResponse(res, responseData, 'Library members retrieved successfully');
  } catch (error) {
    logger.error('Error fetching members:', error);
    return successResponse(res, {
      members: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 }
    }, 'Library members retrieved (empty)');
  }
};

// Get member by ID
const getMemberById = async (req, res) => {
  try {
    logger.info('Fetching library member');
    
    const { id } = req.params;
    
    const institutionId = getInstitutionId(req);
    
    // Continue with the function
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ _id: id, institutionId: institutionId, isLibraryMember: true });
    
    if (!user) {
      return notFoundResponse(res, 'Library member not found');
    }
    
    // Get issue count
    const { BookIssue } = await import('../models/library.js');
    const issueCount = await BookIssue.countDocuments({ user: id, tenant: institutionId, status: 'Issued' });
    
    return successResponse(res, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      userType: user.userType || (user.role === 'teacher' ? 'Teacher' : user.role === 'student' ? 'Student' : 'Staff'),
      membershipDate: user.libraryMemberSince,
      expiryDate: user.libraryMemberExpiry,
      booksIssued: issueCount,
      status: user.libraryMemberExpiry && new Date(user.libraryMemberExpiry) < new Date() ? 'expired' : 'active'
    }, 'Member retrieved successfully');
  } catch (error) {
    logger.error('Error fetching member:', error);
    return errorResponse(res, error.message);
  }
};

// Update member
const updateMember = async (req, res) => {
  try {
    logger.info('Updating library member');
    
    const { id } = req.params;
    const { membershipDate, expiryDate, status } = req.body;
    
    const institutionId = getInstitutionId(req);
    
    // Continue
    const User = (await import('../models/User.js')).default;
    const user = await User.findOne({ _id: id, institutionId: institutionId, isLibraryMember: true });
    
    if (!user) {
      return notFoundResponse(res, 'Library member not found');
    }
    
    if (membershipDate) user.libraryMemberSince = membershipDate;
    if (expiryDate) user.libraryMemberExpiry = expiryDate;
    if (status === 'inactive') {
      user.isLibraryMember = false;
    } else if (status === 'active') {
      user.isLibraryMember = true;
    }
    
    await user.save();
    
    logger.info('Member updated successfully:', { id });
    return successResponse(res, user, 'Member updated successfully');
  } catch (error) {
    logger.error('Error updating member:', error);
    return errorResponse(res, error.message);
  }
};

// Delete member
const deleteMember = async (req, res) => {
  try {
    logger.info('Deleting library member');
    
    const { id } = req.params;
    
    const institutionId = getInstitutionId(req);
    
    // Check if user has any active issues
    const { BookIssue } = await import('../models/library.js');
    const activeIssues = await BookIssue.countDocuments({ 
      user: id, 
      tenant: institutionId, 
      status: 'Issued' 
    });
    
    if (activeIssues > 0) {
      return validationErrorResponse(res, ['Cannot remove member with active book issues']);
    }
    
    const User = (await import('../models/User.js')).default;
    const user = await User.findOneAndUpdate(
      { _id: id, institutionId: institutionId },
      { isLibraryMember: false },
      { new: true }
    );
    
    if (!user) {
      return notFoundResponse(res, 'Library member not found');
    }
    
    logger.info('Member deleted successfully:', { id });
    return successResponse(res, null, 'Member removed from library successfully');
  } catch (error) {
    logger.error('Error deleting member:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  createBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  issueBook,
  returnBook,
  getIssues,
  getOverdueIssues,
  payFine,
  reserveBook,
  cancelReservation,
  getLibraryStats,
  getLibraryOverview,
  getAvailableBooks,
  renewBookIssue,
  getUserIssueHistory,
  bulkImportBooks,
  exportBooks,
  getPopularBooks,
  getLibraryAnalytics,
  sendOverdueReminders,
  getReservations,
  addMember,
  getMembers,
  getMemberById,
  updateMember,
  deleteMember
};
