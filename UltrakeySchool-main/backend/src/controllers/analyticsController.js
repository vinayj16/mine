import analyticsService from '../services/analyticsService.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// Valid period values
const VALID_PERIODS = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'];

// Valid metric types
const VALID_METRICS = ['institutions', 'revenue', 'users', 'subscriptions', 'modules', 'support'];

/**
 * Validate period parameter
 */
const validatePeriod = (period) => {
  if (!period) return true;
  return VALID_PERIODS.includes(period);
};

/**
 * Validate date range
 */
const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end && !isNaN(start.getTime()) && !isNaN(end.getTime());
};

const getFullAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate, includeMetrics } = req.query;

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info('Fetching full analytics');
    const analytics = await analyticsService.getFullAnalytics({ startDate, endDate, includeMetrics });
    
    return successResponse(res, analytics, 'Full analytics fetched successfully', {
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching full analytics:', error);
    next(error);
  }
};

const getInstitutionGrowth = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate, institutionType } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching institution growth for period: ${period}`);
    const data = await analyticsService.getInstitutionGrowth(period, { startDate, endDate, institutionType });
    
    return successResponse(res, data, 'Institution growth data fetched successfully', {
      period,
      filters: { institutionType }
    });
  } catch (error) {
    logger.error('Error fetching institution growth:', error);
    next(error);
  }
};

const getRevenueGrowth = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate, planType, currency = 'USD' } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching revenue growth for period: ${period}`);
    const data = await analyticsService.getRevenueGrowth(period, { startDate, endDate, planType, currency });
    
    return successResponse(res, data, 'Revenue growth data fetched successfully', {
      period,
      currency,
      filters: { planType }
    });
  } catch (error) {
    logger.error('Error fetching revenue growth:', error);
    next(error);
  }
};

const getPlanDistribution = async (req, res, next) => {
  try {
    const { includeInactive = false, groupBy = 'plan' } = req.query;

    // Validate groupBy
    const validGroupBy = ['plan', 'type', 'tier'];
    if (!validGroupBy.includes(groupBy)) {
      return validationErrorResponse(res, [{ field: 'groupBy', message: 'groupBy must be one of: ' + validGroupBy.join(', ') }]);
    }

    logger.info('Fetching plan distribution');
    const data = await analyticsService.getPlanDistribution({ includeInactive: includeInactive === 'true', groupBy });
    
    return successResponse(res, data, 'Plan distribution data fetched successfully');
  } catch (error) {
    logger.error('Error fetching plan distribution:', error);
    next(error);
  }
};

const getInstitutionTypeDistribution = async (req, res, next) => {
  try {
    const { region, country, minSize, maxSize } = req.query;

    // Validate size range if provided
    if (minSize && maxSize) {
      const min = parseInt(minSize);
      const max = parseInt(maxSize);
      if (isNaN(min) || isNaN(max) || min > max || min < 0) {
        return validationErrorResponse(res, [{ field: 'sizeRange', message: 'Valid size range is required' }]);
      }
    }

    logger.info('Fetching institution type distribution');
    const data = await analyticsService.getInstitutionTypeDistribution({ region, country, minSize, maxSize });
    
    return successResponse(res, data, 'Institution type distribution fetched successfully', {
      filters: { region, country, minSize, maxSize }
    });
  } catch (error) {
    logger.error('Error fetching institution type distribution:', error);
    next(error);
  }
};

const getChurnRate = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate, planType } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching churn rate for period: ${period}`);
    const data = await analyticsService.getChurnRate(period, { startDate, endDate, planType });
    
    return successResponse(res, data, 'Churn rate data fetched successfully', {
      period,
      filters: { planType }
    });
  } catch (error) {
    logger.error('Error fetching churn rate:', error);
    next(error);
  }
};

const getRenewalRate = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate, planType } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching renewal rate for period: ${period}`);
    const data = await analyticsService.getRenewalRate(period, { startDate, endDate, planType });
    
    return successResponse(res, data, 'Renewal rate data fetched successfully', {
      period,
      filters: { planType }
    });
  } catch (error) {
    logger.error('Error fetching renewal rate:', error);
    next(error);
  }
};

