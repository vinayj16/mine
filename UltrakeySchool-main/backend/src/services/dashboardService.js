import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Staff from '../models/Staff.js';
import Attendance from '../models/Attendance.js';
import HomeWork from '../models/HomeWork.js';
import Fee from '../models/Fee.js';
import Notification from '../models/Notification.js';
import PTMSlot from '../models/PTMSlot.js';
import Event from '../models/Event.js';
import School from '../models/School.js';
import Leave from '../models/Leave.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import logger from '../utils/logger.js';

class DashboardService {
  /**
   * Get Student Dashboard Data
   */
  async getStudentDashboard(userId, schoolId, institutionId = null) {
    // Build query with institution filter
    const studentQuery = { userId, schoolId };
    if (institutionId) {
      studentQuery.institutionId = institutionId;
    }

    const student = await Student.findOne(studentQuery)
      .populate('classId', 'name grade')
      .populate('sectionId', 'name');

    if (!student) {
      throw new Error('Student not found');
    }
op
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's schedule
    const todaySchedule = await this.getTodaySchedule(student.classId, student.sectionId);

    // Get attendance stats
    const attendanceStats = await this.getAttendanceStats(student._id, schoolId);

    // Get pending assignments
    const pendingAssignments = await HomeWork.find({
      schoolId,
      classId: student.classId,
      dueDate: { $gte: today },
      status: 'published'
    })
      .populate('subjectId', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    // Get fee status
    const feeStatus = await this.getFeeStatus(student._id, schoolId);

    // Get recent notifications
    const notifications = await Notification.find({
      schoolId,
      recipientId: userId,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      schoolId,
      date: { $gte: today },
      isActive: true
    })
      .sort({ date: 1 })
      .limit(5);

    // Get recent messages count
    const unreadMessages = await this.getUnreadMessagesCount(userId, schoolId);

    return {
      student: {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        class: student.classId?.name,
        section: student.sectionId?.name,
        rollNumber: student.rollNumber,
        avatar: student.documents?.find(d => d.type === 'photo')?.url
      },
      quickStats: {
        attendance: attendanceStats.percentage,
        pendingAssignments: pendingAssignments.length,
        feeStatus: feeStatus.status,
        unreadMessages
      },
      todaySchedule,
      pendingAssignments: pendingAssignments.map(hw => ({
        id: hw._id,
        title: hw.title,
        subject: hw.subjectId?.name,
        dueDate: hw.dueDate,
        status: this.getHomeworkStatus(hw, student._id)
      })),
      feeStatus,
      notifications: notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        isRead: n.isRead
      })),
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        type: e.type
      }))
    };
  }

  /**
   * Get Teacher Dashboard Data
   */
  async getTeacherDashboard(userId, schoolId) {
    const teacher = await Teacher.findOne({ userId, schoolId })
      .populate('departmentId', 'name')
      .populate('classTeacherOf', 'name grade');

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's schedule
    const todaySchedule = await this.getTeacherSchedule(teacher._id, schoolId, today);

    // Get class statistics (if class teacher)
    let classStats = null;
    if (teacher.classTeacherOf) {
      classStats = await this.getClassStatistics(teacher.classTeacherOf, schoolId);
    }

    // Get pending tasks
    const pendingTasks = await this.getTeacherPendingTasks(teacher._id, schoolId);

    // Get recent messages
    const messages = await this.getRecentMessages(userId, schoolId, 3);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      schoolId,
      date: { $gte: today },
      isActive: true
    })
      .sort({ date: 1 })
      .limit(5);

    // Get recent activities
    const recentActivities = await this.getTeacherRecentActivities(teacher._id, schoolId);

    return {
      teacher: {
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        department: teacher.departmentId?.name,
        classTeacher: teacher.classTeacherOf?.name,
        avatar: teacher.profileImage
      },
      quickStats: {
        studentsInClass: classStats?.totalStudents || 0,
        presentToday: classStats?.presentToday || 0,
        pendingTasks: pendingTasks.length,
        unreadMessages: messages.unreadCount
      },
      todaySchedule,
      classStats,
      pendingTasks,
      messages: messages.messages,
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        type: e.type
      })),
      recentActivities
    };
  }

  /**
   * Get Staff Dashboard Data
   */
  async getStaffDashboard(userId, schoolId, institutionId = null) {
    // Try to find staff in Staff collection first (for HRM staff records)
    let staffQuery = { _id: userId };
    if (schoolId) staffQuery.schoolId = schoolId;
    if (institutionId) {
      staffQuery.institutionId = institutionId;
    }

    let staff = await Staff.findOne(staffQuery);

    // If not found in Staff collection, try UserCredential (for staff role users)
    if (!staff) {
      const UserCredential = (await import('../models/UserCredential.js')).default;
      const userCredentialQuery = { _id: userId };
      if (institutionId) {
        userCredentialQuery.institutionId = institutionId;
      }
      const userCredential = await UserCredential.findOne(userCredentialQuery);
      
      if (userCredential) {
        // Return a basic dashboard for UserCredential staff users
        return {
          staff: {
            id: userCredential._id,
            name: userCredential.fullName,
            department: 'General',
            designation: userCredential.role,
            avatar: null,
            employeeId: userCredential.userId
          },
          teacher: {
            id: userCredential._id,
            name: userCredential.fullName,
            subject: userCredential.role,
            avatar: null,
            classes: []
          },
          quickStats: {
            presentToday: 0,
            pendingLeaves: 0,
            unreadMessages: 0,
            workingDays: 0,
            studentsInClass: 0,
            pendingTasks: 0
          },
          todaySchedule: [],
          classStats: {
            totalStudents: 0,
            presentToday: 0,
            absentToday: 0,
            attendanceRate: 0,
            total: 0,
            assigned: 0,
            completed: 0
          },
          recentActivities: [],
          upcomingEvents: []
        };
      }
    }

    // Fallback: Try User collection
    if (!staff) {
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (user) {
        return {
          staff: { id: user._id, name: user.name, department: 'General', designation: user.role, avatar: user.avatar, employeeId: user._id },
          teacher: { id: user._id, name: user.name, subject: user.role, avatar: user.avatar, classes: [] },
          quickStats: { presentToday: 0, pendingLeaves: 0, unreadMessages: 0, workingDays: 0, studentsInClass: 0, pendingTasks: 0 },
          todaySchedule: [], classStats: { totalStudents: 0, presentToday: 0, absentToday: 0, attendanceRate: 0, total: 0, assigned: 0, completed: 0 },
          recentActivities: [], upcomingEvents: []
        };
      }
    }

    if (!staff) throw new Error('Staff not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance
    const todayAttendance = staff.attendance?.find(a => a.date === today.toISOString().split('T')[0]) || null;

    // Get pending leave requests
    const pendingLeaves = await Leave.find({
      staffId: staff.staffId,
      status: 'pending'
    }).sort({ createdAt: -1 }).limit(5);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      schoolId,
      date: { $gte: today },
      isActive: true
    })
      .sort({ date: 1 })
      .limit(5);

    // Get recent messages
    const messages = await this.getRecentMessages(userId, schoolId, 3);

    // Get recent activities (from attendance records)
    const recentActivities = staff.attendance
      ?.filter(a => new Date(a.date) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000))
      .map(a => ({
        type: 'attendance',
        description: `Marked ${a.status}`,
        date: a.date
      })) || [];

    return {
      staff: {
        id: staff._id,
        name: staff.fullName,
        department: staff.departmentName,
        designation: staff.designationName,
        avatar: staff.avatar,
        employeeId: staff.employeeId
      },
      teacher: {
        id: staff._id,
        name: staff.fullName,
        subject: staff.designationName,
        avatar: staff.avatar,
        classes: []
      },
      quickStats: {
        presentToday: todayAttendance?.status === 'present' ? 1 : 0,
        pendingLeaves: pendingLeaves.length,
        unreadMessages: messages.unreadCount,
        workingDays: staff.attendance?.filter(a => a.status === 'present').length || 0,
        studentsInClass: 0,
        pendingTasks: 0
      },
      todaySchedule: [],
      classStats: {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: 0,
        total: 0,
        assigned: 0,
        completed: 0
      },
      pendingTasks: [],
      todayAttendance,
      pendingLeaves,
      messages: messages.messages,
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        type: e.type
      })),
      recentActivities
    };
  }

  /**
   * Get Parent Dashboard Data
   */
  async getParentDashboard(userId, schoolId) {
    // Get all children
    const children = await Student.find({ parentId: userId, schoolId, isActive: true })
      .populate('classId', 'name grade')
      .populate('sectionId', 'name');

    if (!children || children.length === 0) {
      throw new Error('No children found');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get progress for each child
    const childrenProgress = await Promise.all(
      children.map(async (child) => {
        const attendance = await this.getAttendanceStats(child._id, schoolId);
        const grades = await this.getAverageGrades(child._id, schoolId);
        const rank = await this.getStudentRank(child._id, child.classId, schoolId);

        return {
          id: child._id,
          name: `${child.firstName} ${child.lastName}`,
          class: child.classId?.name,
          section: child.sectionId?.name,
          avatar: child.documents?.find(d => d.type === 'photo')?.url,
          attendance: attendance.percentage,
          grades: grades.average,
          rank: rank.rank,
          totalStudents: rank.total
        };
      })
    );

    // Get combined fee status
    const feeStatus = await this.getCombinedFeeStatus(children.map(c => c._id), schoolId);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      schoolId,
      date: { $gte: today },
      isActive: true
    })
      .sort({ date: 1 })
      .limit(5);

    // Get recent messages
    const messages = await this.getRecentMessages(userId, schoolId, 5);

    // Get notifications
    const notifications = await Notification.find({
      schoolId,
      recipientId: userId,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming PTM slots
    const ptmSlots = await PTMSlot.find({
      schoolId,
      bookedBy: userId,
      date: { $gte: today },
      status: 'booked'
    })
      .populate('teacherId', 'firstName lastName')
      .sort({ date: 1 })
      .limit(3);

    return {
      parent: {
        id: userId,
        childrenCount: children.length
      },
      children: childrenProgress,
      feeStatus,
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        type: e.type
      })),
      messages: messages.messages,
      notifications: notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        isRead: n.isRead
      })),
      ptmSlots: ptmSlots.map(slot => ({
        id: slot._id,
        teacher: `${slot.teacherId?.firstName} ${slot.teacherId?.lastName}`,
        date: slot.date,
        time: `${slot.startTime} - ${slot.endTime}`
      }))
    };
  }

