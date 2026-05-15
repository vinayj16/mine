/**
 * Database Performance Optimization
 * Indexes, aggregations, and optimization scripts for MongoDB
 */

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Database indexes for optimal query performance
export const databaseIndexes = {
  // User collection indexes
  User: [
    { email: 1 }, // Unique email lookup
    { role: 1 }, // Role-based queries
    { institutionId: 1 }, // Institution-based queries
    { schoolId: 1 }, // School-based queries
    { status: 1 }, // Active/inactive filtering
    { createdAt: -1 }, // Recent users
    { email: 1, institutionId: 1 }, // Compound index for institution-specific email queries
    { role: 1, institutionId: 1 }, // Role and institution queries
    { lastLogin: -1 } // Recent login queries
  ],

  // Student collection indexes
  Student: [
    { 'user.email': 1 }, // Student email lookup
    { studentId: 1 }, // Unique student ID
    { 'academicInfo.grade': 1 }, // Grade-based queries
    { 'academicInfo.class': 1 }, // Class-based queries
    { 'academicInfo.status': 1 }, // Status filtering
    { institutionId: 1 }, // Institution queries
    { 'academicInfo.grade': 1, 'academicInfo.class': 1 }, // Grade and class queries
    { 'academicInfo.enrollmentDate': -1 }, // Recent enrollments
    { 'personalInfo.dateOfBirth': 1 } // Age-based queries
  ],

  // Teacher collection indexes
  Teacher: [
    { 'user.email': 1 }, // Teacher email lookup
    { employeeId: 1 }, // Unique employee ID
    { subjects: 1 }, // Subject-based queries
    { department: 1 }, // Department queries
    { status: 1 }, // Active/inactive filtering
    { institutionId: 1 }, // Institution queries
    { hireDate: -1 }, // Recent hires
    { 'user.role': 1, institutionId: 1 } // Role and institution queries
  ],

  // Attendance collection indexes
  Attendance: [
    { student: 1, date: -1 }, // Student attendance history
    { class: 1, date: -1 }, // Class attendance for date
    { date: -1 }, // All attendance for date
    { status: 1, date: -1 }, // Status filtering by date
    { student: 1, class: 1, date: -1 }, // Student-class attendance
    { markedBy: 1 }, // Teacher who marked attendance
    { createdAt: -1 } // Recent attendance records
  ],

  // Class collection indexes
  Class: [
    { name: 1 }, // Class name lookup
    { grade: 1 }, // Grade-based queries
    { section: 1 }, // Section queries
    { academicYear: 1 }, // Year-based queries
    { teacher: 1 }, // Class teacher queries
    { institutionId: 1 }, // Institution queries
    { status: 1 }, // Active/inactive classes
    { grade: 1, section: 1 }, // Grade and section queries
    { capacity: 1 } // Capacity-based queries
  ],

  // Exam collection indexes
  Exam: [
    { name: 1 }, // Exam name lookup
    { subject: 1 }, // Subject-based queries
    { class: 1 }, // Class-based queries
    { examDate: -1 }, // Upcoming exams
    { status: 1 }, // Exam status
    { type: 1 }, // Exam type queries
    { subject: 1, class: 1 }, // Subject and class queries
    { createdBy: 1 }, // Teacher who created exam
    { totalMarks: 1 } // Score-based queries
  ],

  // Fee collection indexes
  Fee: [
    { student: 1 }, // Student fee records
    { type: 1 }, // Fee type queries
    { status: 1 }, // Payment status
    { dueDate: 1 }, // Upcoming due dates
    { academicYear: 1 }, // Year-based queries
    { amount: 1 }, // Amount-based queries
    { student: 1, status: 1 }, // Student payment status
    { dueDate: 1, status: 1 }, // Overdue payments
    { createdAt: -1 } // Recent fee records
  ],

  // Notification collection indexes
  Notification: [
    { recipient: 1, read: 1 }, // Unread notifications for user
    { type: 1 }, // Notification type filtering
    { priority: 1 }, // Priority-based queries
    { createdAt: -1 }, // Recent notifications
    { recipient: 1, createdAt: -1 }, // User notification history
    { expiresAt: 1 } // Expiration cleanup
  ],

  // SupportTicket collection indexes
  SupportTicket: [
    { createdBy: 1 }, // User ticket history
    { assignedTo: 1 }, // Assigned tickets
    { status: 1 }, // Status filtering
    { priority: 1 }, // Priority sorting
    { category: 1 }, // Category filtering
    { createdAt: -1 }, // Recent tickets
    { status: 1, priority: 1 }, // Status and priority queries
    { updatedAt: -1 } // Recently updated tickets
  ],

  // Institution collection indexes
  Institution: [
    { name: 1 }, // Institution name lookup
    { code: 1 }, // Unique institution code
    { type: 1 }, // Institution type
    { status: 1 }, // Active/inactive institutions
    { 'subscription.status': 1 }, // Subscription status
    { 'subscription.expiresAt': 1 }, // Expiring subscriptions
    { createdAt: -1 } // Recent institutions
  ]
};

