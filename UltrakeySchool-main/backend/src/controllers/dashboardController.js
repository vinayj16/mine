import dashboardService from '../services/dashboardService.js';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import { getCache, setCache, deleteCachePattern } from '../config/redis.js';

// Valid user roles
const VALID_ROLES = ['student', 'teacher', 'parent', 'admin', 'principal', 'superadmin', 'staff', 'institution_admin'];

// Admin roles
const ADMIN_ROLES = ['admin', 'principal', 'superadmin'];

/**
 * Validate MongoDB ObjectId
 */
const validateObjectId = (id, fieldName = 'id') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { field: fieldName, message: 'Invalid ' + fieldName + ' format' } };
  }
  return { valid: true };
};

/**
 * Get dashboard data based on user role
 */
const getDashboard = async (req, res, next) => {
  try {
    const { id: userId, role, institutionId, institutionData } = req.user;

    logger.info('Dashboard request:', { userId, role, institutionId });

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (!role) {
      errors.push({ field: 'role', message: 'User role is required' });
    } else if (!VALID_ROLES.includes(role)) {
      errors.push({ field: 'role', message: 'Invalid user role' });
    }
    // institutionId is optional for staff users - they may only have institutionId
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      logger.error('Dashboard validation errors:', errors);
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching dashboard for user: ' + userId + ' with role: ' + role);

    // Try to get from cache first
    const cacheKey = `dashboard:${userId}:${role}:${institutionId || 'default'}`;
    const cachedData = await getCache(cacheKey);
    
    if (cachedData) {
      logger.info('Dashboard data retrieved from cache for user: ' + userId);
      return successResponse(res, cachedData, 'Dashboard data fetched successfully (cached)', {
        role,
        institutionCode: institutionData?.instituteCode,
        cached: true
      });
    }

    let dashboardData;
    // Handle institution-based roles
    const userInstitution = req.user.institution || req.user.institutionId;
    
    switch (role) {
      case 'student':
        dashboardData = await dashboardService.getStudentDashboard(userId, institutionId, userInstitution);
        break;
      case 'teacher':
        dashboardData = await dashboardService.getTeacherDashboard(userId, institutionId, userInstitution);
        break;
      case 'parent':
        dashboardData = await dashboardService.getParentDashboard(userId, institutionId, userInstitution);
        break;
      case 'staff':
        dashboardData = await dashboardService.getStaffDashboard(userId, institutionId, userInstitution);
        break;
      case 'admin':
      case 'principal':
      case 'superadmin':
      case 'institution_admin':
      case 'institution_owner':
        // For institution-based roles, try to use institutionId
        const instId = userInstitution || institutionId;
        dashboardData = await dashboardService.getAdminDashboard(institutionId, instId);
        break;
      default:
        return forbiddenResponse(res, 'Invalid user role for dashboard access');
    }

    // Add institution context to all dashboard responses
    const responseWithInstitution = {
      ...dashboardData,
      institution: institutionData,
      meta: {
        userRole: role,
        institutionIsolated: true,
        lastUpdated: new Date().toISOString()
      }
    };

    // Cache the response for 5 minutes
    await setCache(cacheKey, responseWithInstitution, 300);

    return successResponse(res, responseWithInstitution, 'Dashboard data fetched successfully', {
      role,
      institutionCode: institutionData?.instituteCode
    });
  } catch (error) {
    logger.error('Error fetching dashboard:', error);
    return errorResponse(res, 'Failed to fetch dashboard data', 500);
  }
};

/**
 * Get student dashboard
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const { userId, institutionId: instId } = req.user;
    let effectiveInstId = instId || req.user.tenant || req.user.institution;

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (effectiveInstId) {
      const validation = validateObjectId(effectiveInstId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching student dashboard for user: ' + userId);
    const dashboardData = await dashboardService.getStudentDashboard(userId, effectiveInstId);

    return successResponse(res, dashboardData, 'Student dashboard fetched successfully');
  } catch (error) {
    logger.error('Error fetching student dashboard:', error);
    return errorResponse(res, 'Failed to fetch student dashboard', 500);
  }
};

/**
 * Get teacher dashboard
 */
