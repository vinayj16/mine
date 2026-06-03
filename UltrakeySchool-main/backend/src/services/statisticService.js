import Statistic from '../models/Statistic.js';
import User from '../models/User.js';
import Fee from '../models/Fee.js';
import Attendance from '../models/Attendance.js';

class StatisticService {
  async getStatistic(institutionId, statId) {
    const stat = await Statistic.findOne({
      institutionId,
      statId,
      isActive: true
    }).sort({ createdAt: -1 }).lean();

    if (!stat) {
      return await this.calculateAndSaveStatistic(institutionId, statId);
    }

    return this.formatStatistic(stat);
  }

  async getAllStatistics(institutionId) {
    const stats = await Statistic.find({
      institutionId,
      isActive: true
    }).sort({ createdAt: -1 }).lean();

    const grouped = {};
    stats.forEach(stat => {
      if (!grouped[stat.statId] || new Date(stat.createdAt) > new Date(grouped[stat.statId].createdAt)) {
        grouped[stat.statId] = stat;
      }
    });

    return Object.values(grouped).map(this.formatStatistic);
  }

  async calculateAndSaveStatistic(institutionId, statId) {
    let statData;

    switch (statId) {
      case 'students':
        statData = await this.calculateStudentStats(institutionId);
        break;
      case 'teachers':
        statData = await this.calculateTeacherStats(institutionId);
        break;
      case 'revenue':
        statData = await this.calculateRevenueStats(institutionId);
        break;
      case 'attendance':
        statData = await this.calculateAttendanceStats(institutionId);
        break;
      default:
        throw new Error('Invalid statId');
    }

    const previousStat = await Statistic.findOne({
      institutionId,
      statId,
      isActive: true
    }).sort({ createdAt: -1 }).lean();

    if (previousStat) {
      const delta = ((statData.value - previousStat.value) / previousStat.value) * 100;
      statData.delta = Math.round(delta * 10) / 10;
      statData.deltaType = delta > 0 ? 'increase' : delta < 0 ? 'decrease' : 'neutral';
      statData.trend = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
      statData.previousPeriod = {
        value: previousStat.value,
        delta: statData.delta
      };
    }

    const stat = new Statistic({
      institutionId,
      ...statData
    });

    await stat.save();
    return this.formatStatistic(stat.toObject());
  }

  async calculateStudentStats(institutionId) {
    const students = await User.find({ institutionId, role: 'student' });
    const active = students.filter(s => s.isActive).length;
    const inactive = students.filter(s => !s.isActive).length;

    return {
      statId: 'students',
      label: 'Total Students',
      value: students.length,
      active,
      inactive,
      icon: '/assets/img/icons/student.svg',
      category: 'academic',
      period: 'this-month',
      thresholds: {
        warning: 2500,
        critical: 2000
      },
      metadata: {}
    };
  }

  async calculateTeacherStats(institutionId) {
    const teachers = await User.find({ institutionId, role: 'teacher' });
    const active = teachers.filter(t => t.isActive).length;
    const inactive = teachers.filter(t => !t.isActive).length;

    return {
      statId: 'teachers',
      label: 'Total Teachers',
      value: teachers.length,
      active,
      inactive,
      icon: '/assets/img/icons/teacher.svg',
      category: 'staff',
      period: 'this-month',
      thresholds: {
        warning: 140,
        critical: 130
      },
      metadata: {}
    };
  }

