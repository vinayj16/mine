import { Book, BookIssue, BookReservation } from '../models/library.js';
import logger from '../utils/logger.js';

class LibraryService {
  // Book Management
  async createBook(bookData, tenantId) {
    try {
      // Ensure tenant is always set
      const data = {
        ...bookData,
        tenant: tenantId || bookData.tenant || '507f1f77bcf86cd799439011'
      };
      const book = new Book(data);
      await book.save();
      logger.info('Book created successfully', { bookId: book._id });
      return book;
    } catch (error) {
      logger.error('Failed to create book', { error: error.message });
      throw error;
    }
  }

  async getBooks(tenantId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, search, category, status } = { ...filters, ...pagination };
      const skip = (page - 1) * limit;

      const query = { tenant: tenantId };

      if (search) {
        query.$text = { $search: search };
      }

      if (category) {
        query.category = category;
      }

      if (status) {
        query.status = status;
      }

      const [books, total] = await Promise.all([
        Book.find(query)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        Book.countDocuments(query),
      ]);

      return {
        books,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to fetch books', { error: error.message });
      throw error;
    }
  }

  async getBookById(bookId, tenantId) {
    try {
      const book = await Book.findOne({ _id: bookId, tenant: tenantId });
      if (!book) {
        throw new Error('Book not found');
      }
      return book;
    } catch (error) {
      logger.error('Failed to fetch book', { bookId, error: error.message });
      throw error;
    }
  }

  async updateBook(bookId, tenantId, updateData) {
    try {
      const book = await Book.findOneAndUpdate(
        { _id: bookId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!book) {
        throw new Error('Book not found');
      }

      logger.info('Book updated successfully', { bookId });
      return book;
    } catch (error) {
      logger.error('Failed to update book', { bookId, error: error.message });
      throw error;
    }
  }

  async deleteBook(bookId, tenantId) {
    try {
      // Check if book has active issues
      const activeIssues = await BookIssue.countDocuments({
        book: bookId,
        tenant: tenantId,
        status: 'Issued',
      });

      if (activeIssues > 0) {
        throw new Error('Cannot delete book with active issues');
      }

      const book = await Book.findOneAndDelete({ _id: bookId, tenant: tenantId });

      if (!book) {
        throw new Error('Book not found');
      }

      logger.info('Book deleted successfully', { bookId });
      return book;
    } catch (error) {
      logger.error('Failed to delete book', { bookId, error: error.message });
      throw error;
    }
  }

  // Issue Management
  async issueBook(issueData, tenantId, issuedBy) {
    try {
      const book = await Book.findOne({ _id: issueData.bookId, tenant: tenantId });

      if (!book) {
        throw new Error('Book not found');
      }

      if (book.availableCopies <= 0) {
        throw new Error('No copies available');
      }

      // Check if user already has this book
      const existingIssue = await BookIssue.findOne({
        book: issueData.bookId,
        user: issueData.userId,
        tenant: tenantId,
        status: 'Issued',
      });

      if (existingIssue) {
        throw new Error('User already has this book issued');
      }

      // Calculate due date (default 14 days)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (issueData.daysAllowed || 14));

      const issue = new BookIssue({
        book: issueData.bookId,
        user: issueData.userId,
        userType: issueData.userType,
        dueDate,
        issuedBy,
        tenant: tenantId,
      });

      await issue.save();

      // Update available copies
      book.availableCopies -= 1;
      await book.save();

      logger.info('Book issued successfully', { issueId: issue._id });
      return await issue.populate(['book', 'user', 'issuedBy']);
    } catch (error) {
      logger.error('Failed to issue book', { error: error.message });
      throw error;
    }
  }

  async returnBook(issueId, tenantId, returnedTo) {
    try {
      const issue = await BookIssue.findOne({
        _id: issueId,
        tenant: tenantId,
        status: 'Issued',
      }).populate('book');

      if (!issue) {
        throw new Error('Issue record not found');
      }

      issue.returnDate = new Date();
      issue.status = 'Returned';
      issue.returnedTo = returnedTo;

      // Calculate fine if overdue
      const fine = issue.calculateFine();
      if (fine > 0) {
        issue.fine = fine;
        issue.fineStatus = 'Pending';
      }

      await issue.save();

      // Update available copies
      const book = await Book.findById(issue.book._id);
      book.availableCopies += 1;
      await book.save();

      logger.info('Book returned successfully', { issueId });
      return await issue.populate(['user', 'returnedTo']);
    } catch (error) {
      logger.error('Failed to return book', { issueId, error: error.message });
      throw error;
    }
  }

  async getIssues(tenantId, filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, userId, status } = { ...filters, ...pagination };
      const skip = (page - 1) * limit;

      const query = { tenant: tenantId };

      if (userId) {
        query.user = userId;
      }

      if (status) {
        query.status = status;
      }

      const [issues, total] = await Promise.all([
        BookIssue.find(query)
          .populate('book user issuedBy returnedTo')
          .skip(skip)
          .limit(limit)
          .sort({ issueDate: -1 }),
        BookIssue.countDocuments(query),
      ]);

      return {
        issues,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Failed to fetch issues', { error: error.message });
      throw error;
    }
  }

  async getOverdueIssues(tenantId) {
    try {
      const issues = await BookIssue.find({
        tenant: tenantId,
        status: 'Issued',
        dueDate: { $lt: new Date() },
      }).populate('book user');

      // Calculate fines
      issues.forEach((issue) => {
        issue.fine = issue.calculateFine();
      });

      return issues;
    } catch (error) {
      logger.error('Failed to fetch overdue issues', { error: error.message });
      throw error;
    }
  }

  async payFine(issueId, tenantId) {
    try {
      const issue = await BookIssue.findOne({ _id: issueId, tenant: tenantId });

      if (!issue) {
        throw new Error('Issue record not found');
      }

      issue.fineStatus = 'Paid';
      await issue.save();

      logger.info('Fine paid successfully', { issueId });
      return issue;
    } catch (error) {
      logger.error('Failed to pay fine', { issueId, error: error.message });
      throw error;
    }
  }

  // Reservation Management
  async reserveBook(bookId, userId, tenantId) {
    try {
      const book = await Book.findOne({ _id: bookId, tenant: tenantId });

      if (!book) {
        throw new Error('Book not found');
      }

      // Check if user already has a reservation
      const existingReservation = await BookReservation.findOne({
        book: bookId,
        user: userId,
        tenant: tenantId,
        status: 'Active',
      });

      if (existingReservation) {
        throw new Error('You already have a reservation for this book');
      }

      // Set expiry date (7 days from now)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);

      const reservation = new BookReservation({
        book: bookId,
        user: userId,
        expiryDate,
        tenant: tenantId,
      });

      await reservation.save();

      logger.info('Book reserved successfully', { reservationId: reservation._id });
      return await reservation.populate(['book', 'user']);
    } catch (error) {
      logger.error('Failed to reserve book', { error: error.message });
      throw error;
    }
  }

  async cancelReservation(reservationId, tenantId) {
    try {
      const reservation = await BookReservation.findOneAndUpdate(
        { _id: reservationId, tenant: tenantId },
        { status: 'Cancelled' },
        { new: true }
      );

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      logger.info('Reservation cancelled', { reservationId });
      return reservation;
    } catch (error) {
      logger.error('Failed to cancel reservation', { error: error.message });
      throw error;
    }
  }

  // Statistics
  async getLibraryStats(tenantId) {
    try {
      const [
        totalBooks,
        availableBooks,
        issuedBooks,
        overdueBooks,
        totalReservations,
      ] = await Promise.all([
        Book.countDocuments({ tenant: tenantId, status: 'Active' }),
        Book.aggregate([
          { $match: { tenant: tenantId, status: 'Active' } },
          { $group: { _id: null, total: { $sum: '$availableCopies' } } },
        ]),
        BookIssue.countDocuments({ tenant: tenantId, status: 'Issued' }),
        BookIssue.countDocuments({
          tenant: tenantId,
          status: 'Issued',
          dueDate: { $lt: new Date() },
        }),
        BookReservation.countDocuments({ tenant: tenantId, status: 'Active' }),
      ]);

      return {
        totalBooks,
        availableBooks: availableBooks[0]?.total || 0,
        issuedBooks,
        overdueBooks,
        totalReservations,
      };
    } catch (error) {
      logger.error('Failed to fetch library stats', { error: error.message });
      throw error;
    }
  }
}

export default new LibraryService();