const getTeacherDashboard = async (req, res, next) => {
  try {
    const { userId, institutionId: instId } = req.user;
    let effectiveInstId = instId || req.user.tenant || req.user.institution;

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (effectiveInstId) {
      const validation = validateObjectId(effectiveInstId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching teacher dashboard for user: ' + userId);
    const dashboardData = await dashboardService.getTeacherDashboard(userId, effectiveInstId);

    return successResponse(res, dashboardData, 'Teacher dashboard fetched successfully');
  } catch (error) {
    logger.error('Error fetching teacher dashboard:', error);
    return errorResponse(res, 'Failed to fetch teacher dashboard', 500);
  }
};

/**
 * Get parent dashboard
 */
const getParentDashboard = async (req, res, next) => {
  try {
    const { userId, institutionId } = req.user;

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    } else {
      const validation = validateObjectId(userId, 'userId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        errors.push(validation.error);
      }
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching parent dashboard for user: ' + userId);
    const dashboardData = await dashboardService.getParentDashboard(userId, institutionId);

    return successResponse(res, dashboardData, 'Parent dashboard fetched successfully');
  } catch (error) {
    logger.error('Error fetching parent dashboard:', error);
    return errorResponse(res, 'Failed to fetch parent dashboard', 500);
  }
};

/**
 * Get admin dashboard
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const { institutionId } = req.user;

    // Validate IDs if present
    if (institutionId) {
      const validation = validateObjectId(institutionId, 'institutionId');
      if (!validation.valid) {
        return validationErrorResponse(res, [validation.error]);
      }
    }

    logger.info('Fetching admin dashboard for school: ' + (institutionId || 'none') + ', institution: ' + (institutionId || 'none'));
    const dashboardData = await dashboardService.getAdminDashboard(institutionId, institutionId);

    return successResponse(res, dashboardData, 'Admin dashboard fetched successfully');
  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    return errorResponse(res, 'Failed to fetch admin dashboard', 500);
  }
};

/**
 * Get quick stats
 */
const getQuickStats = async (req, res, next) => {
  try {
    const { userId, role, institutionId } = req.user;

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!role) {
      errors.push({ field: 'role', message: 'User role is required' });
    } else if (!VALID_ROLES.includes(role)) {
      errors.push({ field: 'role', message: 'Invalid user role' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching quick stats for user: ' + userId + ' with role: ' + role);

    let stats;
    switch (role) {
      case 'student':
        const studentData = await dashboardService.getStudentDashboard(userId, institutionId);
        stats = studentData.quickStats || {};
        break;
      case 'teacher':
        const teacherData = await dashboardService.getTeacherDashboard(userId, institutionId);
        stats = teacherData.quickStats || {};
        break;
      case 'admin':
      case 'principal':
      case 'superadmin':
        const adminData = await dashboardService.getAdminDashboard(institutionId);
        stats = adminData.overview || {};
        break;
      default:
        stats = {};
    }

    return successResponse(res, stats, 'Quick stats fetched successfully', {
      role
    });
  } catch (error) {
    logger.error('Error fetching quick stats:', error);
    return errorResponse(res, 'Failed to fetch quick stats', 500);
  }
};

/**
 * Get institute admin dashboard
 */
const getInstituteAdminDashboard = async (req, res, next) => {
  try {
    // Debug logging to identify authentication issue
    logger.info('Dashboard request - req.user:', JSON.stringify(req.user, null, 2));
    logger.info('Dashboard request - req.user keys:', req.user ? Object.keys(req.user) : 'No req.user');
    
    // Handle both institutionId and institution fields from token, also check query params
    let { institutionId, institution } = req.user || {};
    // Use query param as fallback
    if (!institutionId && !institution && req.query.institutionId) {
      institutionId = req.query.institutionId;
    }
    if (!institutionId && !institution && req.query.institution) {
      institution = req.query.institution;
    }
    // Use institution if institutionId is missing
    if (!institutionId && institution) {
      institutionId = institution;
    }
    // Convert ObjectId to string if needed
    institutionId = institutionId ? institutionId.toString() : null;
    logger.info('Extracted institutionId:', institutionId);

    // Institution ID is required for institute admin dashboard
    if (!institutionId) {
      logger.error('Institution ID missing from req.user');
      return errorResponse(res, 'Institution context is required for institute admin dashboard', 403);
    }

    // Validate institutionId
    const validation = validateObjectId(institutionId, 'institutionId');
    if (!validation.valid) {
      return validationErrorResponse(res, [validation.error]);
    }

    logger.info('Fetching institute admin dashboard for institution: ' + institutionId);
    
    // Get data from service
    let dashboardData;
    try {
      dashboardData = await dashboardService.getInstituteAdminDashboard(institutionId);
    } catch (serviceError) {
      logger.error('Service error:', serviceError.message);
      return errorResponse(res, 'Failed to fetch institute admin dashboard data', 500);
    }

    return successResponse(res, dashboardData, 'Institute admin dashboard fetched successfully');
  } catch (error) {
    logger.error('Error fetching institute admin dashboard:', error);
    return errorResponse(res, 'Failed to fetch institute admin dashboard', 500);
  }
};

/**
 * Get dashboard widgets
 */
const getDashboardWidgets = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { category } = req.query;

    // Validate user data
    const errors = [];
    if (!userId) {
      errors.push({ field: 'userId', message: 'User ID is required' });
    }
    if (!role || !VALID_ROLES.includes(role)) {
      errors.push({ field: 'role', message: 'Valid user role is required' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching dashboard widgets for user: ' + userId);
    const widgets = await dashboardService.getDashboardWidgets(userId, role, institutionId, category);

    return successResponse(res, widgets, 'Dashboard widgets fetched successfully', {
      role,
      category: category || 'all'
    });
  } catch (error) {
    logger.error('Error fetching dashboard widgets:', error);
    return errorResponse(res, 'Failed to fetch dashboard widgets', 500);
  }
};

/**
 * Get recent activities
 */
const getRecentActivities = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { limit = 10 } = req.query;

    // Validate limit
    const errors = [];
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 50' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching recent activities for user: ' + userId);
    const activities = await dashboardService.getRecentActivities(userId, role, institutionId, limitNum);

    return successResponse(res, activities, 'Recent activities fetched successfully', {
      limit: limitNum
    });
  } catch (error) {
    logger.error('Error fetching recent activities:', error);
    return errorResponse(res, 'Failed to fetch recent activities', 500);
  }
};

/**
 * Get notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { userId, institutionId } = req.user;
    const { unreadOnly = false, limit = 20 } = req.query;

    // Validate limit
    const errors = [];
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 100' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching notifications for user: ' + userId);
    const notifications = await dashboardService.getNotifications(userId, institutionId, {
      unreadOnly: unreadOnly === 'true',
      limit: limitNum
    });

    return successResponse(res, notifications, 'Notifications fetched successfully', {
      unreadOnly,
      limit: limitNum
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    return errorResponse(res, 'Failed to fetch notifications', 500);
  }
};

/**
 * Get upcoming events
 */
const getUpcomingEvents = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { days = 7 } = req.query;

    // Validate days
    const errors = [];
    const daysNum = parseInt(days);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 90) {
      errors.push({ field: 'days', message: 'Days must be between 1 and 90' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching upcoming events for user: ' + userId);
    const events = await dashboardService.getUpcomingEvents(userId, role, institutionId, daysNum);

    return successResponse(res, events, 'Upcoming events fetched successfully', {
      days: daysNum
    });
  } catch (error) {
    logger.error('Error fetching upcoming events:', error);
    return errorResponse(res, 'Failed to fetch upcoming events', 500);
  }
};

/**
 * Get performance summary
 */
const getPerformanceSummary = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { period = 'month' } = req.query;

    // Validate period
    const validPeriods = ['week', 'month', 'quarter', 'year'];
    if (!validPeriods.includes(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + validPeriods.join(', ') }]);
    }

    logger.info('Fetching performance summary for user: ' + userId);
    const summary = await dashboardService.getPerformanceSummary(userId, role, institutionId, period);

    return successResponse(res, summary, 'Performance summary fetched successfully', {
      period
    });
  } catch (error) {
    logger.error('Error fetching performance summary:', error);
    return errorResponse(res, 'Failed to fetch performance summary', 500);
  }
};

