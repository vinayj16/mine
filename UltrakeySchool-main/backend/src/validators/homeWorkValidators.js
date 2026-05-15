import { body, param, query } from 'express-validator';

// Validation rules for creating homework
export const createHomeWorkValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  
  body('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isMongoId()
    .withMessage('Invalid class ID'),
  
  body('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  
  body('teacherId')
    .notEmpty()
    .withMessage('Teacher ID is required')
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  
  body('dueDate')
    .notEmpty()
    .withMessage('Due date is required')
    .isISO8601()
    .withMessage('Invalid due date format'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Instructions must not exceed 1000 characters'),
  
  body('totalMarks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total marks must be at least 1'),
  
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
];

// Validation rules for updating homework
export const updateHomeWorkValidator = [
  param('homeWorkId')
    .notEmpty()
    .withMessage('Homework ID is required')
    .isMongoId()
    .withMessage('Invalid homework ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title must not exceed 200 characters'),
  
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid due date format'),
  
  body('totalMarks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total marks must be at least 1'),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status')
];

// Validation rules for getting homework by ID
export const homeWorkIdValidator = [
  param('homeWorkId')
    .notEmpty()
    .withMessage('Homework ID is required')
    .isMongoId()
    .withMessage('Invalid homework ID')
];

// Validation rules for getting homework list
export const getHomeWorksValidator = [
  param('schoolId')
    .notEmpty()
    .withMessage('School ID is required')
    .isMongoId()
    .withMessage('Invalid school ID'),
  
  query('classId')
    .optional()
    .isMongoId()
    .withMessage('Invalid class ID'),
  
  query('subjectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid subject ID'),
  
  query('teacherId')
    .optional()
    .isMongoId()
    .withMessage('Invalid teacher ID'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Validation rules for search
export const searchHomeWorkValidator = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
];

// Validation rules for class ID
export const classIdValidator = [
  param('classId')
    .notEmpty()
    .withMessage('Class ID is required')
    .isMongoId()
    .withMessage('Invalid class ID')
];

// Validation rules for teacher ID
export const teacherIdValidator = [
  param('teacherId')
    .notEmpty()
    .withMessage('Teacher ID is required')
    .isMongoId()
    .withMessage('Invalid teacher ID')
];

// Validation rules for subject ID
export const subjectIdValidator = [
  param('subjectId')
    .notEmpty()
    .withMessage('Subject ID is required')
    .isMongoId()
    .withMessage('Invalid subject ID')
];

// Validation rules for submitting homework
export const submitHomeWorkValidator = [
  param('homeWorkId')
    .notEmpty()
    .withMessage('Homework ID is required')
    .isMongoId()
    .withMessage('Invalid homework ID'),
  
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  
  body('isLate')
    .optional()
    .isBoolean()
    .withMessage('isLate must be a boolean')
];

// Validation rules for grading submission
export const gradeSubmissionValidator = [
  param('homeWorkId')
    .notEmpty()
    .withMessage('Homework ID is required')
    .isMongoId()
    .withMessage('Invalid homework ID'),
  
  body('studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isMongoId()
    .withMessage('Invalid student ID'),
  
  body('marks')
    .notEmpty()
    .withMessage('Marks are required')
    .isFloat({ min: 0 })
    .withMessage('Marks must be a positive number'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters')
];