const getBranchGrowth = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate, institutionId, region } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching branch growth for period: ${period}`);
    const data = await analyticsService.getBranchGrowth(period, { startDate, endDate, institutionId, region });
    
    return successResponse(res, data, 'Branch growth data fetched successfully', {
      period,
      filters: { institutionId, region }
    });
  } catch (error) {
    logger.error('Error fetching branch growth:', error);
    next(error);
  }
};

const getModuleUsage = async (req, res, next) => {
  try {
    const { startDate, endDate, moduleType, institutionType, minUsage } = req.query;

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    // Validate minUsage if provided
    if (minUsage && (isNaN(minUsage) || minUsage < 0 || minUsage > 100)) {
      return validationErrorResponse(res, [{ field: 'minUsage', message: 'Minimum usage must be between 0 and 100' }]);
    }

    logger.info('Fetching module usage data');
    const data = await analyticsService.getModuleUsage({ startDate, endDate, moduleType, institutionType, minUsage });
    
    return successResponse(res, data, 'Module usage data fetched successfully', {
      filters: { moduleType, institutionType, minUsage }
    });
  } catch (error) {
    logger.error('Error fetching module usage:', error);
    next(error);
  }
};

const getSupportLoad = async (req, res, next) => {
  try {
    const { period = 'monthly', startDate, endDate, priority, status, category } = req.query;

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching support load for period: ${period}`);
    const data = await analyticsService.getSupportLoad(period, { startDate, endDate, priority, status, category });
    
    return successResponse(res, data, 'Support load data fetched successfully', {
      period,
      filters: { priority, status, category }
    });
  } catch (error) {
    logger.error('Error fetching support load:', error);
    next(error);
  }
};


/**
 * Get analytics summary
 */
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const { metrics = 'all' } = req.query;

    // Parse metrics
    const requestedMetrics = metrics === 'all' ? VALID_METRICS : metrics.split(',');
    
    // Validate metrics
    const invalidMetrics = requestedMetrics.filter(m => !VALID_METRICS.includes(m));
    if (invalidMetrics.length > 0) {
      return validationErrorResponse(res, [{ field: 'metrics', message: 'Invalid metrics: ' + invalidMetrics.join(', ') }]);
    }

    logger.info('Fetching analytics summary');
    const summary = await analyticsService.getAnalyticsSummary(requestedMetrics);
    
    return successResponse(res, summary, 'Analytics summary fetched successfully', {
      metrics: requestedMetrics,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching analytics summary:', error);
    next(error);
  }
};

/**
 * Compare analytics between periods
 */
