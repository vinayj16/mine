import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Dashboard Widget Schema
const dashboardWidgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  widgetType: {
    type: String,
    enum: [
      'attendance_summary',
      'fee_status',
      'upcoming_exams',
      'recent_grades',
      'homework_pending',
      'announcements',
      'calendar',
      'quick_stats',
      'performance_chart',
      'class_schedule',
      'notifications',
      'student_list',
      'teacher_list',
      'transport_status',
      'library_books',
      'recent_activities',
      'weather',
      'todo_list',
      'messages',
      'analytics',
      'custom',
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  position: {
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
  },
  size: {
    width: {
      type: Number,
      default: 4,
      min: 1,
      max: 12,
    },
    height: {
      type: Number,
      default: 4,
      min: 1,
      max: 12,
    },
  },
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
  refreshInterval: {
    type: Number,
    default: 300000, // 5 minutes in milliseconds
  },
  order: {
    type: Number,
    default: 0,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
    required: true,
  },
}, {
  timestamps: true,
});

dashboardWidgetSchema.index({ user: 1, tenant: 1 });
dashboardWidgetSchema.index({ user: 1, order: 1 });

const DashboardWidget = mongoose.model('DashboardWidget', dashboardWidgetSchema);

// Widget Template Schema
const widgetTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  widgetType: {
    type: String,
    required: true,
  },
  description: String,
  icon: String,
  category: {
    type: String,
    enum: ['academic', 'financial', 'communication', 'analytics', 'general'],
    default: 'general',
  },
  defaultSettings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  defaultSize: {
    width: {
      type: Number,
      default: 4,
    },
    height: {
      type: Number,
      default: 4,
    },
  },
  roles: [{
    type: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institution',
  },
}, {
  timestamps: true,
});

const WidgetTemplate = mongoose.model('WidgetTemplate', widgetTemplateSchema);

