import todoService from '../services/todoService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'cancelled', 'new', 'inprogress', 'done', 'trash'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

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

// Helper function to validate date
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start >= end) {
    return 'Start date must be before end date';
  }
  return null;
};

const createTodo = async (req, res) => {
  try {
    logger.info('Creating todo');
    
    const { title, description, priority, dueDate, tags, userId, institutionId } = req.body;
    
    // Validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (dueDate) {
      const dueDateError = validateDate(dueDate, 'Due date');
      if (dueDateError) errors.push(dueDateError);
    }
    
    if (tags) {
      if (!Array.isArray(tags)) {
        errors.push('Tags must be an array');
      } else if (tags.length > MAX_TAGS) {
        errors.push('Cannot have more than ' + MAX_TAGS + ' tags');
      } else {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.length > MAX_TAG_LENGTH) {
            errors.push('Each tag must be a string with max ' + MAX_TAG_LENGTH + ' characters');
            break;
          }
        }
      }
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.createTodo(req.body);
    
    logger.info('Todo created successfully:', { todoId: todo._id, title });
    return createdResponse(res, todo, 'Todo created successfully');
  } catch (error) {
    logger.error('Error creating todo:', error);
    return errorResponse(res, error.message);
  }
};

const getTodoById = async (req, res) => {
  try {
    logger.info('Fetching todo by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.getTodoById(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo fetched successfully:', { todoId: id });
    return successResponse(res, todo, 'Todo retrieved successfully');
  } catch (error) {
    logger.error('Error fetching todo:', error);
    return errorResponse(res, error.message);
  }
};

