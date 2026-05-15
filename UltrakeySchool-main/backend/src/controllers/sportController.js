import Sport from '../models/Sport.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_CATEGORIES = ['indoor', 'outdoor', 'water', 'team', 'individual', 'combat', 'racquet', 'athletics', 'other'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_RULES_LENGTH = 5000;

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

// Create sport
const createSport = async (req, res) => {
  try {
    logger.info('Creating sport');
    
    const { name, category, description, rules, coach, status, maxPlayers, minPlayers, equipment } = req.body;
    const userId = req.user?.id;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Sport name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (!category || category.trim().length === 0) {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (rules && rules.length > MAX_RULES_LENGTH) {
      errors.push('Rules must not exceed ' + MAX_RULES_LENGTH + ' characters');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (coach) {
      const coachError = validateObjectId(coach, 'Coach ID');
      if (coachError) errors.push(coachError);
    }
    
    if (maxPlayers !== undefined) {
      if (typeof maxPlayers !== 'number' || maxPlayers < 1 || maxPlayers > 1000) {
        errors.push('Max players must be between 1 and 1000');
      }
    }
    
    if (minPlayers !== undefined) {
      if (typeof minPlayers !== 'number' || minPlayers < 1 || minPlayers > 1000) {
        errors.push('Min players must be between 1 and 1000');
      }
    }
    
    if (maxPlayers && minPlayers && minPlayers > maxPlayers) {
      errors.push('Min players cannot be greater than max players');
    }
    
    if (equipment && !Array.isArray(equipment)) {
      errors.push('Equipment must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const count = await Sport.countDocuments({ institution: tenantId });
    const sportId = 'SPT' + String(count + 1).padStart(6, '0');
    
    const sport = new Sport({
      ...req.body,
      sportId,
      institution: tenantId,
      createdBy: userId
    });
    
    await sport.save();
    await sport.populate('coach', 'name email');
    
    logger.info('Sport created successfully:', { sportId: sport.sportId, name });
    return createdResponse(res, sport, 'Sport created successfully');
  } catch (error) {
    logger.error('Error creating sport:', error);
    return errorResponse(res, error.message);
  }
};

// Get sport by ID
const getSportById = async (req, res) => {
  try {
    logger.info('Fetching sport by ID');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOne({
      _id: id,
      institution: tenantId
    })
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Sport fetched successfully:', { sportId: id });
    return successResponse(res, sport, 'Sport retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sport:', error);
    return errorResponse(res, error.message);
  }
};

// Get all sports
const getAllSports = async (req, res) => {
  try {
    logger.info('Fetching all sports');
    
    const { status, category, search, page, limit, sortBy, sortOrder } = req.query;
    const tenantId = req.tenantId;
    
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
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
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
    
    const query = { institution: tenantId };
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const sortField = sortBy || 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection;
    
    const [sports, total] = await Promise.all([
      Sport.find(query)
        .populate('coach', 'name email phone')
        .populate('createdBy', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Sport.countDocuments(query)
    ]);
    
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      itemsPerPage: limitNum,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1
    };
    
    logger.info('Sports fetched successfully:', { count: sports.length, total });
    return successResponse(res, {
      sports,
      pagination
    }, 'Sports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sports:', error);
    return errorResponse(res, error.message);
  }
};

// Update sport
const updateSport = async (req, res) => {
  try {
    logger.info('Updating sport');
    
    const { id } = req.params;
    const { name, category, description, rules, coach, status, maxPlayers, minPlayers, equipment } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Sport name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (category !== undefined) {
      if (!category || category.trim().length === 0) {
        errors.push('Category cannot be empty');
      } else if (!VALID_CATEGORIES.includes(category)) {
        errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (rules !== undefined && rules.length > MAX_RULES_LENGTH) {
      errors.push('Rules must not exceed ' + MAX_RULES_LENGTH + ' characters');
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (coach !== undefined && coach !== null) {
      const coachError = validateObjectId(coach, 'Coach ID');
      if (coachError) errors.push(coachError);
    }
    
    if (maxPlayers !== undefined) {
      if (typeof maxPlayers !== 'number' || maxPlayers < 1 || maxPlayers > 1000) {
        errors.push('Max players must be between 1 and 1000');
      }
    }
    
    if (minPlayers !== undefined) {
      if (typeof minPlayers !== 'number' || minPlayers < 1 || minPlayers > 1000) {
        errors.push('Min players must be between 1 and 1000');
      }
    }
    
    if (equipment !== undefined && !Array.isArray(equipment)) {
      errors.push('Equipment must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOneAndUpdate(
      { _id: id, institution: tenantId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Sport updated successfully:', { sportId: id });
    return successResponse(res, sport, 'Sport updated successfully');
  } catch (error) {
    logger.error('Error updating sport:', error);
    return errorResponse(res, error.message);
  }
};

// Delete sport
const deleteSport = async (req, res) => {
  try {
    logger.info('Deleting sport');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOneAndDelete({
      _id: id,
      institution: tenantId
    });
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Sport deleted successfully:', { sportId: id });
    return successResponse(res, null, 'Sport deleted successfully');
  } catch (error) {
    logger.error('Error deleting sport:', error);
    return errorResponse(res, error.message);
  }
};

// Get sports by status
const getSportsByStatus = async (req, res) => {
  try {
    logger.info('Fetching sports by status');
    
    const { status } = req.params;
    const tenantId = req.tenantId;
    
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
    
    const sports = await Sport.find({ status, institution: tenantId })
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    logger.info('Sports fetched by status successfully:', { status, count: sports.length });
    return successResponse(res, sports, 'Sports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sports by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get sports by category
const getSportsByCategory = async (req, res) => {
  try {
    logger.info('Fetching sports by category');
    
    const { category } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!category) {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sports = await Sport.find({ category, institution: tenantId })
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    
    logger.info('Sports fetched by category successfully:', { category, count: sports.length });
    return successResponse(res, sports, 'Sports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sports by category:', error);
    return errorResponse(res, error.message);
  }
};

// Update status
const updateStatus = async (req, res) => {
  try {
    logger.info('Updating sport status');
    
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status },
      { new: true, runValidators: true }
    )
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Sport status updated successfully:', { sportId: id, status });
    return successResponse(res, sport, 'Sport status updated successfully');
  } catch (error) {
    logger.error('Error updating sport status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update status
const bulkUpdateStatus = async (req, res) => {
  try {
    logger.info('Bulk updating sport status');
    
    const { sportIds, status } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!sportIds || !Array.isArray(sportIds)) {
      errors.push('Sport IDs must be an array');
    } else if (sportIds.length === 0) {
      errors.push('Sport IDs array cannot be empty');
    } else if (sportIds.length > 100) {
      errors.push('Cannot update more than 100 sports at once');
    } else {
      for (const id of sportIds) {
        const idError = validateObjectId(id, 'Sport ID');
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
    
    const result = await Sport.updateMany(
      { _id: { $in: sportIds }, institution: tenantId },
      { status }
    );
    
    logger.info('Sport status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, { modifiedCount: result.modifiedCount }, 'Sports status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating sport status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete sports
const bulkDeleteSports = async (req, res) => {
  try {
    logger.info('Bulk deleting sports');
    
    const { sportIds } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!sportIds || !Array.isArray(sportIds)) {
      errors.push('Sport IDs must be an array');
    } else if (sportIds.length === 0) {
      errors.push('Sport IDs array cannot be empty');
    } else if (sportIds.length > 100) {
      errors.push('Cannot delete more than 100 sports at once');
    } else {
      for (const id of sportIds) {
        const idError = validateObjectId(id, 'Sport ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Sport.deleteMany({
      _id: { $in: sportIds },
      institution: tenantId
    });
    
    logger.info('Sports bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Sports deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting sports:', error);
    return errorResponse(res, error.message);
  }
};

// Get sport statistics
const getSportStatistics = async (req, res) => {
  try {
    logger.info('Fetching sport statistics');
    
    const tenantId = req.tenantId;
    
    const [
      totalSports,
      activeSports,
      inactiveSports,
      archivedSports,
      sportsByCategory
    ] = await Promise.all([
      Sport.countDocuments({ institution: tenantId }),
      Sport.countDocuments({ institution: tenantId, status: 'active' }),
      Sport.countDocuments({ institution: tenantId, status: 'inactive' }),
      Sport.countDocuments({ institution: tenantId, status: 'archived' }),
      Sport.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(tenantId) } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);
    
    const statistics = {
      total: totalSports,
      byStatus: {
        active: activeSports,
        inactive: inactiveSports,
        archived: archivedSports
      },
      byCategory: sportsByCategory.map(item => ({
        category: item._id,
        count: item.count
      }))
    };
    
    logger.info('Sport statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sport statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Search sports
const searchSports = async (req, res) => {
  try {
    logger.info('Searching sports');
    
    const { q } = req.query;
    const tenantId = req.tenantId;
    
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
    
    const sports = await Sport.find({
      institution: tenantId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ]
    })
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name')
      .limit(50);
    
    logger.info('Sports searched successfully:', { query: q, count: sports.length });
    return successResponse(res, sports, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching sports:', error);
    return errorResponse(res, error.message);
  }
};

// Export sports
const exportSports = async (req, res) => {
  try {
    logger.info('Exporting sports');
    
    const { format, status, category } = req.query;
    const tenantId = req.tenantId;
    
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
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: tenantId };
    if (status) query.status = status;
    if (category) query.category = category;
    
    const sports = await Sport.find(query)
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    const exportData = {
      format: format.toLowerCase(),
      data: sports,
      exportedAt: new Date().toISOString(),
      totalRecords: sports.length
    };
    
    logger.info('Sports exported successfully:', { format, count: sports.length });
    return successResponse(res, exportData, 'Sports exported successfully');
  } catch (error) {
    logger.error('Error exporting sports:', error);
    return errorResponse(res, error.message);
  }
};

// Get active sports
const getActiveSports = async (req, res) => {
  try {
    logger.info('Fetching active sports');
    
    const tenantId = req.tenantId;
    
    const sports = await Sport.find({ status: 'active', institution: tenantId })
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ name: 1 });
    
    logger.info('Active sports fetched successfully:', { count: sports.length });
    return successResponse(res, sports, 'Active sports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching active sports:', error);
    return errorResponse(res, error.message);
  }
};

// Archive sport
const archiveSport = async (req, res) => {
  try {
    logger.info('Archiving sport');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status: 'archived' },
      { new: true, runValidators: true }
    )
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Sport archived successfully:', { sportId: id });
    return successResponse(res, sport, 'Sport archived successfully');
  } catch (error) {
    logger.error('Error archiving sport:', error);
    return errorResponse(res, error.message);
  }
};

// Restore archived sport
const restoreSport = async (req, res) => {
  try {
    logger.info('Restoring archived sport');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status: 'active' },
      { new: true, runValidators: true }
    )
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Sport restored successfully:', { sportId: id });
    return successResponse(res, sport, 'Sport restored successfully');
  } catch (error) {
    logger.error('Error restoring sport:', error);
    return errorResponse(res, error.message);
  }
};

// Get sports by coach
const getSportsByCoach = async (req, res) => {
  try {
    logger.info('Fetching sports by coach');
    
    const { coachId } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const coachIdError = validateObjectId(coachId, 'Coach ID');
    if (coachIdError) errors.push(coachIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sports = await Sport.find({ coach: coachId, institution: tenantId })
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    
    logger.info('Sports fetched by coach successfully:', { coachId, count: sports.length });
    return successResponse(res, sports, 'Sports retrieved successfully');
  } catch (error) {
    logger.error('Error fetching sports by coach:', error);
    return errorResponse(res, error.message);
  }
};

// Assign coach to sport
const assignCoach = async (req, res) => {
  try {
    logger.info('Assigning coach to sport');
    
    const { id } = req.params;
    const { coachId } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Sport ID');
    if (idError) errors.push(idError);
    
    if (!coachId) {
      errors.push('Coach ID is required');
    } else {
      const coachIdError = validateObjectId(coachId, 'Coach ID');
      if (coachIdError) errors.push(coachIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sport = await Sport.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { coach: coachId },
      { new: true, runValidators: true }
    )
      .populate('coach', 'name email phone')
      .populate('createdBy', 'name');
    
    if (!sport) {
      return notFoundResponse(res, 'Sport not found');
    }
    
    logger.info('Coach assigned to sport successfully:', { sportId: id, coachId });
    return successResponse(res, sport, 'Coach assigned successfully');
  } catch (error) {
    logger.error('Error assigning coach to sport:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createSport,
  getSportById,
  getAllSports,
  updateSport,
  deleteSport,
  getSportsByStatus,
  getSportsByCategory,
  updateStatus,
  bulkUpdateStatus,
  bulkDeleteSports,
  getSportStatistics,
  searchSports,
  exportSports,
  getActiveSports,
  archiveSport,
  restoreSport,
  getSportsByCoach,
  assignCoach
};
