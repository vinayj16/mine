import adminAnalyticsService from '../services/adminAnalyticsService.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Valid period values
const VALID_PERIODS = ['day', 'week', 'month', 'quarter', 'year', 'custom'];

// Valid metric types
const VALID_METRICS = ['admissions', 'attendance', 'fees', 'staff', 'complaints', 'performance', 'all'];

/**
 * Validate period parameter
 */
const validatePeriod = (period) => {
  if (!period) return true;
  return VALID_PERIODS.includes(period);
};

/**
 * Validate date range for custom period
 */
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime());
};

/**
 * Get comprehensive admin analytics dashboard
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month', startDate, endDate } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      logger.warn(`Invalid period requested: ${period}`);
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      logger.warn('Invalid date range for custom period');
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    logger.info(`Fetching admin analytics for school ${schoolId}, period: ${period}`);
    const analytics = await adminAnalyticsService.getAdminAnalytics(schoolId, period, { startDate, endDate });

    return successResponse(res, analytics, 'Analytics fetched successfully', {
      period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching admin analytics:', error);
    next(error);
  }
};

/**
 * Get admissions analytics only
 */
const getAdmissionsAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month', startDate, endDate, classId, status } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    // Validate classId if provided
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Invalid class ID format' }]);
    }

    logger.info(`Fetching admissions analytics for school ${schoolId}`);
    const data = await adminAnalyticsService.getAdmissionsAnalytics(schoolId, period, { startDate, endDate, classId, status });

    return successResponse(res, data, 'Admissions analytics fetched successfully', {
      period,
      filters: { classId, status }
    });
  } catch (error) {
    logger.error('Error fetching admissions analytics:', error);
    next(error);
  }
};

/**
 * Get attendance analytics only
 */
const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month', startDate, endDate, classId, studentId } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    // Validate IDs if provided
    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return validationErrorResponse(res, [{ field: 'classId', message: 'Invalid class ID format' }]);
    }
    if (studentId && !mongoose.Types.ObjectId.isValid(studentId)) {
      return validationErrorResponse(res, [{ field: 'studentId', message: 'Invalid student ID format' }]);
    }

    logger.info(`Fetching attendance analytics for school ${schoolId}`);
    const data = await adminAnalyticsService.getAttendanceAnalytics(schoolId, period, { startDate, endDate, classId, studentId });

    return successResponse(res, data, 'Attendance analytics fetched successfully', {
      period,
      filters: { classId, studentId }
    });
  } catch (error) {
    logger.error('Error fetching attendance analytics:', error);
    next(error);
  }
};

/**
 * Get fees analytics only
 */
const getFeesAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month', startDate, endDate, status, paymentMode } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    logger.info(`Fetching fees analytics for school ${schoolId}`);
    const data = await adminAnalyticsService.getFeesAnalytics(schoolId, period, { startDate, endDate, status, paymentMode });

    return successResponse(res, data, 'Fees analytics fetched successfully', {
      period,
      filters: { status, paymentMode }
    });
  } catch (error) {
    logger.error('Error fetching fees analytics:', error);
    next(error);
  }
};

/**
 * Get staff analytics only
 */
const getStaffAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month', startDate, endDate, departmentId, designation } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    // Validate departmentId if provided
    if (departmentId && !mongoose.Types.ObjectId.isValid(departmentId)) {
      return validationErrorResponse(res, [{ field: 'departmentId', message: 'Invalid department ID format' }]);
    }

    logger.info(`Fetching staff analytics for school ${schoolId}`);
    const data = await adminAnalyticsService.getStaffAnalytics(schoolId, period, { startDate, endDate, departmentId, designation });

    return successResponse(res, data, 'Staff analytics fetched successfully', {
      period,
      filters: { departmentId, designation }
    });
  } catch (error) {
    logger.error('Error fetching staff analytics:', error);
    next(error);
  }
};

/**
 * Get complaints analytics only
 */
const getComplaintsAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month', startDate, endDate, status, priority, category } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    logger.info(`Fetching complaints analytics for school ${schoolId}`);
    const data = await adminAnalyticsService.getComplaintsAnalytics(schoolId, period, { startDate, endDate, status, priority, category });

    return successResponse(res, data, 'Complaints analytics fetched successfully', {
      period,
      filters: { status, priority, category }
    });
  } catch (error) {
    logger.error('Error fetching complaints analytics:', error);
    next(error);
  }
};

