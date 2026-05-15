import * as roleService from '../services/roleService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_CATEGORIES = ['admin', 'teacher', 'student', 'parent', 'staff', 'management', 'custom'];
const VALID_PLANS = ['free', 'basic', 'premium', 'enterprise'];
const VALID_STATUSES = ['active', 'inactive', 'archived'];
const VALID_ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'reject'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

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

// Get all roles
const getAllRoles = async (req, res) => {
  try {
    logger.info('Fetching all roles');
    
    const { category, plan, status, search, page, limit, sortBy, sortOrder } = req.query;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (plan && !VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const filters = { category, plan, status, search };
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'name',
      sortOrder: sortOrder || 'asc'
    };
    
    const result = await roleService.getAllRoles(filters, options);
    
    logger.info('Roles fetched successfully');
    return successResponse(res, {
      roles: result.roles || result,
      pagination: result.pagination
    }, 'Roles retrieved successfully');
  } catch (error) {
    logger.error('Error fetching roles:', error);
    return errorResponse(res, error.message);
  }
};

// Get role by ID
const getRoleById = async (req, res) => {
  try {
    logger.info('Fetching role by ID');
    
    const { roleId } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const role = await roleService.getRoleById(roleId);
    
    if (!role) {
      return notFoundResponse(res, 'Role not found');
    }
    
    logger.info('Role fetched successfully:', { roleId });
    return successResponse(res, role, 'Role retrieved successfully');
  } catch (error) {
    logger.error('Error fetching role:', error);
    return errorResponse(res, error.message);
  }
};

