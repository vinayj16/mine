import { emitDashboardUpdate, emitInstitutionDashboardUpdate, emitStatisticsUpdate } from './socketService.js';
import dashboardService from './dashboardService.js';
import logger from '../utils/logger.js';

class RealtimeDashboardService {
  /**
   * Refresh user dashboard data and emit update
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} tenantId - Tenant ID
   */
  async refreshUserDashboard(userId, role, tenantId) {
    try {
      let dashboardData;

      switch (role) {
        case 'student':
          dashboardData = await dashboardService.getStudentDashboard(userId, tenantId);
          break;
        case 'teacher':
          dashboardData = await dashboardService.getTeacherDashboard(userId, tenantId);
          break;
        case 'parent':
          dashboardData = await dashboardService.getParentDashboard(userId, tenantId);
          break;
        case 'admin':
        case 'super_admin':
          dashboardData = await dashboardService.getAdminDashboard(tenantId);
          break;
        default:
          dashboardData = await dashboardService.getAdminDashboard(tenantId);
      }

      // Emit real-time update
      emitDashboardUpdate(userId, {
        type: 'dashboard_refresh',
        role,
        data: dashboardData,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Dashboard refreshed for user: ${userId}`);
      return dashboardData;
    } catch (error) {
      logger.error(`Error refreshing user dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Refresh institution-wide dashboard
   * @param {string} tenantId - Tenant ID
   */
  async refreshInstitutionDashboard(tenantId) {
    try {
      const dashboardData = await dashboardService.getAdminDashboard(tenantId);

      // Emit to all users in institution
      emitInstitutionDashboardUpdate(tenantId, {
        type: 'institution_dashboard_refresh',
        data: dashboardData,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Institution dashboard refreshed: ${tenantId}`);
      return dashboardData;
    } catch (error) {
      logger.error(`Error refreshing institution dashboard: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update attendance statistics in real-time
   * @param {string} tenantId - Tenant ID
   * @param {Object} attendanceData - Attendance data
   */
  async updateAttendanceStats(tenantId, attendanceData) {
    try {
      // Emit to institution
      emitInstitutionDashboardUpdate(tenantId, {
        type: 'attendance_update',
        data: {
          attendance: attendanceData,
        },
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Attendance stats updated for institution: ${tenantId}`);
    } catch (error) {
      logger.error(`Error updating attendance stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update fee statistics in real-time
   * @param {string} tenantId - Tenant ID
   * @param {Object} feeData - Fee data
   */
  async updateFeeStats(tenantId, feeData) {
    try {
      // Emit to institution
      emitInstitutionDashboardUpdate(tenantId, {
        type: 'fee_update',
        data: {
          fees: feeData,
        },
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Fee stats updated for institution: ${tenantId}`);
    } catch (error) {
      logger.error(`Error updating fee stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update exam statistics in real-time
   * @param {string} tenantId - Tenant ID
   * @param {Object} examData - Exam data
   */
  async updateExamStats(tenantId, examData) {
    try {
      // Emit to institution
      emitInstitutionDashboardUpdate(tenantId, {
        type: 'exam_update',
        data: {
          exams: examData,
        },
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Exam stats updated for institution: ${tenantId}`);
    } catch (error) {
      logger.error(`Error updating exam stats: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update student count in real-time
   * @param {string} tenantId - Tenant ID
   * @param {number} count - Student count
   */
  async updateStudentCount(tenantId, count) {
    try {
      emitInstitutionDashboardUpdate(tenantId, {
        type: 'student_count_update',
        data: {
          totalStudents: count,
        },
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Student count updated for institution: ${tenantId}`);
    } catch (error) {
      logger.error(`Error updating student count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update teacher count in real-time
   * @param {string} tenantId - Tenant ID
   * @param {number} count - Teacher count
   */
  async updateTeacherCount(tenantId, count) {
    try {
      emitInstitutionDashboardUpdate(tenantId, {
        type: 'teacher_count_update',
        data: {
          totalTeachers: count,
        },
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Teacher count updated for institution: ${tenantId}`);
    } catch (error) {
      logger.error(`Error updating teacher count: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send custom statistics update
   * @param {string} userId - User ID
   * @param {Object} statsData - Statistics data
   */
  async sendStatsUpdate(userId, statsData) {
    try {
      emitStatisticsUpdate(userId, {
        type: 'custom_stats_update',
        data: statsData,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Custom stats sent to user: ${userId}`);
    } catch (error) {
      logger.error(`Error sending stats update: ${error.message}`);
      throw error;
    }
  }

  /**
   * Schedule periodic dashboard refresh
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} tenantId - Tenant ID
   * @param {number} intervalMinutes - Refresh interval in minutes
   */
  schedulePeriodicRefresh(userId, role, tenantId, intervalMinutes = 5) {
    const intervalMs = intervalMinutes * 60 * 1000;

    const refreshInterval = setInterval(async () => {
      try {
        await this.refreshUserDashboard(userId, role, tenantId);
      } catch (error) {
        logger.error(`Error in periodic dashboard refresh: ${error.message}`);
      }
    }, intervalMs);

    logger.info(`Periodic dashboard refresh scheduled for user: ${userId}, interval: ${intervalMinutes} minutes`);
    
    return refreshInterval;
  }

  /**
   * Stop periodic dashboard refresh
   * @param {NodeJS.Timeout} refreshInterval - Interval ID
   */
  stopPeriodicRefresh(refreshInterval) {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      logger.info('Periodic dashboard refresh stopped');
    }
  }
}

export default new RealtimeDashboardService();