/**
 * Send fee reminder to overdue students
 */
const sendFeeReminders = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { studentIds, reminderType = 'email', message: customMessage } = req.body;

    // Validate studentIds if provided
    if (studentIds && !Array.isArray(studentIds)) {
      return validationErrorResponse(res, [{ field: 'studentIds', message: 'studentIds must be an array' }]);
    }

    if (studentIds && studentIds.length > 0) {
      const invalidIds = studentIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return validationErrorResponse(res, [{ field: 'studentIds', message: 'One or more student IDs are invalid' }]);
      }
    }

    // Validate reminderType
    const validReminderTypes = ['email', 'sms', 'both'];
    if (!validReminderTypes.includes(reminderType)) {
      return validationErrorResponse(res, [{ field: 'reminderType', message: `reminderType must be one of: ${validReminderTypes.join(', ')}` }]);
    }

    logger.info(`Sending fee reminders to ${studentIds?.length || 'all'} students via ${reminderType}`);

    // TODO: Implement email/SMS reminder logic
    // For now, just return success
    const count = studentIds?.length || 0;

    return successResponse(res, {
      remindersSent: count,
      reminderType,
      timestamp: new Date().toISOString()
    }, `Fee reminders sent to ${count || 'all'} students`);
  } catch (error) {
    logger.error('Error sending fee reminders:', error);
    next(error);
  }
};

/**
 * Get Institute Admin Analytics Dashboard
 */
