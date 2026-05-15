/**
 * Pagination Helper
 * Provides pagination utilities for list endpoints
 */

/**
 * Calculate pagination metadata
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total items count
 * @returns {Object} Pagination metadata
 */
export const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: parseInt(total),
      totalPages,
      hasNextPage,
      hasPrevPage
    }
  };
};

/**
 * Build pagination object for Mongoose queries
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Skip and limit values for MongoDB
 */
export const getPaginationParams = (page = 1, limit = 10) => {
  const validPage = Math.max(1, parseInt(page) || 1);
  const validLimit = Math.min(100, Math.max(1, parseInt(limit) || 10));

  return {
    skip: (validPage - 1) * validLimit,
    limit: validLimit,
    page: validPage
  };
};

/**
 * Build sort object for Mongoose queries
 * @param {string} sortBy - Field to sort by
 * @param {string} order - Sort order (asc/desc)
 * @returns {Object} Sort object for MongoDB
 */
export const getSortParams = (sortBy = 'createdAt', order = 'desc') => {
  const sortOrder = order.toLowerCase() === 'asc' ? 1 : -1;
  return {
    [sortBy]: sortOrder
  };
};

/**
 * Build filter object for Mongoose queries
 * @param {Object} filters - Filter parameters from query string
 * @param {Array} allowedFields - Fields that can be filtered
 * @returns {Object} Filter object for MongoDB
 */
export const getFilterParams = (filters = {}, allowedFields = []) => {
  const filterObj = {};

  for (const [key, value] of Object.entries(filters)) {
    // Skip pagination and sorting params
    if (['page', 'limit', 'sort', 'order', 'search'].includes(key)) {
      continue;
    }

    // Only allow filtering on specified fields
    if (allowedFields.length === 0 || allowedFields.includes(key)) {
      if (value !== undefined && value !== null && value !== '') {
        // Handle different filter types
        if (key.includes('_id')) {
          // MongoDB ObjectId fields
          filterObj[key] = value;
        } else if (typeof value === 'string' && value.includes(',')) {
          // Array values (comma-separated)
          filterObj[key] = { $in: value.split(',') };
        } else if (value.startsWith('>=')) {
          // Greater than or equal
          filterObj[key] = { $gte: parseFloat(value.slice(2)) };
        } else if (value.startsWith('<=')) {
          // Less than or equal
          filterObj[key] = { $lte: parseFloat(value.slice(2)) };
        } else if (value.startsWith('>')) {
          // Greater than
          filterObj[key] = { $gt: parseFloat(value.slice(1)) };
        } else if (value.startsWith('<')) {
          // Less than
          filterObj[key] = { $lt: parseFloat(value.slice(1)) };
        } else if (value.startsWith('~')) {
          // Regex search
          filterObj[key] = { $regex: value.slice(1), $options: 'i' };
        } else {
          // Exact match
          filterObj[key] = value;
        }
      }
    }
  }

  return filterObj;
};

/**
 * Build search query for Mongoose
 * @param {string} search - Search term
 * @param {Array} searchFields - Fields to search in
 * @returns {Object} Search query object
 */
export const getSearchQuery = (search, searchFields = []) => {
  if (!search || searchFields.length === 0) {
    return null;
  }

  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: search, $options: 'i' }
    }))
  };
};

/**
 * Build complete query options
 * @param {Object} query - Express query object
 * @param {Array} allowedFilters - Fields that can be filtered
 * @param {Array} searchFields - Fields to search in
 * @returns {Object} Complete query options
 */
export const buildQueryOptions = (query, allowedFilters = [], searchFields = []) => {
  const { page = 1, limit = 10, sort = 'createdAt', order = 'desc', search } = query;

  const pagination = getPaginationParams(page, limit);
  const sortParams = getSortParams(sort, order);
  
  // Build filter params
  const filters = getFilterParams(query, allowedFilters);
  
  // Build search query
  const searchQuery = getSearchQuery(search, searchFields);
  
  // Combine filters and search
  let finalQuery = { ...filters };
  if (searchQuery) {
    finalQuery = {
      ...finalQuery,
      ...searchQuery
    };
  }

  return {
    pagination,
    sort: sortParams,
    query: finalQuery
  };
};

/**
 * Paginated result helper
 * @param {Array} items - Array of items
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
export const paginatedResult = (items, total, page, limit) => {
  const meta = getPaginationMeta(page, limit, total);
  
  return {
    items,
    ...meta
  };
};

export default {
  getPaginationMeta,
  getPaginationParams,
  getSortParams,
  getFilterParams,
  getSearchQuery,
  buildQueryOptions,
  paginatedResult
};
