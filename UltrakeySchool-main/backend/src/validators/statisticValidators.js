import { param, query } from 'express-validator';

export const getStatisticValidation = [
  param('statId')
    .notEmpty()
    .withMessage('Stat ID is required')
    .isIn(['students', 'teachers', 'revenue', 'attendance'])
    .withMessage('Invalid stat ID')
];

export const refreshStatisticValidation = [
  param('statId')
    .notEmpty()
    .withMessage('Stat ID is required')
    .isIn(['students', 'teachers', 'revenue', 'attendance'])
    .withMessage('Invalid stat ID')
];

export const acknowledgeAlertValidation = [
  param('statId')
    .notEmpty()
    .withMessage('Stat ID is required')
    .isIn(['students', 'teachers', 'revenue', 'attendance'])
    .withMessage('Invalid stat ID'),
  
  param('alertId')
    .notEmpty()
    .withMessage('Alert ID is required')
    .isMongoId()
    .withMessage('Invalid alert ID format')
];

export const getStatisticHistoryValidation = [
  param('statId')
    .notEmpty()
    .withMessage('Stat ID is required')
    .isIn(['students', 'teachers', 'revenue', 'attendance'])
    .withMessage('Invalid stat ID'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
