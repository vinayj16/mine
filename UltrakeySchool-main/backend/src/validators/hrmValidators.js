import { body, param, query } from 'express-validator';

const hrmValidators = {
  createStaff: [
    body('staffId').notEmpty().withMessage('Staff ID is required'),
    body('employeeId').notEmpty().withMessage('Employee ID is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('nationality').notEmpty().withMessage('Nationality is required'),
    body('department').notEmpty().withMessage('Department is required'),
    body('designation').notEmpty().withMessage('Designation is required'),
    body('employeeType').isIn(['permanent', 'contract', 'part-time', 'intern']).withMessage('Invalid employee type'),
    body('joiningDate').notEmpty().withMessage('Joining date is required')
  ],

  updateStaff: [
    param('id').notEmpty().withMessage('Staff ID is required')
  ],

  createDepartment: [
    body('departmentId').notEmpty().withMessage('Department ID is required'),
    body('name').notEmpty().withMessage('Department name is required'),
    body('code').notEmpty().withMessage('Department code is required')
  ],

  createDesignation: [
    body('designationId').notEmpty().withMessage('Designation ID is required'),
    body('name').notEmpty().withMessage('Designation name is required'),
    body('code').notEmpty().withMessage('Designation code is required'),
    body('level').isInt({ min: 1 }).withMessage('Level must be a positive integer'),
    body('department').notEmpty().withMessage('Department is required')
  ],

  createLeave: [
    body('leaveId').notEmpty().withMessage('Leave ID is required'),
    body('staffId').notEmpty().withMessage('Staff ID is required'),
    body('staffName').notEmpty().withMessage('Staff name is required'),
    body('leaveType').isIn(['casual', 'sick', 'maternity', 'paternity', 'annual', 'emergency']).withMessage('Invalid leave type'),
    body('startDate').notEmpty().withMessage('Start date is required'),
    body('endDate').notEmpty().withMessage('End date is required'),
    body('days').isInt({ min: 1 }).withMessage('Days must be at least 1'),
    body('reason').notEmpty().withMessage('Reason is required')
  ],

  approveLeave: [
    param('id').notEmpty().withMessage('Leave ID is required'),
    body('approvedBy').notEmpty().withMessage('Approver ID is required')
  ],

  rejectLeave: [
    param('id').notEmpty().withMessage('Leave ID is required'),
    body('approvedBy').notEmpty().withMessage('Approver ID is required'),
    body('comments').optional().isString()
  ],

  getAttendanceSummary: [
    param('id').notEmpty().withMessage('Staff ID is required'),
    query('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format')
  ],

  getPayrollReport: [
    query('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be in YYYY-MM format')
  ]
};

export default hrmValidators;