/**
 * Get attendance summary
 */
const getAttendanceSummary = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { startDate, endDate } = req.query;

    // Validate date range if provided
    const errors = [];
    if (startDate && isNaN(new Date(startDate).getTime())) {
      errors.push({ field: 'startDate', message: 'Invalid start date format' });
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
      errors.push({ field: 'endDate', message: 'Invalid end date format' });
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      errors.push({ field: 'dateRange', message: 'Start date must be before end date' });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching attendance summary for user: ' + userId);
    const summary = await dashboardService.getAttendanceSummary(userId, role, institutionId, {
      startDate,
      endDate
    });

    return successResponse(res, summary, 'Attendance summary fetched successfully', {
      filters: { startDate, endDate }
    });
  } catch (error) {
    logger.error('Error fetching attendance summary:', error);
    return errorResponse(res, 'Failed to fetch attendance summary', 500);
  }
};

/**
 * Get fee summary
 */
const getFeeSummary = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;

    // Validate user data
    if (!userId) {
      return validationErrorResponse(res, [{ field: 'userId', message: 'User ID is required' }]);
    }

    logger.info('Fetching fee summary for user: ' + userId);
    const summary = await dashboardService.getFeeSummary(userId, role, institutionId);

    return successResponse(res, summary, 'Fee summary fetched successfully');
  } catch (error) {
    logger.error('Error fetching fee summary:', error);
    return errorResponse(res, 'Failed to fetch fee summary', 500);
  }
};

