import permissionService from '../services/permissionService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_PERMISSION_TYPES = ['read', 'write', 'delete', 'execute', 'admin'];
const VALID_RESOURCE_TYPES = ['module', 'feature', 'api', 'page', 'action'];
const VALID_ROLES = ['super-admin', 'admin', 'teacher', 'student', 'parent', 'staff', 'guest'];
const VALID_PLANS = ['free', 'basic', 'standard', 'premium', 'enterprise'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_KEY_LENGTH = 100;

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

// Helper function to validate permission key format
const validatePermissionKey = (key) => {
  if (!key || key.trim().length === 0) {
    return 'Permission key is required';
  }
  if (key.length > MAX_KEY_LENGTH) {
    return 'Permission key must not exceed ' + MAX_KEY_LENGTH + ' characters';
  }
  // Permission key should follow format: resource:action (e.g., users:read, posts:write)
  if (!/^[a-z0-9_-]+:[a-z0-9_-]+$/i.test(key)) {
    return 'Invalid permission key format. Expected format: resource:action';
  }
  return null;
};

// Get all permissions
const getAllPermissions = async (req, res) => {
  try {
    logger.info('Fetching all permissions');
    
    const { page, limit, type, resourceType, role, search } = req.query;
    
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
    
    if (type && !VALID_PERMISSION_TYPES.includes(type)) {
      errors.push('Invalid permission type. Must be one of: ' + VALID_PERMISSION_TYPES.join(', '));
    }
    
    if (resourceType && !VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (role && !VALID_ROLES.includes(role)) {
      errors.push('Invalid role. Must be one of: ' + VALID_ROLES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await permissionService.getAllPermissions({
      page: pageNum,
      limit: limitNum,
      type,
      resourceType,
      role,
      search
    });
    
    logger.info('Permissions fetched successfully');
    return successResponse(res, result, 'Permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permissions:', error);
    return errorResponse(res, error.message);
  }
};

// Get permission by ID
const getPermissionById = async (req, res) => {
  try {
    logger.info('Fetching permission by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Permission ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permission = await permissionService.getPermissionById(id);
    
    if (!permission) {
      return notFoundResponse(res, 'Permission not found');
    }
    
    logger.info('Permission fetched successfully:', { permissionId: id });
    return successResponse(res, permission, 'Permission retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permission:', error);
    return errorResponse(res, error.message);
  }
};

// Get permission by key
const getPermissionByKey = async (req, res) => {
  try {
    logger.info('Fetching permission by key');
    
    const { key } = req.params;
    
    // Validation
    const errors = [];
    
    const keyError = validatePermissionKey(key);
    if (keyError) errors.push(keyError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permission = await permissionService.getPermissionByKey(key);
    
    if (!permission) {
      return notFoundResponse(res, 'Permission not found');
    }
    
    logger.info('Permission fetched successfully by key:', { key });
    return successResponse(res, permission, 'Permission retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permission by key:', error);
    return errorResponse(res, error.message);
  }
};

// Create permission
const createPermission = async (req, res) => {
  try {
    logger.info('Creating permission');
    
    const { key, name, description, type, resourceType, roles, plans, isActive } = req.body;
    
    // Validation
    const errors = [];
    
    const keyError = validatePermissionKey(key);
    if (keyError) errors.push(keyError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Permission name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (!type) {
      errors.push('Permission type is required');
    } else if (!VALID_PERMISSION_TYPES.includes(type)) {
      errors.push('Invalid permission type. Must be one of: ' + VALID_PERMISSION_TYPES.join(', '));
    }
    
    if (!resourceType) {
      errors.push('Resource type is required');
    } else if (!VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (roles) {
      if (!Array.isArray(roles)) {
        errors.push('Roles must be an array');
      } else {
        for (const role of roles) {
          if (!VALID_ROLES.includes(role)) {
            errors.push('Invalid role: ' + role + '. Must be one of: ' + VALID_ROLES.join(', '));
            break;
          }
        }
      }
    }
    
    if (plans) {
      if (!Array.isArray(plans)) {
        errors.push('Plans must be an array');
      } else {
        for (const plan of plans) {
          if (!VALID_PLANS.includes(plan)) {
            errors.push('Invalid plan: ' + plan + '. Must be one of: ' + VALID_PLANS.join(', '));
            break;
          }
        }
      }
    }
    
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Check for duplicate key
    const existingPermission = await permissionService.getPermissionByKey(key);
    if (existingPermission) {
      return validationErrorResponse(res, ['Permission with this key already exists']);
    }
    
    const permission = await permissionService.createPermission(req.body);
    
    logger.info('Permission created successfully:', { permissionId: permission._id });
    return createdResponse(res, permission, 'Permission created successfully');
  } catch (error) {
    logger.error('Error creating permission:', error);
    return errorResponse(res, error.message);
  }
};

// Update permission
const updatePermission = async (req, res) => {
  try {
    logger.info('Updating permission');
    
    const { id } = req.params;
    const { name, description, type, resourceType, roles, plans, isActive } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Permission ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Permission name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (type !== undefined && !VALID_PERMISSION_TYPES.includes(type)) {
      errors.push('Invalid permission type. Must be one of: ' + VALID_PERMISSION_TYPES.join(', '));
    }
    
    if (resourceType !== undefined && !VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (roles !== undefined) {
      if (!Array.isArray(roles)) {
        errors.push('Roles must be an array');
      } else {
        for (const role of roles) {
          if (!VALID_ROLES.includes(role)) {
            errors.push('Invalid role: ' + role + '. Must be one of: ' + VALID_ROLES.join(', '));
            break;
          }
        }
      }
    }
    
    if (plans !== undefined) {
      if (!Array.isArray(plans)) {
        errors.push('Plans must be an array');
      } else {
        for (const plan of plans) {
          if (!VALID_PLANS.includes(plan)) {
            errors.push('Invalid plan: ' + plan + '. Must be one of: ' + VALID_PLANS.join(', '));
            break;
          }
        }
      }
    }
    
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      errors.push('isActive must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permission = await permissionService.updatePermission(id, req.body);
    
    if (!permission) {
      return notFoundResponse(res, 'Permission not found');
    }
    
    logger.info('Permission updated successfully:', { permissionId: id });
    return successResponse(res, permission, 'Permission updated successfully');
  } catch (error) {
    logger.error('Error updating permission:', error);
    return errorResponse(res, error.message);
  }
};

// Delete permission
const deletePermission = async (req, res) => {
  try {
    logger.info('Deleting permission');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Permission ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permission = await permissionService.deletePermission(id);
    
    if (!permission) {
      return notFoundResponse(res, 'Permission not found');
    }
    
    logger.info('Permission deleted successfully:', { permissionId: id });
    return successResponse(res, null, 'Permission deleted successfully');
  } catch (error) {
    logger.error('Error deleting permission:', error);
    return errorResponse(res, error.message);
  }
};

// Get permissions by role
const getPermissionsByRole = async (req, res) => {
  try {
    logger.info('Fetching permissions by role');
    
    const { role } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!role) {
      errors.push('Role is required');
    } else if (!VALID_ROLES.includes(role)) {
      errors.push('Invalid role. Must be one of: ' + VALID_ROLES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await permissionService.getPermissionsByRole(role, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Permissions fetched by role successfully:', { role });
    return successResponse(res, result, 'Permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permissions by role:', error);
    return errorResponse(res, error.message);
  }
};

// Get permissions by plan
const getPermissionsByPlan = async (req, res) => {
  try {
    logger.info('Fetching permissions by plan');
    
    const { plan } = req.params;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!plan) {
      errors.push('Plan is required');
    } else if (!VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await permissionService.getPermissionsByPlan(plan, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Permissions fetched by plan successfully:', { plan });
    return successResponse(res, result, 'Permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permissions by plan:', error);
    return errorResponse(res, error.message);
  }
};

// Check user permission
const checkUserPermission = async (req, res) => {
  try {
    logger.info('Checking user permission');
    
    const { userId, permissionKey } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const keyError = validatePermissionKey(permissionKey);
    if (keyError) errors.push(keyError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const hasPermission = await permissionService.checkUserPermission(userId, permissionKey);
    
    logger.info('User permission checked:', { userId, permissionKey, hasPermission });
    return successResponse(res, { hasPermission }, 'Permission check completed');
  } catch (error) {
    logger.error('Error checking user permission:', error);
    return errorResponse(res, error.message);
  }
};

// Assign permissions to role
const assignPermissionsToRole = async (req, res) => {
  try {
    logger.info('Assigning permissions to role');
    
    const { role, permissionIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!role) {
      errors.push('Role is required');
    } else if (!VALID_ROLES.includes(role)) {
      errors.push('Invalid role. Must be one of: ' + VALID_ROLES.join(', '));
    }
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      errors.push('Permission IDs must be an array');
    } else if (permissionIds.length === 0) {
      errors.push('At least one permission ID is required');
    } else if (permissionIds.length > 100) {
      errors.push('Cannot assign more than 100 permissions at once');
    } else {
      for (const id of permissionIds) {
        const idError = validateObjectId(id, 'Permission ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await permissionService.assignPermissionsToRole(role, permissionIds);
    
    logger.info('Permissions assigned to role successfully:', { role, count: permissionIds.length });
    return successResponse(res, result, 'Permissions assigned successfully');
  } catch (error) {
    logger.error('Error assigning permissions to role:', error);
    return errorResponse(res, error.message);
  }
};

// Remove permissions from role
const removePermissionsFromRole = async (req, res) => {
  try {
    logger.info('Removing permissions from role');
    
    const { role, permissionIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!role) {
      errors.push('Role is required');
    } else if (!VALID_ROLES.includes(role)) {
      errors.push('Invalid role. Must be one of: ' + VALID_ROLES.join(', '));
    }
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      errors.push('Permission IDs must be an array');
    } else if (permissionIds.length === 0) {
      errors.push('At least one permission ID is required');
    } else if (permissionIds.length > 100) {
      errors.push('Cannot remove more than 100 permissions at once');
    } else {
      for (const id of permissionIds) {
        const idError = validateObjectId(id, 'Permission ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await permissionService.removePermissionsFromRole(role, permissionIds);
    
    logger.info('Permissions removed from role successfully:', { role, count: permissionIds.length });
    return successResponse(res, result, 'Permissions removed successfully');
  } catch (error) {
    logger.error('Error removing permissions from role:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete permissions
const bulkDeletePermissions = async (req, res) => {
  try {
    logger.info('Bulk deleting permissions');
    
    const { permissionIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!permissionIds || !Array.isArray(permissionIds)) {
      errors.push('Permission IDs must be an array');
    } else if (permissionIds.length === 0) {
      errors.push('Permission IDs array cannot be empty');
    } else if (permissionIds.length > 100) {
      errors.push('Cannot delete more than 100 permissions at once');
    } else {
      for (const id of permissionIds) {
        const idError = validateObjectId(id, 'Permission ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await permissionService.bulkDeletePermissions(permissionIds);
    
    logger.info('Permissions bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Permissions deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting permissions:', error);
    return errorResponse(res, error.message);
  }
};

// Export permissions data
const exportPermissions = async (req, res) => {
  try {
    logger.info('Exporting permissions data');
    
    const { format, type, resourceType, role } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (type && !VALID_PERMISSION_TYPES.includes(type)) {
      errors.push('Invalid permission type. Must be one of: ' + VALID_PERMISSION_TYPES.join(', '));
    }
    
    if (resourceType && !VALID_RESOURCE_TYPES.includes(resourceType)) {
      errors.push('Invalid resource type. Must be one of: ' + VALID_RESOURCE_TYPES.join(', '));
    }
    
    if (role && !VALID_ROLES.includes(role)) {
      errors.push('Invalid role. Must be one of: ' + VALID_ROLES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await permissionService.exportPermissions({
      format: format.toLowerCase(),
      type,
      resourceType,
      role
    });
    
    logger.info('Permissions data exported successfully:', { format });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting permissions data:', error);
    return errorResponse(res, error.message);
  }
};

// Get permission statistics
const getPermissionStatistics = async (req, res) => {
  try {
    logger.info('Fetching permission statistics');
    
    const statistics = await permissionService.getPermissionStatistics();
    
    logger.info('Permission statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permission statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllPermissions,
  getPermissionById,
  getPermissionByKey,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsByRole,
  getPermissionsByPlan,
  checkUserPermission,
  assignPermissionsToRole,
  removePermissionsFromRole,
  bulkDeletePermissions,
  exportPermissions,
  getPermissionStatistics
};
