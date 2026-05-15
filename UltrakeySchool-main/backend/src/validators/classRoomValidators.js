import { body, param, query } from 'express-validator';

export const createClassRoomValidator = [
  body('roomNo').trim().notEmpty().withMessage('Room number is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('academicYear').trim().notEmpty().withMessage('Academic year is required'),
  body('institutionId').isMongoId().withMessage('Invalid institution ID'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('roomType').optional().isIn(['classroom', 'laboratory', 'library', 'auditorium', 'computer-lab', 'other']).withMessage('Invalid room type'),
  body('floor').optional().isInt().withMessage('Floor must be a number')
];

export const updateClassRoomValidator = [
  body('roomNo').optional().trim().notEmpty().withMessage('Room number cannot be empty'),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  body('roomType').optional().isIn(['classroom', 'laboratory', 'library', 'auditorium', 'computer-lab', 'other']).withMessage('Invalid room type'),
  body('floor').optional().isInt().withMessage('Floor must be a number')
];

export const roomIdValidator = [
  param('id').isMongoId().withMessage('Invalid room ID')
];

export const searchValidator = [
  query('q').trim().notEmpty().withMessage('Search query is required').isLength({ min: 2 }).withMessage('Search query must be at least 2 characters')
];
