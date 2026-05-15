import { body, param, query } from 'express-validator';

export const createScheduleValidator = [
  body('classId').isMongoId().withMessage('Invalid class ID'),
  body('className').trim().notEmpty().withMessage('Class name is required'),
  body('section').trim().notEmpty().withMessage('Section is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('teacher').trim().notEmpty().withMessage('Teacher name is required'),
  body('teacherId').isMongoId().withMessage('Invalid teacher ID'),
  body('room').trim().notEmpty().withMessage('Room is required'),
  body('day').isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day'),
  body('startTime').trim().notEmpty().withMessage('Start time is required'),
  body('endTime').trim().notEmpty().withMessage('End time is required'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
  body('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('status').optional().isIn(['active', 'inactive', 'cancelled']).withMessage('Invalid status')
];

export const updateScheduleValidator = [
  body('className').optional().trim().notEmpty().withMessage('Class name cannot be empty'),
  body('section').optional().trim().notEmpty().withMessage('Section cannot be empty'),
  body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty'),
  body('day').optional().isIn(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']).withMessage('Invalid day'),
  body('status').optional().isIn(['active', 'inactive', 'cancelled']).withMessage('Invalid status')
];

export const scheduleIdValidator = [
  param('id').isMongoId().withMessage('Invalid schedule ID')
];

export const searchValidator = [
  query('q').trim().notEmpty().withMessage('Search query is required').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
];
