import { body, param, query } from 'express-validator';

export const transactionIdValidator = [
  param('transactionId')
    .notEmpty().withMessage('Transaction ID is required')
    .isString().withMessage('Transaction ID must be a string')
];

export const schoolIdValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID')
];

export const transactionFiltersValidator = [
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded', 'cancelled']).withMessage('Invalid status'),
  query('type')
    .optional()
    .isIn(['subscription', 'upgrade', 'addon', 'refund', 'adjustment']).withMessage('Invalid type'),
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const createRefundValidator = [
  param('transactionId')
    .notEmpty().withMessage('Transaction ID is required')
    .isString().withMessage('Transaction ID must be a string'),
  body('amount')
    .notEmpty().withMessage('Refund amount is required')
    .isFloat({ min: 0.01 }).withMessage('Refund amount must be positive'),
  body('reason')
    .notEmpty().withMessage('Refund reason is required')
    .isString().withMessage('Reason must be a string')
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

export const revenueAnalyticsValidator = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('Invalid end date format'),
  query('groupBy')
    .optional()
    .isIn(['day', 'month', 'year']).withMessage('Invalid groupBy value')
];
