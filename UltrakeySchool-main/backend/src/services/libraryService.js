import { Book, BookIssue, BookReservation } from '../models/library.js';
import logger from '../utils/logger.js';

class LibraryService {
  // Helper to create the institution query
  getInstitutionQuery(tenantId) {
    return { 
      $or: [
        { tenant: tenantId }, 
        { institutionId: tenantId }, 
        { institution: tenantId }, 
        { schoolId: tenantId }
      ] 
    };
  }

  // Book Management
  async createBook(bookData, tenantId) {
    try {
      // Ensure tenant is always set and set defaults
      const data = {
        ...bookData,
        tenant: tenantId || bookData.tenant,
        category: bookData.category || 'Other',
        totalCopies: bookData.totalCopies || 1,
        availableCopies: bookData.availableCopies ?? (bookData.totalCopies || 1),
        status: bookData.status || 'Active',
        language: bookData.language || 'English'
      };
      const book = new Book(data);
      await book.save();
      logger.info('Book created successfully', { bookId: book._id, title: book.title });
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

      const query = this.getInstitutionQuery(tenantId);

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
      const query = this.getInstitutionQuery(tenantId);
      query._id = bookId;
      const book = await Book.findOne(query);
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
      const query = this.getInstitutionQuery(tenantId);
      query._id = bookId;
      const book = await Book.findOneAndUpdate(
        query,
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
      const query = this.getInstitutionQuery(tenantId);
      
      // Check if book has active issues
      const issueQuery = { ...query, book: bookId, status: 'Issued' };
      const activeIssues = await BookIssue.countDocuments(issueQuery);

      if (activeIssues > 0) {
        throw new Error('Cannot delete book with active issues');
      }

      query._id = bookId;
      const book = await Book.findOneAndDelete(query);

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
      const bookId = issueData.bookId || issueData._id || issueData.id;
      const userId = issueData.userId || issueData.studentId;
      
      const bookQuery = this.getInstitutionQuery(tenantId);
      bookQuery._id = bookId;
      const book = await Book.findOne(bookQuery);

      if (!book) {
        throw new Error('Book not found');
      }

      if (book.availableCopies <= 0) {
        throw new Error('No copies available');
      }

      const existingIssueQuery = this.getInstitutionQuery(tenantId);
      existingIssueQuery.book = bookId;
      existingIssueQuery.user = userId;
      existingIssueQuery.status = { $in: ['Issued', 'issued'] };
      
      const existingIssue = await BookIssue.findOne(existingIssueQuery);

      if (existingIssue) {
        throw new Error('User already has this book issued');
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (issueData.daysAllowed || 14));

      const issue = new BookIssue({
        book: bookId,
        user: userId,
        userType: issueData.userType || 'Student',
        issueDate: new Date(),
        dueDate,
        issuedBy,
        tenant: tenantId,
        status: 'Issued'
      });

      await issue.save();

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
      const query = this.getInstitutionQuery(tenantId);
      query._id = issueId;
      query.status = { $in: ['Issued', 'issued', 'Overdue', 'overdue'] };
      
      const issue = await BookIssue.findOne(query).populate('book');

      if (!issue) {
        throw new Error('Issue record not found or already returned');
      }

      issue.returnDate = new Date();
      issue.status = 'Returned';
      issue.returnedTo = returnedTo;

      const fine = issue.calculateFine();
      if (fine > 0) {
        issue.fine = fine;
        issue.fineStatus = 'Pending';
      }

      await issue.save();

      if (issue.book && issue.book._id) {
        const book = await Book.findById(issue.book._id);
        if (book) {
          book.availableCopies += 1;
          await book.save();
        }
      }

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

      const query = this.getInstitutionQuery(tenantId);

      if (userId) {
        query.user = userId;
      }

      if (status) {
        if (Array.isArray(status)) {
          query.status = { $in: status };
        } else {
          query.status = status;
        }
      }

      const [issues, total] = await Promise.all([
        BookIssue.find(query)
          .populate('book user issuedBy returnedTo')
          .skip(skip)
          .limit(limit)
          .sort({ issueDate: -1 }),
        BookIssue.countDocuments(query),
      ]);

      const transformedIssues = issues.map(issue => {
        if (issue.bookId && !issue.book) {
          return {
            ...issue.toObject(),
            book: {
              _id: issue.bookId,
              title: issue.bookTitle || 'Unknown Book'
            },
            user: issue.studentId ? {
              _id: issue.studentId,
              name: issue.studentName || 'Unknown Student',
              email: ''
            } : (issue.user || { _id: null, name: 'Unknown' }),
            userType: 'Student'
          };
        }
        return issue;
      });

      return {
        issues: transformedIssues,
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
      const query = this.getInstitutionQuery(tenantId);
      query.status = 'Issued';
      query.dueDate = { $lt: new Date() };
      
      const issues = await BookIssue.find(query).populate('book user');

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
      const query = this.getInstitutionQuery(tenantId);
      query._id = issueId;
      const issue = await BookIssue.findOne(query);

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
      const bookQuery = this.getInstitutionQuery(tenantId);
      bookQuery._id = bookId;
      const book = await Book.findOne(bookQuery);

      if (!book) {
        throw new Error('Book not found');
      }

      const existingReservationQuery = this.getInstitutionQuery(tenantId);
      existingReservationQuery.book = bookId;
      existingReservationQuery.user = userId;
      existingReservationQuery.status = 'Active';
      
      const existingReservation = await BookReservation.findOne(existingReservationQuery);

      if (existingReservation) {
        throw new Error('You already have a reservation for this book');
      }

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
      const query = this.getInstitutionQuery(tenantId);
      query._id = reservationId;
      
      const reservation = await BookReservation.findOneAndUpdate(
        query,
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

  // Overview
  async getLibraryOverview(tenantId) {
    try {
      const query = this.getInstitutionQuery(tenantId);
      const activeBookQuery = { ...query, status: 'Active' };
      const issuedIssueQuery = { ...query, status: 'Issued' };
      
      const [
        totalBooks,
        issuedBooks,
        availableBooksCount,
        overdueBooks,
        recentIssues,
        totalMembers
      ] = await Promise.all([
        Book.countDocuments(activeBookQuery),
        BookIssue.countDocuments(issuedIssueQuery),
        Book.aggregate([
          { $match: activeBookQuery },
          { $group: { _id: null, total: { $sum: '$availableCopies' } } },
        ]),
        BookIssue.countDocuments({
          ...issuedIssueQuery,
          dueDate: { $lt: new Date() },
        }),
        BookIssue.find(issuedIssueQuery)
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('book', 'title')
          .populate('user', 'firstName lastName'),
        BookIssue.distinct('user', query)
      ]);

      const recentIssuesFormatted = recentIssues.map(issue => ({
        id: issue._id,
        bookName: issue.book?.title || 'Unknown',
        borrower: issue.user ? `${issue.user.firstName || ''} ${issue.user.lastName || ''}`.trim() : 'Unknown',
        issueDate: issue.issueDate,
        dueDate: issue.dueDate,
        status: issue.status.toLowerCase()
      }));

      return {
        totalBooks,
        issuedBooks,
        availableBooks: availableBooksCount[0]?.total || 0,
        overdueBooks,
        members: totalMembers.length,
        recentIssues: recentIssuesFormatted
      };
    } catch (error) {
      logger.error('Failed to fetch library overview', { error: error.message });
      throw error;
    }
  }

  // Statistics
  async getLibraryStats(tenantId) {
    try {
      const query = this.getInstitutionQuery(tenantId);
      const activeBookQuery = { ...query, status: 'Active' };
      const issuedIssueQuery = { ...query, status: 'Issued' };
      const activeReservationQuery = { ...query, status: 'Active' };

      const [
        totalBooks,
        availableBooks,
        issuedBooks,
        overdueBooks,
        totalReservations,
      ] = await Promise.all([
        Book.countDocuments(activeBookQuery),
        Book.aggregate([
          { $match: activeBookQuery },
          { $group: { _id: null, total: { $sum: '$availableCopies' } } },
        ]),
        BookIssue.countDocuments(issuedIssueQuery),
        BookIssue.countDocuments({
          ...issuedIssueQuery,
          dueDate: { $lt: new Date() },
        }),
        BookReservation.countDocuments(activeReservationQuery),
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
