import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import Staff from '../models/Staff.js';
import notificationService from './notificationService.js';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks } from '../utils/dateHelpers.js';

class AttendanceService {
  async getAttendanceStats(institutionId, dateRange = 'today') {
    const { startDate, endDate } = this.getDateRange(dateRange);

    const [students, teachers, staff] = await Promise.all([
      this.getStatsForType(institutionId, 'student', startDate, endDate),
      this.getStatsForType(institutionId, 'teacher', startDate, endDate),
      this.getStatsForType(institutionId, 'staff', startDate, endDate)
    ]);

    return { students, teachers, staff };
  }

  async getStatsForType(institutionId, userType, startDate, endDate) {
    const stats = await Attendance.aggregate([
      {
        $match: {
          institutionId: institutionId,
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

  async markAttendance(institutionId, userId, userType, status, markedBy, remarks = '') {
    const today = startOfDay(new Date());

    const attendance = await Attendance.findOneAndUpdate(
      {
        institutionId,
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

  async getAttendanceHistory(institutionId, userId, userType, startDate, endDate) {
    const attendance = await Attendance.find({
      institutionId,
      userId,
      userType,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    return attendance;
  }

  async getBulkAttendance(institutionId, userType, date, options = {}) {
    const { classId, sectionId } = options;
    const startDate = startOfDay(date);
    const endDate = endOfDay(date);

    // 1. Fetch all relevant users based on type
    let users = [];
    if (userType === 'staff') {
      // Fetch from User model with staff-related roles
      users = await User.find({
        institutionId,
        role: { $in: ['staff_member', 'hr_manager', 'accountant', 'librarian', 'transport_manager', 'hostel_warden'] }
      }).select('name email avatar role department designation');

      // Auto-seed demo staff if none exist (for demo purposes as requested)
      if (users.length === 0) {
        const demoStaff = [
          {
            name: 'John Staff',
            email: `john.staff.${institutionId}@example.com`,
            role: 'staff_member',
            institutionId,
            department: 'Administration',
            designation: 'Receptionist',
            status: 'active'
          },
          {
            name: 'Sarah HR',
            email: `sarah.hr.${institutionId}@example.com`,
            role: 'hr_manager',
            institutionId,
            department: 'HR',
            designation: 'HR Manager',
            status: 'active'
          }
        ];
        // Create demo users
        await User.insertMany(demoStaff);
        // Fetch again
        users = await User.find({
          institutionId,
          role: { $in: ['staff_member', 'hr_manager', 'accountant', 'librarian', 'transport_manager', 'hostel_warden'] }
        }).select('name email avatar role department designation');
      }
    } else if (userType === 'teacher') {
      users = await User.find({
        institutionId,
        role: 'teacher'
      }).select('name email avatar department designation');
    } else if (userType === 'student') {
      const query = { institutionId, role: 'student' };
      if (classId) query.class = classId;
      if (sectionId) query.section = sectionId;
      users = await User.find(query).select('name email avatar class section rollNumber admissionNumber');
    }

    // 2. Fetch attendance records for these users on this date
    const attendanceRecords = await Attendance.find({
      institutionId,
      userType,
      date: { $gte: startDate, $lte: endDate }
    });

    // 3. Merge users with their attendance
    const attendanceMap = {};
    attendanceRecords.forEach(rec => {
      attendanceMap[rec.userId.toString()] = rec;
    });

    const result = users.map(user => {
      const att = attendanceMap[user._id.toString()];
      return {
        _id: att?._id,
        userId: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        staffId: user._id, // For frontend compatibility
        staffName: user.name,
        staffAvatar: user.avatar,
        department: user.department || 'General',
        designation: user.designation || user.role,
        userType,
        date: startDate,
        status: att?.status || 'absent', // Default to absent if no record
        attendance: att?.status || 'absent', // For frontend compatibility
        remarks: att?.remarks || '',
        notes: att?.remarks || '', // For frontend compatibility
        checkInTime: att?.checkInTime,
        checkOutTime: att?.checkOutTime
      };
    });

    return result;
  }
}

export default new AttendanceService();
/**
 * Get attendance with summary statistics
 */
async function getAttendanceWithSummary(institutionId, classId, sectionId, date) {
  const startDate = startOfDay(date);
  const endDate = endOfDay(date);

  let query = {
    institutionId,
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
async function bulkMarkAttendance(institutionId, attendanceRecords, markedBy, date) {
  const attendanceDate = date ? startOfDay(new Date(date)) : startOfDay(new Date());
  
  const operations = attendanceRecords.map(record => ({
    updateOne: {
      filter: {
        institutionId,
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
  
  // Create notifications for marked users
  try {
    const users = await User.find({ _id: { $in: attendanceRecords.map(r => r.userId) } }).select('name').lean();
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u.name; });
    
    const notificationPromises = attendanceRecords.map(record => {
      const userName = userMap[record.userId.toString()] || 'User';
      return notificationService.createNotification(institutionId, {
        recipientId: record.userId,
        type: 'info',
        title: 'Attendance Marked',
        message: `Your attendance has been marked as ${record.status} for ${attendanceDate.toISOString().split('T')[0]}`,
        metadata: { attendanceDate: attendanceDate.toISOString(), status: record.status, markedBy }
      }).catch(() => {});
    });
    await Promise.all(notificationPromises);
  } catch (notifErr) {
    console.error('Error creating attendance notifications:', notifErr);
  }
  
  return { successful: result.upsertedCount + result.modifiedCount, total: attendanceRecords.length };
}

AttendanceService.prototype.bulkMarkAttendance = bulkMarkAttendance;

/**
 * Update attendance
 */
async function updateAttendance(id, institutionId, updates, updatedBy) {
  const attendance = await Attendance.findOneAndUpdate(
    { _id: id, institutionId },
    { ...updates, updatedBy },
    { new: true }
  );
  return attendance;
}

AttendanceService.prototype.updateAttendance = updateAttendance;

/**
 * Delete attendance
 */
async function deleteAttendance(id, institutionId) {
  const result = await Attendance.findOneAndDelete({ _id: id, institutionId });
  return result;
}

AttendanceService.prototype.deleteAttendance = deleteAttendance;

/**
 * Get attendance report
 */
async function getAttendanceReport(institutionId, startDate, endDate, options) {
  const { classId, sectionId, userType, format } = options;
  
  let query = {
    institutionId,
    date: { $gte: startDate, $lte: endDate }
  };

  if (classId) query.classId = classId;
  if (sectionId) query.sectionId = sectionId;
  if (userType) query.userType = userType;

  const attendance = await Attendance.find(query)
    .sort({ date: -1 });

  // If userType is 'student', attach student names
  if (userType === 'student') {
    const studentIds = [...new Set(attendance.map(a => a.studentId).filter(Boolean))];
    const Student = (await import('../models/Student.js')).default;
    const students = await Student.find({ _id: { $in: studentIds } }).select('firstName lastName userId').lean();
    const studentMap = {};
    for (const s of students) {
      studentMap[s._id.toString()] = s;
    }
    for (const a of attendance) {
      const student = studentMap[a.studentId?.toString()];
      if (student) {
        a.userId = student.userId;
        a._doc = a._doc || a;
        a._doc.userId = { _id: student.userId, name: student.firstName + ' ' + student.lastName };
      }
    }
  }

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
async function getAttendancePercentage(institutionId, userId, userType, startDate, endDate) {
  const total = await Attendance.countDocuments({
    institutionId,
    userId,
    userType,
    date: { $gte: startDate, $lte: endDate }
  });

  const present = await Attendance.countDocuments({
    institutionId,
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
async function getLowAttendanceUsers(institutionId, threshold, options) {
  const { userType, classId, startDate, endDate, page, limit } = options;
  
  const skip = (page - 1) * limit;
  
  // Aggregate to get attendance percentages per user
  const pipeline = [
    { $match: { institutionId } },
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
  const total = await Attendance.countDocuments({ institutionId });

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
