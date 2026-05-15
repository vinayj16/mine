import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Scholarship Schema
const scholarshipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  type: {
    type: String,
    enum: ['merit', 'need_based', 'sports', 'arts', 'minority', 'government', 'institutional', 'other'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  amountType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed',
  },
  maxAmount: Number,
  eligibilityCriteria: {
    minGrade: Number,
    minAttendance: Number,
    familyIncome: Number,
    category: [String],
    other: String,
  },
  availableSlots: Number,
  filledSlots: {
    type: Number,
    default: 0,
  },
  applicationStartDate: Date,
  applicationEndDate: Date,
  academicYear: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'closed'],
    default: 'active',
  },
  documentsRequired: [String],
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

// Scholarship Application Schema
const scholarshipApplicationSchema = new mongoose.Schema({
  scholarship: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scholarship',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  applicationDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: Date,
  }],
  academicDetails: {
    currentGrade: Number,
    previousGrade: Number,
    attendance: Number,
  },
  financialDetails: {
    familyIncome: Number,
    numberOfDependents: Number,
    otherScholarships: [{
      name: String,
      amount: Number,
    }],
  },
  personalStatement: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewDate: Date,
  reviewComments: String,
  approvedAmount: Number,
  disbursementStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending',
  },
  disbursementDate: Date,
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
const ScholarshipApplication = mongoose.model('ScholarshipApplication', scholarshipApplicationSchema);

