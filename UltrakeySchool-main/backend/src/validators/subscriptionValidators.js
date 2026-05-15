import { body, param, query } from 'express-validator';

export const createSubscriptionValidator = [
  body('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  body('planId')
    .notEmpty().withMessage('Plan ID is required')
    .isIn(['basic', 'medium', 'premium']).withMessage('Invalid plan ID'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly']).withMessage('Invalid billing cycle'),
  body('paymentMethod.type')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['card', 'bank_transfer', 'paypal', 'other']).withMessage('Invalid payment method'),
  body('paymentMethod.brand')
    .optional()
    .isString().withMessage('Payment brand must be a string'),
  body('paymentMethod.lastFour')
    .optional()
    .isString().withMessage('Last four digits must be a string')
    .isLength({ min: 4, max: 4 }).withMessage('Last four must be 4 characters'),
  body('discount.code')
    .optional()
    .isString().withMessage('Discount code must be a string'),
  body('discount.percentage')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount percentage must be between 0 and 100'),
  body('discount.amount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Discount amount must be positive')
];

export const upgradeSubscriptionValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  body('targetPlanId')
    .notEmpty().withMessage('Target plan ID is required')
    .isIn(['basic', 'medium', 'premium']).withMessage('Invalid target plan ID')
];

export const cancelSubscriptionValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID'),
  body('reason')
    .optional()
    .isString().withMessage('Reason must be a string')
    .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
];

export const schoolIdValidator = [
  param('schoolId')
    .notEmpty().withMessage('School ID is required')
    .isMongoId().withMessage('Invalid school ID')
];

export const planIdValidator = [
  param('planId')
    .notEmpty().withMessage('Plan ID is required')
    .isIn(['basic', 'medium', 'premium']).withMessage('Invalid plan ID')
];

export const expiringSubscriptionsValidator = [
  query('days')
    .optional()
    .isInt({ min: 1, max: 90 }).withMessage('Days must be between 1 and 90')
];