class DashboardWidgetService {
  /**
   * Create widget
   * @param {string} userId - User ID
   * @param {Object} widgetData - Widget data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Widget
   */
  async createWidget(userId, widgetData, tenantId) {
    try {
      const widget = new DashboardWidget({
        user: userId,
        ...widgetData,
        tenant: tenantId,
      });

      await widget.save();

      logger.info(`Widget created: ${widget._id} for user ${userId}`);
      return widget;
    } catch (error) {
      logger.error(`Error creating widget: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user widgets
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Widgets
   */
  async getUserWidgets(userId, tenantId) {
    try {
      const widgets = await DashboardWidget.find({
        user: userId,
        tenant: tenantId,
        isVisible: true,
      }).sort({ order: 1 });

      return widgets;
    } catch (error) {
      logger.error(`Error fetching user widgets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get widget by ID
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Widget
   */
  async getWidgetById(widgetId, userId, tenantId) {
    try {
      const widget = await DashboardWidget.findOne({
        _id: widgetId,
        user: userId,
        tenant: tenantId,
      });

      if (!widget) {
        throw new Error('Widget not found');
      }

      return widget;
    } catch (error) {
      logger.error(`Error fetching widget: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update widget
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated widget
   */
  async updateWidget(widgetId, userId, updateData, tenantId) {
    try {
      const widget = await DashboardWidget.findOneAndUpdate(
        {
          _id: widgetId,
          user: userId,
          tenant: tenantId,
        },
        updateData,
        { new: true, runValidators: true }
      );

      if (!widget) {
        throw new Error('Widget not found');
      }

      logger.info(`Widget updated: ${widgetId}`);
      return widget;
    } catch (error) {
      logger.error(`Error updating widget: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete widget
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {boolean} Success status
   */
  async deleteWidget(widgetId, userId, tenantId) {
    try {
      const result = await DashboardWidget.findOneAndDelete({
        _id: widgetId,
        user: userId,
        tenant: tenantId,
      });

      if (!result) {
        throw new Error('Widget not found');
      }

      logger.info(`Widget deleted: ${widgetId}`);
      return true;
    } catch (error) {
      logger.error(`Error deleting widget: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update widget position
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {Object} position - Position data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated widget
   */
  async updateWidgetPosition(widgetId, userId, position, tenantId) {
    try {
      const widget = await DashboardWidget.findOneAndUpdate(
        {
          _id: widgetId,
          user: userId,
          tenant: tenantId,
        },
        { position },
        { new: true }
      );

      if (!widget) {
        throw new Error('Widget not found');
      }

      return widget;
    } catch (error) {
      logger.error(`Error updating widget position: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update widget size
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {Object} size - Size data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated widget
   */
  async updateWidgetSize(widgetId, userId, size, tenantId) {
    try {
      const widget = await DashboardWidget.findOneAndUpdate(
        {
          _id: widgetId,
          user: userId,
          tenant: tenantId,
        },
        { size },
        { new: true }
      );

      if (!widget) {
        throw new Error('Widget not found');
      }

      return widget;
    } catch (error) {
      logger.error(`Error updating widget size: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reorder widgets
   * @param {string} userId - User ID
   * @param {Array} widgetOrders - Array of {widgetId, order}
   * @param {string} tenantId - Tenant ID
   * @returns {boolean} Success status
   */
  async reorderWidgets(userId, widgetOrders, tenantId) {
    try {
      const bulkOps = widgetOrders.map(({ widgetId, order }) => ({
        updateOne: {
          filter: {
            _id: widgetId,
            user: userId,
            tenant: tenantId,
          },
          update: { order },
        },
      }));

      await DashboardWidget.bulkWrite(bulkOps);

      logger.info(`Widgets reordered for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error(`Error reordering widgets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Toggle widget visibility
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Updated widget
   */
  async toggleWidgetVisibility(widgetId, userId, tenantId) {
    try {
      const widget = await DashboardWidget.findOne({
        _id: widgetId,
        user: userId,
        tenant: tenantId,
      });

      if (!widget) {
        throw new Error('Widget not found');
      }

      widget.isVisible = !widget.isVisible;
      await widget.save();

      return widget;
    } catch (error) {
      logger.error(`Error toggling widget visibility: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get widget data
   * @param {string} widgetId - Widget ID
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Widget data
   */
  async getWidgetData(widgetId, userId, tenantId) {
    try {
      const widget = await this.getWidgetById(widgetId, userId, tenantId);

      // Fetch data based on widget type
      let data;
      switch (widget.widgetType) {
        case 'attendance_summary':
          data = await this.getAttendanceSummaryData(userId, tenantId);
          break;
        case 'fee_status':
          data = await this.getFeeStatusData(userId, tenantId);
          break;
        case 'upcoming_exams':
          data = await this.getUpcomingExamsData(userId, tenantId);
          break;
        case 'recent_grades':
          data = await this.getRecentGradesData(userId, tenantId);
          break;
        case 'homework_pending':
          data = await this.getPendingHomeworkData(userId, tenantId);
          break;
        case 'quick_stats':
          data = await this.getQuickStatsData(userId, tenantId);
          break;
        case 'class_schedule':
          data = await this.getClassScheduleData(userId, tenantId);
          break;
        case 'recent_activities':
          data = await this.getRecentActivitiesData(userId, tenantId);
          break;
        default:
          data = { message: 'Widget data not available' };
      }

      return {
        widget,
        data,
      };
    } catch (error) {
      logger.error(`Error fetching widget data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get attendance summary data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Attendance data
   */
  async getAttendanceSummaryData(userId, tenantId) {
    try {
      const Attendance = mongoose.model('Attendance');
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const records = await Attendance.find({
        student: userId,
        tenant: tenantId,
        date: { $gte: thirtyDaysAgo },
      });

      const total = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const absent = records.filter(r => r.status === 'absent').length;
      const late = records.filter(r => r.status === 'late').length;

      return {
        total,
        present,
        absent,
        late,
        percentage: total > 0 ? ((present / total) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      logger.error(`Error fetching attendance data: ${error.message}`);
      return { error: 'Unable to fetch attendance data' };
    }
  }

  /**
   * Get fee status data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Fee data
   */
  async getFeeStatusData(userId, tenantId) {
    try {
      const Fee = mongoose.model('Fee');
      
      const fees = await Fee.find({
        student: userId,
        tenant: tenantId,
      }).sort({ dueDate: 1 });

      const totalDue = fees.reduce((sum, fee) => sum + (fee.amount - fee.paidAmount), 0);
      const overdue = fees.filter(f => f.dueDate < new Date() && f.status !== 'paid').length;

      return {
        totalDue,
        overdue,
        upcoming: fees.filter(f => f.status === 'pending').length,
        paid: fees.filter(f => f.status === 'paid').length,
      };
    } catch (error) {
      logger.error(`Error fetching fee data: ${error.message}`);
      return { error: 'Unable to fetch fee data' };
    }
  }

  /**
   * Get upcoming exams data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Exam data
   */
  async getUpcomingExamsData(userId, tenantId) {
    try {
      const Exam = mongoose.model('Exam');
      
      const exams = await Exam.find({
        tenant: tenantId,
        date: { $gte: new Date() },
      })
        .sort({ date: 1 })
        .limit(5)
        .populate('subject');

      return exams;
    } catch (error) {
      logger.error(`Error fetching exam data: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent grades data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Grade data
   */
  async getRecentGradesData(userId, tenantId) {
    try {
      const Grade = mongoose.model('Grade');
      
      const grades = await Grade.find({
        student: userId,
        tenant: tenantId,
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('subject exam');

      return grades;
    } catch (error) {
      logger.error(`Error fetching grade data: ${error.message}`);
      return [];
    }
  }

  /**
   * Get pending homework data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Homework data
   */
  async getPendingHomeworkData(userId, tenantId) {
    try {
      const HomeWork = mongoose.model('HomeWork');
      
      const homework = await HomeWork.find({
        tenant: tenantId,
        dueDate: { $gte: new Date() },
        'submissions.student': { $ne: userId },
      })
        .sort({ dueDate: 1 })
        .limit(5)
        .populate('subject');

      return homework;
    } catch (error) {
      logger.error(`Error fetching homework data: ${error.message}`);
      return [];
    }
  }

  /**
   * Get quick stats data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Stats data
   */
  async getQuickStatsData(userId, tenantId) {
    try {
      const User = mongoose.model('User');
      const user = await User.findById(userId);

      let stats = {};

      if (user.role === 'student') {
        const Attendance = mongoose.model('Attendance');
        const HomeWork = mongoose.model('HomeWork');
        const Grade = mongoose.model('Grade');

        const [attendanceCount, homeworkCount, gradeAvg] = await Promise.all([
          Attendance.countDocuments({ student: userId, tenant: tenantId }),
          HomeWork.countDocuments({ tenant: tenantId, 'submissions.student': userId }),
          Grade.aggregate([
            { $match: { student: mongoose.Types.ObjectId(userId), tenant: mongoose.Types.ObjectId(tenantId) } },
            { $group: { _id: null, avgMarks: { $avg: '$marksObtained' } } },
          ]),
        ]);

        stats = {
          totalAttendance: attendanceCount,
          homeworkSubmitted: homeworkCount,
          averageMarks: gradeAvg[0]?.avgMarks?.toFixed(2) || 0,
        };
      } else if (user.role === 'teacher') {
        const Class = mongoose.model('Class');
        const HomeWork = mongoose.model('HomeWork');

        const [classCount, homeworkCount] = await Promise.all([
          Class.countDocuments({ teacher: userId, tenant: tenantId }),
          HomeWork.countDocuments({ createdBy: userId, tenant: tenantId }),
        ]);

        stats = {
          totalClasses: classCount,
          homeworkAssigned: homeworkCount,
        };
      }

      return stats;
    } catch (error) {
      logger.error(`Error fetching quick stats: ${error.message}`);
      return {};
    }
  }

  /**
   * Get class schedule data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Schedule data
   */
  async getClassScheduleData(userId, tenantId) {
    try {
      const ClassSchedule = mongoose.model('ClassSchedule');
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

      const schedule = await ClassSchedule.find({
        tenant: tenantId,
        day: today,
      })
        .sort({ startTime: 1 })
        .populate('subject teacher class');

      return schedule;
    } catch (error) {
      logger.error(`Error fetching schedule data: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent activities data
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Activity data
   */
  async getRecentActivitiesData(userId, tenantId) {
    try {
      const AuditLog = mongoose.model('AuditLog');
      
      const activities = await AuditLog.find({
        user: userId,
        tenant: tenantId,
      })
        .sort({ createdAt: -1 })
        .limit(10);

      return activities;
    } catch (error) {
      logger.error(`Error fetching activities: ${error.message}`);
      return [];
    }
  }

  /**
   * Create widget template
   * @param {Object} templateData - Template data
   * @param {string} tenantId - Tenant ID
   * @returns {Object} Template
   */
  async createWidgetTemplate(templateData, tenantId) {
    try {
      const template = new WidgetTemplate({
        ...templateData,
        tenant: tenantId,
      });

      await template.save();

      logger.info(`Widget template created: ${template._id}`);
      return template;
    } catch (error) {
      logger.error(`Error creating widget template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get widget templates
   * @param {string} role - User role
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Templates
   */
  async getWidgetTemplates(role, tenantId) {
    try {
      const templates = await WidgetTemplate.find({
        $or: [
          { tenant: tenantId },
          { tenant: null }, // Global templates
        ],
        roles: role,
        isActive: true,
      });

      return templates;
    } catch (error) {
      logger.error(`Error fetching widget templates: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reset dashboard to default
   * @param {string} userId - User ID
   * @param {string} role - User role
   * @param {string} tenantId - Tenant ID
   * @returns {Array} Default widgets
   */
  async resetToDefault(userId, role, tenantId) {
    try {
      // Delete existing widgets
      await DashboardWidget.deleteMany({
        user: userId,
        tenant: tenantId,
      });

      // Get default templates for role
      const templates = await this.getWidgetTemplates(role, tenantId);

      // Create default widgets
      const widgets = await Promise.all(
        templates.map((template, index) =>
          this.createWidget(
            userId,
            {
              widgetType: template.widgetType,
              title: template.name,
              size: template.defaultSize,
              settings: template.defaultSettings,
              order: index,
            },
            tenantId
          )
        )
      );

      logger.info(`Dashboard reset to default for user: ${userId}`);
      return widgets;
    } catch (error) {
      logger.error(`Error resetting dashboard: ${error.message}`);
      throw error;
    }
  }
}

export default new DashboardWidgetService();
