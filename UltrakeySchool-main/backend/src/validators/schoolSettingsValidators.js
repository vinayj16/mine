import { body, param, query } from 'express-validator';

export const createSchoolSettingsValidator = [
  body('institutionId')
    .notEmpty()
    .withMessage('Institution ID is required')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('basicInfo.schoolName')
    .notEmpty()
    .withMessage('School name is required')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2 and 200 characters'),
  body('basicInfo.email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('basicInfo.phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  body('basicInfo.website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL')
];

export const updateBasicInfoValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('schoolName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('School name must be between 2 and 200 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]+$/)
    .withMessage('Invalid phone number format'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL')
];

export const updateAcademicSettingsValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('academicYear')
    .optional()
    .matches(/^\d{4}\/\d{4}$/)
    .withMessage('Academic year must be in format YYYY/YYYY'),
  body('sessionStartDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid session start date'),
  body('sessionEndDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid session end date'),
  body('weekendDays')
    .optional()
    .isArray()
    .withMessage('Weekend days must be an array'),
  body('workingDays')
    .optional()
    .isArray()
    .withMessage('Working days must be an array'),
  body('periodDuration')
    .optional()
    .isInt({ min: 1, max: 180 })
    .withMessage('Period duration must be between 1 and 180 minutes'),
  body('breakDuration')
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage('Break duration must be between 1 and 60 minutes')
];

export const updateExamSettingsValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('passingPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Passing percentage must be between 0 and 100'),
  body('gradingSystem')
    .optional()
    .isIn(['percentage', 'gpa', 'cgpa', 'letter'])
    .withMessage('Invalid grading system'),
  body('maxMarks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max marks must be a positive integer')
];

export const updateAttendanceSettingsValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('minimumAttendance')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Minimum attendance must be between 0 and 100'),
  body('lateArrivalTime')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Late arrival time must be between 0 and 60 minutes'),
  body('halfDayThreshold')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Half day threshold must be between 1 and 12 hours')
];

export const updateFeeSettingsValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('lateFeePercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Late fee percentage must be between 0 and 100'),
  body('lateFeeGracePeriod')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Late fee grace period must be a non-negative integer')
];

export const updateNotificationSettingsValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('enableEmailNotifications')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  body('enableSMSNotifications')
    .optional()
    .isBoolean()
    .withMessage('SMS notifications must be a boolean'),
  body('enablePushNotifications')
    .optional()
    .isBoolean()
    .withMessage('Push notifications must be a boolean')
];

export const updateLogoValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('url')
    .notEmpty()
    .withMessage('Logo URL is required')
    .isURL()
    .withMessage('Invalid logo URL')
];

export const updateStatusValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive')
];

export const institutionIdValidator = [
  param('institutionId')
    .isMongoId()
    .withMessage('Invalid institution ID')
];

export const getAllSchoolSettingsValidator = [
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];