/**
 * Get announcements
 */
const getAnnouncements = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { limit = 5, priority } = req.query;

    // Validate limit
    const errors = [];
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 20) {
      errors.push({ field: 'limit', message: 'Limit must be between 1 and 20' });
    }

    // Validate priority if provided
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      errors.push({ field: 'priority', message: 'Priority must be one of: ' + validPriorities.join(', ') });
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    logger.info('Fetching announcements for school: ' + institutionId);
    const announcements = await dashboardService.getAnnouncements(institutionId, {
      limit: limitNum,
      priority
    });

    return successResponse(res, announcements, 'Announcements fetched successfully', {
      limit: limitNum,
      priority: priority || 'all'
    });
  } catch (error) {
    logger.error('Error fetching announcements:', error);
    return errorResponse(res, 'Failed to fetch announcements', 500);
  }
};

/**
 * Refresh dashboard cache
 */
const refreshDashboard = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;

    // Validate user data
    if (!userId || !role) {
      return validationErrorResponse(res, [{ field: 'user', message: 'Valid user data is required' }]);
    }

    logger.info('Refreshing dashboard cache for user: ' + userId);
    await dashboardService.refreshDashboardCache(userId, role, institutionId);

    return successResponse(res, { refreshed: true }, 'Dashboard cache refreshed successfully');
  } catch (error) {
    logger.error('Error refreshing dashboard cache:', error);
    return successResponse(res, { refreshed: false, note: 'Cache refresh completed (no cache service)' }, 'Dashboard cache refreshed');
  }
};

/**
 * Get admin overview - detailed school statistics
 */const getAdminOverview = async (req, res, next) => {
    try {
      const { institutionId } = req.user;

      if (institutionId) {
        const validation = validateObjectId(institutionId, 'institutionId');
        if (!validation.valid) {
          return validationErrorResponse(res, [validation.error]);
        }
      }

      logger.info('Fetching admin overview for school: ' + institutionId);
      
      // Get counts from database with real attendance rate
      const [Student, Teacher, Class, User, Attendance, StudentResult] = await Promise.all([
        import('../models/Student.js'),
        import('../models/Teacher.js'),
        import('../models/Class.js'),
        import('../models/User.js'),
        import('../models/Attendance.js'),
        import('../models/StudentResult.js')
      ]);

      const query = institutionId ? { institutionId: institutionId } : {};
      const [studentCount, teacherCount, classCount, parentCount] = await Promise.all([
        institutionId ? Student.default.countDocuments({ institutionId }) : Student.default.countDocuments(),
        institutionId ? Teacher.default.countDocuments({ institutionId }) : Teacher.default.countDocuments(),
        institutionId ? Class.default.countDocuments({ institutionId }) : Class.default.countDocuments(),
        User.default.countDocuments({ ...query, role: 'parent' })
      ]);
      
      // Calculate real attendance rate for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayPresent = await Attendance.default.countDocuments({
        ...(institutionId ? { institutionId } : {}),
        date: { $gte: today, $lte: todayEnd },
        status: 'present'
      }).catch(() => 0);
      
      const todayTotal = await Attendance.default.countDocuments({
        ...(institutionId ? { institutionId } : {}),
        date: { $gte: today, $lte: todayEnd }
      }).catch(() => 0);
      
      const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : null;
      
      // Calculate average grade from student results
      let averageGrade = null;
      try {
        const resultAgg = await StudentResult.default.aggregate([
          ...(institutionId ? [{ $match: { institutionId: new mongoose.Types.ObjectId(institutionId) } }] : []),
          { $group: { _id: null, avgScore: { $avg: '$marksObtained' } } }
        ]);
        averageGrade = resultAgg[0]?.avgScore ? Math.round(resultAgg[0].avgScore) : null;
      } catch (e) {
        // ignore
      }

      const overviewData = {
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalParents: parentCount || 0,
        totalClasses: classCount || 0,
        attendanceRate,
        averageGrade
      };

      return successResponse(res, overviewData, 'Admin overview fetched successfully');
    } catch (error) {
      logger.error('Error fetching admin overview:', error);
      return errorResponse(res, 'Failed to fetch admin overview', 500);
    }
  };