// Aggregation pipelines for common queries
export const aggregationPipelines = {
  // Student attendance summary
  studentAttendanceSummary: (studentId, startDate, endDate) => [
    {
      $match: {
        student: mongoose.Types.ObjectId(studentId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ],

  // Class attendance report
  classAttendanceReport: (classId, date) => [
    {
      $match: {
        class: mongoose.Types.ObjectId(classId),
        date: new Date(date)
      }
    },
    {
      $lookup: {
        from: 'students',
        localField: 'student',
        foreignField: '_id',
        as: 'studentInfo'
      }
    },
    {
      $unwind: '$studentInfo'
    },
    {
      $project: {
        studentId: '$studentInfo.studentId',
        studentName: '$studentInfo.user.name',
        status: 1,
        markedBy: 1,
        markedAt: 1
      }
    }
  ],

  // Monthly fee collection summary
  monthlyFeeSummary: (institutionId, year, month) => [
    {
      $match: {
        institutionId: mongoose.Types.ObjectId(institutionId),
        createdAt: {
          $gte: new Date(year, month - 1, 1),
          $lt: new Date(year, month, 1)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ],

  // Student performance analytics
  studentPerformanceAnalytics: (studentId) => [
    {
      $match: { student: mongoose.Types.ObjectId(studentId) }
    },
    {
      $lookup: {
        from: 'exams',
        localField: 'exam',
        foreignField: '_id',
        as: 'examInfo'
      }
    },
    {
      $unwind: '$examInfo'
    },
    {
      $group: {
        _id: '$examInfo.subject',
        averageScore: { $avg: '$marksObtained' },
        totalExams: { $sum: 1 },
        highestScore: { $max: '$marksObtained' },
        lowestScore: { $min: '$marksObtained' }
      }
    }
  ]
};

// Database optimization functions
export class DatabaseOptimizer {
  /**
   * Create all database indexes
   */
  static async createIndexes() {
    const db = mongoose.connection.db;
    const collections = Object.keys(databaseIndexes);

    logger.info('Starting database index creation...');

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName.toLowerCase() + 's');
        const indexes = databaseIndexes[collectionName];

        for (const indexSpec of indexes) {
          await collection.createIndex(indexSpec);
          logger.info(`Created index on ${collectionName}:`, indexSpec);
        }
      } catch (error) {
        logger.error(`Error creating indexes for ${collectionName}:`, error);
      }
    }

    logger.info('Database index creation completed');
  }

  /**
   * Analyze slow queries and suggest optimizations
   */
  static async analyzeSlowQueries() {
    try {
      const db = mongoose.connection.db;
      const profileResults = await db.command({ profile: 2, slowms: 100 });

      logger.info('Slow query profiling enabled (100ms threshold)');
      return profileResults;
    } catch (error) {
      logger.error('Error enabling query profiling:', error);
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats() {
    try {
      const db = mongoose.connection.db;
      const stats = await db.stats();

      logger.info('Database Statistics:', {
        db: stats.db,
        collections: stats.collections,
        objects: stats.objects,
        dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
        storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
        indexes: stats.indexes,
        indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
      });

      return stats;
    } catch (error) {
      logger.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Optimize collection by rebuilding indexes
   */
  static async optimizeCollection(collectionName) {
    try {
      const db = mongoose.connection.db;
      const collection = db.collection(collectionName);

      logger.info(`Starting optimization for collection: ${collectionName}`);

      // Rebuild indexes
      await collection.reIndex();

      // Analyze collection
      const stats = await collection.stats();

      logger.info(`Optimization completed for ${collectionName}:`, {
        size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
        count: stats.count,
        indexes: Object.keys(stats.indexSizes || {}).length
      });

      return stats;
    } catch (error) {
      logger.error(`Error optimizing collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Run database maintenance tasks
   */
  static async runMaintenance() {
    try {
      logger.info('Starting database maintenance...');

      // Clean up expired notifications
      const notificationCleanup = await mongoose.connection.db
        .collection('notifications')
        .deleteMany({ expiresAt: { $lt: new Date() } });

      // Clean up old sessions (if using MongoDB sessions)
      const sessionCleanup = await mongoose.connection.db
        .collection('sessions')
        .deleteMany({ expires: { $lt: new Date() } });

      // Update statistics
      await this.getDatabaseStats();

      logger.info('Database maintenance completed:', {
        notificationsCleaned: notificationCleanup.deletedCount || 0,
        sessionsCleaned: sessionCleanup.deletedCount || 0
      });

      return {
        notificationsCleaned: notificationCleanup.deletedCount || 0,
        sessionsCleaned: sessionCleanup.deletedCount || 0
      };
    } catch (error) {
      logger.error('Database maintenance error:', error);
      throw error;
    }
  }

  /**
   * Create text indexes for search functionality
   */
  static async createTextIndexes() {
    try {
      const db = mongoose.connection.db;

      // Student search index
      await db.collection('students').createIndex({
        'user.name': 'text',
        'user.email': 'text',
        studentId: 'text'
      });

      // Teacher search index
      await db.collection('teachers').createIndex({
        'user.name': 'text',
        'user.email': 'text',
        employeeId: 'text',
        subjects: 'text'
      });

      // User search index
      await db.collection('users').createIndex({
        name: 'text',
        email: 'text'
      });

      logger.info('Text indexes created for search functionality');
    } catch (error) {
      logger.error('Error creating text indexes:', error);
      throw error;
    }
  }

  /**
   * Monitor database performance
   */
  static async monitorPerformance() {
    try {
      const db = mongoose.connection.db;

      // Get server status
      const serverStatus = await db.admin().serverStatus();

      // Extract relevant metrics
      const metrics = {
        connections: serverStatus.connections,
        opcounters: serverStatus.opcounters,
        mem: serverStatus.mem,
        uptime: serverStatus.uptime,
        asserts: serverStatus.asserts
      };

      logger.info('Database Performance Metrics:', metrics);
      return metrics;
    } catch (error) {
      logger.error('Error monitoring database performance:', error);
      throw error;
    }
  }
}

// Query optimization helpers
export const queryHelpers = {
  /**
   * Add pagination to any query
   */
  paginate: (query, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    return query.skip(skip).limit(limit);
  },

  /**
   * Add sorting to any query
   */
  sort: (query, sortBy = 'createdAt', order = 'desc') => {
    const sortOrder = order === 'desc' ? -1 : 1;
    return query.sort({ [sortBy]: sortOrder });
  },

  /**
   * Add search functionality
   */
  search: (query, searchTerm, searchFields = []) => {
    if (!searchTerm || searchFields.length === 0) return query;

    const searchRegex = new RegExp(searchTerm, 'i');
    const searchConditions = searchFields.map(field => ({
      [field]: searchRegex
    }));

    return query.find({ $or: searchConditions });
  },

  /**
   * Add filtering functionality
   */
  filter: (query, filters = {}) => {
    const conditions = {};

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle different filter types
        if (key.includes('Date') || key.includes('date')) {
          conditions[key] = new Date(value);
        } else if (key.includes('Id') || key.includes('_id')) {
          conditions[key] = mongoose.Types.ObjectId(value);
        } else if (typeof value === 'string' && value.includes(',')) {
          conditions[key] = { $in: value.split(',').map(v => v.trim()) };
        } else {
          conditions[key] = value;
        }
      }
    });

    return Object.keys(conditions).length > 0 ? query.find(conditions) : query;
  }
};

export default {
  databaseIndexes,
  aggregationPipelines,
  DatabaseOptimizer,
  queryHelpers
};