  async calculateRevenueStats(institutionId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const fees = await Fee.find({
      institutionId,
      date: { $gte: startOfMonth },
      isActive: true
    });

    const totalRevenue = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const collected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.paidAmount, 0);
    const pending = fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.remainingAmount, 0);

    return {
      statId: 'revenue',
      label: 'Total Revenue',
      value: totalRevenue,
      active: collected,
      inactive: pending,
      icon: '/assets/img/icons/revenue.svg',
      category: 'finance',
      period: 'this-month',
      thresholds: {
        warning: 100000,
        critical: 80000
      },
      metadata: {}
    };
  }

  async calculateAttendanceStats(institutionId) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const attendanceRecords = await Attendance.find({
      institutionId,
      date: { $gte: startOfMonth },
      userType: 'student'
    });

    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(a => a.status === 'present' || a.status === 'late').length;
    const absentRecords = attendanceRecords.filter(a => a.status === 'absent').length;

    const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    return {
      statId: 'attendance',
      label: 'Average Attendance',
      value: Math.round(attendanceRate * 10) / 10,
      active: presentRecords,
      inactive: absentRecords,
      icon: '/assets/img/icons/attendance.svg',
      category: 'academic',
      period: 'this-month',
      thresholds: {
        warning: 85,
        critical: 75
      },
      metadata: {}
    };
  }

  async refreshAllStatistics(institutionId) {
    const statIds = ['students', 'teachers', 'revenue', 'attendance'];
    const results = [];

    for (const statId of statIds) {
      try {
        const stat = await this.calculateAndSaveStatistic(institutionId, statId);
        results.push(stat);
      } catch (error) {
        console.error(`Error refreshing ${statId}:`, error);
      }
    }

    return results;
  }

  async acknowledgeAlert(institutionId, statId, alertId) {
    const stat = await Statistic.findOne({
      institutionId,
      statId,
      isActive: true
    }).sort({ createdAt: -1 });

    if (!stat) {
      throw new Error('Statistic not found');
    }

    const alert = stat.alerts.id(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.acknowledged = true;
    await stat.save();

    return this.formatStatistic(stat.toObject());
  }

  async getStatisticHistory(institutionId, statId, limit = 30) {
    const stats = await Statistic.find({
      institutionId,
      statId,
      isActive: true
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

    return stats.map(this.formatStatistic);
  }

  formatStatistic(stat) {
    return {
      id: stat.statId,
      label: stat.label,
      value: stat.value,
      formattedValue: this.formatValue(stat.value, stat.statId),
      delta: stat.delta || 0,
      deltaFormatted: this.formatDelta(stat.delta || 0, stat.statId),
      deltaType: stat.deltaType || 'neutral',
      active: stat.active,
      inactive: stat.inactive,
      total: stat.total,
      icon: stat.icon,
      category: stat.category,
      trend: stat.trend || 'stable',
      period: stat.period,
      previousPeriod: stat.previousPeriod,
      thresholds: stat.thresholds,
      alerts: stat.alerts || [],
      lastUpdated: stat.updatedAt || stat.createdAt,
      metadata: stat.metadata || {}
    };
  }

  formatValue(value, statId) {
    if (statId === 'revenue') {
      return `$${value.toLocaleString()}`;
    } else if (statId === 'attendance') {
      return `${value}%`;
    }
    return value.toLocaleString();
  }

  formatDelta(delta, statId) {
    const sign = delta > 0 ? '+' : '';
    if (statId === 'revenue') {
      return `${sign}$${Math.abs(delta).toFixed(1)}%`;
    }
    return `${sign}${delta}%`;
  }

  // Frontend-compatible methods
  async getDashboardData(institutionId, params = {}) {
    const [students, teachers, attendance, revenue] = await Promise.all([
      this.calculateStudentStats(institutionId),
      this.calculateTeacherStats(institutionId),
      this.calculateAttendanceStats(institutionId),
      this.calculateRevenueStats(institutionId)
    ]);

    return {
      students: this.formatStatistic({ ...students, statId: 'students' }),
      teachers: this.formatStatistic({ ...teachers, statId: 'teachers' }),
      attendance: this.formatStatistic({ ...attendance, statId: 'attendance' }),
      revenue: this.formatStatistic({ ...revenue, statId: 'revenue' })
    };
  }

  async getStudentStats(institutionId, params = {}) {
    const stats = await this.calculateStudentStats(institutionId);
    return this.formatStatistic({ ...stats, statId: 'students' });
  }

  async getTeacherStats(institutionId, params = {}) {
    const stats = await this.calculateTeacherStats(institutionId);
    return this.formatStatistic({ ...stats, statId: 'teachers' });
  }

  async getAttendanceStats(institutionId, params = {}) {
    const stats = await this.calculateAttendanceStats(institutionId);
    return this.formatStatistic({ ...stats, statId: 'attendance' });
  }
}

export default new StatisticService();
