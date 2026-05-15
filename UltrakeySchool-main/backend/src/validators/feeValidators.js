import { body, query, param } from 'express-validator';

export const createInvoiceValidation = [
  body('studentId').isMongoId().withMessage('Invalid student ID'),
  body('items').isArray({ min: 1 }).withMessage('Items array is required'),
  body('items.*.description').isString().withMessage('Item description is required'),
  body('items.*.amount').isNumeric().withMessage('Item amount must be a number'),
  body('dueDate').isISO8601().withMessage('Invalid due date format')
];

export const getInvoicesValidation = [
  query('studentId').optional().isMongoId().withMessage('Invalid student ID'),
  query('status').optional().isIn(['pending', 'paid', 'overdue', 'cancelled']).withMessage('Invalid status'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const initiatePaymentValidation = [
  param('invoiceId').isMongoId().withMessage('Invalid invoice ID'),
  body('paymentMethod').isIn(['upi', 'card', 'netbanking', 'wallet', 'emi']).withMessage('Invalid payment method'),
  body('amount').isNumeric().withMessage('Amount must be a number')
];

export const verifyPaymentValidation = [
  body('paymentId').isMongoId().withMessage('Invalid payment ID'),
  body('razorpayOrderId').isString().withMessage('Razorpay order ID is required'),
  body('razorpaySignature').isString().withMessage('Razorpay signature is required')
];

export const getPaymentReceiptValidation = [
  param('paymentId').isMongoId().withMessage('Invalid payment ID')
];

export const bulkCreateFeesValidation = [
  body('classId').isMongoId().withMessage('Invalid class ID'),
  body('fees').isArray({ min: 1 }).withMessage('Fees array is required'),
  body('fees.*.studentId').isMongoId().withMessage('Invalid student ID'),
  body('fees.*.amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').isISO8601().withMessage('Invalid due date')
];

export const collectFeeValidation = [
  body('studentId').isMongoId().withMessage('Invalid student ID'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('paymentMethod').isIn(['cash', 'upi', 'card', 'netbanking', 'wallet']).withMessage('Invalid payment method')
];

export const updateInvoiceValidation = [
  param('invoiceId').isMongoId().withMessage('Invalid invoice ID'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date')
];

export const deleteInvoiceValidation = [
  param('invoiceId').isMongoId().withMessage('Invalid invoice ID')
];

export const getFeeStructureValidation = [
  query('classId').optional().isMongoId().withMessage('Invalid class ID')
];

export const createFeeStructureValidation = [
  body('classId').isMongoId().withMessage('Invalid class ID'),
  body('fees').isArray({ min: 1 }).withMessage('Fees array is required'),
  body('academicYear').isString().withMessage('Academic year is required')
];

export const getFeesOverviewValidation = [
  query('schoolId').optional().isMongoId().withMessage('Invalid school ID'),
  query('classId').optional().isMongoId().withMessage('Invalid class ID')
];

export const createFeeValidation = [
  body('studentId').isMongoId().withMessage('Invalid student ID'),
  body('feeType').isString().withMessage('Fee type is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('dueDate').isISO8601().withMessage('Invalid due date')
];

export const getStudentFeesValidation = [
  query('studentId').isMongoId().withMessage('Invalid student ID')
];

export const getPendingFeesValidation = [
  query('classId').optional().isMongoId().withMessage('Invalid class ID'),
  query('schoolId').optional().isMongoId().withMessage('Invalid school ID')
];

export const sendRemindersValidation = [
  body('studentIds').isArray({ min: 1 }).withMessage('Student IDs array is required'),
  body('message').optional().isString().withMessage('Message must be a string')
];

export const getFeesReportValidation = [
  query('startDate').optional().isISO8601().withMessage('Invalid start date'),
  query('endDate').optional().isISO8601().withMessage('Invalid end date'),
  query('classId').optional().isMongoId().withMessage('Invalid class ID')
];

export const updateFeeValidation = [
  param('feeId').isMongoId().withMessage('Invalid fee ID'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number'),
  body('status').optional().isIn(['pending', 'paid', 'waived']).withMessage('Invalid status')
];

export const deleteFeeValidation = [
  param('feeId').isMongoId().withMessage('Invalid fee ID')
];

export const applyLateFeesValidation = [
  body('studentId').isMongoId().withMessage('Invalid student ID'),
  body('lateFeeAmount').isNumeric().withMessage('Late fee amount must be a number')
];