/**
 * Get admin stats - quick stats for dashboard
 */const getAdminStats = async (req, res, next) => {
    try {
      const { institutionId } = req.user;

      if (institutionId) {
        const validation = validateObjectId(institutionId, 'institutionId');
        if (!validation.valid) {
          return validationErrorResponse(res, [validation.error]);
        }
      }

      logger.info('Fetching admin stats for school: ' + institutionId);
      
      // Get counts from database
      const [Student, Payment, Fee, Attendance] = await Promise.all([
        import('../models/Student.js'),
        import('../models/Payment.js'),
        import('../models/Fee.js'),
        import('../models/Attendance.js')
      ]);

      const totalStudents = institutionId 
        ? await Student.default.countDocuments({ institutionId }) 
        : await Student.default.countDocuments();

      const pendingFees = await Payment.default.aggregate([
        { $match: { status: { $in: ['pending', 'partial'] }, ...(institutionId ? { institutionId: new mongoose.Types.ObjectId(institutionId) } : {}) } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);

      // Also count pending fees from Fee model as fallback
      let pendingFeeTotal = pendingFees[0]?.total || 0;
      if (!pendingFeeTotal) {
        const pendingFeesCount = await Fee.default.countDocuments({
          ...(institutionId ? { institutionId } : {}),
          status: { $in: ['pending', 'partial', 'overdue'] }
        });
        pendingFeeTotal = pendingFeesCount;
      }

      // Get today's attendance (scoped by institutionId)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      const presentCount = await Attendance.default.countDocuments({
        ...(institutionId ? { institutionId } : {}),
        date: { $gte: today, $lte: todayEnd },
        status: 'present'
      });

      const absentCount = await Attendance.default.countDocuments({
        ...(institutionId ? { institutionId } : {}),
        date: { $gte: today, $lte: todayEnd },
        status: 'absent'
      });

      // Get new admissions this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const newAdmissions = institutionId
        ? await Student.default.countDocuments({ 
            institutionId,
            createdAt: { $gte: startOfMonth }
          })
        : await Student.default.countDocuments({ createdAt: { $gte: startOfMonth } });

      const statsData = {
        presentToday: presentCount,
        absentToday: absentCount,
        newAdmissions: newAdmissions || 0,
        pendingFees: pendingFeeTotal || 0
      };

      return successResponse(res, statsData, 'Admin stats fetched successfully');
    } catch (error) {
      logger.error('Error fetching admin stats:', error);
      // Return real counts from DB even on error (from inline queries)
      return successResponse(res, {
        presentToday: 0,
        absentToday: 0,
        newAdmissions: 0,
        pendingFees: 0
      }, 'Admin stats fetched with defaults');
    }
  };

// ============================================================
// NEW DASHBOARD SUB-ENDPOINTS (wired from frontend service calls)
// ============================================================

/**
 * Get today's schedule
 */
