import Attendance from '../models/Attendance.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks } from '../utils/dateHelpers.js';

class AttendanceService {
  async getAttendanceStats(schoolId, dateRange = 'today') {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const [students, teachers, staff] = await Promise.all([
      this.getStatsForType(schoolId, 'student', startDate, endDate),
      this.getStatsForType(schoolId, 'teacher', startDate, endDate),
      this.getStatsForType(schoolId, 'staff', startDate, endDate)
    ]);

    return { students, teachers, staff };
  }

  async getStatsForType(schoolId, userType, startDate, endDate) {
    const stats = await Attendance.aggregate([
      {
        $match: {
          schoolId: schoolId,
          userType: userType,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      present: 0,
      absent: 0,
      late: 0,
      emergency: 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    // Get emergency count (present status)
    result.emergency = result.present;

    return result;
  }

  getDateRange(range) {
    const now = new Date();
    
    switch (range) {
      case 'today':
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now)
        };
      case 'this-week':
        return {
          startDate: startOfWeek(now),
          endDate: endOfWeek(now)
        };
      case 'last-week':
        const lastWeek = subWeeks(now, 1);
        return {
          startDate: startOfWeek(lastWeek),
          endDate: endOfWeek(lastWeek)
        };
      default:
        return {
          startDate: startOfDay(now),
          endDate: endOfDay(now)
        };
    }
  }

  async markAttendance(schoolId, userId, userType, status, markedBy, remarks = '') {
    const today = startOfDay(new Date());

    const attendance = await Attendance.findOneAndUpdate(
      {
        schoolId,
        userId,
        userType,
        date: today
      },
      {
        status,
        markedBy,
        remarks,
        checkInTime: status === 'present' || status === 'late' ? new Date() : null
      },
      {
        upsert: true,
        new: true
      }
    );

    return attendance;
  }

  async getAttendanceHistory(schoolId, userId, userType, startDate, endDate) {
    const attendance = await Attendance.find({
      schoolId,
      userId,
      userType,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    return attendance;
  }

  async getBulkAttendance(schoolId, userType, date) {
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    const attendance = await Attendance.find({
      schoolId,
      userType,
      date: { $gte: startDate, $lte: endDate }
    }).populate('userId', 'name email');

    return attendance;
  }
}

export default new AttendanceService();
/**
 * Get attendance with summary statistics
 */
async function getAttendanceWithSummary(schoolId, classId, sectionId, date) {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  let query = {
    schoolId,
    date: { $gte: startDate, $lte: endDate }
  };

  if (classId) {
    query.classId = classId;
  }
  if (sectionId) {
    query.sectionId = sectionId;
  }

  const attendance = await Attendance.find(query)
    .populate('userId', 'name email')
    .sort({ date: -1 });

  // Calculate summary
  const totalStudents = attendance.length;
  const present = attendance.filter(a => a.status === 'present').length;
  const absent = attendance.filter(a => a.status === 'absent').length;
  const late = attendance.filter(a => a.status === 'late').length;
  const percentage = totalStudents > 0 ? ((present / totalStudents) * 100).toFixed(2) : 0;

  return {
    attendance,
    summary: {
      total_students: totalStudents,
      present,
      absent,
      late,
      percentage: parseFloat(percentage)
    }
  };
}

// Add method to AttendanceService class
AttendanceService.prototype.getAttendanceWithSummary = getAttendanceWithSummary;

/**
 * Bulk mark attendance
 */
async function bulkMarkAttendance(schoolId, attendanceRecords, markedBy, date) {
  const attendanceDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
  
  const operations = attendanceRecords.map(record => ({
    updateOne: {
      filter: {
        schoolId,
        userId: record.userId,
        userType: record.userType,
        date: attendanceDate
      },
      update: {
        $set: {
          status: record.status,
          markedBy,
          remarks: record.remarks || '',
          checkInTime: (record.status === 'present' || record.status === 'late') ? new Date() : null
        }
      },
      upsert: true
    }
  }));

  const result = await Attendance.bulkWrite(operations);
  return { successful: result.upsertedCount + result.modifiedCount, total: attendanceRecords.length };
}

AttendanceService.prototype.bulkMarkAttendance = bulkMarkAttendance;

/**
 * Update attendance
 */
async function updateAttendance(id, schoolId, updates, updatedBy) {
  const attendance = await Attendance.findOneAndUpdate(
    { _id: id, schoolId },
    { ...updates, updatedBy },
    { new: true }
  );
  return attendance;
}

AttendanceService.prototype.updateAttendance = updateAttendance;

/**
 * Delete attendance
 */
async function deleteAttendance(id, schoolId) {
  const result = await Attendance.findOneAndDelete({ _id: id, schoolId });
  return result;
}

AttendanceService.prototype.deleteAttendance = deleteAttendance;

/**
 * Get attendance report
 */
async function getAttendanceReport(schoolId, startDate, endDate, options) {
  const { classId, sectionId, userType, format } = options;
  
  let query = {
    schoolId,
    date: { $gte: startDate, $lte: endDate }
  };

  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (userType) query.userType = userType;

  const attendance = await Attendance.find(query)
    .populate('userId', 'name email')
    .sort({ date: -1 });

  return {
    attendance,
    summary: {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length
    }
  };
}

AttendanceService.prototype.getAttendanceReport = getAttendanceReport;

/**
 * Get attendance percentage
 */
async function getAttendancePercentage(schoolId, userId, userType, startDate, endDate) {
  const total = await Attendance.countDocuments({
    schoolId,
    userId,
    userType,
    date: { $gte: startDate, $lte: endDate }
  });

  const present = await Attendance.countDocuments({
    schoolId,
    userId,
    userType,
    date: { $gte: startDate, $lte: endDate },
    status: { $in: ['present', 'late'] }
  });

  const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;
  return {
    userId,
    userType,
    total,
    present,
    absent: total - present,
    percentage: parseFloat(percentage)
  };
}

AttendanceService.prototype.getAttendancePercentage = getAttendancePercentage;

/**
 * Get low attendance users
 */
async function getLowAttendanceUsers(schoolId, threshold, options) {
  const { userType, classId, startDate, endDate, page, limit } = options;
  
  const skip = (page - 1) * limit;
  
  // Aggregate to get attendance percentages per user
  const pipeline = [
    { $match: { schoolId } },
    { $group: {
      _id: { userId: '$userId', userType: '$userType' },
      total: { $sum: 1 },
      present: {
        $sum: { $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0] }
      }
    }},
    { $project: {
      userId: '$_id.userId',
      userType: '$_id.userType',
      total: 1,
      present: 1,
      percentage: { $multiply: [{ $divide: ['$present', '$total'] }, 100] }
    }},
    { $match: { percentage: { $lt: threshold } } },
    { $skip: skip },
    { $limit: limit }
  ];

  if (userType) pipeline.splice(1, 0, { $match: { userType } });
  if (startDate && endDate) pipeline.splice(1, 0, { $match: { date: { $gte: startDate, $lte: endDate } } });

  const users = await Attendance.aggregate(pipeline);
  const total = await Attendance.countDocuments({ schoolId });

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

AttendanceService.prototype.getLowAttendanceUsers = getLowAttendanceUsers;