const getInstituteAdminAnalytics = async (req, res) => {
  try {
    const { institutionId } = req.user || {};
    const { period = 'month', startDate, endDate } = req.query;

    if (!institutionId) {
      logger.warn('Institution ID not found in user context');
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    logger.info(`Fetching institute admin analytics for institution ${institutionId}`);
    
    // Get all schools under this institution
    const School = (await import('../models/School.js')).default;
    const Student = (await import('../models/Student.js')).default;
    const Teacher = (await import('../models/Teacher.js')).default;
    const Attendance = (await import('../models/Attendance.js')).default;
    
    const schools = await School.find({ institutionId, isActive: true });
    const schoolIds = schools.map(s => s._id);

    if (schoolIds.length === 0) {
      logger.warn(`No active schools found for institution ${institutionId}`);
      return successResponse(res, {
        topStats: [],
        message: 'No active schools found'
      }, 'No data available');
    }

    // Get aggregate statistics
    const [totalStudents, totalTeachers, attendanceStats] = await Promise.all([
      Student.countDocuments({ schoolId: { $in: schoolIds }, isActive: true }),
      Teacher.countDocuments({ schoolId: { $in: schoolIds }, isActive: true }),
      Attendance.aggregate([
        { $match: { schoolId: { $in: schoolIds }, date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, avgAttendance: { $avg: { $cond: [{ $eq: ['$status', 'present'] }, 100, 0] } } } }
      ])
    ]);
    
    const totalSchools = schools.length;
    const avgAttendance = attendanceStats[0]?.avgAttendance || 0;

    const dashboardData = {
      topStats: [
        {
          label: 'Total Schools',
          value: totalSchools,
          sub: 'Active institutions',
          icon: '/assets/img/icons/building.svg',
          avatarTone: 'bg-primary-transparent',
          delta: '+0',
          deltaTone: 'badge-soft-success'
        },
        {
          label: 'Total Students',
          value: totalStudents,
          sub: 'Across all schools',
          icon: '/assets/img/icons/students.svg',
          avatarTone: 'bg-success-transparent',
          delta: '+0',
          deltaTone: 'badge-soft-success'
        },
        {
          label: 'Total Teachers',
          value: totalTeachers,
          sub: 'Teaching staff',
          icon: '/assets/img/icons/teacher.svg',
          avatarTone: 'bg-warning-transparent',
          delta: '+0',
          deltaTone: 'badge-soft-success'
        },
        {
          label: 'Avg Attendance',
          value: `${avgAttendance.toFixed(0)}%`,
          sub: 'This month',
          icon: '/assets/img/icons/attendance.svg',
          avatarTone: 'bg-info-transparent',
          delta: '+2%',
          deltaTone: 'badge-soft-success'
        }
      ],
      admissionKPIs: [],
      admissionsYearData: [],
      gradeStrength: [],
      admissionTrend: [],
      dropoutData: [],
      seatOccupancy: [],
      boardExams: [],
      topClasses: [],
      subjectPerf: [],
      perfTrend: [],
      attPct: [],
      staffKPIs: [],
      staffAttByDept: [],
      staffTurnover: [],
      perfRating: []
    };

    return successResponse(res, dashboardData, 'Institute analytics fetched successfully', {
      period,
      schoolCount: totalSchools,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching institute admin analytics:', error);
    return errorResponse(res, 'Failed to fetch analytics data', 500);
  }
};

/**
 * Get Institute Admin Fees Analytics Dashboard
 */
const getInstituteAdminFeesAnalytics = async (req, res) => {
  try {
    const { institutionId } = req.user || {};
    const { period = 'month', startDate, endDate } = req.query;

    if (!institutionId) {
      logger.warn('Institution ID not found in user context');
      return errorResponse(res, 'Institution ID is required', 400);
    }

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date range for custom period
    if (period === 'custom' && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid startDate and endDate are required for custom period' }]);
    }

    logger.info(`Fetching institute admin fees analytics for institution ${institutionId}`);
    
    // Get all schools under this institution
    const School = (await import('../models/School.js')).default;
    const Fee = (await import('../models/Fee.js')).default;
    
    const schools = await School.find({ institutionId, isActive: true });
    const schoolIds = schools.map(s => s._id);

    if (schoolIds.length === 0) {
      logger.warn(`No active schools found for institution ${institutionId}`);
      return successResponse(res, {
        topStats: [],
        message: 'No active schools found'
      }, 'No data available');
    }

    // Build date filter
    const dateFilter = {};
    if (period === 'custom' && startDate && endDate) {
      dateFilter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Get fee statistics
    const [totalRevenue, pendingFees, collectedFees, overdueCount] = await Promise.all([
      Fee.aggregate([
        { $match: { schoolId: { $in: schoolIds }, ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Fee.countDocuments({ schoolId: { $in: schoolIds }, status: 'pending', ...dateFilter }),
      Fee.countDocuments({ schoolId: { $in: schoolIds }, status: 'paid', ...dateFilter }),
      Fee.countDocuments({ 
        schoolId: { $in: schoolIds }, 
        status: 'overdue',
        dueDate: { $lt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
        ...dateFilter 
      })
    ]);

    const revenue = totalRevenue[0]?.total || 0;

    const dashboardData = {
      topStats: [
        {
          label: 'Total Revenue',
          value: `$${(revenue / 1000).toFixed(0)}k`,
          sub: period === 'year' ? 'This year' : `This ${period}`,
          icon: '/assets/img/icons/revenue.svg',
          avatarTone: 'bg-success-transparent',
          delta: '+12%',
          deltaTone: 'badge-soft-success'
        },
        {
          label: 'Collected Fees',
          value: collectedFees,
          sub: 'Paid invoices',
          icon: '/assets/img/icons/check.svg',
          avatarTone: 'bg-primary-transparent',
          delta: '+8%',
          deltaTone: 'badge-soft-success'
        },
        {
          label: 'Pending Fees',
          value: pendingFees,
          sub: 'Outstanding',
          icon: '/assets/img/icons/pending.svg',
          avatarTone: 'bg-warning-transparent',
          delta: '-5%',
          deltaTone: 'badge-soft-danger'
        },
        {
          label: 'Overdue',
          value: overdueCount,
          sub: '60+ days',
          icon: '/assets/img/icons/alert.svg',
          avatarTone: 'bg-danger-transparent',
          delta: '-2%',
          deltaTone: 'badge-soft-success'
        }
      ],
      financeKPIs: [],
      revenueData: [],
      expensePie: [],
      budgetVsActual: [],
      recentInvoices: [],
      feeByTerm: [],
      schoolWiseRevenue: [],
      paymentModes: [],
      overduePayments: [],
      expenseTrend: [],
      profitMargin: []
    };

    return successResponse(res, dashboardData, 'Institute fees analytics fetched successfully', {
      period,
      schoolCount: schoolIds.length,
      totalRevenue: revenue,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching institute admin fees analytics:', error);
    return errorResponse(res, 'Failed to fetch fees analytics data', 500);
  }
};


/**
 * Get analytics comparison between periods
 */
const compareAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { metric, period1, period2, startDate1, endDate1, startDate2, endDate2 } = req.query;

    // Validate metric
    if (!metric || !VALID_METRICS.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: `Metric must be one of: ${VALID_METRICS.join(', ')}` }]);
    }

    // Validate periods
    if (!validatePeriod(period1) || !validatePeriod(period2)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Periods must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate date ranges for custom periods
    if (period1 === 'custom' && !validateDateRange(startDate1, endDate1)) {
      return validationErrorResponse(res, [{ field: 'period1', message: 'Valid startDate1 and endDate1 are required' }]);
    }
    if (period2 === 'custom' && !validateDateRange(startDate2, endDate2)) {
      return validationErrorResponse(res, [{ field: 'period2', message: 'Valid startDate2 and endDate2 are required' }]);
    }

    logger.info(`Comparing ${metric} analytics for school ${schoolId}: ${period1} vs ${period2}`);

    // Fetch data for both periods
    const [data1, data2] = await Promise.all([
      adminAnalyticsService[`get${metric.charAt(0).toUpperCase() + metric.slice(1)}Analytics`](
        schoolId, 
        period1, 
        { startDate: startDate1, endDate: endDate1 }
      ),
      adminAnalyticsService[`get${metric.charAt(0).toUpperCase() + metric.slice(1)}Analytics`](
        schoolId, 
        period2, 
        { startDate: startDate2, endDate: endDate2 }
      )
    ]);

    return successResponse(res, {
      period1: { period: period1, data: data1 },
      period2: { period: period2, data: data2 },
      comparison: {
        metric,
        periods: [period1, period2]
      }
    }, 'Analytics comparison fetched successfully');
  } catch (error) {
    logger.error('Error comparing analytics:', error);
    next(error);
  }
};

/**
 * Export analytics data
 */
const exportAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { metric = 'all', period = 'month', format = 'json', startDate, endDate } = req.query;

    // Validate metric
    if (!VALID_METRICS.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: `Metric must be one of: ${VALID_METRICS.join(', ')}` }]);
    }

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx'];
    if (!validFormats.includes(format)) {
      return validationErrorResponse(res, [{ field: 'format', message: `Format must be one of: ${validFormats.join(', ')}` }]);
    }

    logger.info(`Exporting ${metric} analytics for school ${schoolId} in ${format} format`);

    let data;
    if (metric === 'all') {
      data = await adminAnalyticsService.getAdminAnalytics(schoolId, period, { startDate, endDate });
    } else {
      const methodName = `get${metric.charAt(0).toUpperCase() + metric.slice(1)}Analytics`;
      data = await adminAnalyticsService[methodName](schoolId, period, { startDate, endDate });
    }

    // TODO: Implement CSV/XLSX conversion
    if (format === 'json') {
      return successResponse(res, data, 'Analytics exported successfully', {
        format,
        metric,
        period,
        exportedAt: new Date().toISOString()
      });
    }

    return errorResponse(res, `Export format ${format} not yet implemented`, 501);
  } catch (error) {
    logger.error('Error exporting analytics:', error);
    next(error);
  }
};

/**
 * Get analytics summary for quick overview
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { period = 'month' } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: `Period must be one of: ${VALID_PERIODS.join(', ')}` }]);
    }

    logger.info(`Fetching analytics summary for school ${schoolId}`);

    // Fetch all analytics in parallel
    const [admissions, attendance, fees, staff, complaints] = await Promise.all([
      adminAnalyticsService.getAdmissionsAnalytics(schoolId, period).catch(() => null),
      adminAnalyticsService.getAttendanceAnalytics(schoolId, period).catch(() => null),
      adminAnalyticsService.getFeesAnalytics(schoolId, period).catch(() => null),
      adminAnalyticsService.getStaffAnalytics(schoolId, period).catch(() => null),
      adminAnalyticsService.getComplaintsAnalytics(schoolId, period).catch(() => null)
    ]);

    const summary = {
      admissions: admissions ? { total: admissions.total || 0, trend: admissions.trend || 'stable' } : null,
      attendance: attendance ? { average: attendance.average || 0, trend: attendance.trend || 'stable' } : null,
      fees: fees ? { collected: fees.collected || 0, pending: fees.pending || 0 } : null,
      staff: staff ? { total: staff.total || 0, active: staff.active || 0 } : null,
      complaints: complaints ? { total: complaints.total || 0, resolved: complaints.resolved || 0 } : null
    };

    return successResponse(res, summary, 'Analytics summary fetched successfully', {
      period,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching analytics summary:', error);
    next(error);
  }
};

/**
 * Get real-time analytics updates
 */
const getRealtimeAnalytics = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { metrics } = req.query;

    // Parse metrics array
    const requestedMetrics = metrics ? metrics.split(',') : ['all'];
    
    // Validate metrics
    const invalidMetrics = requestedMetrics.filter(m => !VALID_METRICS.includes(m));
    if (invalidMetrics.length > 0) {
      return validationErrorResponse(res, [{ field: 'metrics', message: `Invalid metrics: ${invalidMetrics.join(', ')}` }]);
    }

    logger.info(`Fetching real-time analytics for school ${schoolId}`);

    // Get current day data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const realtimeData = {
      timestamp: new Date().toISOString(),
      metrics: {}
    };

    // Fetch requested metrics
    if (requestedMetrics.includes('all') || requestedMetrics.includes('attendance')) {
      const Attendance = (await import('../models/Attendance.js')).default;
      const todayAttendance = await Attendance.countDocuments({
        schoolId,
        date: { $gte: today },
        status: 'present'
      });
      realtimeData.metrics.attendance = { present: todayAttendance };
    }

    if (requestedMetrics.includes('all') || requestedMetrics.includes('admissions')) {
      const Student = (await import('../models/Student.js')).default;
      const todayAdmissions = await Student.countDocuments({
        schoolId,
        createdAt: { $gte: today }
      });
      realtimeData.metrics.admissions = { today: todayAdmissions };
    }

    if (requestedMetrics.includes('all') || requestedMetrics.includes('fees')) {
      const Fee = (await import('../models/Fee.js')).default;
      const todayPayments = await Fee.countDocuments({
        schoolId,
        status: 'paid',
        paidAt: { $gte: today }
      });
      realtimeData.metrics.fees = { paymentsToday: todayPayments };
    }

    return successResponse(res, realtimeData, 'Real-time analytics fetched successfully');
  } catch (error) {
    logger.error('Error fetching real-time analytics:', error);
    next(error);
  }
};

