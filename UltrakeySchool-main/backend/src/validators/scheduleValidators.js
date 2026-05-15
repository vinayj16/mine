import { body, query, param } from 'express-validator';

export const getSchedulesValidation = [
  query('type')
    .optional()
    .isIn(['meeting', 'class', 'event', 'exam', 'vacation'])
    .withMessage('Invalid schedule type'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  query('search')
    .optional()
    .isString()
    .withMessage('Search must be a string')
    .trim(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip must be a positive number'),
  
  query('sortBy')
    .optional()
    .isIn(['date', 'title', 'priority', 'createdAt'])
    .withMessage('Invalid sort field'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

export const getScheduleByIdValidation = [
  param('id')
    .notEmpty()
    .withMessage('Schedule ID is required')
    .isMongoId()
    .withMessage('Invalid schedule ID format')
];

export const getUserSchedulesValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  
  query('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

export const createScheduleValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  
  body('type')
    .notEmpty()
    .withMessage('Type is required')
    .isIn(['meeting', 'class', 'event', 'exam', 'vacation'])
    .withMessage('Invalid schedule type'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isString()
    .withMessage('Start time must be a string')
    .trim(),
  
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isString()
    .withMessage('End time must be a string')
    .trim(),
  
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim(),
  
  body('virtualLink')
    .optional()
    .isString()
    .withMessage('Virtual link must be a string')
    .trim(),
  
  body('participantIds')
    .optional()
    .isArray()
    .withMessage('Participant IDs must be an array'),
  
  body('participantIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each participant ID must be a valid MongoDB ObjectId'),
  
  body('organizerId')
    .optional()
    .isMongoId()
    .withMessage('Organizer ID must be a valid MongoDB ObjectId'),
  
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  
  body('recurrencePattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'yearly'])
    .withMessage('Invalid recurrence pattern'),
  
  body('recurrenceEndDate')
    .optional()
    .isISO8601()
    .withMessage('Recurrence end date must be a valid date'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .isString()
    .withMessage('Each tag must be a string')
    .trim(),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
];

export const updateScheduleValidation = [
  param('id')
    .notEmpty()
    .withMessage('Schedule ID is required')
    .isMongoId()
    .withMessage('Invalid schedule ID format'),
  
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  
  body('type')
    .optional()
    .isIn(['meeting', 'class', 'event', 'exam', 'vacation'])
    .withMessage('Invalid schedule type'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date'),
  
  body('startTime')
    .optional()
    .isString()
    .withMessage('Start time must be a string')
    .trim(),
  
  body('endTime')
    .optional()
    .isString()
    .withMessage('End time must be a string')
    .trim(),
  
  body('location')
    .optional()
    .isString()
    .withMessage('Location must be a string')
    .trim(),
  
  body('virtualLink')
    .optional()
    .isString()
    .withMessage('Virtual link must be a string')
    .trim(),
  
  body('status')
    .optional()
    .isIn(['upcoming', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('participantIds')
    .optional()
    .isArray()
    .withMessage('Participant IDs must be an array'),
  
  body('participantIds.*')
    .optional()
    .isMongoId()
    .withMessage('Each participant ID must be a valid MongoDB ObjectId'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('notes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
];

export const deleteScheduleValidation = [
  param('id')
    .notEmpty()
    .withMessage('Schedule ID is required')
    .isMongoId()
    .withMessage('Invalid schedule ID format')
];

export const setReminderValidation = [
  param('id')
    .notEmpty()
    .withMessage('Schedule ID is required')
    .isMongoId()
    .withMessage('Invalid schedule ID format'),
  
  body('reminderTime')
    .notEmpty()
    .withMessage('Reminder time is required')
    .isISO8601()
    .withMessage('Reminder time must be a valid date')
];

export const addParticipantValidation = [
  param('id')
    .notEmpty()
    .withMessage('Schedule ID is required')
    .isMongoId()
    .withMessage('Invalid schedule ID format'),
  
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

export const removeParticipantValidation = [
  param('id')
    .notEmpty()
    .withMessage('Schedule ID is required')
    .isMongoId()
    .withMessage('Invalid schedule ID format'),
  
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

export const getUpcomingSchedulesValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];
