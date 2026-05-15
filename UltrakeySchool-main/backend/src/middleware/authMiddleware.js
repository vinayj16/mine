import User from '../models/User.js';
import { verifyAccessToken, extractToken } from '../services/tokenService.js';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Access token is required'
        }
      });
    }

    // Additional validation for token format
    if (typeof token !== 'string' || token.trim() === '') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_FORMAT',
          message: 'Invalid token format'
        }
      });
    }

    const decoded = verifyAccessToken(token);

    // First try User collection
    let user = await User.findById(decoded.sub || decoded.id)
      .select('-password')
      .lean();

    // If not found in User, try UserCredential collection
    if (!user) {
      const UserCredential = (await import('../models/UserCredential.js')).default;
      user = await UserCredential.findOne({ _id: decoded.sub || decoded.id })
        .lean();
      
      if (user) {
        // Convert UserCredential to same format as User for consistent handling
        user._id = user._id;
        user.email = user.email;
        user.name = user.fullName;
        user.role = user.role;
        user.plan = 'basic';
        user.permissions = user.permissions || [];
        user.modules = [];
        user.institutionId = user.institutionId || user.institution;
        user.institutionCode = user.institutionCode || user.instituteCode || user.schoolCode;
        user.status = user.status || 'active';
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    if (user.status !== 'active' && user.isActive !== true) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is deactivated'
        }
      });
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan,
      permissions: user.permissions || [],
      modules: user.modules || [],
      institutionId: user.institutionId,
      institutionCode: user.institutionCode || user.instituteCode || user.schoolCode,
      institution: decoded.institution || user.institutionId,
      schoolId: user.schoolId,
      avatar: user.avatar,
      status: user.status || (user.isActive ? 'active' : 'inactive')
    };

    if (user.institutionId || decoded.institution) {
      req.tenantId = user.institutionId || decoded.institution;
      req.user.institution = decoded.institution || user.institutionId;
    }

    // Add institution context validation
    if (req.user.institutionId) {
      try {
        const Institution = (await import('../models/Institution.js')).default;
        const institution = await Institution.findById(req.user.institutionId).select('name instituteCode type status logo').lean();
        
        if (institution && institution.status === 'active') {
          req.user.institutionData = {
            id: institution._id,
            name: institution.name,
            instituteCode: institution.instituteCode,
            type: institution.type,
            logo: institution.logo,
            status: institution.status
          };
        } else if (!institution) {
          logger.warn(`Institution not found for user ${req.user.id}: ${req.user.institutionId}`);
        } else if (institution.status !== 'active') {
          logger.warn(`Inactive institution access attempt for user ${req.user.id}: ${req.user.institutionId}`);
          return res.status(403).json({
            success: false,
            error: {
              code: 'INSTITUTION_INACTIVE',
              message: 'Your institution account is not active'
            }
          });
        }
      } catch (error) {
        logger.error('Error validating institution:', error);
      }
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    let errorCode = 'AUTH_TOKEN_INVALID';
    let message = 'Invalid access token';

    if (error.message === 'Invalid access token') {
      errorCode = 'AUTH_TOKEN_INVALID';
      message = 'Invalid access token';
    } else if (error.name === 'TokenExpiredError') {
      errorCode = 'AUTH_TOKEN_EXPIRED';
      message = 'Access token has expired';
    } else if (error.name === 'JsonWebTokenError') {
      errorCode = 'AUTH_TOKEN_INVALID';
      message = 'Invalid access token format';
    }

    return res.status(401).json({
      success: false,
      error: {
        code: errorCode,
        message
      }
    });
  }
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authentication required'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Role '${req.user.role}' is not authorized to access this resource`
        }
      });
    }

    next();
  };
};