const getAllTodos = async (req, res) => {
  try {
    logger.info('Fetching all todos');
    
    const { page, limit, status, priority, userId, institutionId, search, sortBy, sortOrder } = req.query;
    
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
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
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
    
    const result = await todoService.getAllTodos({
      ...req.query,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Todos fetched successfully');
    return successResponse(res, result, 'Todos retrieved successfully');
  } catch (error) {
    logger.error('Error fetching todos:', error);
    return errorResponse(res, error.message);
  }
};

const updateTodo = async (req, res) => {
  try {
    logger.info('Updating todo');
    
    const { id } = req.params;
    const { title, description, priority, dueDate, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (dueDate !== undefined) {
      const dueDateError = validateDate(dueDate, 'Due date');
      if (dueDateError) errors.push(dueDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.updateTodo(id, req.body);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo updated successfully:', { todoId: id });
    return successResponse(res, todo, 'Todo updated successfully');
  } catch (error) {
    logger.error('Error updating todo:', error);
    return errorResponse(res, error.message);
  }
};

const deleteTodo = async (req, res) => {
  try {
    logger.info('Deleting todo');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.deleteTodo(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo deleted successfully:', { todoId: id });
    return successResponse(res, null, 'Todo deleted successfully');
  } catch (error) {
    logger.error('Error deleting todo:', error);
    return errorResponse(res, error.message);
  }
};

const toggleComplete = async (req, res) => {
  try {
    logger.info('Toggling todo completion status');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.toggleComplete(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo completion status toggled successfully:', { todoId: id, isCompleted: todo.isCompleted });
    return successResponse(res, todo, 'Todo completion status updated successfully');
  } catch (error) {
    logger.error('Error toggling todo completion:', error);
    return errorResponse(res, error.message);
  }
};

const toggleImportant = async (req, res) => {
  try {
    logger.info('Toggling todo important status');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.toggleImportant(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo important status toggled successfully:', { todoId: id, isImportant: todo.isImportant });
    return successResponse(res, todo, 'Todo important status updated successfully');
  } catch (error) {
    logger.error('Error toggling todo important status:', error);
    return errorResponse(res, error.message);
  }
};

const moveToTrash = async (req, res) => {
  try {
    logger.info('Moving todo to trash');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.moveToTrash(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo moved to trash successfully:', { todoId: id });
    return successResponse(res, todo, 'Todo moved to trash successfully');
  } catch (error) {
    logger.error('Error moving todo to trash:', error);
    return errorResponse(res, error.message);
  }
};

const restoreTodo = async (req, res) => {
  try {
    logger.info('Restoring todo from trash');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.restoreTodo(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo restored from trash successfully:', { todoId: id });
    return successResponse(res, todo, 'Todo restored successfully');
  } catch (error) {
    logger.error('Error restoring todo:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDelete = async (req, res) => {
  try {
    logger.info('Bulk deleting todos');
    
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    if (!ids || !Array.isArray(ids)) {
      errors.push('Todo IDs must be an array');
    } else if (ids.length === 0) {
      errors.push('Todo IDs array cannot be empty');
    } else if (ids.length > 100) {
      errors.push('Cannot delete more than 100 todos at once');
    } else {
      for (const id of ids) {
        const idError = validateObjectId(id, 'Todo ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await todoService.bulkDelete(ids);
    
    logger.info('Todos bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, result, 'Todos deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting todos:', error);
    return errorResponse(res, error.message);
  }
};

const bulkMarkDone = async (req, res) => {
  try {
    logger.info('Bulk marking todos as done');
    
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    if (!ids || !Array.isArray(ids)) {
      errors.push('Todo IDs must be an array');
    } else if (ids.length === 0) {
      errors.push('Todo IDs array cannot be empty');
    } else if (ids.length > 100) {
      errors.push('Cannot update more than 100 todos at once');
    } else {
      for (const id of ids) {
        const idError = validateObjectId(id, 'Todo ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await todoService.bulkMarkDone(ids);
    
    logger.info('Todos bulk marked as done successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Todos marked as done successfully');
  } catch (error) {
    logger.error('Error bulk marking todos as done:', error);
    return errorResponse(res, error.message);
  }
};

const bulkMarkUndone = async (req, res) => {
  try {
    logger.info('Bulk marking todos as undone');
    
    const { ids } = req.body;
    
    // Validation
    const errors = [];
    
    if (!ids || !Array.isArray(ids)) {
      errors.push('Todo IDs must be an array');
    } else if (ids.length === 0) {
      errors.push('Todo IDs array cannot be empty');
    } else if (ids.length > 100) {
      errors.push('Cannot update more than 100 todos at once');
    } else {
      for (const id of ids) {
        const idError = validateObjectId(id, 'Todo ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await todoService.bulkMarkUndone(ids);
    
    logger.info('Todos bulk marked as undone successfully:', { count: result.modifiedCount });
    return successResponse(res, result, 'Todos marked as undone successfully');
  } catch (error) {
    logger.error('Error bulk marking todos as undone:', error);
    return errorResponse(res, error.message);
  }
};

const permanentDelete = async (req, res) => {
  try {
    logger.info('Permanently deleting todo');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const todo = await todoService.permanentDelete(id);
    
    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }
    
    logger.info('Todo permanently deleted successfully:', { todoId: id });
    return successResponse(res, null, 'Todo permanently deleted');
  } catch (error) {
    logger.error('Error permanently deleting todo:', error);
    return errorResponse(res, error.message);
  }
};

const getStatistics = async (req, res) => {
  try {
    logger.info('Fetching todo statistics');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await todoService.getStatistics(userId, institutionId);
    
    logger.info('Todo statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching todo statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getTodosByDate = async (req, res) => {
  try {
    logger.info('Fetching todos grouped by date');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const grouped = await todoService.getTodosByDate(userId, institutionId);
    
    logger.info('Todos grouped by date fetched successfully');
    return successResponse(res, grouped, 'Todos by date retrieved successfully');
  } catch (error) {
    logger.error('Error fetching todos by date:', error);
    return errorResponse(res, error.message);
  }
};


// Get todos by priority
const getTodosByPriority = async (req, res) => {
  try {
    logger.info('Fetching todos by priority');
    
    const { priority } = req.params;
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!priority) {
      errors.push('Priority is required');
    } else if (!VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todos = await todoService.getTodosByPriority(priority, userId, institutionId);

    logger.info('Todos fetched by priority successfully:', { priority, count: todos.length });
    return successResponse(res, todos, 'Todos retrieved successfully');
  } catch (error) {
    logger.error('Error fetching todos by priority:', error);
    return errorResponse(res, error.message);
  }
};

// Get todos by status
const getTodosByStatus = async (req, res) => {
  try {
    logger.info('Fetching todos by status');
    
    const { status } = req.params;
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todos = await todoService.getTodosByStatus(status, userId, institutionId);

    logger.info('Todos fetched by status successfully:', { status, count: todos.length });
    return successResponse(res, todos, 'Todos retrieved successfully');
  } catch (error) {
    logger.error('Error fetching todos by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get overdue todos
const getOverdueTodos = async (req, res) => {
  try {
    logger.info('Fetching overdue todos');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todos = await todoService.getOverdueTodos(userId, institutionId);

    logger.info('Overdue todos fetched successfully:', { count: todos.length });
    return successResponse(res, todos, 'Overdue todos retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue todos:', error);
    return errorResponse(res, error.message);
  }
};

// Get today's todos
const getTodayTodos = async (req, res) => {
  try {
    logger.info('Fetching today\'s todos');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todos = await todoService.getTodayTodos(userId, institutionId);

    logger.info('Today\'s todos fetched successfully:', { count: todos.length });
    return successResponse(res, todos, 'Today\'s todos retrieved successfully');
  } catch (error) {
    logger.error('Error fetching today\'s todos:', error);
    return errorResponse(res, error.message);
  }
};

// Get upcoming todos
const getUpcomingTodos = async (req, res) => {
  try {
    logger.info('Fetching upcoming todos');
    
    const { userId, institutionId, days } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    const daysNum = parseInt(days) || 7;
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todos = await todoService.getUpcomingTodos(userId, institutionId, daysNum);

    logger.info('Upcoming todos fetched successfully:', { days: daysNum, count: todos.length });
    return successResponse(res, todos, 'Upcoming todos retrieved successfully');
  } catch (error) {
    logger.error('Error fetching upcoming todos:', error);
    return errorResponse(res, error.message);
  }
};

// Update todo priority
const updateTodoPriority = async (req, res) => {
  try {
    logger.info('Updating todo priority');
    
    const { id } = req.params;
    const { priority } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (!priority) {
      errors.push('Priority is required');
    } else if (!VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todo = await todoService.updateTodoPriority(id, priority);

    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }

    logger.info('Todo priority updated successfully:', { todoId: id, priority });
    return successResponse(res, todo, 'Todo priority updated successfully');
  } catch (error) {
    logger.error('Error updating todo priority:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update priority
const bulkUpdatePriority = async (req, res) => {
  try {
    logger.info('Bulk updating todo priority');
    
    const { ids, priority } = req.body;
    
    // Validation
    const errors = [];
    
    if (!ids || !Array.isArray(ids)) {
      errors.push('Todo IDs must be an array');
    } else if (ids.length === 0) {
      errors.push('Todo IDs array cannot be empty');
    } else if (ids.length > 100) {
      errors.push('Cannot update more than 100 todos at once');
    } else {
      for (const id of ids) {
        const idError = validateObjectId(id, 'Todo ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!priority) {
      errors.push('Priority is required');
    } else if (!VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const result = await todoService.bulkUpdatePriority(ids, priority);

    logger.info('Todo priority bulk updated successfully:', { count: result.modifiedCount, priority });
    return successResponse(res, result, 'Todos priority updated successfully');
  } catch (error) {
    logger.error('Error bulk updating todo priority:', error);
    return errorResponse(res, error.message);
  }
};

// Search todos
const searchTodos = async (req, res) => {
  try {
    logger.info('Searching todos');
    
    const { q, userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (!q || q.trim().length === 0) {
      errors.push('Search query is required');
    } else if (q.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todos = await todoService.searchTodos(q, userId, institutionId);

    logger.info('Todos searched successfully:', { query: q, count: todos.length });
    return successResponse(res, todos, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching todos:', error);
    return errorResponse(res, error.message);
  }
};

// Export todos
const exportTodos = async (req, res) => {
  try {
    logger.info('Exporting todos');
    
    const { format, userId, institutionId, status, priority } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const exportData = await todoService.exportTodos({
      format: format.toLowerCase(),
      userId,
      institutionId,
      status,
      priority
    });

    logger.info('Todos exported successfully:', { format });
    return successResponse(res, exportData, 'Todos exported successfully');
  } catch (error) {
    logger.error('Error exporting todos:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate todo
const duplicateTodo = async (req, res) => {
  try {
    logger.info('Duplicating todo');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Todo ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const todo = await todoService.duplicateTodo(id);

    if (!todo) {
      return notFoundResponse(res, 'Todo not found');
    }

    logger.info('Todo duplicated successfully:', { originalId: id, newId: todo._id });
    return createdResponse(res, todo, 'Todo duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating todo:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createTodo,
  getTodoById,
  getAllTodos,
  updateTodo,
  deleteTodo,
  toggleComplete,
  toggleImportant,
  moveToTrash,
  restoreTodo,
  bulkDelete,
  bulkMarkDone,
  bulkMarkUndone,
  permanentDelete,
  getStatistics,
  getTodosByDate,
  getTodosByPriority,
  getTodosByStatus,
  getOverdueTodos,
  getTodayTodos,
  getUpcomingTodos,
  updateTodoPriority,
  bulkUpdatePriority,
  searchTodos,
  exportTodos,
  duplicateTodo
};
