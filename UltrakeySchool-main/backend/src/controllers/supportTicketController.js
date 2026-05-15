import supportTicketService from '../services/supportTicketService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['open', 'in_progress', 'pending', 'resolved', 'closed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'medium', 'high', 'urgent', 'critical'];
const VALID_CATEGORIES = ['technical', 'billing', 'account', 'feature_request', 'bug', 'general', 'other'];
const VALID_SOURCES = ['email', 'web', 'phone', 'chat', 'api', 'mobile'];
const VALID_SORT_ORDERS = ['asc', 'desc'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_SUBJECT_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_REASON_LENGTH = 500;
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

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
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

// Create ticket
const createTicket = async (req, res) => {
  try {
    logger.info('Creating support ticket');
    
    const { subject, description, priority, category, requesterEmail } = req.body;
    
    // Validation
    const errors = [];
    
    if (!subject || subject.trim().length === 0) {
      errors.push('Subject is required');
    } else if (subject.length > MAX_SUBJECT_LENGTH) {
      errors.push('Subject must not exceed ' + MAX_SUBJECT_LENGTH + ' characters');
    }
    
    if (!description || description.trim().length === 0) {
      errors.push('Description is required');
    } else if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (requesterEmail) {
      const emailError = validateEmail(requesterEmail);
      if (emailError) errors.push(emailError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.createTicket(req.body);
    
    logger.info('Support ticket created successfully:', { ticketId: ticket._id, ticketNumber: ticket.ticketNumber });
    return createdResponse(res, ticket, 'Support ticket created successfully');
  } catch (error) {
    logger.error('Error creating support ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
  try {
    logger.info('Fetching ticket by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.getTicketById(id);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket fetched successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Ticket retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ticket:', error);
    return errorResponse(res, error.message);
  }
};

// Get ticket by number
const getTicketByNumber = async (req, res) => {
  try {
    logger.info('Fetching ticket by number');
    
    const { ticketNumber } = req.params;
    
    // Validation
    const errors = [];
    
    if (!ticketNumber || ticketNumber.trim().length === 0) {
      errors.push('Ticket number is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.getTicketByNumber(ticketNumber);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket fetched by number successfully:', { ticketNumber });
    return successResponse(res, ticket, 'Ticket retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ticket by number:', error);
    return errorResponse(res, error.message);
  }
};

// Get all tickets
const getAllTickets = async (req, res) => {
  try {
    logger.info('Fetching all tickets');
    
    const { status, priority, category, assignedTo, requesterEmail, source, startDate, endDate, search, page, limit, sortBy, sortOrder } = req.query;
    
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
    
    if (category && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (source && !VALID_SOURCES.includes(source)) {
      errors.push('Invalid source. Must be one of: ' + VALID_SOURCES.join(', '));
    }
    
    if (assignedTo) {
      const assignedToError = validateObjectId(assignedTo, 'Assigned to ID');
      if (assignedToError) errors.push(assignedToError);
    }
    
    if (requesterEmail) {
      const emailError = validateEmail(requesterEmail);
      if (emailError) errors.push(emailError);
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
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
    
    const filters = {
      status,
      priority,
      category,
      assignedTo,
      requesterEmail,
      source,
      startDate,
      endDate,
      search
    };
    
    const options = {
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc'
    };
    
    const result = await supportTicketService.getAllTickets(filters, options);
    
    logger.info('All tickets fetched successfully');
    return successResponse(res, {
      tickets: result.tickets,
      pagination: result.pagination
    }, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all tickets:', error);
    return errorResponse(res, error.message);
  }
};

// Update ticket
const updateTicket = async (req, res) => {
  try {
    logger.info('Updating ticket');
    
    const { id } = req.params;
    const { subject, description, priority, category } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (subject !== undefined) {
      if (!subject || subject.trim().length === 0) {
        errors.push('Subject cannot be empty');
      } else if (subject.length > MAX_SUBJECT_LENGTH) {
        errors.push('Subject must not exceed ' + MAX_SUBJECT_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined) {
      if (!description || description.trim().length === 0) {
        errors.push('Description cannot be empty');
      } else if (description.length > MAX_DESCRIPTION_LENGTH) {
        errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
      }
    }
    
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (category !== undefined && !VALID_CATEGORIES.includes(category)) {
      errors.push('Invalid category. Must be one of: ' + VALID_CATEGORIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.updateTicket(id, req.body);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket updated successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Ticket updated successfully');
  } catch (error) {
    logger.error('Error updating ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Update ticket status
const updateTicketStatus = async (req, res) => {
  try {
    logger.info('Updating ticket status');
    
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.updateTicketStatus(id, status, userId);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket status updated successfully:', { ticketId: id, status });
    return successResponse(res, ticket, 'Ticket status updated successfully');
  } catch (error) {
    logger.error('Error updating ticket status:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Delete ticket
const deleteTicket = async (req, res) => {
  try {
    logger.info('Deleting ticket');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await supportTicketService.deleteTicket(id);
    
    logger.info('Ticket deleted successfully:', { ticketId: id });
    return successResponse(res, null, 'Ticket deleted successfully');
  } catch (error) {
    logger.error('Error deleting ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Add message
const addMessage = async (req, res) => {
  try {
    logger.info('Adding message to ticket');
    
    const { id } = req.params;
    const { message, sender } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!message || message.trim().length === 0) {
      errors.push('Message is required');
    } else if (message.length > MAX_MESSAGE_LENGTH) {
      errors.push('Message must not exceed ' + MAX_MESSAGE_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.addMessage(id, req.body);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Message added to ticket successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Message added successfully');
  } catch (error) {
    logger.error('Error adding message to ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Get ticket messages
const getTicketMessages = async (req, res) => {
  try {
    logger.info('Fetching ticket messages');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const messages = await supportTicketService.getTicketMessages(id);
    
    logger.info('Ticket messages fetched successfully:', { ticketId: id, count: messages.length });
    return successResponse(res, messages, 'Messages retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ticket messages:', error);
    return errorResponse(res, error.message);
  }
};

// Assign ticket
const assignTicket = async (req, res) => {
  try {
    logger.info('Assigning ticket');
    
    const { id } = req.params;
    const { userId, team, department } = req.body;
    const assignedBy = req.user?.id || 'system';
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.assignTicket(id, userId, assignedBy, team, department);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket assigned successfully:', { ticketId: id, userId });
    return successResponse(res, ticket, 'Ticket assigned successfully');
  } catch (error) {
    logger.error('Error assigning ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Reassign ticket
const reassignTicket = async (req, res) => {
  try {
    logger.info('Reassigning ticket');
    
    const { id } = req.params;
    const { userId, reason } = req.body;
    const assignedBy = req.user?.id || 'system';
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!userId) {
      errors.push('User ID is required');
    } else {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.reassignTicket(id, userId, assignedBy, reason);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket reassigned successfully:', { ticketId: id, userId });
    return successResponse(res, ticket, 'Ticket reassigned successfully');
  } catch (error) {
    logger.error('Error reassigning ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Escalate ticket
const escalateTicket = async (req, res) => {
  try {
    logger.info('Escalating ticket');
    
    const { id } = req.params;
    const { level, reason, escalatedBy, escalatedTo } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!level || typeof level !== 'number' || level < 1 || level > 5) {
      errors.push('Level must be a number between 1 and 5');
    }
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.escalateTicket(id, level, reason, escalatedBy, escalatedTo);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket escalated successfully:', { ticketId: id, level });
    return successResponse(res, ticket, 'Ticket escalated successfully');
  } catch (error) {
    logger.error('Error escalating ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Resolve ticket
const resolveTicket = async (req, res) => {
  try {
    logger.info('Resolving ticket');
    
    const { id } = req.params;
    const userId = req.user?.id || 'system';
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.resolveTicket(id, req.body, userId);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket resolved successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Ticket resolved successfully');
  } catch (error) {
    logger.error('Error resolving ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Close ticket
const closeTicket = async (req, res) => {
  try {
    logger.info('Closing ticket');
    
    const { id } = req.params;
    const userId = req.user?.id || 'system';
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.closeTicket(id, userId);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket closed successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Ticket closed successfully');
  } catch (error) {
    logger.error('Error closing ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Reopen ticket
const reopenTicket = async (req, res) => {
  try {
    logger.info('Reopening ticket');
    
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user?.id || 'system';
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (reason && reason.length > MAX_REASON_LENGTH) {
      errors.push('Reason must not exceed ' + MAX_REASON_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.reopenTicket(id, reason, userId);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Ticket reopened successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Ticket reopened successfully');
  } catch (error) {
    logger.error('Error reopening ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Add attachment
const addAttachment = async (req, res) => {
  try {
    logger.info('Adding attachment to ticket');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.addAttachment(id, req.body);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Attachment added to ticket successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Attachment added successfully');
  } catch (error) {
    logger.error('Error adding attachment to ticket:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Link related tickets
const linkRelatedTickets = async (req, res) => {
  try {
    logger.info('Linking related tickets');
    
    const { id } = req.params;
    const { relatedTicketIds } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!relatedTicketIds || !Array.isArray(relatedTicketIds)) {
      errors.push('Related ticket IDs must be an array');
    } else if (relatedTicketIds.length === 0) {
      errors.push('Related ticket IDs array cannot be empty');
    } else {
      for (const relatedId of relatedTicketIds) {
        const relatedIdError = validateObjectId(relatedId, 'Related ticket ID');
        if (relatedIdError) {
          errors.push(relatedIdError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.linkRelatedTickets(id, relatedTicketIds);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Related tickets linked successfully:', { ticketId: id, count: relatedTicketIds.length });
    return successResponse(res, ticket, 'Related tickets linked successfully');
  } catch (error) {
    logger.error('Error linking related tickets:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Submit satisfaction survey
const submitSatisfactionSurvey = async (req, res) => {
  try {
    logger.info('Submitting satisfaction survey');
    
    const { id } = req.params;
    const { rating, feedback } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (!rating) {
      errors.push('Rating is required');
    } else if (typeof rating !== 'number' || rating < MIN_RATING || rating > MAX_RATING) {
      errors.push('Rating must be between ' + MIN_RATING + ' and ' + MAX_RATING);
    }
    
    if (feedback && feedback.length > MAX_MESSAGE_LENGTH) {
      errors.push('Feedback must not exceed ' + MAX_MESSAGE_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.submitSatisfactionSurvey(id, req.body);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Satisfaction survey submitted successfully:', { ticketId: id, rating });
    return successResponse(res, ticket, 'Satisfaction survey submitted successfully');
  } catch (error) {
    logger.error('Error submitting satisfaction survey:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Send satisfaction survey
const sendSatisfactionSurvey = async (req, res) => {
  try {
    logger.info('Sending satisfaction survey');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Ticket ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const ticket = await supportTicketService.sendSatisfactionSurvey(id);
    
    if (!ticket) {
      return notFoundResponse(res, 'Ticket not found');
    }
    
    logger.info('Satisfaction survey sent successfully:', { ticketId: id });
    return successResponse(res, ticket, 'Satisfaction survey sent successfully');
  } catch (error) {
    logger.error('Error sending satisfaction survey:', error);
    return errorResponse(res, error.message, 400);
  }
};

// Get tickets by status
const getTicketsByStatus = async (req, res) => {
  try {
    logger.info('Fetching tickets by status');
    
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
    
    const tickets = await supportTicketService.getTicketsByStatus(status);
    
    logger.info('Tickets fetched by status successfully:', { status, count: tickets.length });
    return successResponse(res, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets by status:', error);
    return errorResponse(res, error.message);
  }
};

// Get tickets by priority
const getTicketsByPriority = async (req, res) => {
  try {
    logger.info('Fetching tickets by priority');
    
    const { priority } = req.params;
    
    // Validation
    const errors = [];
    
    if (!priority) {
      errors.push('Priority is required');
    } else if (!VALID_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const tickets = await supportTicketService.getTicketsByPriority(priority);
    
    logger.info('Tickets fetched by priority successfully:', { priority, count: tickets.length });
    return successResponse(res, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets by priority:', error);
    return errorResponse(res, error.message);
  }
};

// Get tickets by category
const getTicketsByCategory = async (req, res) => {
  try {
    logger.info('Fetching tickets by category');
    
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
    
    const tickets = await supportTicketService.getTicketsByCategory(category);
    
    logger.info('Tickets fetched by category successfully:', { category, count: tickets.length });
    return successResponse(res, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets by category:', error);
    return errorResponse(res, error.message);
  }
};

// Get tickets by requester
const getTicketsByRequester = async (req, res) => {
  try {
    logger.info('Fetching tickets by requester');
    
    const { email } = req.params;
    
    // Validation
    const errors = [];
    
    const emailError = validateEmail(email);
    if (emailError) errors.push(emailError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const tickets = await supportTicketService.getTicketsByRequester(email);
    
    logger.info('Tickets fetched by requester successfully:', { email, count: tickets.length });
    return successResponse(res, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets by requester:', error);
    return errorResponse(res, error.message);
  }
};

// Get tickets by assignee
const getTicketsByAssignee = async (req, res) => {
  try {
    logger.info('Fetching tickets by assignee');
    
    const { userId } = req.params;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const tickets = await supportTicketService.getTicketsByAssignee(userId);
    
    logger.info('Tickets fetched by assignee successfully:', { userId, count: tickets.length });
    return successResponse(res, tickets, 'Tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets by assignee:', error);
    return errorResponse(res, error.message);
  }
};

// Get overdue tickets
const getOverdueTickets = async (_req, res) => {
  try {
    logger.info('Fetching overdue tickets');
    
    const tickets = await supportTicketService.getOverdueTickets();
    
    logger.info('Overdue tickets fetched successfully:', { count: tickets.length });
    return successResponse(res, tickets, 'Overdue tickets retrieved successfully');
  } catch (error) {
    logger.error('Error fetching overdue tickets:', error);
    return errorResponse(res, error.message);
  }
};

// Get tickets requiring escalation
const getTicketsRequiringEscalation = async (_req, res) => {
  try {
    logger.info('Fetching tickets requiring escalation');
    
    const tickets = await supportTicketService.getTicketsRequiringEscalation();
    
    logger.info('Tickets requiring escalation fetched successfully:', { count: tickets.length });
    return successResponse(res, tickets, 'Tickets requiring escalation retrieved successfully');
  } catch (error) {
    logger.error('Error fetching tickets requiring escalation:', error);
    return errorResponse(res, error.message);
  }
};

// Search tickets
const searchTickets = async (req, res) => {
  try {
    logger.info('Searching tickets');
    
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
    
    const tickets = await supportTicketService.searchTickets(q);
    
    logger.info('Tickets searched successfully:', { query: q, count: tickets.length });
    return successResponse(res, tickets, 'Search results retrieved successfully');
  } catch (error) {
    logger.error('Error searching tickets:', error);
    return errorResponse(res, error.message);
  }
};

// Get ticket statistics
const getTicketStatistics = async (_req, res) => {
  try {
    logger.info('Fetching ticket statistics');
    
    const statistics = await supportTicketService.getTicketStatistics();
    
    logger.info('Ticket statistics fetched successfully');
    return successResponse(res, statistics, 'Ticket statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ticket statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Get ticket resolution analytics
const getTicketResolutionAnalytics = async (req, res) => {
  try {
    logger.info('Fetching ticket resolution analytics');
    
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await supportTicketService.getTicketResolutionAnalytics(startDate, endDate);
    
    logger.info('Ticket resolution analytics fetched successfully');
    return successResponse(res, analytics, 'Ticket resolution analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching ticket resolution analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Get agent performance
const getAgentPerformance = async (req, res) => {
  try {
    logger.info('Fetching agent performance');
    
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const performance = await supportTicketService.getAgentPerformance(userId, startDate, endDate);
    
    logger.info('Agent performance fetched successfully:', { userId });
    return successResponse(res, performance, 'Agent performance retrieved successfully');
  } catch (error) {
    logger.error('Error fetching agent performance:', error);
    return errorResponse(res, error.message);
  }
};

// Get dashboard metrics
const getDashboardMetrics = async (_req, res) => {
  try {
    logger.info('Fetching dashboard metrics');
    
    const metrics = await supportTicketService.getDashboardMetrics();
    
    logger.info('Dashboard metrics fetched successfully');
    return successResponse(res, metrics, 'Dashboard metrics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching dashboard metrics:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createTicket,
  getTicketById,
  getTicketByNumber,
  getAllTickets,
  updateTicket,
  updateTicketStatus,
  deleteTicket,
  addMessage,
  getTicketMessages,
  assignTicket,
  reassignTicket,
  escalateTicket,
  resolveTicket,
  closeTicket,
  reopenTicket,
  addAttachment,
  linkRelatedTickets,
  submitSatisfactionSurvey,
  sendSatisfactionSurvey,
  getTicketsByStatus,
  getTicketsByPriority,
  getTicketsByCategory,
  getTicketsByRequester,
  getTicketsByAssignee,
  getOverdueTickets,
  getTicketsRequiringEscalation,
  searchTickets,
  getTicketStatistics,
  getTicketResolutionAnalytics,
  getAgentPerformance,
  getDashboardMetrics
};