class ScholarshipService {
  /**
   * Create scholarship
   * @param {Object} scholarshipData - Scholarship data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Scholarship
   */
  async createScholarship(scholarshipData, tenantId) {
    try {
      const scholarship = new Scholarship({
        ...scholarshipData,
        tenant: tenantId,
      });

      await scholarship.save();

      logger.info(`Scholarship created: ${scholarship._id}`);
      return scholarship;
    } catch (error) {
      logger.error(`Error creating scholarship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scholarships
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Scholarships with pagination
   */
  async getScholarships(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, type } = filters;
      const query = { tenant: tenantId };

      if (status) query.status = status;
      if (type) query.type = type;

      const scholarships = await Scholarship.find(query)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await Scholarship.countDocuments(query);

      return {
        scholarships,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching scholarships: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scholarship by ID
   * @param {string} scholarshipId - Scholarship ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Scholarship
   */
  async getScholarshipById(scholarshipId, tenantId) {
    try {
      const scholarship = await Scholarship.findOne({
        _id: scholarshipId,
        tenant: tenantId,
      });

      if (!scholarship) {
        throw new Error('Scholarship not found');
      }

      return scholarship;
    } catch (error) {
      logger.error(`Error fetching scholarship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update scholarship
   * @param {string} scholarshipId - Scholarship ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated scholarship
   */
  async updateScholarship(scholarshipId, tenantId, updateData) {
    try {
      const scholarship = await Scholarship.findOneAndUpdate(
        { _id: scholarshipId, tenant: tenantId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!scholarship) {
        throw new Error('Scholarship not found');
      }

      logger.info(`Scholarship updated: ${scholarshipId}`);
      return scholarship;
    } catch (error) {
      logger.error(`Error updating scholarship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete scholarship
   * @param {string} scholarshipId - Scholarship ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Deleted scholarship
   */
  async deleteScholarship(scholarshipId, tenantId) {
    try {
      // Check if there are any applications
      const applicationsCount = await ScholarshipApplication.countDocuments({
        scholarship: scholarshipId,
        tenant: tenantId,
      });

      if (applicationsCount > 0) {
        throw new Error('Cannot delete scholarship with existing applications');
      }

      const scholarship = await Scholarship.findOneAndDelete({
        _id: scholarshipId,
        tenant: tenantId,
      });

      if (!scholarship) {
        throw new Error('Scholarship not found');
      }

      logger.info(`Scholarship deleted: ${scholarshipId}`);
      return scholarship;
    } catch (error) {
      logger.error(`Error deleting scholarship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Apply for scholarship
   * @param {Object} applicationData - Application data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Application
   */
  async applyForScholarship(applicationData, tenantId) {
    try {
      const { scholarship, student } = applicationData;

      // Check if scholarship exists and is active
      const scholarshipDoc = await Scholarship.findOne({
        _id: scholarship,
        tenant: tenantId,
        status: 'active',
      });

      if (!scholarshipDoc) {
        throw new Error('Scholarship not found or not active');
      }

      // Check if application period is valid
      const now = new Date();
      if (scholarshipDoc.applicationStartDate && now < scholarshipDoc.applicationStartDate) {
        throw new Error('Application period has not started');
      }
      if (scholarshipDoc.applicationEndDate && now > scholarshipDoc.applicationEndDate) {
        throw new Error('Application period has ended');
      }

      // Check if student already applied
      const existingApplication = await ScholarshipApplication.findOne({
        scholarship,
        student,
        tenant: tenantId,
        status: { $nin: ['rejected', 'cancelled'] },
      });

      if (existingApplication) {
        throw new Error('You have already applied for this scholarship');
      }

      // Check if slots are available
      if (scholarshipDoc.availableSlots && scholarshipDoc.filledSlots >= scholarshipDoc.availableSlots) {
        throw new Error('No slots available for this scholarship');
      }

      const application = new ScholarshipApplication({
        ...applicationData,
        tenant: tenantId,
      });

      await application.save();
      await application.populate(['scholarship', 'student']);

      logger.info(`Scholarship application submitted: ${application._id}`);
      return application;
    } catch (error) {
      logger.error(`Error applying for scholarship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scholarship applications
   * @param {string} tenantId - Tenant ID
   * @param {Object} filters - Filters
   * @returns {Object} Applications with pagination
   */
  async getApplications(tenantId, filters = {}) {
    try {
      const { page = 1, limit = 10, status, scholarshipId, studentId } = filters;
      const query = { tenant: tenantId };

      if (status) query.status = status;
      if (scholarshipId) query.scholarship = scholarshipId;
      if (studentId) query.student = studentId;

      const applications = await ScholarshipApplication.find(query)
        .populate(['scholarship', 'student', 'reviewedBy'])
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await ScholarshipApplication.countDocuments(query);

      return {
        applications,
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
   * Review scholarship application
   * @param {string} applicationId - Application ID
   * @param {string} tenantId - Tenant ID
   * @param {Object} reviewData - Review data
   * @returns {Object} Updated application
   */
  async reviewApplication(applicationId, tenantId, reviewData) {
    try {
      const { status, reviewComments, approvedAmount, reviewedBy } = reviewData;

      const application = await ScholarshipApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
      });

      if (!application) {
        throw new Error('Application not found');
      }

      application.status = status;
      application.reviewComments = reviewComments;
      application.approvedAmount = approvedAmount;
      application.reviewedBy = reviewedBy;
      application.reviewDate = new Date();

      await application.save();
      await application.populate(['scholarship', 'student', 'reviewedBy']);

      // Update scholarship filled slots if approved
      if (status === 'approved') {
        await Scholarship.findByIdAndUpdate(application.scholarship._id, {
          $inc: { filledSlots: 1 },
        });
      }

      logger.info(`Scholarship application reviewed: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error reviewing application: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disburse scholarship
   * @param {string} applicationId - Application ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated application
   */
  async disburseScholarship(applicationId, tenantId) {
    try {
      const application = await ScholarshipApplication.findOne({
        _id: applicationId,
        tenant: tenantId,
        status: 'approved',
      });

      if (!application) {
        throw new Error('Application not found or not approved');
      }

      application.disbursementStatus = 'completed';
      application.disbursementDate = new Date();

      await application.save();

      logger.info(`Scholarship disbursed: ${applicationId}`);
      return application;
    } catch (error) {
      logger.error(`Error disbursing scholarship: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get scholarship statistics
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Statistics
   */
  async getScholarshipStatistics(tenantId) {
    try {
      const [scholarships, applications] = await Promise.all([
        Scholarship.find({ tenant: tenantId }),
        ScholarshipApplication.find({ tenant: tenantId }),
      ]);

      const stats = {
        totalScholarships: scholarships.length,
        activeScholarships: scholarships.filter(s => s.status === 'active').length,
        totalApplications: applications.length,
        pendingApplications: applications.filter(a => a.status === 'pending').length,
        approvedApplications: applications.filter(a => a.status === 'approved').length,
        rejectedApplications: applications.filter(a => a.status === 'rejected').length,
        totalAmountDisbursed: applications
          .filter(a => a.disbursementStatus === 'completed')
          .reduce((sum, a) => sum + (a.approvedAmount || 0), 0),
        totalAmountApproved: applications
          .filter(a => a.status === 'approved')
          .reduce((sum, a) => sum + (a.approvedAmount || 0), 0),
      };

      return stats;
    } catch (error) {
      logger.error(`Error fetching scholarship statistics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check eligibility
   * @param {string} scholarshipId - Scholarship ID
   * @param {Object} studentData - Student data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Eligibility result
   */
  async checkEligibility(scholarshipId, studentData, tenantId) {
    try {
      const scholarship = await Scholarship.findOne({
        _id: scholarshipId,
        tenant: tenantId,
      });

      if (!scholarship) {
        throw new Error('Scholarship not found');
      }

      const { eligibilityCriteria } = scholarship;
      const eligible = {
        isEligible: true,
        reasons: [],
      };

      if (eligibilityCriteria.minGrade && studentData.grade < eligibilityCriteria.minGrade) {
        eligible.isEligible = false;
        eligible.reasons.push(`Minimum grade requirement: ${eligibilityCriteria.minGrade}%`);
      }

      if (eligibilityCriteria.minAttendance && studentData.attendance < eligibilityCriteria.minAttendance) {
        eligible.isEligible = false;
        eligible.reasons.push(`Minimum attendance requirement: ${eligibilityCriteria.minAttendance}%`);
      }

      if (eligibilityCriteria.familyIncome && studentData.familyIncome > eligibilityCriteria.familyIncome) {
        eligible.isEligible = false;
        eligible.reasons.push(`Maximum family income: ${eligibilityCriteria.familyIncome}`);
      }

      return eligible;
    } catch (error) {
      logger.error(`Error checking eligibility: ${error.message}`);
      throw error;
    }
  }
}

export default new ScholarshipService();
