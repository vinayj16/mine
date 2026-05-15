import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Admission Application Schema
const admissionApplicationSchema = new mongoose.Schema({
  applicationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  student: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    previousSchool: String,
    previousClass: String,
  },
  parent: {
    fatherName: String,
    fatherOccupation: String,
    fatherPhone: String,
    fatherEmail: String,
    motherName: String,
    motherOccupation: String,
    motherPhone: String,
    motherEmail: String,
    guardianName: String,
    guardianRelation: String,
    guardianPhone: String,
    guardianEmail: String,
  },
  appliedFor: {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
    },
  },
  documents: [{
    type: String,
    name: String,
    url: String,
  }],
  entranceTest: {
    required: {
      type: Boolean,
      default: false,
    },
    scheduled: Boolean,
    testDate: Date,
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'OnlineExam',
    },
    completed: {
      type: Boolean,
      default: false,
    },
    score: Number,
    maxScore: Number,
    percentage: Number,
    rank: Number,
  },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'test_scheduled', 'test_completed', 'approved', 'rejected', 'waitlisted'],
    default: 'submitted',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: Date,
  reviewNotes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectedAt: Date,
  rejectionReason: String,
  meritScore: {
    type: Number,
    default: 0,
  },
  meritRank: Number,
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

admissionApplicationSchema.index({ tenant: 1, academicYear: 1, status: 1 });

const AdmissionApplication = mongoose.model('AdmissionApplication', admissionApplicationSchema);

