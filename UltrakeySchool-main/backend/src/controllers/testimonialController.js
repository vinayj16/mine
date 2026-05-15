import Testimonial from '../models/Testimonial.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'pending', 'approved', 'rejected'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_AUTHOR_LENGTH = 100;
const MAX_ROLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 2000;
const MAX_COMPANY_LENGTH = 200;
const MIN_RATING = 1;
const MAX_RATING = 5;

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

// Helper function to validate URL
const validateURL = (url) => {
  if (!url) return null;
  try {
    new URL(url);
    return null;
  } catch (e) {
    return 'Invalid URL format';
  }
};

// Get all testimonials
const getAllTestimonials = async (req, res) => {
  try {
    logger.info('Fetching all testimonials');
    
    const { page, limit, status, search, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (sortOrder && !VALID_SORT_ORDERS.includes(sortOrder)) {
      errors.push('Invalid sort order. Must be one of: ' + VALID_SORT_ORDERS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { author: { $regex: search, $options: 'i' } },
        { role: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    
    const [testimonials, total] = await Promise.all([
      Testimonial.find(query)
        .sort({ [sortField]: sortDirection })
        .skip(skip)
        .limit(limitNum),
      Testimonial.countDocuments(query)
    ]);
    
    logger.info('Testimonials fetched successfully:', { count: testimonials.length });
    return successResponse(res, {
      testimonials,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Testimonials retrieved successfully');
  } catch (error) {
    logger.error('Error fetching testimonials:', error);
    return errorResponse(res, error.message);
  }
};

// Get single testimonial
const getTestimonial = async (req, res) => {
  try {
    logger.info('Fetching testimonial by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const testimonial = await Testimonial.findById(id);
    
    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    logger.info('Testimonial fetched successfully:', { testimonialId: id });
    return successResponse(res, testimonial, 'Testimonial retrieved successfully');
  } catch (error) {
    logger.error('Error fetching testimonial:', error);
    return errorResponse(res, error.message);
  }
};

// Create testimonial
const createTestimonial = async (req, res) => {
  try {
    logger.info('Creating testimonial');
    
    const { author, role, content, company, rating, imageUrl, status } = req.body;

    // Validation
    const errors = [];
    
    if (!author || author.trim().length === 0) {
      errors.push('Author name is required');
    } else if (author.length > MAX_AUTHOR_LENGTH) {
      errors.push('Author name must not exceed ' + MAX_AUTHOR_LENGTH + ' characters');
    }
    
    if (!role || role.trim().length === 0) {
      errors.push('Role is required');
    } else if (role.length > MAX_ROLE_LENGTH) {
      errors.push('Role must not exceed ' + MAX_ROLE_LENGTH + ' characters');
    }
    
    if (!content || content.trim().length === 0) {
      errors.push('Content is required');
    } else if (content.length > MAX_CONTENT_LENGTH) {
      errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
    }
    
    if (company && company.length > MAX_COMPANY_LENGTH) {
      errors.push('Company name must not exceed ' + MAX_COMPANY_LENGTH + ' characters');
    }
    
    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < MIN_RATING || rating > MAX_RATING) {
        errors.push('Rating must be between ' + MIN_RATING + ' and ' + MAX_RATING);
      }
    }
    
    if (imageUrl) {
      const urlError = validateURL(imageUrl);
      if (urlError) errors.push(urlError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.create(req.body);

    logger.info('Testimonial created successfully:', { testimonialId: testimonial._id, author });
    return createdResponse(res, testimonial, 'Testimonial created successfully');
  } catch (error) {
    logger.error('Error creating testimonial:', error);
    return errorResponse(res, error.message);
  }
};

// Update testimonial
const updateTestimonial = async (req, res) => {
  try {
    logger.info('Updating testimonial');
    
    const { id } = req.params;
    const { author, role, content, company, rating, imageUrl, status } = req.body;

    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (author !== undefined) {
      if (!author || author.trim().length === 0) {
        errors.push('Author name cannot be empty');
      } else if (author.length > MAX_AUTHOR_LENGTH) {
        errors.push('Author name must not exceed ' + MAX_AUTHOR_LENGTH + ' characters');
      }
    }
    
    if (role !== undefined) {
      if (!role || role.trim().length === 0) {
        errors.push('Role cannot be empty');
      } else if (role.length > MAX_ROLE_LENGTH) {
        errors.push('Role must not exceed ' + MAX_ROLE_LENGTH + ' characters');
      }
    }
    
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        errors.push('Content cannot be empty');
      } else if (content.length > MAX_CONTENT_LENGTH) {
        errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
      }
    }
    
    if (company !== undefined && company.length > MAX_COMPANY_LENGTH) {
      errors.push('Company name must not exceed ' + MAX_COMPANY_LENGTH + ' characters');
    }
    
    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < MIN_RATING || rating > MAX_RATING) {
        errors.push('Rating must be between ' + MIN_RATING + ' and ' + MAX_RATING);
      }
    }
    
    if (imageUrl !== undefined) {
      const urlError = validateURL(imageUrl);
      if (urlError) errors.push(urlError);
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    logger.info('Testimonial updated successfully:', { testimonialId: id });
    return successResponse(res, testimonial, 'Testimonial updated successfully');
  } catch (error) {
    logger.error('Error updating testimonial:', error);
    return errorResponse(res, error.message);
  }
};

// Delete testimonial
const deleteTestimonial = async (req, res) => {
  try {
    logger.info('Deleting testimonial');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.findByIdAndDelete(id);

    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    logger.info('Testimonial deleted successfully:', { testimonialId: id });
    return successResponse(res, null, 'Testimonial deleted successfully');
  } catch (error) {
    logger.error('Error deleting testimonial:', error);
    return errorResponse(res, error.message);
  }
};


// Get testimonials by status
const getTestimonialsByStatus = async (req, res) => {
  try {
    logger.info('Fetching testimonials by status');
    
    const { status } = req.params;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonials = await Testimonial.find({ status }).sort({ createdAt: -1 });

    logger.info('Testimonials fetched by status successfully:', { status, count: testimonials.length });
    return successResponse(res, testimonials, 'Testimonials retrieved successfully');
  } catch (error) {
    logger.error('Error fetching testimonials by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get active testimonials
const getActiveTestimonials = async (req, res) => {
  try {
    logger.info('Fetching active testimonials');
    
    const { limit } = req.query;
    
    // Validation
    const errors = [];
    
    const limitNum = parseInt(limit) || 10;
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonials = await Testimonial.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .limit(limitNum);

    logger.info('Active testimonials fetched successfully:', { count: testimonials.length });
    return successResponse(res, testimonials, 'Active testimonials retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active testimonials:', error);
    return errorResponse(res, error.message);
  }
};

// Get featured testimonials
const getFeaturedTestimonials = async (req, res) => {
  try {
    logger.info('Fetching featured testimonials');
    
    const { limit } = req.query;
    
    // Validation
    const errors = [];
    
    const limitNum = parseInt(limit) || 5;
    if (limitNum < 1 || limitNum > 50) {
      errors.push('Limit must be between 1 and 50');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonials = await Testimonial.find({ status: 'active', isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(limitNum);

    logger.info('Featured testimonials fetched successfully:', { count: testimonials.length });
    return successResponse(res, testimonials, 'Featured testimonials retrieved successfully');
  } catch (error) {
    logger.error('Error fetching featured testimonials:', error);
    return errorResponse(res, error.message);
  }
};

// Update testimonial status
const updateTestimonialStatus = async (req, res) => {
  try {
    logger.info('Updating testimonial status');
    
    const { id } = req.params;
    const { status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    logger.info('Testimonial status updated successfully:', { testimonialId: id, status });
    return successResponse(res, testimonial, 'Testimonial status updated successfully');
  } catch (error) {
    logger.error('Error updating testimonial status:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle featured status
const toggleFeatured = async (req, res) => {
  try {
    logger.info('Toggling testimonial featured status');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.findById(id);

    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    testimonial.isFeatured = !testimonial.isFeatured;
    await testimonial.save();

    logger.info('Testimonial featured status toggled successfully:', { testimonialId: id, isFeatured: testimonial.isFeatured });
    return successResponse(res, testimonial, 'Testimonial featured status updated successfully');
  } catch (error) {
    logger.error('Error toggling testimonial featured status:', error);
    return errorResponse(res, error.message);
  }
};

// Approve testimonial
const approveTestimonial = async (req, res) => {
  try {
    logger.info('Approving testimonial');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    logger.info('Testimonial approved successfully:', { testimonialId: id });
    return successResponse(res, testimonial, 'Testimonial approved successfully');
  } catch (error) {
    logger.error('Error approving testimonial:', error);
    return errorResponse(res, error.message);
  }
};

// Reject testimonial
const rejectTestimonial = async (req, res) => {
  try {
    logger.info('Rejecting testimonial');
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Testimonial ID');
    if (idError) errors.push(idError);
    
    if (reason && reason.length > 500) {
      errors.push('Reason must not exceed 500 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonial = await Testimonial.findByIdAndUpdate(
      id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );

    if (!testimonial) {
      return notFoundResponse(res, 'Testimonial not found');
    }

    logger.info('Testimonial rejected successfully:', { testimonialId: id });
    return successResponse(res, testimonial, 'Testimonial rejected successfully');
  } catch (error) {
    logger.error('Error rejecting testimonial:', error);
    return errorResponse(res, error.message);
  }
};

// Get testimonials by rating
const getTestimonialsByRating = async (req, res) => {
  try {
    logger.info('Fetching testimonials by rating');
    
    const { rating } = req.params;
    
    // Validation
    const errors = [];
    
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < MIN_RATING || ratingNum > MAX_RATING) {
      errors.push('Rating must be between ' + MIN_RATING + ' and ' + MAX_RATING);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonials = await Testimonial.find({ rating: ratingNum, status: 'active' })
      .sort({ createdAt: -1 });

    logger.info('Testimonials fetched by rating successfully:', { rating: ratingNum, count: testimonials.length });
    return successResponse(res, testimonials, 'Testimonials retrieved successfully');
  } catch (error) {
    logger.error('Error fetching testimonials by rating:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating testimonial status');
    
    const { testimonialIds, status } = req.body;
    
    // Validation
    const errors = [];
    
    if (!testimonialIds || !Array.isArray(testimonialIds)) {
      errors.push('Testimonial IDs must be an array');
    } else if (testimonialIds.length === 0) {
      errors.push('Testimonial IDs array cannot be empty');
    } else if (testimonialIds.length > 100) {
      errors.push('Cannot update more than 100 testimonials at once');
    } else {
      for (const id of testimonialIds) {
        const idError = validateObjectId(id, 'Testimonial ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await Testimonial.updateMany(
      { _id: { $in: testimonialIds } },
      { status }
    );

    logger.info('Testimonial status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Testimonials status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating testimonial status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete testimonials
const bulkDeleteTestimonials = async (req, res) => {
  try {
    logger.info('Bulk deleting testimonials');
    
    const { testimonialIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!testimonialIds || !Array.isArray(testimonialIds)) {
      errors.push('Testimonial IDs must be an array');
    } else if (testimonialIds.length === 0) {
      errors.push('Testimonial IDs array cannot be empty');
    } else if (testimonialIds.length > 100) {
      errors.push('Cannot delete more than 100 testimonials at once');
    } else {
      for (const id of testimonialIds) {
        const idError = validateObjectId(id, 'Testimonial ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await Testimonial.deleteMany({ _id: { $in: testimonialIds } });

    logger.info('Testimonials bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Testimonials deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting testimonials:', error);
    return errorResponse(res, error.message);
  }
};

// Export testimonials
const exportTestimonials = async (req, res) => {
  try {
    logger.info('Exporting testimonials');
    
    const { format, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const query = {};
    if (status) query.status = status;

    const testimonials = await Testimonial.find(query).sort({ createdAt: -1 });

    const exportData = {
      format: format.toLowerCase(),
      data: testimonials,
      count: testimonials.length,
      exportedAt: new Date().toISOString()
    };

    logger.info('Testimonials exported successfully:', { format, count: testimonials.length });
    return successResponse(res, exportData, 'Testimonials exported successfully');
  } catch (error) {
    logger.error('Error exporting testimonials:', error);
    return errorResponse(res, error.message);
  }
};

// Get testimonial statistics
const getTestimonialStatistics = async (req, res) => {
  try {
    logger.info('Fetching testimonial statistics');

    const [total, active, pending, approved, rejected, byRating] = await Promise.all([
      Testimonial.countDocuments(),
      Testimonial.countDocuments({ status: 'active' }),
      Testimonial.countDocuments({ status: 'pending' }),
      Testimonial.countDocuments({ status: 'approved' }),
      Testimonial.countDocuments({ status: 'rejected' }),
      Testimonial.aggregate([
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: -1 } }
      ])
    ]);

    const statistics = {
      total,
      active,
      pending,
      approved,
      rejected,
      byRating
    };

    logger.info('Testimonial statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching testimonial statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Search testimonials
const searchTestimonials = async (req, res) => {
  try {
    logger.info('Searching testimonials');
    
    const { q } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const testimonials = await Testimonial.find({
      $or: [
        { author: { $regex: q, $options: 'i' } },
        { role: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50);

    logger.info('Testimonials searched successfully:', { query: q, count: testimonials.length });
    return successResponse(res, testimonials, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching testimonials:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllTestimonials,
  getTestimonial,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  getTestimonialsByStatus,
  getActiveTestimonials,
  getFeaturedTestimonials,
  updateTestimonialStatus,
  toggleFeatured,
  approveTestimonial,
  rejectTestimonial,
  getTestimonialsByRating,
  bulkUpdateStatus,
  bulkDeleteTestimonials,
  exportTestimonials,
  getTestimonialStatistics,
  searchTestimonials
};