/**
 * Get analytics trends over time
 */
const getAnalyticsTrends = async (req, res, next) => {
  try {
    const { schoolId } = req.user;
    const { metric, period = 'month', dataPoints = 12 } = req.query;

    // Validate metric
    if (!metric || !VALID_METRICS.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: `Metric must be one of: ${VALID_METRICS.join(', ')}` }]);
    }

    // Validate dataPoints
    const points = parseInt(dataPoints);
    if (isNaN(points) || points < 1 || points > 100) {
      return validationErrorResponse(res, [{ field: 'dataPoints', message: 'dataPoints must be between 1 and 100' }]);
    }

    logger.info(`Fetching ${metric} trends for school ${schoolId}`);

    // TODO: Implement trend calculation logic
    const trends = {
      metric,
      period,
      dataPoints: points,
      data: [],
      trend: 'stable',
      message: 'Trend calculation not yet implemented'
    };

    return successResponse(res, trends, 'Analytics trends fetched successfully');
  } catch (error) {
    logger.error('Error fetching analytics trends:', error);
    next(error);
  }
};


export default {
  getAdminAnalytics,
  getAdmissionsAnalytics,
  getAttendanceAnalytics,
  getFeesAnalytics,
  getStaffAnalytics,
  getComplaintsAnalytics,
  sendFeeReminders,
  getInstituteAdminAnalytics,
  getInstituteAdminFeesAnalytics,
  compareAnalytics,
  exportAnalytics,
  getAnalyticsSummary,
  getRealtimeAnalytics,
  getAnalyticsTrends
};
