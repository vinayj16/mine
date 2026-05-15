import PendingInstitutionRegistration from '../models/PendingInstitutionRegistration.js';
import User from '../models/User.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

const MIN_PASSWORD_LENGTH = 8;

// Create new institution registration
export const createInstitutionRegistration = async (req, res) => {
  try {
    const { instituteType, instituteCode, fullName, email, agreedToTerms } = req.body;

    // Validate required fields
    if (!instituteType || !instituteCode || !fullName || !email || agreedToTerms === undefined) {
      return validationErrorResponse(res, 'All required fields must be provided');
    }

    // Check if email already exists
    const existingEmail = await PendingInstitutionRegistration.findOne({
      email: email.toLowerCase(),
      status: { $in: ['pending', 'approved'] }
    });

    if (existingEmail) {
      return validationErrorResponse(res, 'Email is already registered');
    }

    // Check if institute code already exists
    const existingCode = await PendingInstitutionRegistration.findOne({
      instituteCode: instituteCode.toUpperCase(),
      status: { $in: ['pending', 'approved'] }
    });

    if (existingCode) {
      return validationErrorResponse(res, 'Institute code is already taken');
    }

    // Create new registration
    const registration = new PendingInstitutionRegistration({
      instituteType,
      instituteCode: instituteCode.toUpperCase().trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      agreedToTerms
    });

    await registration.save();

    logger.info('New institution registration created', {
      registrationId: registration._id,
      email: registration.email,
      instituteCode: registration.instituteCode
    });

    return createdResponse(res, 'Registration submitted successfully. A superadmin will review your application.', {
      registrationId: registration._id,
      status: registration.status
    });

  } catch (error) {
    logger.error('Error creating institution registration', { error: error.message });
    return errorResponse(res, 'Failed to submit registration');
  }
};

// Get all pending registrations (for superadmin)
export const getPendingRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const statusFilter = (status || 'pending').toString().toLowerCase().trim();

    const query = {};
    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { registrationDate: -1 },
      populate: [
        { path: 'reviewedBy', select: 'name email' },
        { path: 'institutionId', select: 'name type' }
      ]
    };

    const result = await PendingInstitutionRegistration.paginate(query, options);

    return successResponse(res, 'Pending registrations retrieved successfully', {
      registrations: result.docs,
      pagination: {
        total: result.totalDocs,
        page: result.page,
        pages: result.totalPages,
        limit: result.limit
      }
    });

  } catch (error) {
    logger.error('Error fetching pending registrations', { error: error.message });
    return errorResponse(res, 'Failed to fetch registrations');
  }
};

// Get single registration by ID
export const getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await PendingInstitutionRegistration.findById(id)
      .populate('reviewedBy', 'name email')
      .populate('institutionId', 'name type category');

    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }

    return successResponse(res, 'Registration retrieved successfully', registration);

  } catch (error) {
    logger.error('Error fetching registration', { error: error.message, id: req.params.id });
    return errorResponse(res, 'Failed to fetch registration');
  }
};

// Approve registration (superadmin only)
export const approveRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      institutionId,
      notes = '',
      ownerEmail,
      ownerPassword,
    } = req.body;
    const reviewerId = req.user?.id; // Assuming auth middleware sets req.user

    const registration = await PendingInstitutionRegistration.findById(id);

    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }

    if (registration.status !== 'pending') {
      return errorResponse(res, 'Registration has already been processed', 400);
    }

    if (!ownerPassword || typeof ownerPassword !== 'string' || ownerPassword.length < MIN_PASSWORD_LENGTH) {
      return validationErrorResponse(res, `Owner password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
    }

    const targetEmail = (ownerEmail || registration.email || '').toLowerCase().trim();

    if (!targetEmail) {
      return validationErrorResponse(res, 'A valid owner email is required to grant access');
    }

    const existingUser = await User.findOne({ email: targetEmail });
    if (existingUser) {
      return validationErrorResponse(res, 'A user with that email already exists');
    }

    const newUser = await User.create({
      name: registration.fullName,
      email: targetEmail,
      password: ownerPassword,
      role: 'institution_admin',
      status: 'active'
    });

    const approvedRegistration = await registration.approve(reviewerId, institutionId, notes);
    approvedRegistration.ownerUserId = newUser._id;
    await approvedRegistration.save();

    logger.info('Institution registration approved', {
      registrationId: registration._id,
      ownerUserId: newUser._id,
      institutionId,
      reviewerId
    });

    return successResponse(res, 'Registration approved successfully', {
      registration: approvedRegistration,
      userId: newUser._id,
    });

  } catch (error) {
    logger.error('Error approving registration', { error: error.message, id: req.params.id });
    return errorResponse(res, 'Failed to approve registration');
  }
};

// Reject registration (superadmin only)
export const rejectRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reviewerId = req.user?.id;

    const registration = await PendingInstitutionRegistration.findById(id);

    if (!registration) {
      return errorResponse(res, 'Registration not found', 404);
    }

    if (registration.status !== 'pending') {
      return errorResponse(res, 'Registration has already been processed', 400);
    }

    await registration.reject(reviewerId, reason);

    logger.info('Institution registration rejected', {
      registrationId: registration._id,
      reason,
      reviewerId
    });

    return successResponse(res, 'Registration rejected successfully', registration);

  } catch (error) {
    logger.error('Error rejecting registration', { error: error.message, id: req.params.id });
    return errorResponse(res, 'Failed to reject registration');
  }
};

// Get registration statistics
export const getRegistrationStats = async (req, res) => {
  try {
    const stats = await PendingInstitutionRegistration.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    return successResponse(res, 'Registration statistics retrieved successfully', result);

  } catch (error) {
    logger.error('Error fetching registration stats', { error: error.message });
    return errorResponse(res, 'Failed to fetch statistics');
  }
};