export const checkPermission = (permissionKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'AUTH_REQUIRED',
            message: 'Authentication required'
          }
        });
      }

      if (req.user.role === 'superadmin') {
        return next();
      }

      if (req.user.permissions && req.user.permissions.includes('*')) {
        return next();
      }

      if (req.user.permissions && req.user.permissions.includes(permissionKey)) {
        return next();
      }

      const ROLE_PERMISSIONS = {
        'superadmin': [
          '*',
          'system.admin', 'system.config', 'system.monitoring',
          'users.admin', 'users.manage', 'users.view',
          'institutions.admin', 'institutions.manage', 'institutions.view',
          'schools.admin', 'schools.manage', 'schools.view',
          'students.admin', 'students.manage', 'students.view',
          'teachers.admin', 'teachers.manage', 'teachers.view',
          'finance.admin', 'finance.manage', 'finance.view',
          'hr.admin', 'hr.manage', 'hr.view',
          'library.admin', 'library.manage', 'library.view',
          'transport.admin', 'transport.manage', 'transport.view',
          'hostel.admin', 'hostel.manage', 'hostel.view',
          'reports.admin', 'reports.view', 'reports.generate'
        ],
        'institution_admin': [
          'institution.admin', 'institution.config', 'institution.monitoring',
          'schools.admin', 'schools.manage', 'schools.view',
          'users.manage', 'users.view',
          'students.admin', 'students.manage', 'students.view',
          'teachers.admin', 'teachers.manage', 'teachers.view',
          'finance.view', 'finance.manage',
          'hr.view', 'hr.manage',
          'library.view', 'library.manage',
          'transport.view', 'transport.manage',
          'hostel.view', 'hostel.manage',
          'reports.view', 'reports.generate'
        ],
        'admin': [
          'school.admin', 'school.config',
          'users.view', 'users.manage',
          'students.admin', 'students.manage', 'students.view',
          'teachers.admin', 'teachers.manage', 'teachers.view',
          'classes.admin', 'classes.manage', 'classes.view',
          'subjects.admin', 'subjects.manage', 'subjects.view',
          'exams.admin', 'exams.manage', 'exams.view',
          'attendance.admin', 'attendance.manage', 'attendance.view',
          'grades.admin', 'grades.manage', 'grades.view',
          'timetable.admin', 'timetable.manage', 'timetable.view',
          'library.view', 'library.manage',
          'transport.view', 'transport.manage',
          'hostel.view', 'hostel.manage',
          'reports.view', 'reports.generate'
        ],
        'principal': [
          'school.admin', 'school.overview',
          'students.view', 'students.manage',
          'teachers.view', 'teachers.manage',
          'classes.view', 'classes.manage',
          'exams.view', 'exams.manage',
          'attendance.view', 'attendance.manage',
          'grades.view', 'grades.manage',
          'reports.view', 'reports.generate',
          'announcements.admin', 'announcements.manage',
          'events.admin', 'events.manage'
        ],
        'teacher': [
          'students.view', 'students.grade',
          'classes.view', 'classes.manage',
          'subjects.view', 'subjects.manage',
          'exams.create', 'exams.manage', 'exams.view',
          'attendance.mark', 'attendance.view',
          'grades.enter', 'grades.view',
          'timetable.view', 'timetable.manage',
          'homework.create', 'homework.manage', 'homework.view',
          'reports.view'
        ],
        'student': [
          'profile.view', 'profile.manage',
          'classes.view', 'classes.join',
          'subjects.view', 'subjects.enroll',
          'exams.view', 'exams.take',
          'grades.view',
          'attendance.view',
          'timetable.view',
          'homework.view', 'homework.submit',
          'library.view', 'library.borrow',
          'transport.view', 'transport.book',
          'hostel.view', 'hostel.book',
          'fee.view', 'fee.pay',
          'announcements.view',
          'events.view'
        ],
        'parent': [
          'children.view', 'children.manage',
          'grades.view', 'grades.monitor',
          'attendance.view', 'attendance.monitor',
          'fee.view', 'fee.pay', 'fee.monitor',
          'homework.view', 'homework.monitor',
          'announcements.view',
          'events.view',
          'teachers.contact',
          'transport.view', 'transport.monitor',
          'hostel.view', 'hostel.monitor',
          'reports.view'
        ],
        'accountant': [
          'finance.admin', 'finance.manage', 'finance.view',
          'fee.admin', 'fee.manage', 'fee.view', 'fee.collect',
          'invoice.create', 'invoice.manage', 'invoice.view',
          'salary.admin', 'salary.manage', 'salary.view',
          'budget.admin', 'budget.manage', 'budget.view',
          'reports.financial', 'reports.generate',
          'transactions.view', 'transactions.manage',
          'payment.gateway', 'payment.process'
        ],
        'hr_manager': [
          'hr.admin', 'hr.manage', 'hr.view',
          'employees.admin', 'employees.manage', 'employees.view',
          'recruitment.admin', 'recruitment.manage', 'recruitment.view',
          'payroll.admin', 'payroll.manage', 'payroll.view',
          'leave.admin', 'leave.manage', 'leave.view', 'leave.approve',
          'performance.admin', 'performance.manage', 'performance.view',
          'training.admin', 'training.manage', 'training.view',
          'attendance.admin', 'attendance.view',
          'reports.hr', 'reports.generate'
        ],
        'librarian': [
          'library.admin', 'library.manage', 'library.view',
          'books.admin', 'books.manage', 'books.view',
          'borrowing.admin', 'borrowing.manage', 'borrowing.view',
          'returns.admin', 'returns.manage', 'returns.view',
          'inventory.admin', 'inventory.manage', 'inventory.view',
          'catalog.admin', 'catalog.manage', 'catalog.view',
          'fines.admin', 'fines.manage', 'fines.view',
          'reports.library', 'reports.generate'
        ],
        'transport_manager': [
          'transport.admin', 'transport.manage', 'transport.view',
          'vehicles.admin', 'vehicles.manage', 'vehicles.view',
          'routes.admin', 'routes.manage', 'routes.view',
          'drivers.admin', 'drivers.manage', 'drivers.view',
          'assignments.admin', 'assignments.manage', 'assignments.view',
          'maintenance.admin', 'maintenance.manage', 'maintenance.view',
          'fuel.admin', 'fuel.manage', 'fuel.view',
          'tracking.admin', 'tracking.view',
          'reports.transport', 'reports.generate'
        ],
        'hostel_warden': [
          'hostel.admin', 'hostel.manage', 'hostel.view',
          'rooms.admin', 'rooms.manage', 'rooms.view',
          'occupancy.admin', 'occupancy.manage', 'occupancy.view',
          'maintenance.admin', 'maintenance.manage', 'maintenance.view',
          'security.admin', 'security.manage', 'security.view',
          'complaints.admin', 'complaints.manage', 'complaints.view',
          'discipline.admin', 'discipline.manage', 'discipline.view',
          'reports.hostel', 'reports.generate'
        ],
        'staff_member': [
          'profile.view', 'profile.manage',
          'tasks.view', 'tasks.manage',
          'announcements.view',
          'events.view',
          'leave.apply', 'leave.view',
          'attendance.mark', 'attendance.view',
          'reports.view'
        ]
      };

      const rolePermissions = ROLE_PERMISSIONS[req.user.role] || [];
      if (rolePermissions.includes('*') || rolePermissions.includes(permissionKey)) {
        return next();
      }

      return res.status(403).json({
        success:false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action'
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'PERMISSION_CHECK_ERROR',
          message: 'Error checking permissions'
        }
      });
    }
  };
};