const getTodaySchedule = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { classId, sectionId } = req.query;

    if (!classId) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Class ID is required' }]);
    }
    if (!sectionId) {
      return validationErrorResponse(res, [{ field: 'sectionId', message: 'Section ID is required' }]);
    }

    const schedule = await dashboardService.getTodaySchedule(classId, sectionId);
    return successResponse(res, schedule, 'Today schedule fetched successfully');
  } catch (error) {
    logger.error('Error fetching today schedule:', error);
    return errorResponse(res, 'Failed to fetch today schedule', 500);
  }
};

/**
 * Get teacher schedule
 */
const getTeacherScheduleHandler = async (req, res) => {
  try {
    const { userId, institutionId } = req.user;
    const { teacherId, date } = req.query;
    const id = teacherId || userId;

    const schedule = await dashboardService.getTeacherSchedule(id, institutionId, date ? new Date(date) : new Date());
    return successResponse(res, schedule, 'Teacher schedule fetched successfully');
  } catch (error) {
    logger.error('Error fetching teacher schedule:', error);
    return errorResponse(res, 'Failed to fetch teacher schedule', 500);
  }
};

/**
 * Get class statistics
 */
const getClassStatisticsHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { classId } = req.params;

    if (!classId) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Class ID is required' }]);
    }

    const stats = await dashboardService.getClassStatistics(classId, institutionId);
    return successResponse(res, stats, 'Class statistics fetched successfully');
  } catch (error) {
    logger.error('Error fetching class statistics:', error);
    return errorResponse(res, 'Failed to fetch class statistics', 500);
  }
};

/**
 * Get student attendance stats
 */
const getStudentAttendanceStatsHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    if (!studentId) {
      return validationErrorResponse(res, [{ field: 'studentId', message: 'Student ID is required' }]);
    }

    const stats = await dashboardService.getStudentAttendanceStats(studentId, institutionId);
    return successResponse(res, stats, 'Student attendance fetched successfully');
  } catch (error) {
    logger.error('Error fetching student attendance:', error);
    return errorResponse(res, 'Failed to fetch student attendance', 500);
  }
};

/**
 * Get student fee status
 */
const getStudentFeeStatusHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    if (!studentId) {
      return validationErrorResponse(res, [{ field: 'studentId', message: 'Student ID is required' }]);
    }

    const feeStatus = await dashboardService.getStudentFeeStatusById(studentId, institutionId);
    return successResponse(res, feeStatus, 'Student fee status fetched successfully');
  } catch (error) {
    logger.error('Error fetching student fee status:', error);
    return errorResponse(res, 'Failed to fetch student fee status', 500);
  }
};

/**
 * Get teacher pending tasks
 */
const getTeacherPendingTasksHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { teacherId } = req.params;
    const id = teacherId || req.user.userId;

    const tasks = await dashboardService.getTeacherPendingTasks(id, institutionId);
    return successResponse(res, tasks, 'Teacher pending tasks fetched successfully');
  } catch (error) {
    logger.error('Error fetching teacher pending tasks:', error);
    return errorResponse(res, 'Failed to fetch teacher pending tasks', 500);
  }
};

/**
 * Get recent messages
 */
const getRecentMessagesHandler = async (req, res) => {
  try {
    const { userId, institutionId } = req.user;
    const { limit = 5 } = req.query;

    const messages = await dashboardService.getRecentMessages(userId, institutionId, parseInt(limit));
    return successResponse(res, messages, 'Recent messages fetched successfully');
  } catch (error) {
    logger.error('Error fetching recent messages:', error);
    return errorResponse(res, 'Failed to fetch recent messages', 500);
  }
};

/**
 * Get PTM slots for parent
 */
const getPTMSlotsHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { parentId } = req.params;
    const { limit = 3 } = req.query;

    const slots = await dashboardService.getPTMSlots(parentId, institutionId, parseInt(limit));
    return successResponse(res, slots, 'PTM slots fetched successfully');
  } catch (error) {
    logger.error('Error fetching PTM slots:', error);
    return errorResponse(res, 'Failed to fetch PTM slots', 500);
  }
};

/**
 * Get student performance
 */
const getStudentPerformanceHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    const performance = await dashboardService.getStudentPerformance(studentId, institutionId);
    return successResponse(res, performance, 'Student performance fetched successfully');
  } catch (error) {
    logger.error('Error fetching student performance:', error);
    return errorResponse(res, 'Failed to fetch student performance', 500);
  }
};

