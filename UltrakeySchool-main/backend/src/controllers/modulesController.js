import Module from '../models/Module.js';
import ModuleCategory from '../models/ModuleCategory.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_MODULE_STATUSES = ['enabled', 'disabled', 'maintenance'];
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

// Get all modules with categories
const getAllModules = async (req, res) => {
  try {
    logger.info('Fetching all modules with categories');
    
    const { page, limit, search } = req.query;
    
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
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { tenantId: req.tenantId };
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    const [categories, total] = await Promise.all([
      ModuleCategory.find(filter).populate('modules').skip(skip).limit(limitNum),
      ModuleCategory.countDocuments(filter)
    ]);
    
    logger.info('Modules with categories fetched successfully');
    return successResponse(res, {
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Modules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching modules:', error);
    return errorResponse(res, error.message);
  }
};

// Get modules by category
const getModulesByCategory = async (req, res) => {
  try {
    logger.info('Fetching modules by category');
    
    const { categoryId } = req.params;
    const { page, limit, search, status } = req.query;
    
    // Validation
    const errors = [];
    
    const categoryIdError = validateObjectId(categoryId, 'Category ID');
    if (categoryIdError) errors.push(categoryIdError);
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_MODULE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MODULE_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { 
      tenantId: req.tenantId, 
      category: categoryId 
    };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    const [modules, total] = await Promise.all([
      Module.find(filter).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      Module.countDocuments(filter)
    ]);
    
    logger.info('Modules fetched successfully by category:', { categoryId, count: modules.length });
    return successResponse(res, {
      modules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Modules retrieved successfully');
  } catch (error) {
    logger.error('Error fetching modules by category:', error);
    return errorResponse(res, error.message);
  }
};

// Get single module
const getModuleById = async (req, res) => {
  try {
    logger.info('Fetching module by ID');
    
    const { moduleId } = req.params;
    
    // Validation
    const errors = [];
    
    const moduleIdError = validateObjectId(moduleId, 'Module ID');
    if (moduleIdError) errors.push(moduleIdError);
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const module = await Module.findOne({ 
      _id: moduleId, 
      tenantId: req.tenantId 
    }).populate('category');
    
    if (!module) {
      return notFoundResponse(res, 'Module not found');
    }
    
    logger.info('Module fetched successfully:', { moduleId });
    return successResponse(res, module, 'Module retrieved successfully');
  } catch (error) {
    logger.error('Error fetching module:', error);
    return errorResponse(res, error.message);
  }
};

// Create new module
const createModule = async (req, res) => {
  try {
    logger.info('Creating new module');
    
    const { name, description, category, icon, path, status, enabled, permissions } = req.body;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Module name is required');
    } else if (name.length > 100) {
      errors.push('Module name must not exceed 100 characters');
    }
    
    if (description && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (category) {
      const categoryError = validateObjectId(category, 'Category ID');
      if (categoryError) errors.push(categoryError);
    }
    
    if (path && path.length > 200) {
      errors.push('Path must not exceed 200 characters');
    }
    
    if (status && !VALID_MODULE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MODULE_STATUSES.join(', '));
    }
    
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (permissions && !Array.isArray(permissions)) {
      errors.push('Permissions must be an array');
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check for duplicate module name
    const existingModule = await Module.findOne({
      name: name.trim(),
      tenantId: req.tenantId
    });
    
    if (existingModule) {
      return validationErrorResponse(res, ['Module with this name already exists']);
    }
    
    const moduleData = {
      name: name.trim(),
      description: description?.trim(),
      category,
      icon,
      path,
      status: status || 'enabled',
      enabled: enabled !== undefined ? enabled : true,
      permissions: permissions || [],
      tenantId: req.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const module = new Module(moduleData);
    await module.save();
    
    // Add module to category if specified
    if (category) {
      await ModuleCategory.findByIdAndUpdate(
        category,
        { $push: { modules: module._id } }
      );
    }
    
    logger.info('Module created successfully:', { moduleId: module._id });
    return createdResponse(res, module, 'Module created successfully');
  } catch (error) {
    logger.error('Error creating module:', error);
    return errorResponse(res, error.message);
  }
};

// Update module
const updateModule = async (req, res) => {
  try {
    logger.info('Updating module');
    
    const { moduleId } = req.params;
    const { name, description, category, icon, path, status, enabled, permissions } = req.body;
    
    // Validation
    const errors = [];
    
    const moduleIdError = validateObjectId(moduleId, 'Module ID');
    if (moduleIdError) errors.push(moduleIdError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Module name cannot be empty');
      } else if (name.length > 100) {
        errors.push('Module name must not exceed 100 characters');
      }
    }
    
    if (description !== undefined && description.length > 500) {
      errors.push('Description must not exceed 500 characters');
    }
    
    if (category !== undefined) {
      const categoryError = validateObjectId(category, 'Category ID');
      if (categoryError) errors.push(categoryError);
    }
    
    if (path !== undefined && path.length > 200) {
      errors.push('Path must not exceed 200 characters');
    }
    
    if (status !== undefined && !VALID_MODULE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MODULE_STATUSES.join(', '));
    }
    
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      errors.push('Enabled must be a boolean value');
    }
    
    if (permissions !== undefined && !Array.isArray(permissions)) {
      errors.push('Permissions must be an array');
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check if module exists
    const existingModule = await Module.findOne({
      _id: moduleId,
      tenantId: req.tenantId
    });
    
    if (!existingModule) {
      return notFoundResponse(res, 'Module not found');
    }
    
    // Check for duplicate name if name is being updated
    if (name && name.trim() !== existingModule.name) {
      const duplicateModule = await Module.findOne({
        name: name.trim(),
        tenantId: req.tenantId,
        _id: { $ne: moduleId }
      });
      
      if (duplicateModule) {
        return validationErrorResponse(res, ['Module with this name already exists']);
      }
    }
    
    const updateData = {
      updatedAt: new Date()
    };
    
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (category !== undefined) updateData.category = category;
    if (icon !== undefined) updateData.icon = icon;
    if (path !== undefined) updateData.path = path;
    if (status !== undefined) updateData.status = status;
    if (enabled !== undefined) updateData.enabled = enabled;
    if (permissions !== undefined) updateData.permissions = permissions;
    
    const module = await Module.findOneAndUpdate(
      { _id: moduleId, tenantId: req.tenantId },
      updateData,
      { new: true, runValidators: true }
    );
    
    // Update category if changed
    if (category !== undefined && category !== existingModule.category?.toString()) {
      // Remove from old category
      if (existingModule.category) {
        await ModuleCategory.findByIdAndUpdate(
          existingModule.category,
          { $pull: { modules: moduleId } }
        );
      }
      
      // Add to new category
      if (category) {
        await ModuleCategory.findByIdAndUpdate(
          category,
          { $push: { modules: moduleId } }
        );
      }
    }
    
    logger.info('Module updated successfully:', { moduleId });
    return successResponse(res, module, 'Module updated successfully');
  } catch (error) {
    logger.error('Error updating module:', error);
    return errorResponse(res, error.message);
  }
};

// Delete module
const deleteModule = async (req, res) => {
  try {
    logger.info('Deleting module');
    
    const { moduleId } = req.params;
    
    // Validation
    const errors = [];
    
    const moduleIdError = validateObjectId(moduleId, 'Module ID');
    if (moduleIdError) errors.push(moduleIdError);
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const module = await Module.findOneAndDelete({
      _id: moduleId,
      tenantId: req.tenantId
    });
    
    if (!module) {
      return notFoundResponse(res, 'Module not found');
    }
    
    // Remove module from category
    if (module.category) {
      await ModuleCategory.findByIdAndUpdate(
        module.category,
        { $pull: { modules: module._id } }
      );
    }
    
    logger.info('Module deleted successfully:', { moduleId });
    return successResponse(res, null, 'Module deleted successfully');
  } catch (error) {
    logger.error('Error deleting module:', error);
    return errorResponse(res, error.message);
  }
};

// Toggle module status
const toggleModuleStatus = async (req, res) => {
  try {
    logger.info('Toggling module status');
    
    const { moduleId } = req.params;
    
    // Validation
    const errors = [];
    
    const moduleIdError = validateObjectId(moduleId, 'Module ID');
    if (moduleIdError) errors.push(moduleIdError);
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const module = await Module.findOne({ 
      _id: moduleId, 
      tenantId: req.tenantId 
    });
    
    if (!module) {
      return notFoundResponse(res, 'Module not found');
    }
    
    module.enabled = !module.enabled;
    module.updatedAt = new Date();
    await module.save();
    
    logger.info('Module status toggled successfully:', { moduleId, enabled: module.enabled });
    return successResponse(res, module, 'Module status updated successfully');
  } catch (error) {
    logger.error('Error toggling module status:', error);
    return errorResponse(res, error.message);
  }
};

// Get module categories
const getModuleCategories = async (req, res) => {
  try {
    logger.info('Fetching module categories');
    
    const { page, limit, search } = req.query;
    
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
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { tenantId: req.tenantId };
    
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    const [categories, total] = await Promise.all([
      ModuleCategory.find(filter).populate('modules').skip(skip).limit(limitNum).sort({ name: 1 }),
      ModuleCategory.countDocuments(filter)
    ]);
    
    logger.info('Module categories fetched successfully');
    return successResponse(res, {
      categories,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Categories retrieved successfully');
  } catch (error) {
    logger.error('Error fetching module categories:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update modules
const bulkUpdateModules = async (req, res) => {
  try {
    logger.info('Bulk updating modules');
    
    const { moduleIds, updateData } = req.body;
    
    // Validation
    const errors = [];
    
    if (!moduleIds || !Array.isArray(moduleIds)) {
      errors.push('Module IDs must be an array');
    } else if (moduleIds.length === 0) {
      errors.push('Module IDs array cannot be empty');
    } else if (moduleIds.length > 100) {
      errors.push('Cannot update more than 100 modules at once');
    } else {
      for (const id of moduleIds) {
        const idError = validateObjectId(id, 'Module ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updateData || typeof updateData !== 'object') {
      errors.push('Update data is required');
    }
    
    if (updateData?.status && !VALID_MODULE_STATUSES.includes(updateData.status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MODULE_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Module.updateMany(
      { _id: { $in: moduleIds }, tenantId: req.tenantId },
      { ...updateData, updatedAt: new Date() }
    );
    
    logger.info('Modules bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }, 'Modules updated successfully');
  } catch (error) {
    logger.error('Error bulk updating modules:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete modules
const bulkDeleteModules = async (req, res) => {
  try {
    logger.info('Bulk deleting modules');
    
    const { moduleIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!moduleIds || !Array.isArray(moduleIds)) {
      errors.push('Module IDs must be an array');
    } else if (moduleIds.length === 0) {
      errors.push('Module IDs array cannot be empty');
    } else if (moduleIds.length > 100) {
      errors.push('Cannot delete more than 100 modules at once');
    } else {
      for (const id of moduleIds) {
        const idError = validateObjectId(id, 'Module ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Get modules to remove from categories
    const modules = await Module.find({
      _id: { $in: moduleIds },
      tenantId: req.tenantId
    });
    
    // Remove modules from categories
    const categoryIds = [...new Set(modules.map(m => m.category).filter(Boolean))];
    if (categoryIds.length > 0) {
      await ModuleCategory.updateMany(
        { _id: { $in: categoryIds } },
        { $pull: { modules: { $in: moduleIds } } }
      );
    }
    
    const result = await Module.deleteMany({
      _id: { $in: moduleIds },
      tenantId: req.tenantId
    });
    
    logger.info('Modules bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, {
      deletedCount: result.deletedCount
    }, 'Modules deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting modules:', error);
    return errorResponse(res, error.message);
  }
};

// Export modules data
const exportModules = async (req, res) => {
  try {
    logger.info('Exporting modules data');
    
    const { format, categoryId, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (categoryId) {
      const categoryIdError = validateObjectId(categoryId, 'Category ID');
      if (categoryIdError) errors.push(categoryIdError);
    }
    
    if (status && !VALID_MODULE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MODULE_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { tenantId: req.tenantId };
    if (categoryId) filter.category = categoryId;
    if (status) filter.status = status;
    
    const modules = await Module.find(filter).populate('category').lean();
    
    const exportData = {
      format: format.toLowerCase(),
      exportDate: new Date().toISOString(),
      totalRecords: modules.length,
      data: modules
    };
    
    logger.info('Modules data exported successfully:', { format, count: modules.length });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting modules data:', error);
    return errorResponse(res, error.message);
  }
};

// Get module statistics
const getModuleStatistics = async (req, res) => {
  try {
    logger.info('Fetching module statistics');
    
    const { categoryId } = req.query;
    
    // Validation
    const errors = [];
    
    if (categoryId) {
      const categoryIdError = validateObjectId(categoryId, 'Category ID');
      if (categoryIdError) errors.push(categoryIdError);
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { tenantId: req.tenantId };
    if (categoryId) filter.category = categoryId;
    
    const [
      totalModules,
      enabledModules,
      disabledModules,
      statusBreakdown,
      categoryBreakdown
    ] = await Promise.all([
      Module.countDocuments(filter),
      Module.countDocuments({ ...filter, enabled: true }),
      Module.countDocuments({ ...filter, enabled: false }),
      Module.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Module.aggregate([
        { $match: filter },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'modulecategories', localField: '_id', foreignField: '_id', as: 'categoryInfo' } },
        { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
        { $project: { categoryName: '$categoryInfo.name', count: 1 } }
      ])
    ]);
    
    const statistics = {
      totalModules,
      enabledModules,
      disabledModules,
      statusBreakdown: statusBreakdown.reduce((acc, item) => {
        acc[item._id || 'unknown'] = item.count;
        return acc;
      }, {}),
      categoryBreakdown: categoryBreakdown.map(item => ({
        categoryId: item._id,
        categoryName: item.categoryName || 'Uncategorized',
        count: item.count
      }))
    };
    
    logger.info('Module statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching module statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get module analytics
const getModuleAnalytics = async (req, res) => {
  try {
    logger.info('Fetching module analytics');
    
    const { startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    const validGroupBy = ['day', 'week', 'month', 'year'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = { tenantId: req.tenantId };
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    const groupByFormat = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      year: { $dateToString: { format: '%Y', date: '$createdAt' } }
    };
    
    const analytics = await Module.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupBy ? groupByFormat[groupBy] : null,
          totalModules: { $sum: 1 },
          enabledModules: { $sum: { $cond: ['$enabled', 1, 0] } },
          disabledModules: { $sum: { $cond: ['$enabled', 0, 1] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    logger.info('Module analytics fetched successfully');
    return successResponse(res, {
      groupBy: groupBy || 'all',
      analytics
    }, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching module analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Search modules
const searchModules = async (req, res) => {
  try {
    logger.info('Searching modules');
    
    const { query, page, limit, categoryId, status, enabled } = req.query;
    
    // Validation
    const errors = [];
    
    if (!query || query.trim().length === 0) {
      errors.push('Search query is required');
    } else if (query.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (categoryId) {
      const categoryIdError = validateObjectId(categoryId, 'Category ID');
      if (categoryIdError) errors.push(categoryIdError);
    }
    
    if (status && !VALID_MODULE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_MODULE_STATUSES.join(', '));
    }
    
    if (enabled !== undefined && enabled !== 'true' && enabled !== 'false') {
      errors.push('Enabled must be true or false');
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filter = {
      tenantId: req.tenantId,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { path: { $regex: query, $options: 'i' } }
      ]
    };
    
    if (categoryId) filter.category = categoryId;
    if (status) filter.status = status;
    if (enabled !== undefined) filter.enabled = enabled === 'true';
    
    const skip = (pageNum - 1) * limitNum;
    
    const [modules, total] = await Promise.all([
      Module.find(filter).populate('category').skip(skip).limit(limitNum).sort({ name: 1 }),
      Module.countDocuments(filter)
    ]);
    
    logger.info('Modules search completed:', { query, count: modules.length });
    return successResponse(res, {
      modules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    }, 'Search completed successfully');
  } catch (error) {
    logger.error('Error searching modules:', error);
    return errorResponse(res, error.message);
  }
};

// Clone module
const cloneModule = async (req, res) => {
  try {
    logger.info('Cloning module');
    
    const { moduleId } = req.params;
    const { newName } = req.body;
    
    // Validation
    const errors = [];
    
    const moduleIdError = validateObjectId(moduleId, 'Module ID');
    if (moduleIdError) errors.push(moduleIdError);
    
    if (!newName || newName.trim().length === 0) {
      errors.push('New module name is required');
    } else if (newName.length > 100) {
      errors.push('Module name must not exceed 100 characters');
    }
    
    if (!req.tenantId) {
      errors.push('Tenant information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const sourceModule = await Module.findOne({
      _id: moduleId,
      tenantId: req.tenantId
    });
    
    if (!sourceModule) {
      return notFoundResponse(res, 'Source module not found');
    }
    
    // Check for duplicate name
    const existingModule = await Module.findOne({
      name: newName.trim(),
      tenantId: req.tenantId
    });
    
    if (existingModule) {
      return validationErrorResponse(res, ['Module with this name already exists']);
    }
    
    const clonedModuleData = {
      name: newName.trim(),
      description: sourceModule.description,
      category: sourceModule.category,
      icon: sourceModule.icon,
      path: sourceModule.path,
      status: sourceModule.status,
      enabled: sourceModule.enabled,
      permissions: sourceModule.permissions,
      tenantId: req.tenantId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const clonedModule = new Module(clonedModuleData);
    await clonedModule.save();
    
    // Add to category if exists
    if (sourceModule.category) {
      await ModuleCategory.findByIdAndUpdate(
        sourceModule.category,
        { $push: { modules: clonedModule._id } }
      );
    }
    
    logger.info('Module cloned successfully:', { sourceId: moduleId, clonedId: clonedModule._id });
    return createdResponse(res, clonedModule, 'Module cloned successfully');
  } catch (error) {
    logger.error('Error cloning module:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllModules,
  getModulesByCategory,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  toggleModuleStatus,
  getModuleCategories,
  bulkUpdateModules,
  bulkDeleteModules,
  exportModules,
  getModuleStatistics,
  getModuleAnalytics,
  searchModules,
  cloneModule
};