export const checkModule = (moduleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated'
        });
      }

      if (req.user.role === 'superadmin') {
        return next();
      }

      const moduleUpper = moduleName.toUpperCase();

      if (req.user.modules && req.user.modules.length > 0) {
        const hasModule = req.user.modules.some(m => m.toUpperCase() === moduleUpper);
        if (hasModule) {
          return next();
        }
      } else {
        const PLAN_MODULES = {
          'basic': ['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'CLASSES'],
          'medium': ['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'CLASSES', 'TEACHERS', 'FEES', 'EXAMS', 'LIBRARY'],
          'premium': ['DASHBOARD', 'STUDENTS', 'ATTENDANCE', 'CLASSES', 'TEACHERS', 'FEES', 'EXAMS', 'LIBRARY', 'HOSTEL', 'TRANSPORT', 'ANALYTICS', 'REPORTS']
        };

        const planModules = PLAN_MODULES[req.user.plan?.toLowerCase()] || PLAN_MODULES['basic'];
        if (planModules.includes(moduleUpper)) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        message: `Module ${moduleName} is not available in your plan`
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking module access'
      });
    }
  };
};

export const protect = authenticate;

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractToken(authHeader);

    if (!token) {
      req.user = {
        id: null,
        email: null,
        name: null,
        role: 'guest',
        plan: 'basic',
        permissions: [],
        modules: [],
        institutionId: null,
        schoolId: null,
        avatar: null,
        status: 'active'
      };
      return next();
    }

    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.sub || decoded.id)
      .select('-password')
      .lean();

    if (!user) {
      return next();
    }

    if (user.status !== 'active' && user.isActive !== true) {
      return next();
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      plan: user.plan || 'basic',
      permissions: user.permissions || [],
      modules: user.modules || [],
      institutionId: user.institutionId,
      schoolId: user.schoolId,
      avatar: user.avatar,
      status: user.status
    };

    next();
  } catch (error) {
    // Continue without authentication on any error
    next();
  }
};