// Admission Criteria Schema
const admissionCriteriaSchema = new mongoose.Schema({
  academicYear: {
    type: String,
    required: true,
  },
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  totalSeats: {
    type: Number,
    required: true,
  },
  reservedSeats: {
    general: Number,
    sc: Number,
    st: Number,
    obc: Number,
    ews: Number,
  },
  entranceTest: {
    required: {
      type: Boolean,
      default: false,
    },
    passingPercentage: {
      type: Number,
      default: 40,
    },
    weightage: {
      type: Number,
      default: 100,
    },
  },
  previousAcademicPerformance: {
    required: {
      type: Boolean,
      default: false,
    },
    weightage: {
      type: Number,
      default: 0,
    },
  },
  interview: {
    required: {
      type: Boolean,
      default: false,
    },
    weightage: {
      type: Number,
      default: 0,
    },
  },
  ageLimit: {
    min: Number,
    max: Number,
  },
  applicationFee: {
    type: Number,
    default: 0,
  },
  applicationStartDate: Date,
  applicationEndDate: Date,
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const AdmissionCriteria = mongoose.model('AdmissionCriteria', admissionCriteriaSchema);

class AdmissionService {
  /**
   * Submit admission application
   * @param {string} tenantId - Tenant ID
   * @param {Object} applicationData - Application data
   * @returns {Object} Application
   */
  async submitApplication(tenantId, applicationData) {
    try {
      // Generate application number
      const applicationNumber = await this.generateApplicationNumber(tenantId);

      const application = new AdmissionApplication({
        ...applicationData,
        applicationNumber,
        tenant: tenantId,
      });

      await application.save();
      // Skip populate if Class/Section models don't exist
      try {
        await application.populate(['appliedFor.class', 'appliedFor.section']);
      } catch (error) {
        // Models don't exist, skip populate
        logger.warn('Class/Section models not found, skipping populate');
      }

      logger.info(`Admission application submitted: ${application._id}`);
      return application;
    } catch (error) {
      logger.error(`Error submitting application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate application number
   * @param {string} tenantId - Tenant ID
   * @returns {string} Application number
   */
  async generateApplicationNumber(tenantId) {
    const year = new Date().getFullYear();
    const count = await AdmissionApplication.countDocuments({
      tenant: tenantId,
      createdAt: {
        $gte: new Date(year, 0, 1),
        $lt: new Date(year + 1, 0, 1),
      },
    });

    return `ADM${year}${String(count + 1).padStart(5, '0')}`;
  }

  /**
   * Get applications
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Applications with pagination
   */
  async getApplications(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 20, status, academicYear, classId } = filters;
      const query = { tenant: tenantId };

      if (status) query.status = status;
      if (academicYear) query.academicYear = academicYear;
      if (classId) query['appliedFor.class'] = classId;

      let applications = await AdmissionApplication.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      // Try to populate if models exist
      try {
        applications = await AdmissionApplication.populate(applications, ['appliedFor.class', 'appliedFor.section', 'reviewedBy', 'approvedBy']);
      } catch (error) {
        logger.warn('Some models not found for populate, skipping');
      }

      const total = await AdmissionApplication.countDocuments(query);

      return {
        data: applications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching applications: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get application by ID
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @returns {Object} Application
   */
  async getApplicationById(tenantId, applicationId) {
    try {
      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      // Try to populate if models exist
      try {
        await application.populate(['appliedFor.class', 'appliedFor.section', 'reviewedBy', 'approvedBy', 'entranceTest.testId']);
      } catch (error) {
        logger.warn('Some models not found for populate, skipping');
      }

      return application;
    } catch (error) {
      logger.error(`Error fetching application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update application
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated application
   */
  async updateApplication(tenantId, applicationId, updateData) {
    try {
      const application = await AdmissionApplication.findOneAndUpdate(
        { _id: applicationId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!application) {
        throw new Error('Application not found');
      }

      // Try to populate if models exist
      try {
        await application.populate(['appliedFor.class', 'appliedFor.section']);
      } catch (error) {
        logger.warn('Class/Section models not found for populate, skipping');
      }

      logger.info(`Application updated: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error updating application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Review application
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @param {string} reviewerId - Reviewer ID
   * @param {Object} reviewData - Review data
   * @returns {Object} Updated application
   */
  async reviewApplication(tenantId, applicationId, reviewerId, reviewData) {
    try {
      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      application.status = 'under_review';
      application.reviewedBy = reviewerId;
      application.reviewedAt = new Date();
      application.reviewNotes = reviewData.notes;

      await application.save();

      logger.info(`Application reviewed: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error reviewing application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Approve application
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @param {string} approverId - Approver ID
   * @param {Object} approvalData - Approval data
   * @returns {Object} Updated application
   */
  async approveApplication(tenantId, applicationId, approverId, approvalData) {
    try {
      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      application.status = 'approved';
      application.approvedBy = approverId;
      application.approvedAt = new Date();

      await application.save();

      logger.info(`Application approved: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error approving application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject application
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @param {string} rejecterId - Rejecter ID
   * @param {Object} rejectionData - Rejection data
   * @returns {Object} Updated application
   */
  async rejectApplication(tenantId, applicationId, rejecterId, rejectionData) {
    try {
      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      application.status = 'rejected';
      application.rejectedBy = rejecterId;
      application.rejectedAt = new Date();
      application.rejectionReason = rejectionData.reason;

      await application.save();

      logger.info(`Application rejected: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error rejecting application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Schedule entrance test
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @param {Object} testData - Test data
   * @returns {Object} Updated application
   */
  async scheduleEntranceTest(tenantId, applicationId, testData) {
    try {
      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      application.entranceTest.scheduled = true;
      application.entranceTest.testDate = testData.testDate;
      application.entranceTest.testId = testData.testId;
      application.status = 'test_scheduled';

      await application.save();

      logger.info(`Entrance test scheduled for application: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error scheduling entrance test: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit entrance test result
   * @param {string} tenantId - Tenant ID
   * @param {string} applicationId - Application ID
   * @param {Object} resultData - Result data
   * @returns {Object} Updated application
   */
  async submitEntranceTestResult(tenantId, applicationId, resultData) {
    try {
      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      application.entranceTest.completed = true;
      application.entranceTest.score = resultData.score;
      application.entranceTest.maxScore = resultData.maxScore;
      application.entranceTest.percentage = (resultData.score / resultData.maxScore) * 100;
      application.status = 'test_completed';

      // Calculate merit score
      application.meritScore = application.entranceTest.percentage;

      await application.save();

      logger.info(`Entrance test result submitted for application: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error submitting test result: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate merit list
   * @param {string} tenantId - Tenant ID
   * @param {Object} criteria - Criteria
   * @returns {Array} Merit list
   */
  async generateMeritList(tenantId, criteria) {
    try {
      const { academicYear, classId } = criteria;

      const query = {
        tenant: tenantId,
        academicYear,
        'appliedFor.class': classId,
        status: { $in: ['test_completed', 'approved'] },
      };

      // Get all applications
      let applications = await AdmissionApplication.find(query)
        .sort({ meritScore: -1 });

      // Try to populate if models exist
      try {
        applications = await AdmissionApplication.populate(applications, ['appliedFor.class', 'appliedFor.section']);
      } catch (error) {
        logger.warn('Class/Section models not found for populate, skipping');
      }

      // Assign ranks
      applications.forEach((app, index) => {
        app.meritRank = index + 1;
        app.entranceTest.rank = index + 1;
      });

      // Save all applications with ranks
      await Promise.all(applications.map(app => app.save()));

      logger.info(`Merit list generated for ${academicYear}, class ${classId}`);
      return applications;
    } catch (error) {
      logger.error(`Error generating merit list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get merit list
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Array} Merit list
   */
  async getMeritList(tenantId, filters = {}) {
    try {
      const { academicYear, classId, page = 1, limit = 50 } = filters;

      const query = {
        tenant: tenantId,
        meritRank: { $exists: true, $ne: null },
      };

      if (academicYear) query.academicYear = academicYear;
      if (classId) query['appliedFor.class'] = classId;

      let applications = await AdmissionApplication.find(query)
        .sort({ meritRank: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      // Try to populate if models exist
      try {
        applications = await AdmissionApplication.populate(applications, ['appliedFor.class', 'appliedFor.section']);
      } catch (error) {
        logger.warn('Class/Section models not found for populate, skipping');
      }

      const total = await AdmissionApplication.countDocuments(query);

      return {
        data: applications,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching merit list: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get available seats
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Seat availability
   */
  async getAvailableSeats(tenantId, filters = {}) {
    try {
      const { academicYear, classId } = filters;

      const criteria = await AdmissionCriteria.findOne({
        tenant: tenantId,
        academicYear,
        class: classId,
      });

      if (!criteria) {
        return {
          totalSeats: 0,
          filledSeats: 0,
          availableSeats: 0,
        };
      }

      const filledSeats = await AdmissionApplication.countDocuments({
        tenant: tenantId,
        academicYear,
        'appliedFor.class': classId,
        status: 'approved',
      });

      return {
        totalSeats: criteria.totalSeats,
        filledSeats,
        availableSeats: criteria.totalSeats - filledSeats,
        reservedSeats: criteria.reservedSeats,
      };
    } catch (error) {
      logger.error(`Error fetching available seats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Allocate seat
   * @param {string} tenantId - Tenant ID
   * @param {Object} allocationData - Allocation data
   * @param {string} allocatedBy - Allocated by user ID
   * @returns {Object} Updated application
   */
  async allocateSeat(tenantId, allocationData, allocatedBy) {
    try {
      const { applicationId, section } = allocationData;

      const application = await AdmissionApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      if (application.status !== 'approved') {
        throw new Error('Application must be approved before seat allocation');
      }

      application.appliedFor.section = section;
      await application.save();

      logger.info(`Seat allocated for application: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error allocating seat: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get admission criteria
   * @param {string} tenantId - Tenant ID
   * @param {string} academicYear - Academic year
   * @returns {Array} Criteria
   */
  async getAdmissionCriteria(tenantId, academicYear) {
    try {
      let criteria = await AdmissionCriteria.find({
        tenant: tenantId,
        academicYear,
      });

      // Try to populate if Class model exists
      try {
        criteria = await AdmissionCriteria.populate(criteria, 'class');
      } catch (error) {
        logger.warn('Class model not found for populate, skipping');
      }

      return criteria;
    } catch (error) {
      logger.error(`Error fetching admission criteria: ${error.message}`);
      throw error;
    }
  }

  /**
   * Set admission criteria
   * @param {string} tenantId - Tenant ID
   * @param {Object} criteriaData - Criteria data
   * @param {string} createdBy - Created by user ID
   * @returns {Object} Criteria
   */
  async setAdmissionCriteria(tenantId, criteriaData, createdBy) {
    try {
      const criteria = new AdmissionCriteria({
        ...criteriaData,
        tenant: tenantId,
      });

      await criteria.save();

      logger.info(`Admission criteria set: ${criteria._id}`);
      return criteria;
    } catch (error) {
      logger.error(`Error setting admission criteria: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get admission statistics
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Statistics
   */
  async getAdmissionStatistics(tenantId, filters = {}) {
    try {
      const { academicYear } = filters;
      const query = { tenant: tenantId };

      if (academicYear) query.academicYear = academicYear;

      const applications = await AdmissionApplication.find(query);

      const stats = {
        total: applications.length,
        byStatus: {},
        byClass: {},
        entranceTestStats: {
          required: 0,
          completed: 0,
          pending: 0,
          averageScore: 0,
        },
      };

      let totalScore = 0;
      let scoredCount = 0;

      applications.forEach(app => {
        // By status
        stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1;

        // By class
        const className = app.appliedFor.class?.toString() || 'unknown';
        stats.byClass[className] = (stats.byClass[className] || 0) + 1;

        // Entrance test stats
        if (app.entranceTest.required) {
          stats.entranceTestStats.required++;
          if (app.entranceTest.completed) {
            stats.entranceTestStats.completed++;
            totalScore += app.entranceTest.percentage || 0;
            scoredCount++;
          } else {
            stats.entranceTestStats.pending++;
          }
        }
      });

      if (scoredCount > 0) {
        stats.entranceTestStats.averageScore = (totalScore / scoredCount).toFixed(2);
      }

      return stats;
    } catch (error) {
      logger.error(`Error fetching admission statistics: ${error.message}`);
      throw error;
    }
  }
}

export default new AdmissionService();