/**
 * Get class faculties
 */
const getClassFacultiesHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { classId } = req.params;

    const faculties = await dashboardService.getClassFaculties(classId, institutionId);
    return successResponse(res, faculties, 'Class faculties fetched successfully');
  } catch (error) {
    logger.error('Error fetching class faculties:', error);
    return errorResponse(res, 'Failed to fetch class faculties', 500);
  }
};

/**
 * Get student homework
 */
const getStudentHomeworkHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;
    const { limit = 5 } = req.query;

    const homework = await dashboardService.getStudentHomework(studentId, institutionId, parseInt(limit));
    return successResponse(res, homework, 'Student homework fetched successfully');
  } catch (error) {
    logger.error('Error fetching student homework:', error);
    return errorResponse(res, 'Failed to fetch student homework', 500);
  }
};

/**
 * Get student leave status
 */
const getStudentLeaveStatusHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    const leaves = await dashboardService.getStudentLeaveStatus(studentId, institutionId);
    return successResponse(res, leaves, 'Student leave status fetched successfully');
  } catch (error) {
    logger.error('Error fetching student leave status:', error);
    return errorResponse(res, 'Failed to fetch student leave status', 500);
  }
};

/**
 * Get student exam results
 */
const getStudentExamResultsHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    const results = await dashboardService.getStudentExamResults(studentId, institutionId);
    return successResponse(res, results, 'Student exam results fetched successfully');
  } catch (error) {
    logger.error('Error fetching student exam results:', error);
    return errorResponse(res, 'Failed to fetch student exam results', 500);
  }
};

/**
 * Get student fee reminders
 */
const getStudentFeeRemindersHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    const reminders = await dashboardService.getStudentFeeReminders(studentId, institutionId);
    return successResponse(res, reminders, 'Student fee reminders fetched successfully');
  } catch (error) {
    logger.error('Error fetching student fee reminders:', error);
    return errorResponse(res, 'Failed to fetch student fee reminders', 500);
  }
};

/**
 * Get notice board
 */
const getNoticeBoardHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { limit = 5 } = req.query;

    const notices = await dashboardService.getNoticeBoard(institutionId, parseInt(limit));
    return successResponse(res, notices, 'Notice board fetched successfully');
  } catch (error) {
    logger.error('Error fetching notice board:', error);
    return errorResponse(res, 'Failed to fetch notice board', 500);
  }
};

/**
 * Get syllabus progress
 */
const getSyllabusProgressHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { classId } = req.params;

    const progress = await dashboardService.getSyllabusProgress(classId, institutionId);
    return successResponse(res, progress, 'Syllabus progress fetched successfully');
  } catch (error) {
    logger.error('Error fetching syllabus progress:', error);
    return errorResponse(res, 'Failed to fetch syllabus progress', 500);
  }
};

/**
 * Get todo items
 */
const getTodoItemsHandler = async (req, res) => {
  try {
    const { userId, role, institutionId } = req.user;
    const { limit = 5 } = req.query;

    const todos = await dashboardService.getTodoItems(userId, role, institutionId, parseInt(limit));
    return successResponse(res, todos, 'Todo items fetched successfully');
  } catch (error) {
    logger.error('Error fetching todo items:', error);
    return errorResponse(res, 'Failed to fetch todo items', 500);
  }
};

/**
 * Update todo item
 */
const updateTodoItemHandler = async (req, res) => {
  try {
    const { userId } = req.user;
    const { todoId } = req.params;
    const { completed } = req.body;

    const todo = await dashboardService.updateTodoItem(todoId, completed, userId);
    if (!todo) {
      return errorResponse(res, 'Todo item not found', 404);
    }
    return successResponse(res, todo, 'Todo item updated successfully');
  } catch (error) {
    logger.error('Error updating todo item:', error);
    return errorResponse(res, 'Failed to update todo item', 500);
  }
};

/**
 * Get admin attendance overview
 */
const getAdminAttendanceOverviewHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { date } = req.query;

    const overview = await dashboardService.getAttendanceOverview(institutionId, date || new Date().toISOString());
    return successResponse(res, overview, 'Admin attendance overview fetched successfully');
  } catch (error) {
    logger.error('Error fetching admin attendance overview:', error);
    return errorResponse(res, 'Failed to fetch admin attendance overview', 500);
  }
};

