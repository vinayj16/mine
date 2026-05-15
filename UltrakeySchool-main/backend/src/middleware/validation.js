/**
 * Input Validation Middleware
 * Validates request body/query/params based on provided schema
 */

import Joi from 'joi';

/**
 * Middleware to validate input based on schema
 * @param {Object} schema - Validation schema
 * @param {string} source - 'body', 'query', or 'params' (default: 'body')
 * @returns {Function} Express middleware function
 */
export const validateInput = (schema, source = 'body') => {
  return (req, res, next) => {
    console.log('=== VALIDATION DEBUG: START ===');
    console.log('Source:', source);
    try {
      // Convert custom schema format to Joi schema
      const joiSchema = convertToJoiSchema(schema);

      // Validate based on source
      let dataToValidate;
      switch (source) {
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        case 'body':
        default:
          dataToValidate = req.body;
          break;
      }

      const { error, value } = joiSchema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true,
        convert: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context.value
        }));

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors,
          error: 'VALIDATION_ERROR'
        });
      }

      // Replace request data with validated/cleaned data
      switch (source) {
        case 'query':
          req.query = value;
          break;
        case 'params':
          req.params = value;
          break;
        case 'body':
        default:
          req.body = value;
          break;
      }

      next();
    } catch (err) {
      console.log('=== VALIDATION DEBUG: ERROR ===');
      console.log('Error:', err.message);
      console.log('Stack:', err.stack);
      console.error('Validation middleware error:', err);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during validation',
        error: 'VALIDATION_INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Convert custom schema format to Joi schema
 * @param {Object} schema - Custom validation schema
 * @returns {Object} Joi schema
 */
function convertToJoiSchema(schema) {
  const joiSchema = {};

  for (const [field, rules] of Object.entries(schema)) {
    let fieldSchema;

    // Handle array fields
    if (rules.type === 'array') {
      if (rules.items) {
        fieldSchema = Joi.array().items(convertFieldSchema(rules.items));
      } else {
        fieldSchema = Joi.array();
      }
    } else {
      fieldSchema = convertFieldSchema(rules);
    }

    // Apply required rule
    if (rules.required) {
      fieldSchema = fieldSchema.required();
    } else {
      fieldSchema = fieldSchema.optional();
    }

    joiSchema[field] = fieldSchema;
  }

  return Joi.object(joiSchema);
}

/**
 * Convert field rules to Joi schema
 * @param {Object} rules - Field validation rules
 * @returns {Object} Joi field schema
 */
function convertFieldSchema(rules) {
  let schema;

  switch (rules.type) {
    case 'string':
      schema = Joi.string();
      if (rules.min) schema = schema.min(rules.min);
      if (rules.max) schema = schema.max(rules.max);
      if (rules.pattern) schema = schema.pattern(new RegExp(rules.pattern));
      if (rules.enum) schema = schema.valid(...rules.enum);
      break;

    case 'number':
      schema = Joi.number();
      if (rules.min !== undefined) schema = schema.min(rules.min);
      if (rules.max !== undefined) schema = schema.max(rules.max);
      if (rules.integer) schema = schema.integer();
      break;

    case 'boolean':
      schema = Joi.boolean();
      break;

    case 'date':
      schema = Joi.date();
      if (rules.format) schema = schema.format(rules.format);
      break;

    case 'object':
      if (rules.properties) {
        const objSchema = {};
        for (const [prop, propRules] of Object.entries(rules.properties)) {
          objSchema[prop] = convertFieldSchema(propRules);
        }
        schema = Joi.object(objSchema);
      } else {
        schema = Joi.object();
      }
      break;

    case 'array':
      if (rules.items) {
        schema = Joi.array().items(convertFieldSchema(rules.items));
      } else {
        schema = Joi.array();
      }
      break;

    default:
      schema = Joi.any();
  }

  return schema;
}

/**
 * Predefined validation schemas for common use cases
 */
export const validationSchemas = {
  // User ID validation
  userId: {
    id: { required: true, type: 'string', pattern: '^[0-9a-fA-F]{24}$' }
  },

  // Pagination validation
  pagination: {
    page: { required: false, type: 'number', min: 1 },
    limit: { required: false, type: 'number', min: 1, max: 100 }
  },

  // Email validation
  email: {
    email: { required: true, type: 'string', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' }
  },

  // Password validation
  password: {
    password: { required: true, type: 'string', min: 6, max: 100 }
  }
};

export default {
  validateInput,
  validationSchemas
};
