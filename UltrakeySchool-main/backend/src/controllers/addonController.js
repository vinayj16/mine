/**
 * Addon Controller
 * Manages membership addons and features
 */

import MembershipAddon from '../models/MembershipAddon.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id) => {
  if (!id) {
    throw new Error('ID is required');
  }
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
};

/**
 * Validate addon data
 */
const validateAddonData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }
    
    if (!data.category) {
      errors.push('Category is required');
    }
    
    if (data.price === undefined || data.price === null) {
      errors.push('Price is required');
    }
  }
  
  if (data.name && data.name.length > 200) {
    errors.push('Name must not exceed 200 characters');
  }
  
  if (data.price !== undefined && (isNaN(data.price) || data.price < 0)) {
    errors.push('Price must be a non-negative number');
  }
  
  const validCategories = ['FEATURE', 'MODULE', 'STORAGE', 'USERS', 'SUPPORT', 'INTEGRATION', 'OTHER'];
  if (data.category && !validCategories.includes(data.category.toUpperCase())) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }
  
  const validBillingCycles = ['MONTHLY', 'YEARLY', 'ONE_TIME'];
  if (data.billingCycle && !validBillingCycles.includes(data.billingCycle.toUpperCase())) {
    errors.push(`Billing cycle must be one of: ${validBillingCycles.join(', ')}`);
  }
  
  const validStatuses = ['active', 'inactive', 'archived'];
  if (data.status && !validStatuses.includes(data.status.toLowerCase())) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }
  
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.details = errors;
    throw error;
  }
  
  return true;
};

/**
 * Generate unique addon ID
 */
const generateAddonId = async () => {
  try {
    const count = await MembershipAddon.countDocuments();
    const addonId = `ADDON-${String(count + 1).padStart(6, '0')}`;
    
    // Check if ID already exists (race condition protection)
    const existing = await MembershipAddon.findOne({ addonId });
    if (existing) {
      // Recursively generate new ID
      return generateAddonId();
    }
    
    return addonId;
  } catch (error) {
    logger.error('Error generating addon ID:', error);
    throw error;
  }
};

/**
 * Get all addons with filtering and pagination
 * @route GET /api/v1/addons
 */
const getAllAddons = async (req, res, next) => {
  try {
    const { 
      status, 
      category, 
      billingCycle,
      search,
      page, 
      limit, 
      sortBy, 
      sortOrder 
    } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status.toLowerCase();
    if (category) filter.category = category.toUpperCase();
    if (billingCycle) filter.billingCycle = billingCycle.toUpperCase();
    
    // Search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { addonId: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    const sort = {};
    const sortField = sortBy || 'sortOrder';
    const order = sortOrder === 'asc' ? 1 : -1;
    sort[sortField] = order;
    if (sortField !== 'createdAt') {
      sort.createdAt = -1; // Secondary sort
    }

    // Execute query
    const [addons, total] = await Promise.all([
      MembershipAddon.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      MembershipAddon.countDocuments(filter)
    ]);

    logger.info('Addons retrieved', {
      userId: req.user?.id,
      count: addons.length,
      total,
      filters: filter
    });

    return ApiResponse.success(
      res,
      'Addons retrieved successfully',
      {
        addons,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1
        },
        filters: filter
      }
    );
  } catch (error) {
    logger.error('Error fetching addons:', error);
    next(error);
  }
};

/**
 * Get addon by ID
 * @route GET /api/v1/addons/:id
 */
const getAddonById = async (req, res, next) => {
  try {
    const addonId = validateObjectId(req.params.id);
    
    const addon = await MembershipAddon.findById(addonId).lean();

    if (!addon) {
      return ApiResponse.notFound(res, 'Addon not found');
    }

    logger.info('Addon retrieved', {
      addonId: addon._id,
      userId: req.user?.id
    });

    return ApiResponse.success(
      res,
      'Addon retrieved successfully',
      { addon }
    );
  } catch (error) {
    logger.error('Error fetching addon:', error);
    next(error);
  }
};

/**
 * Get addon by addon ID (custom ID)
 * @route GET /api/v1/addons/by-addon-id/:addonId
 */
const getAddonByAddonId = async (req, res, next) => {
  try {
    const { addonId } = req.params;
    
    if (!addonId) {
      return ApiResponse.badRequest(res, 'Addon ID is required');
    }
    
    const addon = await MembershipAddon.findOne({ addonId }).lean();

    if (!addon) {
      return ApiResponse.notFound(res, 'Addon not found');
    }

    logger.info('Addon retrieved by addon ID', {
      addonId,
      userId: req.user?.id
    });

    return ApiResponse.success(
      res,
      'Addon retrieved successfully',
      { addon }
    );
  } catch (error) {
    logger.error('Error fetching addon by addon ID:', error);
    next(error);
  }
};