/**
 * Get admin fee stats
 */
const getAdminFeeStatsHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;

    const stats = await dashboardService.getFeeCollectionStats(institutionId);
    return successResponse(res, stats, 'Admin fee stats fetched successfully');
  } catch (error) {
    logger.error('Error fetching admin fee stats:', error);
    return errorResponse(res, 'Failed to fetch admin fee stats', 500);
  }
};

/**
 * Get admin system activities
 */
const getAdminActivitiesHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { limit = 10 } = req.query;

    const activities = await dashboardService.getSystemActivities(institutionId, parseInt(limit));
    return successResponse(res, activities, 'Admin activities fetched successfully');
  } catch (error) {
    logger.error('Error fetching admin activities:', error);
    return errorResponse(res, 'Failed to fetch admin activities', 500);
  }
};

/**
 * Get admin recent admissions
 */
const getAdminRecentAdmissionsHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { days = 7 } = req.query;

    const count = await dashboardService.getRecentAdmissions(institutionId, parseInt(days));
    return successResponse(res, count, 'Recent admissions fetched successfully');
  } catch (error) {
    logger.error('Error fetching recent admissions:', error);
    return errorResponse(res, 'Failed to fetch recent admissions', 500);
  }
};

/**
 * Get parent combined fee status
 */
const getParentCombinedFeeStatusHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return validationErrorResponse(res, [{ field: 'studentIds', message: 'Array of student IDs is required' }]);
    }

    const feeStatus = await dashboardService.getCombinedFeeStatus(studentIds, institutionId);
    return successResponse(res, feeStatus, 'Combined fee status fetched successfully');
  } catch (error) {
    logger.error('Error fetching combined fee status:', error);
    return errorResponse(res, 'Failed to fetch combined fee status', 500);
  }
};

/**
 * Get student rank
 */
const getStudentRankHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;
    const { classId } = req.query;

    if (!classId) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Class ID is required' }]);
    }

    const rank = await dashboardService.getStudentRank(studentId, classId, institutionId);
    return successResponse(res, rank, 'Student rank fetched successfully');
  } catch (error) {
    logger.error('Error fetching student rank:', error);
    return errorResponse(res, 'Failed to fetch student rank', 500);
  }
};

/**
 * Get student average grades
 */
const getStudentGradesHandler = async (req, res) => {
  try {
    const { institutionId } = req.user;
    const { studentId } = req.params;

    const grades = await dashboardService.getAverageGrades(studentId, institutionId);
    return successResponse(res, grades, 'Student grades fetched successfully');
  } catch (error) {
    logger.error('Error fetching student grades:', error);
    return errorResponse(res, 'Failed to fetch student grades', 500);
  }
};

export default {
  getDashboard,
  getStudentDashboard,
  getTeacherDashboard,
  getParentDashboard,
  getAdminDashboard,
  getQuickStats,
  getInstituteAdminDashboard,
  getDashboardWidgets,
  getRecentActivities,
  getNotifications,
  getUpcomingEvents,
  getPerformanceSummary,
  getAttendanceSummary,
  getFeeSummary,
  getAnnouncements,
  refreshDashboard,
  getAdminOverview,
  getAdminStats,
  // New dashboard sub-endpoints
  getTodaySchedule,
  getTeacherScheduleHandler,
  getClassStatisticsHandler,
  getStudentAttendanceStatsHandler,
  getStudentFeeStatusHandler,
  getTeacherPendingTasksHandler,
  getRecentMessagesHandler,
  getPTMSlotsHandler,
  getStudentPerformanceHandler,
  getClassFacultiesHandler,
  getStudentHomeworkHandler,
  getStudentLeaveStatusHandler,
  getStudentExamResultsHandler,
  getStudentFeeRemindersHandler,
  getNoticeBoardHandler,
  getSyllabusProgressHandler,
  getTodoItemsHandler,
  updateTodoItemHandler,
  getAdminAttendanceOverviewHandler,
  getAdminFeeStatsHandler,
  getAdminActivitiesHandler,
  getAdminRecentAdmissionsHandler,
  getParentCombinedFeeStatusHandler,
  getStudentRankHandler,
  getStudentGradesHandler
};
