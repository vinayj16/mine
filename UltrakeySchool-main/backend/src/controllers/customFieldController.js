import customFieldService from '../services/customFieldService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid entity types
const VALID_ENTITY_TYPES = ['student', 'teacher', 'staff', 'parent', 'class', 'course', 'exam', 'fee', 'admission'];

// Valid field types
const VALID_FIELD_TYPES = ['text', 'number', 'email', 'phone', 'date', 'datetime', 'boolean', 'select', 'multiselect', 'textarea', 'url', 'file'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: 'Invalid ' + fieldName + ' format' } };
  }
  return { valid: true };
};

const createField = async (req, res, next) => {
  try {
    const { schoolId } = req.params;
    const { name, label, fieldType, entityType, required, options } = req.body;

    // Validate required fields
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    if (!name || name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Field name is required and must be at least 2 characters' });
    } else if (name.length > 100) {
      errors.push({ field: 'name', message: 'Field name cannot exceed 100 characters' });
    }
    if (!label || label.trim().length < 2) {
      errors.push({ field: 'label', message: 'Field label is required and must be at least 2 characters' });
    } else if (label.length > 100) {
      errors.push({ field: 'label', message: 'Field label cannot exceed 100 characters' });
    }
    if (!fieldType) {
      errors.push({ field: 'fieldType', message: 'Field type is required' });
    } else if (!VALID_FIELD_TYPES.includes(fieldType)) {
      errors.push({ field: 'fieldType', message: 'Field type must be one of: ' + VALID_FIELD_TYPES.join(', ') });
    }
    if (!entityType) {
      errors.push({ field: 'entityType', message: 'Entity type is required' });
    } else if (!VALID_ENTITY_TYPES.includes(entityType)) {
      errors.push({ field: 'entityType', message: 'Entity type must be one of: ' + VALID_ENTITY_TYPES.join(', ') });
    }
    if (['select', 'multiselect'].includes(fieldType) && (!options || !Array.isArray(options) || options.length === 0)) {
      errors.push({ field: 'options', message: 'Options are required for select and multiselect field types' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Creating custom field: ' + name + ' for entity: ' + entityType);
    const field = await customFieldService.createField(schoolId, req.body);
    
    return createdResponse(res, field, 'Custom field created successfully');
  } catch (error) {
    logger.error('Error creating custom field:', error);
    return errorResponse(res, error.message, 400);
  }
};

const getFields = async (req, res, next) => {
  try {
    const { schoolId, entityType } = req.params;

    // Validate IDs and entityType
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      errors.push({ field: 'entityType', message: 'Entity type must be one of: ' + VALID_ENTITY_TYPES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching custom fields for entity: ' + entityType);
    const fields = await customFieldService.getFields(schoolId, entityType);
    
    return successResponse(res, fields, 'Custom fields fetched successfully', {
      entityType
    });
  } catch (error) {
    logger.error('Error fetching custom fields:', error);
    return errorResponse(res, 'Failed to fetch custom fields', 500);
  }
};

const getFieldById = async (req, res, next) => {
  try {
    const { schoolId, fieldId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const fieldValidation = validateObjectId(fieldId, 'fieldId');
    if (!fieldValidation.valid) {
      errors.push(fieldValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching custom field by ID: ' + fieldId);
    const field = await customFieldService.getFieldById(fieldId, schoolId);
    
    if (!field) {
      return notFoundResponse(res, 'Custom field not found');
    }

    return successResponse(res, field, 'Custom field fetched successfully');
  } catch (error) {
    logger.error('Error fetching custom field by ID:', error);
    return errorResponse(res, 'Failed to fetch custom field', 500);
  }
};

const updateField = async (req, res, next) => {
  try {
    const { schoolId, fieldId } = req.params;
    const { label, fieldType, required, options } = req.body;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const fieldValidation = validateObjectId(fieldId, 'fieldId');
    if (!fieldValidation.valid) {
      errors.push(fieldValidation.error);
    }

    // Validate fields if provided
    if (label && label.trim().length < 2) {
      errors.push({ field: 'label', message: 'Field label must be at least 2 characters' });
    } else if (label && label.length > 100) {
      errors.push({ field: 'label', message: 'Field label cannot exceed 100 characters' });
    }
    if (fieldType && !VALID_FIELD_TYPES.includes(fieldType)) {
      errors.push({ field: 'fieldType', message: 'Field type must be one of: ' + VALID_FIELD_TYPES.join(', ') });
    }
    if (fieldType && ['select', 'multiselect'].includes(fieldType) && (!options || !Array.isArray(options) || options.length === 0)) {
      errors.push({ field: 'options', message: 'Options are required for select and multiselect field types' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Updating custom field: ' + fieldId);
    const field = await customFieldService.updateField(fieldId, schoolId, req.body);
    
    if (!field) {
      return notFoundResponse(res, 'Custom field not found');
    }

    return successResponse(res, field, 'Custom field updated successfully');
  } catch (error) {
    logger.error('Error updating custom field:', error);
    return errorResponse(res, error.message, 400);
  }
};

const deleteField = async (req, res, next) => {
  try {
    const { schoolId, fieldId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const fieldValidation = validateObjectId(fieldId, 'fieldId');
    if (!fieldValidation.valid) {
      errors.push(fieldValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Deleting custom field: ' + fieldId);
    const result = await customFieldService.deleteField(fieldId, schoolId);
    
    if (!result) {
      return notFoundResponse(res, 'Custom field not found');
    }

    return successResponse(res, null, 'Custom field deleted successfully');
  } catch (error) {
    logger.error('Error deleting custom field:', error);
    return errorResponse(res, error.message, 400);
  }
};

const reorderFields = async (req, res, next) => {
  try {
    const { schoolId, entityType } = req.params;
    const { orderedIds } = req.body;

    // Validate IDs and entityType
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    if (!VALID_ENTITY_TYPES.includes(entityType)) {
      errors.push({ field: 'entityType', message: 'Entity type must be one of: ' + VALID_ENTITY_TYPES.join(', ') });
    }

    // Validate orderedIds
    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      errors.push({ field: 'orderedIds', message: 'orderedIds must be a non-empty array' });
    } else if (orderedIds.length > 100) {
      errors.push({ field: 'orderedIds', message: 'Maximum 100 fields allowed per request' });
    } else {
      orderedIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'orderedIds[' + index + ']', message: 'Invalid field ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Reordering ' + orderedIds.length + ' custom fields for entity: ' + entityType);
    const fields = await customFieldService.reorderFields(schoolId, entityType, orderedIds);
    
    return successResponse(res, fields, 'Custom fields reordered successfully');
  } catch (error) {
    logger.error('Error reordering custom fields:', error);
    return errorResponse(res, error.message, 400);
  }
};

/**
 * Get all custom fields for a school
 */
const getAllFields = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { entityType, fieldType, required, page = 1, limit = 20 } = req.query;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate entityType if provided
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
      errors.push({ field: 'entityType', message: 'Entity type must be one of: ' + VALID_ENTITY_TYPES.join(', ') });
    }

    // Validate fieldType if provided
    if (fieldType && !VALID_FIELD_TYPES.includes(fieldType)) {
      errors.push({ field: 'fieldType', message: 'Field type must be one of: ' + VALID_FIELD_TYPES.join(', ') });
    }

    // Validate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push({ field: 'page', message: 'Page must be a positive integer' });
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching all custom fields for school: ' + schoolId);
    const result = await customFieldService.getAllFields(schoolId, {
      entityType,
      fieldType,
      required: required === 'true',
      page: pageNum,
      limit: limitNum
    });

    return successResponse(res, result.fields, 'Custom fields fetched successfully', {
      pagination: result.pagination,
      filters: { entityType, fieldType, required }
    });
  } catch (error) {
    logger.error('Error fetching all custom fields:', error);
    return errorResponse(res, 'Failed to fetch custom fields', 500);
  }
};

/**
 * Bulk create custom fields
 */
const bulkCreateFields = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { fields } = req.body;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate fields array
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      errors.push({ field: 'fields', message: 'fields must be a non-empty array' });
    } else if (fields.length > 50) {
      errors.push({ field: 'fields', message: 'Maximum 50 fields allowed per request' });
    } else {
      fields.forEach((field, index) => {
        if (!field.name || field.name.trim().length < 2) {
          errors.push({ field: 'fields[' + index + '].name', message: 'Field name is required' });
        }
        if (!field.label || field.label.trim().length < 2) {
          errors.push({ field: 'fields[' + index + '].label', message: 'Field label is required' });
        }
        if (!field.fieldType || !VALID_FIELD_TYPES.includes(field.fieldType)) {
          errors.push({ field: 'fields[' + index + '].fieldType', message: 'Invalid field type' });
        }
        if (!field.entityType || !VALID_ENTITY_TYPES.includes(field.entityType)) {
          errors.push({ field: 'fields[' + index + '].entityType', message: 'Invalid entity type' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk creating ' + fields.length + ' custom fields');
    const result = await customFieldService.bulkCreateFields(schoolId, fields);

    return createdResponse(res, result, result.successful + ' custom fields created successfully');
  } catch (error) {
    logger.error('Error bulk creating custom fields:', error);
    return errorResponse(res, 'Failed to bulk create custom fields', 500);
  }
};

/**
 * Bulk delete custom fields
 */
const bulkDeleteFields = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { fieldIds } = req.body;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate fieldIds
    if (!fieldIds || !Array.isArray(fieldIds) || fieldIds.length === 0) {
      errors.push({ field: 'fieldIds', message: 'fieldIds must be a non-empty array' });
    } else if (fieldIds.length > 100) {
      errors.push({ field: 'fieldIds', message: 'Maximum 100 fields allowed per request' });
    } else {
      fieldIds.forEach((id, index) => {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ field: 'fieldIds[' + index + ']', message: 'Invalid field ID' });
        }
      });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Bulk deleting ' + fieldIds.length + ' custom fields');
    const result = await customFieldService.bulkDeleteFields(schoolId, fieldIds);

    return successResponse(res, result, result.deletedCount + ' custom fields deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting custom fields:', error);
    return errorResponse(res, 'Failed to bulk delete custom fields', 500);
  }
};

/**
 * Clone custom fields from one entity type to another
 */
const cloneFields = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { sourceEntityType, targetEntityType } = req.body;

    // Validate schoolId
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate entity types
    if (!sourceEntityType) {
      errors.push({ field: 'sourceEntityType', message: 'Source entity type is required' });
    } else if (!VALID_ENTITY_TYPES.includes(sourceEntityType)) {
      errors.push({ field: 'sourceEntityType', message: 'Invalid source entity type' });
    }
    if (!targetEntityType) {
      errors.push({ field: 'targetEntityType', message: 'Target entity type is required' });
    } else if (!VALID_ENTITY_TYPES.includes(targetEntityType)) {
      errors.push({ field: 'targetEntityType', message: 'Invalid target entity type' });
    }
    if (sourceEntityType === targetEntityType) {
      errors.push({ field: 'entityTypes', message: 'Source and target entity types must be different' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Cloning custom fields from ' + sourceEntityType + ' to ' + targetEntityType);
    const result = await customFieldService.cloneFields(schoolId, sourceEntityType, targetEntityType);

    return createdResponse(res, result, result.clonedCount + ' custom fields cloned successfully');
  } catch (error) {
    logger.error('Error cloning custom fields:', error);
    return errorResponse(res, 'Failed to clone custom fields', 500);
  }
};

/**
 * Get custom field statistics
 */
const getFieldStatistics = async (req, res) => {
  try {
    const { schoolId } = req.params;

    // Validate schoolId
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      return validationErrorResponse(res, [schoolValidation.error]);
    }

    logger.info('Fetching custom field statistics for school: ' + schoolId);
    const statistics = await customFieldService.getFieldStatistics(schoolId);

    return successResponse(res, statistics, 'Custom field statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching custom field statistics:', error);
    return errorResponse(res, 'Failed to fetch statistics', 500);
  }
};

/**
 * Validate custom field value
 */
const validateFieldValue = async (req, res) => {
  try {
    const { schoolId, fieldId } = req.params;
    const { value } = req.body;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const fieldValidation = validateObjectId(fieldId, 'fieldId');
    if (!fieldValidation.valid) {
      errors.push(fieldValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Validating custom field value for field: ' + fieldId);
    const result = await customFieldService.validateFieldValue(fieldId, schoolId, value);

    if (result.valid) {
      return successResponse(res, result, 'Field value is valid');
    } else {
      return validationErrorResponse(res, result.errors);
    }
  } catch (error) {
    logger.error('Error validating custom field value:', error);
    return errorResponse(res, 'Failed to validate field value', 500);
  }
};

/**
 * Export custom fields
 */
const exportFields = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { format = 'json', entityType } = req.query;

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx'];
    const errors = [];
    if (!validFormats.includes(format)) {
      errors.push({ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') });
    }

    // Validate schoolId
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }

    // Validate entityType if provided
    if (entityType && !VALID_ENTITY_TYPES.includes(entityType)) {
      errors.push({ field: 'entityType', message: 'Entity type must be one of: ' + VALID_ENTITY_TYPES.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Exporting custom fields in format: ' + format);
    const data = await customFieldService.exportFields(schoolId, { entityType, format });

    if (format === 'json') {
      return successResponse(res, data, 'Custom fields exported successfully', {
        format,
        recordCount: data.length
      });
    }

    return errorResponse(res, 'Export format ' + format + ' not yet implemented', 501);
  } catch (error) {
    logger.error('Error exporting custom fields:', error);
    return errorResponse(res, 'Failed to export custom fields', 500);
  }
};

/**
 * Toggle field required status
 */
const toggleRequired = async (req, res) => {
  try {
    const { schoolId, fieldId } = req.params;

    // Validate IDs
    const errors = [];
    const schoolValidation = validateObjectId(schoolId, 'schoolId');
    if (!schoolValidation.valid) {
      errors.push(schoolValidation.error);
    }
    const fieldValidation = validateObjectId(fieldId, 'fieldId');
    if (!fieldValidation.valid) {
      errors.push(fieldValidation.error);
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Toggling required status for field: ' + fieldId);
    const field = await customFieldService.toggleRequired(fieldId, schoolId);

    if (!field) {
      return notFoundResponse(res, 'Custom field not found');
    }

    return successResponse(res, field, 'Field required status toggled successfully');
  } catch (error) {
    logger.error('Error toggling required status:', error);
    return errorResponse(res, 'Failed to toggle required status', 500);
  }
};


export default {
  createField,
  getFields,
  getFieldById,
  updateField,
  deleteField,
  reorderFields,
  getAllFields,
  bulkCreateFields,
  bulkDeleteFields,
  cloneFields,
  getFieldStatistics,
  validateFieldValue,
  exportFields,
  toggleRequired
};
