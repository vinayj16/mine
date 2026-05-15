import { body, param, query } from 'express-validator';

export const validateTeacherId = [
  param('teacherId')
    .isMongoId()
    .withMessage('Invalid teacher ID')
];

export const validateLeaveApplication = [
  body('leaveType')
    .isIn(['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'emergency', 'other'])
    .withMessage('Invalid leave type'),
  body('startDate')
    .isISO8601()
    .withMessage('Invalid start date'),
  body('endDate')
    .isISO8601()
    .withMessage('Invalid end date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array')
];

export const validateLeaveReview = [
  param('leaveId')
    .isMongoId()
    .withMessage('Invalid leave ID'),
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comments must not exceed 500 characters')
];

export const validateRoutineQuery = [
  query('academicYear')
    .optional()
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  query('term')
    .optional()
    .isIn(['1', '2', '3', 'annual'])
    .withMessage('Invalid term'),
  query('dayOfWeek')
    .optional()
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 and 6')
];

export const validateAttendanceQuery = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date'),
  query('status')
    .optional()
    .isIn(['present', 'absent', 'late', 'emergency'])
    .withMessage('Invalid status'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Limit must be between 1 and 365')
];

export const validateSalaryQuery = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Invalid year'),
  query('paymentStatus')
    .optional()
    .isIn(['pending', 'processing', 'paid', 'failed'])
    .withMessage('Invalid payment status'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

export const validateSalaryCreation = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Invalid year'),
  body('basicSalary')
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),
  body('allowances')
    .optional()
    .isObject()
    .withMessage('Allowances must be an object'),
  body('deductions')
    .optional()
    .isObject()
    .withMessage('Deductions must be an object'),
  body('workingDays')
    .isInt({ min: 1, max: 31 })
    .withMessage('Working days must be between 1 and 31'),
  body('presentDays')
    .isInt({ min: 0, max: 31 })
    .withMessage('Present days must be between 0 and 31')
    .custom((presentDays, { req }) => {
      if (presentDays > req.body.workingDays) {
        throw new Error('Present days cannot exceed working days');
      }
      return true;
    }),
  body('leaveDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Leave days must be a non-negative integer'),
  body('overtimeHours')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime hours must be a non-negative number'),
  body('overtimeAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Overtime amount must be a non-negative number'),
  body('paymentMode')
    .optional()
    .isIn(['bank_transfer', 'cash', 'cheque'])
    .withMessage('Invalid payment mode')
];

export const validateSalaryStatusUpdate = [
  param('salaryId')
    .isMongoId()
    .withMessage('Invalid salary ID'),
  body('status')
    .isIn(['pending', 'processing', 'paid', 'failed'])
    .withMessage('Invalid payment status'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid payment date'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Transaction ID must not exceed 100 characters'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters')
];

export const validateLibraryQuery = [
  query('status')
    .optional()
    .isIn(['issued', 'returned', 'overdue', 'lost'])
    .withMessage('Invalid status')
];

export const validateLeaveQuery = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'cancelled'])
    .withMessage('Invalid status'),
  query('leaveType')
    .optional()
    .isIn(['sick', 'casual', 'earned', 'maternity', 'paternity', 'unpaid', 'emergency', 'other'])
    .withMessage('Invalid leave type'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date')
];