/**
   * Get Admin Dashboard Data
   */
  async getAdminDashboard(schoolId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Return basic data to avoid errors
    return {
      overview: {
        totalStudents: 0,
        totalTeachers: 0,
        totalClasses: 0,
        activeStudents: 0,
        presentToday: 0,
        pendingFees: 0
      },
      recentActivities: [],
      upcomingEvents: [],
      attendanceOverview: {},
      feeStats: {}
    };
  }

  // Helper methods
  async getTodaySchedule(classId, sectionId) {
    // Implementation for getting today's class schedule
    return [];
  }

  async getAttendanceStats(studentId, schoolId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendance = await Attendance.find({
      userId: studentId,
      schoolId,
      date: { $gte: thirtyDaysAgo }
    });

    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    return { total, present, percentage };
  }

  async getFeeStatus(studentId, schoolId) {
    const fees = await Fee.find({ studentId, schoolId });
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const pendingAmount = totalAmount - paidAmount;

    return {
      status: pendingAmount === 0 ? 'Paid' : 'Pending',
      totalAmount,
      paidAmount,
      pendingAmount
    };
  }

  getHomeworkStatus(homework, studentId) {
    const submission = homework.submissions?.find(s => s.studentId.toString() === studentId.toString());
    if (!submission) return 'pending';
    return submission.status;
  }

  async getUnreadMessagesCount(userId, schoolId) {
    // Implementation for getting unread messages count
    return 0;
  }

  async getTeacherSchedule(teacherId, schoolId, date) {
    // Implementation for getting teacher's schedule
    return [];
  }

  async getClassStatistics(classId, schoolId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalStudents = await Student.countDocuments({ classId, schoolId, isActive: true });
    const presentToday = await Attendance.countDocuments({
      schoolId,
      date: today,
      status: 'present',
      userType: 'student'
    });

    return {
      totalStudents,
      presentToday,
      absentToday: totalStudents - presentToday,
      attendancePercentage: totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(2) : 0
    };
  }

  async getTeacherPendingTasks(teacherId, schoolId) {
    // Implementation for getting teacher's pending tasks
    return [];
  }

  async getRecentMessages(userId, schoolId, limit = 5) {
    // Implementation for getting recent messages
    return { messages: [], unreadCount: 0 };
  }

  async getTeacherRecentActivities(teacherId, schoolId) {
    // Implementation for getting teacher's recent activities
    return [];
  }

  async getAverageGrades(studentId, schoolId) {
    // Implementation for calculating average grades
    return { average: 0 };
  }

  async getStudentRank(studentId, classId, schoolId) {
    // Implementation for getting student rank
    return { rank: 0, total: 0 };
  }

  async getCombinedFeeStatus(studentIds, schoolId) {
    const fees = await Fee.find({ studentId: { $in: studentIds }, schoolId });
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
      status: totalAmount === paidAmount ? 'Paid' : 'Pending'
    };
  }

  async getTotalClasses(schoolId) {
    // Implementation for getting total classes
    return 0;
  }

  async getRecentAdmissions(schoolId, days) {
    // Implementation for getting recent admissions
    return 0;
  }

  async getAttendanceOverview(schoolId, date) {
    // Implementation for getting attendance overview
    return {};
  }

  async getFeeCollectionStats(schoolId) {
    // Implementation for getting fee collection stats
    return {};
  }

  /**
   * Get institute admin dashboard data
   */