// Get roles by category
const getRolesByCategory = async (req, res) => {
  try {
    logger.info('Fetching roles by category');
    
    const { category } = req.params;
    
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
    
    const roles = await roleService.getRolesByCategory(category);
    
    logger.info('Roles fetched by category successfully:', { category, count: roles.length });
    return successResponse(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    logger.error('Error fetching roles by category:', error);
    return errorResponse(res, error.message);
  }
};

// Get roles by plan
const getRolesByPlan = async (req, res) => {
  try {
    logger.info('Fetching roles by plan');
    
    const { plan } = req.params;
    
    // Validation
    const errors = [];
    
    if (!plan) {
      errors.push('Plan is required');
    } else if (!VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const roles = await roleService.getRolesByPlan(plan);
    
    logger.info('Roles fetched by plan successfully:', { plan, count: roles.length });
    return successResponse(res, roles, 'Roles retrieved successfully');
  } catch (error) {
    logger.error('Error fetching roles by plan:', error);
    return errorResponse(res, error.message);
  }
};

// Check if role can access module
const canRoleAccessModule = async (req, res) => {
  try {
    logger.info('Checking role module access');
    
    const { roleId, moduleKey } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (!moduleKey || moduleKey.trim().length === 0) {
      errors.push('Module key is required');
    } else if (moduleKey.length > 100) {
      errors.push('Module key must not exceed 100 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const canAccess = await roleService.canRoleAccessModule(roleId, moduleKey);
    
    logger.info('Role module access checked:', { roleId, moduleKey, canAccess });
    return successResponse(res, { canAccess }, 'Access check completed');
  } catch (error) {
    logger.error('Error checking role module access:', error);
    return errorResponse(res, error.message);
  }
};

// Check if module is read-only for role
const isModuleReadOnlyForRole = async (req, res) => {
  try {
    logger.info('Checking if module is read-only for role');
    
    const { roleId, moduleKey } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (!moduleKey || moduleKey.trim().length === 0) {
      errors.push('Module key is required');
    } else if (moduleKey.length > 100) {
      errors.push('Module key must not exceed 100 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const isReadOnly = await roleService.isModuleReadOnlyForRole(roleId, moduleKey);
    
    logger.info('Module read-only status checked:', { roleId, moduleKey, isReadOnly });
    return successResponse(res, { isReadOnly }, 'Read-only check completed');
  } catch (error) {
    logger.error('Error checking module read-only status:', error);
    return errorResponse(res, error.message);
  }
};

// Get role permissions
const getRolePermissions = async (req, res) => {
  try {
    logger.info('Fetching role permissions');
    
    const { roleId } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permissions = await roleService.getRolePermissions(roleId);
    
    logger.info('Role permissions fetched successfully:', { roleId });
    return successResponse(res, permissions, 'Permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching role permissions:', error);
    return errorResponse(res, error.message);
  }
};

// Check if role can perform action
const canRolePerformAction = async (req, res) => {
  try {
    logger.info('Checking if role can perform action');
    
    const { roleId, action } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (!action || action.trim().length === 0) {
      errors.push('Action is required');
    } else if (!VALID_ACTIONS.includes(action)) {
      errors.push('Invalid action. Must be one of: ' + VALID_ACTIONS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const canPerform = await roleService.canRolePerformAction(roleId, action);
    
    logger.info('Role action check completed:', { roleId, action, canPerform });
    return successResponse(res, { canPerform }, 'Action check completed');
  } catch (error) {
    logger.error('Error checking role action:', error);
    return errorResponse(res, error.message);
  }
};

// Get users by role
const getUsersByRole = async (req, res) => {
  try {
    logger.info('Fetching users by role');
    
    const { roleId } = req.params;
    const { schoolId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await roleService.getUsersByRole(roleId, schoolId, { page: pageNum, limit: limitNum });
    
    logger.info('Users fetched by role successfully:', { roleId, count: result.users?.length || result.length });
    return successResponse(res, {
      users: result.users || result,
      pagination: result.pagination
    }, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching users by role:', error);
    return errorResponse(res, error.message);
  }
};

// Get role statistics
const getRoleStats = async (req, res) => {
  try {
    logger.info('Fetching role statistics');
    
    const { schoolId } = req.query;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await roleService.getRoleStats(schoolId);
    
    logger.info('Role statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching role statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Assign role to user
const assignRole = async (req, res) => {
  try {
    logger.info('Assigning role to user');
    
    const { userId } = req.params;
    const { roleId } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const user = await roleService.assignRole(userId, roleId);
    
    logger.info('Role assigned successfully:', { userId, roleId });
    return successResponse(res, user, 'Role assigned successfully');
  } catch (error) {
    logger.error('Error assigning role:', error);
    return errorResponse(res, error.message);
  }
};

// Update user permissions
const updateUserPermissions = async (req, res) => {
  try {
    logger.info('Updating user permissions');
    
    const { userId } = req.params;
    const customPermissions = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!customPermissions || typeof customPermissions !== 'object') {
      errors.push('Custom permissions must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const user = await roleService.updateUserPermissions(userId, customPermissions);
    
    logger.info('User permissions updated successfully:', { userId });
    return successResponse(res, user, 'Permissions updated successfully');
  } catch (error) {
    logger.error('Error updating user permissions:', error);
    return errorResponse(res, error.message);
  }
};

// Get user effective permissions
const getUserEffectivePermissions = async (req, res) => {
  try {
    logger.info('Fetching user effective permissions');
    
    const { userId } = req.params;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permissions = await roleService.getUserEffectivePermissions(userId);
    
    logger.info('User effective permissions fetched successfully:', { userId });
    return successResponse(res, permissions, 'Effective permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user effective permissions:', error);
    return errorResponse(res, error.message);
  }
};

// Validate role access
const validateRoleAccess = async (req, res) => {
  try {
    logger.info('Validating role access');
    
    const { userId } = req.params;
    const { moduleKey, action } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!moduleKey || moduleKey.trim().length === 0) {
      errors.push('Module key is required');
    } else if (moduleKey.length > 100) {
      errors.push('Module key must not exceed 100 characters');
    }
    
    if (!action || action.trim().length === 0) {
      errors.push('Action is required');
    } else if (!VALID_ACTIONS.includes(action)) {
      errors.push('Invalid action. Must be one of: ' + VALID_ACTIONS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await roleService.validateRoleAccess(userId, moduleKey, action);
    
    logger.info('Role access validated:', { userId, moduleKey, action });
    return successResponse(res, result, 'Access validation completed');
  } catch (error) {
    logger.error('Error validating role access:', error);
    return errorResponse(res, error.message);
  }
};


// Create role
const createRole = async (req, res) => {
  try {
    logger.info('Creating role');
    
    const { name, description, category, plan, permissions, modules, status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!name || name.trim().length === 0) {
      errors.push('Role name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (!category) {
      errors.push('Category is required');
    } else if (!VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (plan && !VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (permissions && !Array.isArray(permissions)) {
      errors.push('Permissions must be an array');
    }
    
    if (modules && !Array.isArray(modules)) {
      errors.push('Modules must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const roleData = {
      ...req.body,
      metadata: { createdBy: userId || 'system' }
    };
    
    const role = await roleService.createRole(roleData);
    
    logger.info('Role created successfully:', { roleId: role._id, name });
    return createdResponse(res, role, 'Role created successfully');
  } catch (error) {
    logger.error('Error creating role:', error);
    return errorResponse(res, error.message);
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    logger.info('Updating role');
    
    const { roleId } = req.params;
    const { name, description, category, plan, permissions, modules, status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Role name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (plan !== undefined && !VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (permissions !== undefined && !Array.isArray(permissions)) {
      errors.push('Permissions must be an array');
    }
    
    if (modules !== undefined && !Array.isArray(modules)) {
      errors.push('Modules must be an array');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...req.body, 'metadata.updatedBy': userId || 'system' };
    const role = await roleService.updateRole(roleId, updateData);
    
    if (!role) {
      return notFoundResponse(res, 'Role not found');
    }
    
    logger.info('Role updated successfully:', { roleId });
    return successResponse(res, role, 'Role updated successfully');
  } catch (error) {
    logger.error('Error updating role:', error);
    return errorResponse(res, error.message);
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    logger.info('Deleting role');
    
    const { roleId } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await roleService.deleteRole(roleId);
    
    logger.info('Role deleted successfully:', { roleId });
    return successResponse(res, null, 'Role deleted successfully');
  } catch (error) {
    logger.error('Error deleting role:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update roles
const bulkUpdateRoles = async (req, res) => {
  try {
    logger.info('Bulk updating roles');
    
    const { roleIds, updates } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!roleIds || !Array.isArray(roleIds)) {
      errors.push('Role IDs must be an array');
    } else if (roleIds.length === 0) {
      errors.push('Role IDs array cannot be empty');
    } else if (roleIds.length > 100) {
      errors.push('Cannot update more than 100 roles at once');
    } else {
      for (const id of roleIds) {
        const idError = validateObjectId(id, 'Role ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updates || typeof updates !== 'object') {
      errors.push('Updates must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const updateData = { ...updates, 'metadata.updatedBy': userId || 'system' };
    const result = await roleService.bulkUpdateRoles(roleIds, updateData);
    
    logger.info('Roles bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Roles updated successfully');
  } catch (error) {
    logger.error('Error bulk updating roles:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete roles
const bulkDeleteRoles = async (req, res) => {
  try {
    logger.info('Bulk deleting roles');
    
    const { roleIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!roleIds || !Array.isArray(roleIds)) {
      errors.push('Role IDs must be an array');
    } else if (roleIds.length === 0) {
      errors.push('Role IDs array cannot be empty');
    } else if (roleIds.length > 100) {
      errors.push('Cannot delete more than 100 roles at once');
    } else {
      for (const id of roleIds) {
        const idError = validateObjectId(id, 'Role ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await roleService.bulkDeleteRoles(roleIds);
    
    logger.info('Roles bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Roles deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting roles:', error);
    return errorResponse(res, error.message);
  }
};

// Export roles
const exportRoles = async (req, res) => {
  try {
    logger.info('Exporting roles');
    
    const { format, category, plan, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (plan && !VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await roleService.exportRoles({
      format: format.toLowerCase(),
      category,
      plan,
      status
    });
    
    logger.info('Roles exported successfully:', { format });
    return successResponse(res, exportData, 'Roles exported successfully');
  } catch (error) {
    logger.error('Error exporting roles:', error);
    return errorResponse(res, error.message);
  }
};

// Clone role
const cloneRole = async (req, res) => {
  try {
    logger.info('Cloning role');
    
    const { roleId } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const role = await roleService.cloneRole(roleId, name, userId || 'system');
    
    logger.info('Role cloned successfully:', { originalId: roleId, newId: role._id });
    return createdResponse(res, role, 'Role cloned successfully');
  } catch (error) {
    logger.error('Error cloning role:', error);
    return errorResponse(res, error.message);
  }
};

// Get role analytics
const getRoleAnalytics = async (req, res) => {
  try {
    logger.info('Fetching role analytics');
    
    const { startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    if (startDate && isNaN(Date.parse(startDate))) {
      errors.push('Invalid start date format');
    }
    
    if (endDate && isNaN(Date.parse(endDate))) {
      errors.push('Invalid end date format');
    }
    
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push('Start date must be before end date');
    }
    
    if (groupBy && !['day', 'week', 'month', 'year', 'category', 'plan'].includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: day, week, month, year, category, plan');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await roleService.getRoleAnalytics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      groupBy: groupBy || 'category'
    });
    
    logger.info('Role analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching role analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Search roles
const searchRoles = async (req, res) => {
  try {
    logger.info('Searching roles');
    
    const { q, category, plan } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (plan && !VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const roles = await roleService.searchRoles(q, { category, plan });
    
    logger.info('Roles searched successfully:', { query: q, count: roles.length });
    return successResponse(res, roles, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching roles:', error);
    return errorResponse(res, error.message);
  }
};

// Update role status
const updateRoleStatus = async (req, res) => {
  try {
    logger.info('Updating role status');
    
    const { roleId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(roleId, 'Role ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const role = await roleService.updateRoleStatus(roleId, status, userId || 'system');
    
    if (!role) {
      return notFoundResponse(res, 'Role not found');
    }
    
    logger.info('Role status updated successfully:', { roleId, status });
    return successResponse(res, role, 'Role status updated successfully');
  } catch (error) {
    logger.error('Error updating role status:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk assign roles
const bulkAssignRoles = async (req, res) => {
  try {
    logger.info('Bulk assigning roles');
    
    const { userIds, roleId } = req.body;
    
    // Validation
    const errors = [];
    
    if (!userIds || !Array.isArray(userIds)) {
      errors.push('User IDs must be an array');
    } else if (userIds.length === 0) {
      errors.push('User IDs array cannot be empty');
    } else if (userIds.length > 100) {
      errors.push('Cannot assign roles to more than 100 users at once');
    } else {
      for (const id of userIds) {
        const idError = validateObjectId(id, 'User ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    const roleIdError = validateObjectId(roleId, 'Role ID');
    if (roleIdError) errors.push(roleIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await roleService.bulkAssignRoles(userIds, roleId);
    
    logger.info('Roles bulk assigned successfully:', { count: result.modifiedCount, roleId });
    return successResponse(res, result, 'Roles assigned successfully');
  } catch (error) {
    logger.error('Error bulk assigning roles:', error);
    return errorResponse(res, error.message);
  }
};

// Get permission matrix
const getPermissionMatrix = async (req, res) => {
  try {
    logger.info('Fetching permission matrix');
    
    const { category, plan } = req.query;
    
    // Validation
    const errors = [];
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (plan && !VALID_PLANS.includes(plan)) {
      errors.push('Invalid plan. Must be one of: ' + VALID_PLANS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const matrix = await roleService.getPermissionMatrix({ category, plan });
    
    logger.info('Permission matrix fetched successfully');
    return successResponse(res, matrix, 'Permission matrix retrieved successfully');
  } catch (error) {
    logger.error('Error fetching permission matrix:', error);
    return errorResponse(res, error.message);
  }
};

// Compare roles
const compareRoles = async (req, res) => {
  try {
    logger.info('Comparing roles');
    
    const { roleIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!roleIds || !Array.isArray(roleIds)) {
      errors.push('Role IDs must be an array');
    } else if (roleIds.length < 2) {
      errors.push('At least 2 role IDs are required for comparison');
    } else if (roleIds.length > 10) {
      errors.push('Cannot compare more than 10 roles at once');
    } else {
      for (const id of roleIds) {
        const idError = validateObjectId(id, 'Role ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const comparison = await roleService.compareRoles(roleIds);
    
    logger.info('Roles compared successfully:', { count: roleIds.length });
    return successResponse(res, comparison, 'Role comparison completed');
  } catch (error) {
    logger.error('Error comparing roles:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getRolesByCategory,
  getRolesByPlan,
  canRoleAccessModule,
  isModuleReadOnlyForRole,
  getRolePermissions,
  canRolePerformAction,
  getUsersByRole,
  getRoleStats,
  assignRole,
  updateUserPermissions,
  getUserEffectivePermissions,
  validateRoleAccess,
  bulkUpdateRoles,
  bulkDeleteRoles,
  exportRoles,
  cloneRole,
  getRoleAnalytics,
  searchRoles,
  updateRoleStatus,
  bulkAssignRoles,
  getPermissionMatrix,
  compareRoles
};