const compareAnalytics = async (req, res, next) => {
  try {
    const { metric, period1, period2, startDate1, endDate1, startDate2, endDate2 } = req.query;

    // Validate metric
    if (!metric || !VALID_METRICS.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: 'Metric must be one of: ' + VALID_METRICS.join(', ') }]);
    }

    // Validate periods
    if (!validatePeriod(period1) || !validatePeriod(period2)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Periods must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date ranges
    if (!validateDateRange(startDate1, endDate1) || !validateDateRange(startDate2, endDate2)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid date ranges are required for both periods' }]);
    }

    logger.info(`Comparing ${metric} analytics: ${period1} vs ${period2}`);
    const comparison = await analyticsService.compareAnalytics(metric, {
      period1: { period: period1, startDate: startDate1, endDate: endDate1 },
      period2: { period: period2, startDate: startDate2, endDate: endDate2 }
    });
    
    return successResponse(res, comparison, 'Analytics comparison completed successfully');
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
    const { metric = 'all', period = 'monthly', format = 'json', startDate, endDate } = req.query;

    // Validate metric
    if (metric !== 'all' && !VALID_METRICS.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: 'Metric must be one of: ' + VALID_METRICS.join(', ') + ', or "all"' }]);
    }

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate format
    const validFormats = ['json', 'csv', 'xlsx', 'pdf'];
    if (!validFormats.includes(format)) {
      return validationErrorResponse(res, [{ field: 'format', message: 'Format must be one of: ' + validFormats.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Exporting ${metric} analytics in ${format} format`);
    const data = await analyticsService.exportAnalytics(metric, period, { format, startDate, endDate });
    
    // TODO: Implement CSV/XLSX/PDF conversion
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
 * Get real-time analytics
 */
const getRealtimeAnalytics = async (req, res, next) => {
  try {
    const { metrics = 'all', refreshInterval = 60 } = req.query;

    // Parse metrics
    const requestedMetrics = metrics === 'all' ? VALID_METRICS : metrics.split(',');
    
    // Validate metrics
    const invalidMetrics = requestedMetrics.filter(m => !VALID_METRICS.includes(m));
    if (invalidMetrics.length > 0) {
      return validationErrorResponse(res, [{ field: 'metrics', message: 'Invalid metrics: ' + invalidMetrics.join(', ') }]);
    }

    // Validate refresh interval
    const interval = parseInt(refreshInterval);
    if (isNaN(interval) || interval < 10 || interval > 300) {
      return validationErrorResponse(res, [{ field: 'refreshInterval', message: 'Refresh interval must be between 10 and 300 seconds' }]);
    }

    logger.info('Fetching real-time analytics');
    const realtimeData = await analyticsService.getRealtimeAnalytics(requestedMetrics);
    
    return successResponse(res, realtimeData, 'Real-time analytics fetched successfully', {
      metrics: requestedMetrics,
      refreshInterval: interval,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching real-time analytics:', error);
    next(error);
  }
};

/**
 * Get analytics trends
 */
const getAnalyticsTrends = async (req, res, next) => {
  try {
    const { metric, period = 'monthly', dataPoints = 12, trendType = 'linear' } = req.query;

    // Validate metric
    if (!metric || !VALID_METRICS.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: 'Metric must be one of: ' + VALID_METRICS.join(', ') }]);
    }

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate dataPoints
    const points = parseInt(dataPoints);
    if (isNaN(points) || points < 2 || points > 100) {
      return validationErrorResponse(res, [{ field: 'dataPoints', message: 'Data points must be between 2 and 100' }]);
    }

    // Validate trendType
    const validTrendTypes = ['linear', 'exponential', 'moving_average'];
    if (!validTrendTypes.includes(trendType)) {
      return validationErrorResponse(res, [{ field: 'trendType', message: 'Trend type must be one of: ' + validTrendTypes.join(', ') }]);
    }

    logger.info(`Fetching ${metric} trends with ${trendType} analysis`);
    const trends = await analyticsService.getAnalyticsTrends(metric, period, { dataPoints: points, trendType });
    
    return successResponse(res, trends, 'Analytics trends fetched successfully', {
      metric,
      period,
      trendType
    });
  } catch (error) {
    logger.error('Error fetching analytics trends:', error);
    next(error);
  }
};

/**
 * Get top performers
 */
const getTopPerformers = async (req, res, next) => {
  try {
    const { metric, limit = 10, period = 'monthly', startDate, endDate } = req.query;

    // Validate metric
    const validMetrics = ['revenue', 'growth', 'retention', 'usage', 'satisfaction'];
    if (!metric || !validMetrics.includes(metric)) {
      return validationErrorResponse(res, [{ field: 'metric', message: 'Metric must be one of: ' + validMetrics.join(', ') }]);
    }

    // Validate limit
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return validationErrorResponse(res, [{ field: 'limit', message: 'Limit must be between 1 and 100' }]);
    }

    // Validate period
    if (!validatePeriod(period)) {
      return validationErrorResponse(res, [{ field: 'period', message: 'Period must be one of: ' + VALID_PERIODS.join(', ') }]);
    }

    // Validate date range if provided
    if (startDate && endDate && !validateDateRange(startDate, endDate)) {
      return validationErrorResponse(res, [{ field: 'dateRange', message: 'Valid start and end dates are required' }]);
    }

    logger.info(`Fetching top ${limitNum} performers by ${metric}`);
    const performers = await analyticsService.getTopPerformers(metric, { limit: limitNum, period, startDate, endDate });
    
    return successResponse(res, performers, 'Top performers fetched successfully', {
      metric,
      limit: limitNum,
      period
    });
  } catch (error) {
    logger.error('Error fetching top performers:', error);
    next(error);
  }
};


/**
 * Get institute admin dashboard analytics
 */
const getInstituteAdminDashboard = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId;
    
    if (!institutionId) {
      return errorResponse(res, 'Institution ID is required', 400);
    }

    logger.info(`Fetching institute admin dashboard analytics for institution: ${institutionId}`);
    
    // Get comprehensive dashboard data using existing analytics service
    const dashboardData = await analyticsService.getInstituteAdminDashboard(institutionId);
    
    return successResponse(res, dashboardData, 'Institute admin dashboard analytics fetched successfully', {
      institutionId,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching institute admin dashboard analytics:', error);
    next(error);
  }
};

/**
 * Get Teaching Overview Analytics
 */
const getTeachingOverview = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId;
    
    if (!institutionId) {
      return validationErrorResponse(res, ['Institution ID is required']);
    }

    // Import models for database queries
    const User = (await import('../models/User.js')).default;
    const mongoose = (await import('mongoose')).default;
    const ObjectId = mongoose.Types.ObjectId;

    // Get real teaching data from database
    const [totalTeachers, activeTeachers, totalSubjects, avgExperience] = await Promise.all([
      User.countDocuments({ institutionId: new ObjectId(institutionId), role: 'teacher' }),
      User.countDocuments({ institutionId: new ObjectId(institutionId), role: 'teacher', isActive: true }),
      45, // Mock data for now - can be replaced with real subject data
      8.5  // Mock data for now - can be replaced with real experience data
    ]);

    // Generate teaching overview data with real database values
    const dashboardData = {
      // Top Statistics
      topStats: [
        {
          label: 'Total Teachers',
          value: totalTeachers.toString(),
          delta: '+12%',
          deltaTone: 'bg-success',
          icon: '/assets/img/icons/teacher.svg',
          active: 'Active',
          inactive: 'Inactive',
          avatarTone: 'bg-success-transparent'
        },
        {
          label: 'Active Teachers',
          value: activeTeachers.toString(),
          delta: '+8%',
          deltaTone: 'bg-primary',
          icon: '/assets/img/icons/teacher.svg',
          active: 'This Month',
          inactive: 'Last Month',
          avatarTone: 'bg-primary-transparent'
        },
        {
          label: 'Total Subjects',
          value: totalSubjects.toString(),
          delta: '+3',
          deltaTone: 'bg-info',
          icon: '/assets/img/icons/subject.svg',
          active: 'This Year',
          inactive: 'Last Year',
          avatarTone: 'bg-info-transparent'
        },
        {
          label: 'Avg Experience',
          value: `${avgExperience} years`,
          delta: '+0.5 years',
          deltaTone: 'bg-warning',
          icon: '/assets/img/icons/award.svg',
          active: 'This Year',
          inactive: 'Last Year',
          avatarTone: 'bg-warning-transparent'
        }
      ],

      // Teaching KPIs
      teachingKPIs: [
        {
          label: 'Teaching Load',
          value: '85%',
          delta: '+5%',
          deltaTone: 'bg-success',
          icon: '/assets/img/icons/subject.svg',
          active: 'Optimal',
          inactive: 'Overloaded',
          avatarTone: 'bg-success-transparent'
        },
        {
          label: 'Class Coverage',
          value: '92%',
          delta: '+3%',
          deltaTone: 'bg-primary',
          icon: '/assets/img/icons/classroom.svg',
          active: 'Covered',
          inactive: 'Pending',
          avatarTone: 'bg-primary-transparent'
        },
        {
          label: 'Subject Expertise',
          value: '78%',
          delta: '+2%',
          deltaTone: 'bg-info',
          icon: '/assets/img/icons/award.svg',
          active: 'Qualified',
          inactive: 'Training',
          avatarTone: 'bg-info-transparent'
        },
        {
          label: 'Performance Rating',
          value: '4.2/5',
          delta: '+0.3',
          deltaTone: 'bg-warning',
          icon: '/assets/img/icons/star.svg',
          active: 'Excellent',
          inactive: 'Good',
          avatarTone: 'bg-warning-transparent'
        }
      ],

      // Subject Performance
      subjectPerformance: [
        { subject: 'Mathematics', avgScore: 85, passRate: 92, grade: 'A', bar: 'bg-success' },
        { subject: 'Science', avgScore: 78, passRate: 88, grade: 'B', bar: 'bg-primary' },
        { subject: 'English', avgScore: 82, passRate: 90, grade: 'B+', bar: 'bg-info' },
        { subject: 'History', avgScore: 75, passRate: 85, grade: 'B', bar: 'bg-warning' },
        { subject: 'Arts', avgScore: 88, passRate: 95, grade: 'A', bar: 'bg-success' }
      ],

      // Class Performance
      classPerformance: [
        { name: 'Grade 10-A', avgScore: 87, passRate: 94, pct: '94%', bar: 'bg-success' },
        { name: 'Grade 9-B', avgScore: 82, passRate: 89, pct: '89%', bar: 'bg-primary' },
        { name: 'Grade 8-C', avgScore: 79, passRate: 86, pct: '86%', bar: 'bg-info' },
        { name: 'Grade 7-D', avgScore: 76, passRate: 83, pct: '83%', bar: 'bg-warning' }
      ],

      // Teaching Load
      teachingLoad: [
        { subject: 'Mathematics', avgLoad: 20, maxLoad: 25, pct: '80%', bar: 'bg-success' },
        { subject: 'Science', avgLoad: 18, maxLoad: 22, pct: '82%', bar: 'bg-primary' },
        { subject: 'English', avgLoad: 16, maxLoad: 20, pct: '80%', bar: 'bg-info' },
        { subject: 'History', avgLoad: 14, maxLoad: 18, pct: '78%', bar: 'bg-warning' },
        { subject: 'Arts', avgLoad: 12, maxLoad: 15, pct: '80%', bar: 'bg-success' }
      ]
    };

    return successResponse(res, dashboardData, 'Teaching overview analytics fetched successfully');
  } catch (error) {
    logger.error('Error fetching teaching overview:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get Student Overview Analytics
 */
const getStudentOverview = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId;
    
    if (!institutionId) {
      return validationErrorResponse(res, ['Institution ID is required']);
    }

    // Import models for database queries
    const User = (await import('../models/User.js')).default;
    const mongoose = (await import('mongoose')).default;
    const ObjectId = mongoose.Types.ObjectId;

    // Get real student data from database
    const [totalStudents, activeStudents, newAdmissions, avgAttendance] = await Promise.all([
      User.countDocuments({ institutionId: new ObjectId(institutionId), role: 'student' }),
      User.countDocuments({ institutionId: new ObjectId(institutionId), role: 'student', isActive: true }),
      User.countDocuments({ 
        institutionId: new ObjectId(institutionId), 
        role: 'student',
        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
      }),
      87.5  // Mock data for now - can be replaced with real attendance data
    ]);

    // Generate student overview data with real database values
    const dashboardData = {
      // Top Statistics
      topStats: [
        {
          label: 'Total Students',
          value: totalStudents.toString(),
          delta: '+15%',
          deltaTone: 'bg-success',
          icon: '/assets/img/icons/student.svg',
          active: 'Enrolled',
          inactive: 'Inactive',
          avatarTone: 'bg-success-transparent'
        },
        {
          label: 'Active Students',
          value: activeStudents.toString(),
          delta: '+12%',
          deltaTone: 'bg-primary',
          icon: '/assets/img/icons/student.svg',
          active: 'This Month',
          inactive: 'Last Month',
          avatarTone: 'bg-primary-transparent'
        },
        {
          label: 'New Admissions',
          value: newAdmissions.toString(),
          delta: '+8%',
          deltaTone: 'bg-info',
          icon: '/assets/img/icons/plus.svg',
          active: 'This Year',
          inactive: 'Last Year',
          avatarTone: 'bg-info-transparent'
        },
        {
          label: 'Avg Attendance',
          value: `${avgAttendance}%`,
          delta: '+2.5%',
          deltaTone: 'bg-warning',
          icon: '/assets/img/icons/attendance.svg',
          active: 'Present',
          inactive: 'Absent',
          avatarTone: 'bg-warning-transparent'
        }
      ],

      // Student KPIs
      studentKPIs: [
        {
          label: 'Enrollment Rate',
          value: '95%',
          delta: '+3%',
          deltaTone: 'bg-success',
          icon: '/assets/img/icons/trending-up.svg',
          active: 'High',
          inactive: 'Low',
          avatarTone: 'bg-success-transparent'
        },
        {
          label: 'Retention Rate',
          value: '92%',
          delta: '+2%',
          deltaTone: 'bg-primary',
          icon: '/assets/img/icons/users.svg',
          active: 'Retained',
          inactive: 'Dropped',
          avatarTone: 'bg-primary-transparent'
        },
        {
          label: 'Pass Rate',
          value: '88%',
          delta: '+4%',
          deltaTone: 'bg-info',
          icon: '/assets/img/icons/check.svg',
          active: 'Passed',
          inactive: 'Failed',
          avatarTone: 'bg-info-transparent'
        },
        {
          label: 'Avg Performance',
          value: 'B+',
          delta: '+0.5',
          deltaTone: 'bg-warning',
          icon: '/assets/img/icons/award.svg',
          active: 'Good',
          inactive: 'Needs Improvement',
          avatarTone: 'bg-warning-transparent'
        }
      ],

      // Enrollment Data
      enrollmentData: [
        { year: '2021', current: 450, lastYear: 420 },
        { year: '2022', current: 480, lastYear: 450 },
        { year: '2023', current: 520, lastYear: 480 },
        { year: '2024', current: 580, lastYear: 520 },
        { year: '2025', current: totalStudents, lastYear: 580 }
      ],

      // Enrollment Trend
      enrollmentTrend: [
        { m: 'Jan', v: 12 },
        { m: 'Feb', v: 15 },
        { m: 'Mar', v: 18 },
        { m: 'Apr', v: 14 },
        { m: 'May', v: 20 },
        { m: 'Jun', v: 16 }
      ],

      // Grade Distribution
      gradeDistribution: [
        { grade: 'Grade 1', students: 45, pct: '15%', bar: 'bg-primary' },
        { grade: 'Grade 2', students: 42, pct: '14%', bar: 'bg-success' },
        { grade: 'Grade 3', students: 38, pct: '13%', bar: 'bg-info' },
        { grade: 'Grade 4', students: 35, pct: '12%', bar: 'bg-warning' },
        { grade: 'Grade 5', students: 40, pct: '13%', bar: 'bg-danger' }
      ],

      // Attendance Rates
      attendanceRates: [
        { lbl: 'Grade 1', pct: '92%', bar: 'bg-success', w: '92%' },
        { lbl: 'Grade 2', pct: '89%', bar: 'bg-primary', w: '89%' },
        { lbl: 'Grade 3', pct: '87%', bar: 'bg-info', w: '87%' },
        { lbl: 'Grade 4', pct: '85%', bar: 'bg-warning', w: '85%' },
        { lbl: 'Grade 5', pct: '90%', bar: 'bg-success', w: '90%' }
      ]
    };

    return successResponse(res, dashboardData, 'Student overview analytics fetched successfully');
  } catch (error) {
    logger.error('Error fetching student overview:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get Parent Overview Analytics
 */
const getParentOverview = async (req, res) => {
  try {
    const institutionId = req.user?.institutionId;
    
    if (!institutionId) {
      return validationErrorResponse(res, ['Institution ID is required']);
    }

    // Import models for database queries
    const User = (await import('../models/User.js')).default;
    const mongoose = (await import('mongoose')).default;
    const ObjectId = mongoose.Types.ObjectId;

    // Get real parent data from database
    const [totalParents, activeParents, engagementRate, communicationRate] = await Promise.all([
      User.countDocuments({ institutionId: new ObjectId(institutionId), role: 'parent' }),
      User.countDocuments({ institutionId: new ObjectId(institutionId), role: 'parent', isActive: true }),
      78.5,  // Mock data for now - can be replaced with real engagement data
      85.2   // Mock data for now - can be replaced with real communication data
    ]);

    // Generate parent overview data with real database values
    const dashboardData = {
      // Top Statistics
      topStats: [
        {
          label: 'Total Parents',
          value: totalParents.toString(),
          delta: '+18%',
          deltaTone: 'bg-success',
          icon: '/assets/img/icons/users.svg',
          active: 'Registered',
          inactive: 'Inactive',
          avatarTone: 'bg-success-transparent'
        },
        {
          label: 'Active Parents',
          value: activeParents.toString(),
          delta: '+15%',
          deltaTone: 'bg-primary',
          icon: '/assets/img/icons/user-check.svg',
          active: 'Engaged',
          inactive: 'Inactive',
          avatarTone: 'bg-primary-transparent'
        },
        {
          label: 'Engagement Rate',
          value: `${engagementRate}%`,
          delta: '+5.2%',
          deltaTone: 'bg-info',
          icon: '/assets/img/icons/trending-up.svg',
          active: 'Engaged',
          inactive: 'Not Engaged',
          avatarTone: 'bg-info-transparent'
        },
        {
          label: 'Communication Rate',
          value: `${communicationRate}%`,
          delta: '+3.8%',
          deltaTone: 'bg-warning',
          icon: '/assets/img/icons/message.svg',
          active: 'Communicated',
          inactive: 'Not Communicated',
          avatarTone: 'bg-warning-transparent'
        }
      ],

      // Parent KPIs
      parentKPIs: [
        {
          label: 'Meeting Attendance',
          value: '72%',
          delta: '+8%',
          deltaTone: 'bg-success',
          icon: '/assets/img/icons/calendar.svg',
          active: 'Attended',
          inactive: 'Missed',
          avatarTone: 'bg-success-transparent'
        },
        {
          label: 'Portal Usage',
          value: '85%',
          delta: '+12%',
          deltaTone: 'bg-primary',
          icon: '/assets/img/icons/device-desktop.svg',
          active: 'Active',
          inactive: 'Inactive',
          avatarTone: 'bg-primary-transparent'
        },
        {
          label: 'Feedback Response',
          value: '68%',
          delta: '+6%',
          deltaTone: 'bg-info',
          icon: '/assets/img/icons/message-circle.svg',
          active: 'Responded',
          inactive: 'Pending',
          avatarTone: 'bg-info-transparent'
        },
        {
          label: 'Satisfaction Score',
          value: '4.3/5',
          delta: '+0.4',
          deltaTone: 'bg-warning',
          icon: '/assets/img/icons/star.svg',
          active: 'Satisfied',
          inactive: 'Neutral',
          avatarTone: 'bg-warning-transparent'
        }
      ],

      // Parent Engagement
      parentEngagement: [
        { category: 'PTA Meetings', engaged: 85, total: 120, pct: '71%', bar: 'bg-success' },
        { category: 'School Events', engaged: 95, total: 120, pct: '79%', bar: 'bg-primary' },
        { category: 'Volunteer Work', engaged: 45, total: 120, pct: '38%', bar: 'bg-info' },
        { category: 'Fundraising', engaged: 60, total: 120, pct: '50%', bar: 'bg-warning' }
      ],

      // Communication Stats
      communicationStats: [
        { type: 'Email', sent: 450, delivered: 420, pending: 30, pct: '93%', bar: 'bg-success' },
        { type: 'SMS', sent: 320, delivered: 310, pending: 10, pct: '97%', bar: 'bg-primary' },
        { type: 'Portal', sent: 280, delivered: 240, pending: 40, pct: '86%', bar: 'bg-info' },
        { type: 'App', sent: 200, delivered: 180, pending: 20, pct: '90%', bar: 'bg-warning' }
      ]
    };

    return successResponse(res, dashboardData, 'Parent overview analytics fetched successfully');
  } catch (error) {
    logger.error('Error fetching parent overview:', error);
    return errorResponse(res, error.message);
  }
};

export default {
  getFullAnalytics,
  getInstitutionGrowth,
  getRevenueGrowth,
  getPlanDistribution,
  getInstitutionTypeDistribution,
  getChurnRate,
  getRenewalRate,
  getBranchGrowth,
  getModuleUsage,
  getSupportLoad,
  getAnalyticsSummary,
  compareAnalytics,
  exportAnalytics,
  getRealtimeAnalytics,
  getAnalyticsTrends,
  getTopPerformers,
  getInstituteAdminDashboard,
  getTeachingOverview,
  getStudentOverview,
  getParentOverview
};
