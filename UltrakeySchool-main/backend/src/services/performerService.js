import Performer from '../models/Performer.js';
import User from '../models/User.js';
import Attendance from '../models/Attendance.js';

class PerformerService {
  /**
   * Get best performers (teachers and students) for dashboard
   */
  async getBestPerformers(schoolId, options = {}) {
    const {
      limit = 5,
      period = 'current'
    } = options;

    const [teachers, students] = await Promise.all([
      this.getTopPerformersByType(schoolId, 'teacher', limit, period),
      this.getTopPerformersByType(schoolId, 'student', limit, period)
    ]);

    return [
      {
        type: 'teachers',
        title: 'Best Performer',
        backgroundColor: 'bg-success-800',
        className: 'bg-01',
        performers: teachers
      },
      {
        type: 'students',
        title: 'Star Students',
        backgroundColor: 'bg-info',
        className: 'bg-02',
        performers: students
      }
    ];
  }

  /**
   * Get top performers by type (teacher or student)
   */
  async getTopPerformersByType(schoolId, type, limit = 5, period = 'current') {
    const query = {
      schoolId,
      type,
      isActive: true
    };

    // Add period filter if specified
    if (period !== 'all') {
      const now = new Date();
      query['period.year'] = now.getFullYear();
      
      if (period === 'current') {
        query['period.month'] = now.getMonth() + 1;
      }
    }

    const performers = await Performer.find(query)
      .sort({ 'metrics.totalScore': -1, 'performance.rating': -1 })
      .limit(limit)
      .lean();

    return performers.map(p => ({
      id: p._id.toString(),
      name: p.name,
      role: p.role,
      class: p.class,
      imageUrl: p.imageUrl,
      title: type === 'teacher' ? 'Best Performer' : 'Star Students',
      type: p.type,
      achievements: p.achievements || [],
      performance: p.performance
    }));
  }

  /**
   * Get featured performers (manually selected)
   */
  async getFeaturedPerformers(schoolId) {
    const performers = await Performer.find({
      schoolId,
      isFeatured: true,
      isActive: true
    })
    .sort({ featuredOrder: 1 })
    .lean();

    const teachers = performers.filter(p => p.type === 'teacher');
    const students = performers.filter(p => p.type === 'student');

    return [
      {
        type: 'teachers',
        title: 'Best Performer',
        backgroundColor: 'bg-success-800',
        className: 'bg-01',
        performers: teachers.map(this.formatPerformer)
      },
      {
        type: 'students',
        title: 'Star Students',
        backgroundColor: 'bg-info',
        className: 'bg-02',
        performers: students.map(this.formatPerformer)
      }
    ];
  }

  /**
   * Create or update performer record
   */
  async upsertPerformer(schoolId, performerData) {
    const {
      userId,
      type,
      name,
      role,
      classInfo,
      imageUrl,
      achievements,
      performance,
      metrics,
      period
    } = performerData;

    const now = new Date();
    const defaultPeriod = period || {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      quarter: Math.ceil((now.getMonth() + 1) / 3)
    };

    const performer = await Performer.findOneAndUpdate(
      {
        schoolId,
        userId,
        type,
        'period.month': defaultPeriod.month,
        'period.year': defaultPeriod.year
      },
      {
        $set: {
          name,
          role,
          class: classInfo,
          imageUrl: imageUrl || '/assets/img/placeholder-avatar.webp',
          achievements: achievements || [],
          performance: performance || {},
          metrics: metrics || {},
          period: defaultPeriod
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    return performer;
  }

  /**
   * Calculate and update performer metrics automatically
   */
  async calculatePerformerMetrics(schoolId, userId, type) {
    // Get user data
    const user = await User.findOne({ _id: userId, schoolId });
    if (!user) {
      throw new Error('User not found');
    }

    // Calculate attendance percentage
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const attendanceRecords = await Attendance.find({
      schoolId,
      userId,
      userType: type === 'teacher' ? 'teacher' : 'student',
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(a => 
      a.status === 'present' || a.status === 'late'
    ).length;
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Base performance data
    const performerData = {
      userId,
      type,
      name: user.name,
      role: type === 'teacher' ? user.department || 'Teacher' : user.classId || 'Student',
      classInfo: user.classId,
      imageUrl: user.profileImage || '/assets/img/placeholder-avatar.webp',
      performance: {
        attendance: Math.round(attendancePercentage),
        rating: 0 // Will be calculated based on other metrics
      },
      metrics: {
        assignmentCompletion: 0,
        behaviorScore: 8 // Default good behavior
      }
    };

    // Calculate rating based on attendance and other factors
    performerData.performance.rating = this.calculateRating(performerData);

    // Upsert performer record
    return await this.upsertPerformer(schoolId, performerData);
  }

  /**
   * Calculate overall rating
   */
  calculateRating(performerData) {
    const { performance, metrics } = performerData;
    
    // Simple rating calculation based on available metrics
    let rating = 0;
    let factors = 0;

    if (performance.attendance !== undefined) {
      rating += (performance.attendance / 100) * 10;
      factors++;
    }

    if (metrics.assignmentCompletion !== undefined) {
      rating += (metrics.assignmentCompletion / 100) * 10;
      factors++;
    }

    if (metrics.behaviorScore !== undefined) {
      rating += metrics.behaviorScore;
      factors++;
    }

    return factors > 0 ? Math.round((rating / factors) * 10) / 10 : 0;
  }

  /**
   * Set featured performers
   */
  async setFeaturedPerformers(schoolId, performerIds) {
    // Unset all featured performers
    await Performer.updateMany(
      { schoolId },
      { $set: { isFeatured: false, featuredOrder: 0 } }
    );

    // Set new featured performers with order
    const updates = performerIds.map((id, index) => 
      Performer.findByIdAndUpdate(
        id,
        { $set: { isFeatured: true, featuredOrder: index + 1 } },
        { new: true }
      )
    );

    return await Promise.all(updates);
  }

  /**
   * Get performer details by ID
   */
  async getPerformerById(schoolId, performerId) {
    const performer = await Performer.findOne({
      _id: performerId,
      schoolId
    }).lean();

    if (!performer) {
      throw new Error('Performer not found');
    }

    return this.formatPerformer(performer);
  }

  /**
   * Delete performer record
   */
  async deletePerformer(schoolId, performerId) {
    const result = await Performer.findOneAndUpdate(
      { _id: performerId, schoolId },
      { $set: { isActive: false } },
      { new: true }
    );

    return result;
  }

  /**
   * Bulk update performers for a period
   */
  async bulkUpdatePerformers(schoolId, type, period) {
    const users = await User.find({
      schoolId,
      role: type,
      isActive: true
    });

    const updates = users.map(user => 
      this.calculatePerformerMetrics(schoolId, user._id, type)
    );

    return await Promise.all(updates);
  }

  /**
   * Format performer data for API response
   */
  formatPerformer(performer) {
    return {
      id: performer._id.toString(),
      name: performer.name,
      role: performer.role,
      class: performer.class,
      imageUrl: performer.imageUrl,
      title: performer.type === 'teacher' ? 'Best Performer' : 'Star Students',
      type: performer.type,
      achievements: performer.achievements || [],
      performance: performer.performance
    };
  }
}

export default new PerformerService();