/**
 * Create new addon
 * @route POST /api/v1/addons
 */
const createAddon = async (req, res, next) => {
  try {
    // Validate data
    validateAddonData(req.body);
    
    // Generate unique addon ID
    const addonId = await generateAddonId();
    
    const addonData = {
      ...req.body,
      addonId,
      createdBy: req.user?.id
    };

    const addon = new MembershipAddon(addonData);
    await addon.save();

    logger.info('Addon created', {
      addonId: addon._id,
      customAddonId: addon.addonId,
      userId: req.user?.id,
      name: addon.name
    });

    return ApiResponse.created(
      res,
      'Addon created successfully',
      { addon }
    );
  } catch (error) {
    logger.error('Error creating addon:', error);
    if (error.details) {
      return ApiResponse.badRequest(res, error.message, error.details);
    }
    if (error.code === 11000) {
      return ApiResponse.conflict(res, 'Addon with this name or ID already exists');
    }
    next(error);
  }
};

/**
 * Update addon
 * @route PUT /api/v1/addons/:id
 */
const updateAddon = async (req, res, next) => {
  try {
    const addonId = validateObjectId(req.params.id);
    
    // Validate update data
    validateAddonData(req.body, true);
    
    // Don't allow updating addonId
    delete req.body.addonId;
    
    const addon = await MembershipAddon.findByIdAndUpdate(
      addonId,
      { 
        $set: {
          ...req.body,
          updatedBy: req.user?.id,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    if (!addon) {
      return ApiResponse.notFound(res, 'Addon not found');
    }

    logger.info('Addon updated', {
      addonId: addon._id,
      userId: req.user?.id,
      updates: Object.keys(req.body)
    });

    return ApiResponse.success(
      res,
      'Addon updated successfully',
      { addon }
    );
  } catch (error) {
    logger.error('Error updating addon:', error);
    if (error.details) {
      return ApiResponse.badRequest(res, error.message, error.details);
    }
    if (error.code === 11000) {
      return ApiResponse.conflict(res, 'Addon with this name already exists');
    }
    next(error);
  }
};

/**
 * Delete addon (soft delete)
 * @route DELETE /api/v1/addons/:id
 */
const deleteAddon = async (req, res, next) => {
  try {
    const addonId = validateObjectId(req.params.id);
    
    const { permanent } = req.query;
    
    let addon;
    if (permanent === 'true') {
      // Hard delete
      addon = await MembershipAddon.findByIdAndDelete(addonId);
    } else {
      // Soft delete (archive)
      addon = await MembershipAddon.findByIdAndUpdate(
        addonId,
        { 
          $set: { 
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: req.user?.id
          }
        },
        { new: true }
      );
    }

    if (!addon) {
      return ApiResponse.notFound(res, 'Addon not found');
    }

    logger.info('Addon deleted', {
      addonId: addon._id,
      userId: req.user?.id,
      permanent: permanent === 'true',
      name: addon.name
    });

    return ApiResponse.success(
      res,
      permanent === 'true' ? 'Addon permanently deleted' : 'Addon archived successfully',
      { 
        id: addon._id,
        name: addon.name,
        status: addon.status
      }
    );
  } catch (error) {
    logger.error('Error deleting addon:', error);
    next(error);
  }
};

/**
 * Bulk delete addons
 * @route POST /api/v1/addons/bulk-delete
 */
const bulkDeleteAddons = async (req, res, next) => {
  try {
    const { addonIds, permanent } = req.body;
    
    if (!addonIds || !Array.isArray(addonIds) || addonIds.length === 0) {
      return ApiResponse.badRequest(res, 'Addon IDs array is required');
    }
    
    // Validate all IDs
    addonIds.forEach(id => validateObjectId(id));
    
    let result;
    if (permanent === true) {
      // Hard delete
      result = await MembershipAddon.deleteMany({ _id: { $in: addonIds } });
    } else {
      // Soft delete (archive)
      result = await MembershipAddon.updateMany(
        { _id: { $in: addonIds } },
        { 
          $set: { 
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: req.user?.id
          }
        }
      );
    }

    logger.info('Bulk delete addons', {
      userId: req.user?.id,
      count: result.deletedCount || result.modifiedCount,
      permanent
    });

    return ApiResponse.success(
      res,
      `Successfully ${permanent ? 'deleted' : 'archived'} ${result.deletedCount || result.modifiedCount} addon(s)`,
      {
        count: result.deletedCount || result.modifiedCount,
        requestedCount: addonIds.length
      }
    );
  } catch (error) {
    logger.error('Error bulk deleting addons:', error);
    next(error);
  }
};

/**
 * Toggle addon status
 * @route PATCH /api/v1/addons/:id/toggle-status
 */
const toggleStatus = async (req, res, next) => {
  try {
    const addonId = validateObjectId(req.params.id);
    
    const addon = await MembershipAddon.findById(addonId);
    
    if (!addon) {
      return ApiResponse.notFound(res, 'Addon not found');
    }
    
    addon.status = addon.status === 'active' ? 'inactive' : 'active';
    addon.updatedBy = req.user?.id;
    await addon.save();

    logger.info('Addon status toggled', {
      addonId: addon._id,
      userId: req.user?.id,
      newStatus: addon.status
    });

    return ApiResponse.success(
      res,
      `Addon ${addon.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      {
        id: addon._id,
        name: addon.name,
        status: addon.status
      }
    );
  } catch (error) {
    logger.error('Error toggling addon status:', error);
    next(error);
  }
};

/**
 * Get addons by category
 * @route GET /api/v1/addons/category/:category
 */
const getAddonsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return ApiResponse.badRequest(res, 'Category is required');
    }
    
    const addons = await MembershipAddon.find({ 
      category: category.toUpperCase(),
      status: 'active'
    })
    .sort({ sortOrder: 1, createdAt: -1 })
    .lean();

    logger.info('Addons retrieved by category', {
      category,
      userId: req.user?.id,
      count: addons.length
    });

    return ApiResponse.success(
      res,
      `Addons for ${category} retrieved successfully`,
      {
        category: category.toUpperCase(),
        addons,
        count: addons.length
      }
    );
  } catch (error) {
    logger.error('Error getting addons by category:', error);
    next(error);
  }
};

/**
 * Get addon statistics
 * @route GET /api/v1/addons/statistics
 */
const getStatistics = async (req, res, next) => {
  try {
    const [
      total,
      active,
      inactive,
      archived,
      byCategory,
      byBillingCycle
    ] = await Promise.all([
      MembershipAddon.countDocuments(),
      MembershipAddon.countDocuments({ status: 'active' }),
      MembershipAddon.countDocuments({ status: 'inactive' }),
      MembershipAddon.countDocuments({ status: 'archived' }),
      MembershipAddon.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      MembershipAddon.aggregate([
        { $group: { _id: '$billingCycle', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    const statistics = {
      total,
      byStatus: {
        active,
        inactive,
        archived
      },
      byCategory: byCategory.map(item => ({
        category: item._id,
        count: item.count
      })),
      byBillingCycle: byBillingCycle.map(item => ({
        billingCycle: item._id,
        count: item.count
      }))
    };

    logger.info('Addon statistics retrieved', {
      userId: req.user?.id,
      total
    });

    return ApiResponse.success(
      res,
      'Statistics retrieved successfully',
      statistics
    );
  } catch (error) {
    logger.error('Error getting addon statistics:', error);
    next(error);
  }
};

/**
 * Reorder addons
 * @route POST /api/v1/addons/reorder
 */
const reorderAddons = async (req, res, next) => {
  try {
    const { addonIds } = req.body;
    
    if (!addonIds || !Array.isArray(addonIds) || addonIds.length === 0) {
      return ApiResponse.badRequest(res, 'Addon IDs array is required');
    }
    
    // Update sort order for each addon
    const updates = addonIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index + 1 } }
      }
    }));
    
    const result = await MembershipAddon.bulkWrite(updates);

    logger.info('Addons reordered', {
      userId: req.user?.id,
      count: result.modifiedCount
    });

    return ApiResponse.success(
      res,
      'Addons reordered successfully',
      {
        modifiedCount: result.modifiedCount
      }
    );
  } catch (error) {
    logger.error('Error reordering addons:', error);
    next(error);
  }
};

export default {
  getAllAddons,
  getAddonById,
  getAddonByAddonId,
  createAddon,
  updateAddon,
  deleteAddon,
  bulkDeleteAddons,
  toggleStatus,
  getAddonsByCategory,
  getStatistics,
  reorderAddons
};