async getInstituteAdminDashboard(institutionId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const institutionIdStr = institutionId.toString();

    // Simple direct query for users
    const mongoose = require('mongoose');
    const User = mongoose.model('User');
    const Institution = mongoose.model('Institution');
    
    // Find users with this institution
    const users = await User.find({ institutionId: new mongoose.Types.ObjectId(institutionIdStr) });
    
    // Get institution details
    const institution = await Institution.findById(institutionIdStr);
    const institutionName = institution?.name || 'My Institution';
    
    // Count by role
    const counts = { teacher: 0, student: 0, parent: 0, admin: 0, institution_admin: 0, staff_member: 0, principal: 0 };
    users.forEach(u => {
      const role = u.role || 'other';
      if (counts[role] !== undefined) counts[role]++;
    });

    const totalTeachers = counts.teacher;
    const totalStudents = counts.student;
    const totalStaff = counts.admin + counts.institution_admin + counts.staff_member;

    return {
      welcomeMessage: `Welcome Back, ${institutionName} Admin`,
      lastUpdated: today.toLocaleDateString(),
      recentAlert: null,
      topStats: [
        { label: 'Total Schools', value: 1, sub: 'Active institutions', icon: '/assets/img/icons/building.svg', avatarTone: 'bg-primary-transparent', delta: '+0', deltaTone: 'badge-soft-success' },
        { label: 'Total Students', value: totalStudents, sub: 'Enrolled students', icon: '/assets/img/icons/students.svg', avatarTone: 'bg-success-transparent', delta: '+0', deltaTone: 'badge-soft-success' },
        { label: 'Total Teachers', value: totalTeachers, sub: 'Teaching staff', icon: '/assets/img/icons/teacher.svg', avatarTone: 'bg-warning-transparent', delta: '+0', deltaTone: 'badge-soft-success' },
        { label: 'Total Staff', value: totalStaff, sub: 'Admin & support staff', icon: '/assets/img/icons/staff.svg', avatarTone: 'bg-info-transparent', delta: '+0', deltaTone: 'badge-soft-success' }
      ],
      schoolsOverview: [{ id: institutionId, name: institutionName, location: institution?.contact?.city || 'N/A', students: totalStudents, teachers: totalTeachers, status: 'Active', statusClass: 'badge-soft-success' }],
      financialSummary: [{ label: 'Pending Fees', value: 0, icon: 'ti ti-clock' }, { label: 'Collected', value: 0, icon: 'ti ti-check' }],
      recentActivities: []
    };
  }

  /**
   * Get System Recent Activities
   */
  async getSystemRecentActivities(schoolId, institutionId = null) {
    try {
      const activities = [];
      
      // Get recent user registrations
      const recentUsers = await User.find({ 
        schoolId, 
        ...(institutionId && { institutionId }) 
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email role createdAt');

      recentUsers.forEach(user => {
        activities.push({
          id: user._id,
          type: 'user_registration',
          title: `New ${user.role} registered`,
          description: `${user.name} (${user.email}) joined the system`,
          timestamp: user.createdAt,
          icon: 'ti ti-user-plus',
          color: 'success'
        });
      });

      // Get recent attendance records
      const recentAttendance = await Attendance.find({ 
        schoolId, 
        ...(institutionId && { institutionId }) 
      })
        .populate('studentId', 'name')
        .sort({ date: -1 })
        .limit(5);

      recentAttendance.forEach(record => {
        activities.push({
          id: record._id,
          type: 'attendance',
          title: `Attendance marked`,
          description: `${record.studentId?.name || 'Student'} - ${record.status}`,
          timestamp: record.date,
          icon: 'ti ti-check',
          color: record.status === 'present' ? 'success' : 'warning'
        });
      });

      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      return activities.slice(0, 10); // Return top 10 activities
    } catch (error) {
      logger.error('Error fetching system recent activities:', error);
      return [];
    }
  }
}

export default new DashboardService();
