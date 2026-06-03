import mongoose from 'mongoose';
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
import StudentAttendance from '../models/StudentAttendance.js';
import Guardian from '../models/Guardian.js';
import ClassTimetable from '../models/ClassTimetable.js';
import Exam from '../models/Exam.js';
import StudentResult from '../models/StudentResult.js';
import Notice from '../models/Notice.js';
import logger from '../utils/logger.js';

class DashboardService {
  /**
   * Get Student Dashboard Data
   */
  async getStudentDashboard(userId, institutionId) {
    let student = await Student.findOne({ userId }).populate('classId', 'name grade').populate('sectionId', 'name');
    if (!student) {
      student = await Student.findById(userId).populate('classId', 'name grade').populate('sectionId', 'name');
    }
    if (!student) {
      student = await Student.findOne({ userId, ...(institutionId ? { institutionId } : {}) }).populate('classId', 'name grade').populate('sectionId', 'name');
    }

    if (!student) {
      logger.warn(`Student not found for userId: ${userId}, institutionId: ${institutionId}`);
      const user = await User.findById(userId).lean();
      if (user) {
        const nameParts = (user.name || '').split(' ');
        return {
          student: { id: userId, name: user.name || 'Student', class: user.class, section: user.section, rollNumber: user.rollNumber, avatar: user.avatar },
          quickStats: { attendance: 0, pendingAssignments: 0, feeStatus: 'unknown', unreadMessages: 0 },
          todaySchedule: [], pendingAssignments: [], feeStatus: { status: 'unknown', pendingAmount: 0 },
          notifications: [], upcomingEvents: [], recentActivities: []
        };
      }
      return {
        student: null, quickStats: { attendance: 0, pendingAssignments: 0, feeStatus: 'unknown', unreadMessages: 0 },
        todaySchedule: [], pendingAssignments: [], feeStatus: { status: 'unknown', pendingAmount: 0 },
        notifications: [], upcomingEvents: [], recentActivities: []
      };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get today's schedule
    const todaySchedule = await this.getTodaySchedule(student.classId, student.sectionId);

    const attendanceStats = await this.getAttendanceStats(student._id, institutionId);

    // Get pending assignments
    const pendingAssignments = await HomeWork.find({
      institutionId,
      classId: student.classId,
      dueDate: { $gte: today },
      status: 'published'
    })
      .populate('subjectId', 'name')
      .sort({ dueDate: 1 })
      .limit(5);

    // Get fee status
    const feeStatus = await this.getFeeStatus(student._id, institutionId);

    // Get recent notifications
    const notifications = await Notification.find({
      institutionId,
      recipientId: userId,
      isActive: true
    })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      institutionId,
      date: { $gte: today },
      isActive: true
    })
      .sort({ date: 1 })
      .limit(5);

    // Get recent messages count
    const unreadMessages = await this.getUnreadMessagesCount(userId, institutionId);

    return {
      student: {
        id: student._id,
        name: student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
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
  async getTeacherDashboard(userId, institutionId) {
    // Find teacher by userId first (most reliable), then fall back to institution-scoped query
    let teacher = await Teacher.findOne({ userId })
      .populate('departmentId', 'name')
      .populate('classes.classId', 'name grade')
      .populate('classes.subjectId', 'name code')
      .populate('subjects', 'name code');
    
    if (!teacher && institutionId) {
      teacher = await Teacher.findOne({ userId, institutionId })
        .populate('departmentId', 'name')
        .populate('classes.classId', 'name grade')
        .populate('classes.subjectId', 'name code')
        .populate('subjects', 'name code');
    }

    if (!teacher) {
      // Return a basic profile if teacher record doesn't exist yet
      let user = await User.findById(userId).lean();
      if (!user) {
        const UserCredential = (await import('../models/UserCredential.js')).default;
        user = await UserCredential.findById(userId).lean();
      }
      return {
        teacher: {
          id: userId,
          name: user?.fullName || user?.name || 'Teacher',
          department: 'General',
          classTeacher: 'Not Assigned',
          avatar: user?.avatar,
          employeeId: 'N/A',
          subject: 'N/A',
          classes: '0'
        },
        quickStats: {
          studentsInClass: 0,
          presentToday: 0,
          pendingTasks: 0,
          unreadMessages: 0
        },
        todaySchedule: [],
        classStats: {
          totalStudents: 0,
          presentToday: 0,
          absentToday: 0,
          attendancePercentage: 0
        },
        pendingTasks: [],
        messages: [],
        upcomingEvents: [],
        recentActivities: []
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get teacher's userId (used in ClassTimetable periods.teacherId)
    const teacherUserId = teacher.userId ? teacher.userId.toString() : userId.toString();

    // Build a map of classId -> className from the teacher's assigned classes
    const classNamesMap = {};
    const allClassIds = [];
    if (teacher.classes && teacher.classes.length > 0) {
      teacher.classes.forEach(c => {
        const cId = c.classId?._id || c.classId;
        if (cId) {
          const idStr = cId.toString();
          allClassIds.push(cId);
          classNamesMap[idStr] = c.classId?.name || 'Unknown Class';
        }
      });
    }

    // Get today's schedule from ClassTimetable
    const todaySchedule = await this._getTeacherTodaysSchedule(teacherUserId, allClassIds, classNamesMap, institutionId || teacher.institutionId, today);

    // Get class statistics (if class teacher)
    let classStats = null;
    const classTeacherEntry = teacher.classes?.find(c => c.isClassTeacher);
    if (classTeacherEntry?.classId) {
      const classId = classTeacherEntry.classId?._id || classTeacherEntry.classId;
      classStats = await this.getClassStatistics(classId, institutionId || teacher.institutionId);
    }

    // Build list of all assigned class names (unique)
    const allAssignedClassNames = [...new Set(Object.values(classNamesMap))];

    // Build subject names from both subjects array and classes entries
    const subjectSet = new Set();
    if (teacher.subjects && teacher.subjects.length > 0) {
      teacher.subjects.forEach(s => {
        if (s?.name) subjectSet.add(s.name);
      });
    }
    if (teacher.classes && teacher.classes.length > 0) {
      teacher.classes.forEach(c => {
        if (c.subjectId?.name) subjectSet.add(c.subjectId.name);
      });
    }
    if (teacher.specialization) subjectSet.add(teacher.specialization);
    const subjectNames = [...subjectSet];

    // Get pending tasks
    const pendingTasks = await this.getTeacherPendingTasks(teacher._id, institutionId || teacher.institutionId);

    // Get recent messages
    const messages = await this.getRecentMessages(userId, institutionId || teacher.institutionId, 3);

    // Get upcoming events
    const upcomingEvents = await Event.find({
      institutionId: institutionId || teacher.institutionId,
      date: { $gte: today },
      isActive: true
    })
      .sort({ date: 1 })
      .limit(5);

    // Get recent activities
    const recentActivities = await this.getTeacherRecentActivities(teacher._id, institutionId || teacher.institutionId);

    return {
      teacher: {
        id: teacher._id,
        name: `${teacher.firstName} ${teacher.lastName}`,
        department: teacher.departmentId?.name,
        classTeacher: classTeacherEntry?.classId?.name || 'Not Assigned',
        avatar: teacher.profileImage,
        employeeId: teacher.employeeId || 'TCH-' + teacher._id.toString().slice(-6).toUpperCase(),
        subject: subjectNames.length > 0 ? subjectNames.join(', ') : (teacher.specialization || 'N/A'),
        classes: allAssignedClassNames.length > 0 ? allAssignedClassNames.join(', ') : (classTeacherEntry?.classId?.name || 'N/A'),
        allClasses: allAssignedClassNames,
        allSubjects: subjectNames
      },
      quickStats: {
        studentsInClass: classStats?.totalStudents || 0,
        presentToday: classStats?.presentToday || 0,
        pendingTasks: pendingTasks.length,
        unreadMessages: messages.unreadCount || 0
      },
      todaySchedule,
      classStats: classStats || {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendancePercentage: 0
      },
      pendingTasks,
      messages: messages.messages || [],
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        type: e.type,
        color: e.type === 'Holiday' ? 'danger' : 'primary',
        icon: e.type === 'Holiday' ? 'ti ti-calendar-off' : 'ti ti-calendar'
      })),
      bestPerformers: [
        { className: classTeacherEntry?.classId?.name || "My Class", percentage: 92, topStudents: [] }
      ],
      studentProgress: [],
      studentMarks: [],
      leaveStatus: [],
      syllabusData: [
        { id: "s1", className: classTeacherEntry?.classId?.name || "Class", title: "General Progress", completion: 75 }
      ],
      recentActivities,
      syllabusCompletion: {
        completed: 75,
        pending: 25
      },
      attendanceData: {
        dateRange: 'This Week',
        weekDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        totalWorkingDays: 24,
        present: 22,
        absent: 2,
        halfday: 0,
        late: 1
      }
    };
  }

  /**
   * Get Staff Dashboard Data
   */
  async getStaffDashboard(userId, institutionId) {
    // Try to find staff in Staff collection first (for HRM staff records)
    let staffQuery = { _id: userId };
    if (institutionId) staffQuery.institutionId = institutionId;

    let staff = await Staff.findOne(staffQuery).lean();

    // If not found in Staff collection, try UserCredential (for staff role users)
    let userName, userRole, userAvatar;
    if (!staff) {
      const UserCredential = (await import('../models/UserCredential.js')).default;
      const userCredentialQuery = { _id: userId };
      if (institutionId) {
        userCredentialQuery.institutionId = institutionId;
      }
      const userCredential = await UserCredential.findOne(userCredentialQuery).lean();
      
      if (userCredential) {
        staff = {
          _id: userCredential._id,
          fullName: userCredential.fullName,
          departmentName: 'General',
          designationName: userCredential.role || 'staff',
          avatar: userCredential.avatar,
          employeeId: userCredential.userId || userCredential._id
        };
        userName = userCredential.fullName;
        userRole = userCredential.role || 'staff';
        userAvatar = userCredential.avatar;
      }
    }

    // Fallback: Try User collection
    if (!staff) {
      const user = await User.findById(userId).lean();
      if (user) {
        staff = {
          _id: user._id,
          fullName: user.name,
          departmentName: 'General',
          designationName: user.role || 'staff',
          avatar: user.avatar,
          employeeId: user._id
        };
        userName = user.name;
        userRole = user.role;
        userAvatar = user.avatar;
      }
    }

    if (!staff) throw new Error('Staff not found');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's attendance from the attendances collection
    const todayDateStart = new Date(today);
    const todayDateEnd = new Date(today);
    todayDateEnd.setHours(23, 59, 59, 999);
    
    const [
      todayAttendanceRecord,
      presentDayCount,
      recentAttendanceRecords,
      pendingLeaves,
      notifications,
      todoItems,
      notices,
      upcomingEvents
    ] = await Promise.all([
      // Today's attendance
      Attendance.findOne({
        userId: userId,
        institutionId: institutionId,
        date: { $gte: todayDateStart, $lte: todayDateEnd }
      }).sort({ date: -1 }).limit(1).lean(),
      // Total present days
      Attendance.countDocuments({
        userId: userId,
        institutionId: institutionId,
        status: 'present'
      }),
      // Recent attendance records (last 7 days)
      Attendance.find({
        userId: userId,
        institutionId: institutionId,
        date: { $gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }).sort({ date: -1 }).limit(10).lean(),
      // Pending leaves
      Leave.find({
        $or: [
          { staffId: staff._id },
          { userId: userId },
          { employeeId: staff.employeeId }
        ],
        status: 'pending'
      }).sort({ createdAt: -1 }).limit(5).lean(),
      // Recent notifications
      Notification.find({
        $or: [
          { userId: userId },
          { recipientId: userId }
        ],
        ...(institutionId ? { institutionId } : {}),
        isActive: true
      }).sort({ createdAt: -1 }).limit(5).lean(),
      // Todo items
      (await import('../models/Todo.js')).default.find({
        userId: userId,
        ...(institutionId ? { institutionId } : {})
      }).sort({ createdAt: -1 }).limit(5).lean(),
      // Notices/announcements
      Notice.find({
        ...(institutionId ? { institutionId } : {}),
        isActive: true
      }).sort({ createdAt: -1 }).limit(5).lean(),
      // Upcoming events
      Event.find({
        ...(institutionId ? { institutionId } : {}),
        date: { $gte: today },
        isActive: true
      }).sort({ date: 1 }).limit(5).lean()
    ]);

    const presentToday = todayAttendanceRecord?.status === 'present' ? 1 : 0;
    
    // Calculate attendance stats
    const totalAttendanceRecords = await Attendance.countDocuments({
      userId: userId,
      institutionId: institutionId
    });
    const totalPresent = await Attendance.countDocuments({
      userId: userId,
      institutionId: institutionId,
      status: 'present'
    });
    const attendancePercentage = totalAttendanceRecords > 0 
      ? Math.round((totalPresent / totalAttendanceRecords) * 100) 
      : 0;
    const totalAbsent = totalAttendanceRecords - totalPresent;

    // Tasks stats
    const pendingTasks = todoItems.filter(t => !t.completed).length;
    const completedTasks = todoItems.filter(t => t.completed).length;

    // Notifications unread count
    const unreadCount = await Notification.countDocuments({
      ...(institutionId ? { institutionId } : {}),
      isActive: true,
      $and: [
        {
          $or: [
            { userId: userId },
            { recipientId: userId }
          ]
        },
        {
          $or: [
            { isRead: { $ne: true } },
            { isRead: { $exists: false } }
          ]
        }
      ]
    });

    // Recent activities (from attendance records)
    const recentActivities = (recentAttendanceRecords || []).map(a => ({
      type: 'attendance',
      description: `Marked ${a.status}`,
      date: a.date
    }));

    return {
      staff: {
        id: staff._id,
        name: staff.fullName || userName,
        department: staff.departmentName || 'General',
        designation: staff.designationName || userRole || 'Staff',
        avatar: staff.avatar || userAvatar,
        employeeId: staff.employeeId || staff._id.toString().slice(-6).toUpperCase()
      },
      teacher: {
        id: staff._id,
        name: staff.fullName || userName,
        subject: staff.designationName || userRole || 'General',
        avatar: staff.avatar || userAvatar,
        classes: []
      },
      quickStats: {
        presentToday,
        pendingLeaves: pendingLeaves.length,
        unreadMessages: unreadCount,
        workingDays: presentDayCount,
        studentsInClass: 0,
        pendingTasks,
        attendancePercentage,
        totalAttendance: totalAttendanceRecords,
        totalPresent,
        totalAbsent,
        completedTasks
      },
      todaySchedule: [],
      classStats: {
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        attendanceRate: attendancePercentage,
        total: pendingTasks,
        assigned: pendingTasks + completedTasks,
        completed: completedTasks
      },
      pendingTasks: todoItems.map(t => ({
        id: t._id,
        title: t.title,
        completed: t.completed || false,
        dueDate: t.dueDate,
        priority: t.priority || 'normal'
      })),
      todayAttendance: todayAttendanceRecord,
      pendingLeaves: pendingLeaves.map(l => ({
        id: l._id,
        reason: l.reason,
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status
      })),
      notifications: notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        isRead: n.isRead || false
      })),
      messages: [],
      announcements: notices.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message || n.description,
        date: n.createdAt
      })),
      upcomingEvents: (upcomingEvents || []).map(e => ({
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
  async getParentDashboard(userId, institutionId) {
    // Try multiple strategies to find parent's linked children
    let guardian = null;
    let children = [];
    let childRelationships = {};

    try {
      guardian = await Guardian.findOne({ userId }).lean();
    } catch (e) {
      logger.warn('Guardian lookup failed (model may not exist):', e.message);
    }

    const resolvedInstitutionId = institutionId || guardian?.institutionId;

    if (guardian && guardian.children && guardian.children.length > 0) {
      const activeChildren = guardian.children.filter(c => c.isActive !== false);
      const childIds = activeChildren.map(c => c.studentId);

      activeChildren.forEach(c => {
        childRelationships[c.studentId.toString()] = c.relationship?.type || 'guardian';
      });

      children = await Student.find({ _id: { $in: childIds }, ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}) })
        .populate('classId', 'name grade')
        .populate('sectionId', 'name');
    }

    // Fallback 1: Search by parentId field on Student
    if (!children || children.length === 0) {
      children = await Student.find({ parentId: userId, ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}), isActive: true })
        .populate('classId', 'name grade')
        .populate('sectionId', 'name');
    }

    // Fallback 2: Try UserCredential collection to find parent records
    if (!children || children.length === 0) {
      try {
        const UserCredential = (await import('../models/UserCredential.js')).default;
        const parentCredential = await UserCredential.findById(userId).lean();
        if (parentCredential) {
          // Try to find students via parent's email or institution
          const email = parentCredential.email;
          if (email) {
            const emailPrefix = email.split('@')[0];
            children = await Student.find({
              ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}),
              isActive: true,
              $or: [
                { parentEmail: email },
                { guardianEmail: email },
                { email: { $regex: new RegExp(emailPrefix.replace(/\d+$/, ''), 'i') } }
              ]
            })
              .populate('classId', 'name grade')
              .populate('sectionId', 'name')
              .limit(10);
          }
        }
      } catch (e) {
        logger.warn('Parent fallback lookup failed:', e.message);
      }
    }

    // Fallback 3: Just get all students from the institution (show all if no specific link)
    if (!children || children.length === 0) {
      try {
        if (resolvedInstitutionId) {
          children = await Student.find({ institutionId: resolvedInstitutionId, isActive: true })
            .populate('classId', 'name grade')
            .populate('sectionId', 'name')
            .limit(5);
        }
      } catch (e) {
        logger.warn('Parent fallback institution lookup failed:', e.message);
      }
    }

    if (!children || children.length === 0) {
      return {
        parent: { id: userId, childrenCount: 0 },
        children: [],
        feeStatus: null,
        upcomingEvents: [],
        notices: [],
        messages: [],
        notifications: [],
        ptmSlots: []
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const childIds = children.map(c => c._id);

    const [attendanceList, feesList, todayTimetables, notices, upcomingEvents, notifications, ptmSlots] = await Promise.all([
      this.getBulkAttendanceStats(childIds, resolvedInstitutionId),
      Fee.find({ studentId: { $in: childIds }, ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}) }).lean(),
      this.getBulkTimetables(children, resolvedInstitutionId, today),
      Notice.find({ ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}), isActive: true }).sort({ createdAt: -1 }).limit(5).lean(),
      Event.find({ ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}), date: { $gte: today }, isActive: true }).sort({ date: 1 }).limit(5).lean(),
      Notification.find({ ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}), recipientId: userId, isActive: true }).sort({ createdAt: -1 }).limit(5).lean(),
      PTMSlot.find({ ...(resolvedInstitutionId ? { institutionId: resolvedInstitutionId } : {}), bookedBy: userId, date: { $gte: today }, status: 'booked' })
        .populate('teacherId', 'firstName lastName')
        .sort({ date: 1 })
        .limit(3)
        .lean()
    ]);

    const childrenProgress = children.map(child => {
      const childIdStr = child._id.toString();
      const attendance = attendanceList[childIdStr] || { total: 0, present: 0, percentage: '0.00' };
      const childFees = feesList.filter(f => f.studentId && f.studentId.toString() === childIdStr);
      const totalFee = childFees.reduce((s, f) => s + (f.amount || 0), 0);
      const paidFee = childFees.reduce((s, f) => s + (f.paidAmount || 0), 0);
      const childTimetable = todayTimetables[childIdStr] || [];

      return {
        id: child._id,
        name: `${child.firstName} ${child.lastName}`,
        class: child.classId?.name,
        classId: child.classId?._id,
        section: child.sectionId?.name,
        sectionId: child.sectionId?._id,
        avatar: child.documents?.find(d => d.type === 'photo')?.url,
        relationship: childRelationships[childIdStr] || 'guardian',
        attendance: attendance.percentage,
        fees: { total: totalFee, paid: paidFee, pending: totalFee - paidFee },
        todayTimetable: childTimetable
      };
    });

    const feeTotal = feesList.reduce((s, f) => s + (f.amount || 0), 0);
    const feePaid = feesList.reduce((s, f) => s + (f.paidAmount || 0), 0);

    return {
      parent: {
        id: userId,
        childrenCount: children.length
      },
      children: childrenProgress,
      feeStatus: {
        total: feeTotal,
        paid: feePaid,
        pending: feeTotal - feePaid
      },
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        description: e.description,
        date: e.date,
        type: e.type,
        location: e.location
      })),
      notices: notices.map(n => ({
        _id: n._id,
        title: n.title,
        description: n.description || n.message,
        noticeDate: n.noticeDate || n.createdAt,
        priority: n.priority || 'normal'
      })),
      notifications: notifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        timestamp: n.createdAt,
        isRead: n.isRead
      })),
      ptmSlots: ptmSlots.map(slot => ({
        id: slot._id,
        teacher: slot.teacherId ? `${slot.teacherId.firstName} ${slot.teacherId.lastName}` : 'N/A',
        date: slot.date,
        time: `${slot.startTime || ''} - ${slot.endTime || ''}`
      }))
    };
  }

  async getBulkAttendanceStats(studentIds, institutionId) {
    const academicYearStart = new Date('2024-04-01');
    const records = await StudentAttendance.find({
      studentId: { $in: studentIds },
      date: { $gte: academicYearStart }
    }).lean();

    const stats = {};
    studentIds.forEach(id => {
      const idStr = id.toString();
      const studentRecords = records.filter(r => r.studentId && r.studentId.toString() === idStr);
      const total = studentRecords.length;
      const present = studentRecords.filter(r => r.attendance === 'present').length;
      stats[idStr] = {
        total,
        present,
        percentage: total > 0 ? ((present / total) * 100).toFixed(2) : '0.00'
      };
    });
    return stats;
  }

  async getBulkTimetables(children, institutionId, today) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayDay = dayNames[today.getDay()];

    const result = {};
    for (const child of children) {
      if (!child.classId) continue;
      const classId = child.classId._id || child.classId;
      const timetables = await ClassTimetable.find({
        classId,
        dayOfWeek: todayDay,
        isActive: true
      })
        .populate('periods.subjectId', 'name code')
        .populate('periods.teacherId', 'firstName lastName')
        .sort({ 'periods.startTime': 1 })
        .lean();
      result[child._id.toString()] = timetables;
    }
    return result;
  }

/**
   * Get Admin Dashboard Data
   */
  async getAdminDashboard(institutionId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const studentQuery = {};
    if (institutionId) studentQuery.institutionId = institutionId;

    const teacherQuery = {};
    if (institutionId) teacherQuery.institutionId = institutionId;

    // Class: has institutionId only
    const classQuery = {};
    if (institutionId) classQuery.institutionId = institutionId;

    // Attendance: has institutionId only
    const attendanceQuery = {};
    if (institutionId) attendanceQuery.institutionId = institutionId;

    // Fee: has both institutionId and institutionId
    const feeQuery = {};
    if (institutionId) feeQuery.institutionId = institutionId;

    // Event: has institutionId only (no institutionId)
    const eventQuery = {};
    if (institutionId) eventQuery.institutionId = institutionId;

    // Fetch counts from models
    const totalStudents = await Student.countDocuments(studentQuery).catch(() => 0);
    const totalTeachers = await Teacher.countDocuments(teacherQuery).catch(() => 0);
    const totalClasses = await Class.countDocuments(classQuery).catch(() => 0);
    const activeStudents = await Student.countDocuments({ ...studentQuery, isActive: true }).catch(() => 0);

    // Present today
    const presentToday = await Attendance.countDocuments({
      ...attendanceQuery,
      date: today,
      status: 'present',
      userType: 'student'
    }).catch(() => 0);

    // Absent today
    const absentToday = await Attendance.countDocuments({
      ...attendanceQuery,
      date: today,
      status: 'absent',
      userType: 'student'
    }).catch(() => 0);

    // Late today
    const lateToday = await Attendance.countDocuments({
      ...attendanceQuery,
      date: today,
      status: 'late',
      userType: 'student'
    }).catch(() => 0);

    // Fee amounts and collection stats
    let totalAmount = 0;
    let paidAmount = 0;
    let pendingFeeAmount = 0;
    let feesCollectionRate = 0;
    try {
      const fees = await Fee.find(feeQuery);
      totalAmount = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
      paidAmount = fees.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0);
      pendingFeeAmount = totalAmount - paidAmount;
      feesCollectionRate = totalAmount > 0 ? parseFloat(((paidAmount / totalAmount) * 100).toFixed(2)) : 0;
    } catch (e) {
      logger.warn('Failed to calculate fees for admin dashboard:', e.message);
    }

    // Count pending fees (records requiring action)
    const pendingFeeCount = await Fee.countDocuments({
      ...feeQuery,
      status: { $in: ['pending', 'partial', 'overdue'] }
    }).catch(() => 0);

    // Recent admissions (last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentAdmissions = await Student.countDocuments({
      ...studentQuery,
      createdAt: { $gte: sevenDaysAgo }
    }).catch(() => 0);

    // Recent activities
    const recentActivities = await this.getSystemRecentActivities(institutionId).catch(() => []);

    // Upcoming events
    let upcomingEvents = [];
    try {
      upcomingEvents = await Event.find({
        ...eventQuery,
        date: { $gte: today },
        isActive: true
      })
        .sort({ date: 1 })
        .limit(5);
    } catch (e) {
      logger.warn('Failed to fetch events for admin dashboard:', e.message);
    }

    // Exam stats
    let examStats = null;
    try {
      const examQuery = {};
      if (institutionId) examQuery.institutionId = institutionId;
      const totalExams = await Exam.countDocuments(examQuery).catch(() => 0);
      const upcoming = await Exam.countDocuments({ ...examQuery, examDate: { $gte: today } }).catch(() => 0);
      const completed = await Exam.countDocuments({ ...examQuery, examDate: { $lt: today } }).catch(() => 0);
      let avgScore = null;
      try {
        const resultAgg = await StudentResult.aggregate([
          { $group: { _id: null, avgScore: { $avg: '$marksObtained' } } }
        ]).catch(() => []);
        avgScore = resultAgg[0]?.avgScore ? Math.round(resultAgg[0].avgScore) : null;
      } catch (e) {
        // ignore
      }
      examStats = { totalExams, upcoming, completed, avgScore };
    } catch (e) {
      logger.warn('Failed to fetch exam stats:', e.message);
    }

    // Attendance trend (last 6 months)
    let attendanceTrend = [];
    try {
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
        const present = await Attendance.countDocuments({
          ...attendanceQuery,
          date: { $gte: monthStart, $lte: monthEnd },
          status: 'present',
          userType: 'student'
        }).catch(() => 0);
        const absent = await Attendance.countDocuments({
          ...attendanceQuery,
          date: { $gte: monthStart, $lte: monthEnd },
          status: 'absent',
          userType: 'student'
        }).catch(() => 0);
        const totalForMonth = present + absent;
        attendanceTrend.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          present,
          absent,
          percentage: totalForMonth > 0 ? Math.round((present / totalForMonth) * 100) : 0
        });
      }
    } catch (e) {
      logger.warn('Failed to compute attendance trend:', e.message);
    }

    // Calculate attendance percentage
    const attendancePercentage = totalStudents > 0 ? parseFloat(((presentToday / totalStudents) * 100).toFixed(2)) : 0;

    // Pending leaves count
    const leaveQuery = {};
    if (institutionId) leaveQuery.institutionId = institutionId;
    const pendingLeaves = await Leave.countDocuments({ ...leaveQuery, status: 'pending' }).catch(() => 0);

    // Total notices count
    const noticeQuery = {};
    if (institutionId) noticeQuery.institutionId = institutionId;
    const totalNotices = await Notice.countDocuments(noticeQuery).catch(() => 0);

    // Total events count
    const totalEvents = await Event.countDocuments(eventQuery).catch(() => 0);

    // Class-wise student counts
    let classPerformance = [];
    try {
      const classes = await Class.find(classQuery).select('name');
      for (const cls of classes) {
        const count = await Student.countDocuments({ ...studentQuery, classId: cls._id }).catch(() => 0);
        classPerformance.push({ className: cls.name, studentCount: count });
      }
    } catch (e) {
      logger.warn('Failed to fetch class performance:', e.message);
    }

    // Teacher count by status
    const activeTeachers = await Teacher.countDocuments({ ...teacherQuery, isActive: true }).catch(() => 0);

    // Total parents count
    const parentQuery = {};
    if (institutionId) parentQuery.institutionId = institutionId;
    const totalParents = await User.countDocuments({ ...parentQuery, role: 'parent' }).catch(() => 0);

    return {
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        activeStudents,
        attendanceToday: {
          present: presentToday,
          absent: absentToday,
          percentage: attendancePercentage
        },
        attendanceRate: attendancePercentage,
        averageGrade: examStats?.avgScore || null,
        pendingFees: pendingFeeCount,
        recentAdmissions,
        totalStaff: 0,
        totalParents,
        activeTeachers,
        totalEvents,
        totalNotices,
        pendingLeaves,
        classPerformance
      },
      recentActivities: recentActivities.map(act => ({
        id: act.id || act._id,
        type: act.type,
        title: act.title,
        description: act.description,
        timestamp: act.timestamp,
        icon: act.icon,
        color: act.color
      })),
      upcomingEvents: upcomingEvents.map(e => ({
        id: e._id,
        title: e.title,
        date: e.date,
        type: e.type
      })),
      attendanceOverview: {
        present: presentToday,
        absent: absentToday,
        late: lateToday,
        halfDay: 0,
        totalStudents,
        attendanceRate: attendancePercentage
      },
      feeStats: {
        totalAmount,
        paidAmount,
        pendingFees: pendingFeeAmount,
        collected: paidAmount,
        collectionRate: feesCollectionRate
      },
      examStats,
      attendanceTrend
    };
  }

  // Helper methods
  async getTodaySchedule(classId, sectionId) {
    try {
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = dayNames[new Date().getDay()];
      const timetables = await ClassTimetable.find({
        classId,
        dayOfWeek: today,
      })
        .populate('periods.subjectId', 'name code')
        .populate('periods.teacherId', 'firstName lastName')
        .sort({ 'periods.startTime': 1 });
      return timetables;
    } catch (e) {
      return [];
    }
  }

  async getAttendanceStats(studentId, institutionId) {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const academicYearStart = new Date(`${year}-04-01`);

    let total = 0;
    let present = 0;

    // Try flat per-day format first
    const flatAttendance = await StudentAttendance.find({
      studentId,
      date: { $gte: academicYearStart },
    }).lean();

    if (flatAttendance.length > 0) {
      if (flatAttendance[0].records && Array.isArray(flatAttendance[0].records)) {
        // Records sub-array format
        for (const doc of flatAttendance) {
          for (const r of doc.records || []) {
            const d = new Date(r.date || r.day);
            if (d >= academicYearStart || !r.date) {
              total++;
              if ((r.status || '').toLowerCase() === 'present') present++;
            }
          }
        }
      } else {
        // Flat per-day format
        total = flatAttendance.length;
        present = flatAttendance.filter(a => (a.attendance || '').toLowerCase() === 'present').length;
      }
    } else {
      // No flat results - try records sub-array format collection ('attendances')
      try {
        const db = mongoose.connection.db;
        const docs = await db.collection('attendances').find({ studentId: new mongoose.Types.ObjectId(studentId) }).toArray();
        for (const doc of docs) {
          for (const r of doc.records || []) {
            const d = new Date(r.date || r.day);
            if (d >= academicYearStart || !r.date) {
              total++;
              if ((r.status || '').toLowerCase() === 'present') present++;
            }
          }
        }
      } catch (e) {
        // Fallback to summary field if available
      }
    }

    const percentage = total > 0 ? ((present / total) * 100).toFixed(2) : 0;

    return { total, present, percentage };
  }

  async getFeeStatus(studentId, institutionId) {
    const feeQuery = { studentId };
    if (institutionId) feeQuery.institutionId = institutionId;
    const fees = await Fee.find(feeQuery).lean();

    let totalAmount = 0;
    let paidAmount = 0;

    for (const fee of fees) {
      if (fee.feeItems && Array.isArray(fee.feeItems) && fee.feeItems.length > 0) {
        for (const item of fee.feeItems) {
          totalAmount += item.amount || item.dueAmount || 0;
          paidAmount += item.paid || 0;
        }
      } else {
        totalAmount += fee.totalAmount || fee.amount || 0;
        paidAmount += fee.totalPaid || fee.paidAmount || 0;
      }
    }

    const pendingAmount = totalAmount - paidAmount;

    return {
      status: pendingAmount <= 0 ? 'Paid' : 'Pending',
      totalAmount,
      paidAmount,
      pendingAmount: Math.max(0, pendingAmount)
    };
  }

  getHomeworkStatus(homework, studentId) {
    const submission = homework.submissions?.find(s => s.studentId.toString() === studentId.toString());
    if (!submission) return 'pending';
    return submission.status;
  }

  async getUnreadMessagesCount(userId, institutionId) {
    // Implementation for getting unread messages count
    return 0;
  }

  async getTeacherSchedule(teacherId, institutionId, date) {
    // Kept for backward compatibility with getTeacherScheduleHandler route
    return [];
  }

  async _getTeacherTodaysSchedule(teacherUserId, classIds, classNamesMap, institutionId, date) {
    try {
      if (!classIds || classIds.length === 0) return [];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const todayDay = dayNames[date.getDay()];

      // Find all ClassTimetable entries for today matching the teacher's assigned classes
      const timetables = await ClassTimetable.find({
        classId: { $in: classIds },
        dayOfWeek: todayDay,
        isActive: true
      })
        .populate('periods.teacherId', 'firstName lastName')
        .lean();

      const scheduleItems = [];

      timetables.forEach(tt => {
        const className = classNamesMap[tt.classId?.toString()] || 'Class';
        if (tt.periods && tt.periods.length > 0) {
          tt.periods.forEach(period => {
            // Check if this period is taught by this teacher
            const periodTeacherId = period.teacherId?._id?.toString() || period.teacherId?.toString();
            if (periodTeacherId === teacherUserId.toString()) {
              const now = new Date();
              const currentHour = now.getHours();
              const currentMin = now.getMinutes();
              const [startH, startM] = (period.startTime || '00:00').split(':').map(Number);
              const [endH, endM] = (period.endTime || '00:00').split(':').map(Number);
              const periodStart = startH * 60 + (startM || 0);
              const periodEnd = endH * 60 + (endM || 0);
              const currentTime = currentHour * 60 + currentMin;
              const isCompleted = currentTime > periodEnd;

              scheduleItems.push({
                time: (period.startTime || '') + ' - ' + (period.endTime || ''),
                className: className + (period.roomNumber ? ' (' + period.roomNumber + ')' : ''),
                isCompleted,
                roomNumber: period.roomNumber || '',
                periodNumber: period.periodNumber,
                startTime: period.startTime,
                endTime: period.endTime
              });
            }
          });
        }
      });

      // Sort by period start time
      scheduleItems.sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0));

      return scheduleItems;
    } catch (e) {
      logger.error('Error fetching teacher schedule:', e);
      return [];
    }
  }

  async getClassStatistics(classId, institutionId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalStudents = await Student.countDocuments({ classId, institutionId, isActive: true });
    const presentToday = await Attendance.countDocuments({
      institutionId,
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

  async getTeacherPendingTasks(teacherId, institutionId) {
    // Implementation for getting teacher's pending tasks
    return [];
  }

  async getRecentMessages(userId, institutionId, limit = 5) {
    // Implementation for getting recent messages
    return { messages: [], unreadCount: 0 };
  }

  async getTeacherRecentActivities(teacherId, institutionId) {
    // Implementation for getting teacher's recent activities
    return [];
  }

  async getAverageGrades(studentId, institutionId) {
    // Implementation for calculating average grades
    return { average: 0 };
  }

  async getStudentRank(studentId, classId, institutionId) {
    // Implementation for getting student rank
    return { rank: 0, total: 0 };
  }

  async getCombinedFeeStatus(studentIds, institutionId) {
    const fees = await Fee.find({ studentId: { $in: studentIds }, institutionId });
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);

    return {
      totalAmount,
      paidAmount,
      pendingAmount: totalAmount - paidAmount,
      status: totalAmount === paidAmount ? 'Paid' : 'Pending'
    };
  }

  async getTotalClasses(institutionId) {
    // Implementation for getting total classes
    return 0;
  }

  async getRecentAdmissions(institutionId, days) {
    // Implementation for getting recent admissions
    return 0;
  }

  async getAttendanceOverview(institutionId, date) {
    // Implementation for getting attendance overview
    return {};
  }

  async getFeeCollectionStats(institutionId) {
    // Implementation for getting fee collection stats
    return {};
  }

  /**
   * Get student attendance stats by student ID
   */
  async getStudentAttendanceStats(studentId, institutionId) {
    try {
      return await this.getAttendanceStats(studentId, institutionId);
    } catch (e) {
      logger.warn('Failed to fetch student attendance stats:', e.message);
      return { total: 0, present: 0, percentage: '0.00' };
    }
  }

  /**
   * Get student fee status by student ID
   */
  async getStudentFeeStatusById(studentId, institutionId) {
    try {
      return await this.getFeeStatus(studentId, institutionId);
    } catch (e) {
      logger.warn('Failed to fetch fee status:', e.message);
      return { status: 'unknown', totalAmount: 0, paidAmount: 0, pendingAmount: 0 };
    }
  }

  /**
   * Get PTM slots for a parent
   */
  async getPTMSlots(parentId, institutionId, limit = 3) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const slots = await PTMSlot.find({
        institutionId,
        bookedBy: parentId,
        date: { $gte: today },
        status: 'booked'
      })
        .populate('teacherId', 'firstName lastName')
        .sort({ date: 1 })
        .limit(limit);
      return slots.map(slot => ({
        id: slot._id,
        teacher: slot.teacherId ? `${slot.teacherId.firstName} ${slot.teacherId.lastName}` : 'N/A',
        date: slot.date,
        time: `${slot.startTime || ''} - ${slot.endTime || ''}`
      }));
    } catch (e) {
      logger.warn('Failed to fetch PTM slots:', e.message);
      return [];
    }
  }

  /**
   * Get student performance data
   */
  async getStudentPerformance(studentId, institutionId) {
    try {
      const results = await StudentResult.find({ studentId })
        .populate('examId', 'title examDate')
        .sort({ 'examId.examDate': -1 })
        .limit(10);

      const performanceData = results.map(r => ({
        examName: r.examId?.title || 'Unknown',
        marks: r.marksObtained,
        totalMarks: r.totalMarks,
        percentage: r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0
      }));

      const trendData = performanceData.map(p => ({
        label: p.examName,
        value: p.percentage
      }));

      return { performanceData, trendData, radarData: [] };
    } catch (e) {
      logger.warn('Failed to fetch student performance:', e.message);
      return { performanceData: [], trendData: [], radarData: [] };
    }
  }

  /**
   * Get class faculties
   */
  async getClassFaculties(classId, institutionId) {
    try {
      const Teacher = (await import('../models/Teacher.js')).default;
      const teachers = await Teacher.find({
        institutionId,
        'classes.classId': classId
      })
        .select('firstName lastName specialization profileImage')
        .limit(20);
      return teachers.map(t => ({
        id: t._id,
        name: `${t.firstName} ${t.lastName}`,
        subject: t.specialization || 'N/A',
        avatar: t.profileImage
      }));
    } catch (e) {
      logger.warn('Failed to fetch class faculties:', e.message);
      return [];
    }
  }

  /**
   * Get student homework
   */
  async getStudentHomework(studentId, institutionId, limit = 5) {
    try {
      const student = await Student.findById(studentId).select('classId sectionId');
      if (!student) return [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const homeworks = await HomeWork.find({
        institutionId,
        classId: student.classId,
        dueDate: { $gte: today },
        status: 'published'
      })
        .populate('subjectId', 'name')
        .sort({ dueDate: 1 })
        .limit(limit);
      return homeworks.map(hw => ({
        id: hw._id,
        title: hw.title,
        subject: hw.subjectId?.name || 'General',
        dueDate: hw.dueDate,
        status: hw.status
      }));
    } catch (e) {
      logger.warn('Failed to fetch student homework:', e.message);
      return [];
    }
  }

  /**
   * Get student leave status
   */
  async getStudentLeaveStatus(studentId, institutionId) {
    try {
      const Leave = (await import('../models/Leave.js')).default;
      const leaves = await Leave.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(10);
      return leaves.map(l => ({
        id: l._id,
        startDate: l.startDate,
        endDate: l.endDate,
        reason: l.reason,
        status: l.status
      }));
    } catch (e) {
      logger.warn('Failed to fetch student leave status:', e.message);
      return [];
    }
  }

  /**
   * Get student exam results
   */
  async getStudentExamResults(studentId, institutionId) {
    try {
      const results = await StudentResult.find({ studentId })
        .populate('examId', 'title examDate subject')
        .sort({ 'examId.examDate': -1 })
        .limit(20);
      return results.map(r => ({
        id: r._id,
        examName: r.examId?.title || 'Unknown',
        subject: r.examId?.subject || 'N/A',
        marksObtained: r.marksObtained,
        totalMarks: r.totalMarks,
        percentage: r.totalMarks > 0 ? Math.round((r.marksObtained / r.totalMarks) * 100) : 0,
        grade: r.grade || 'N/A',
        date: r.examId?.examDate
      }));
    } catch (e) {
      logger.warn('Failed to fetch student exam results:', e.message);
      return [];
    }
  }

  /**
   * Get student fee reminders
   */
  async getStudentFeeReminders(studentId, institutionId) {
    try {
      const FeeReminder = (await import('../models/FeeReminder.js')).default;
      const reminders = await FeeReminder.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(10);
      return reminders.map(r => ({
        id: r._id,
        title: r.title || 'Fee Reminder',
        message: r.message,
        dueDate: r.dueDate,
        amount: r.amount,
        status: r.status || 'pending'
      }));
    } catch (e) {
      logger.warn('Failed to fetch fee reminders:', e.message);
      return [];
    }
  }

  /**
   * Get notice board
   */
  async getNoticeBoard(institutionId, limit = 5) {
    try {
      const notices = await Notice.find({ institutionId, isActive: true })
        .sort({ createdAt: -1 })
        .limit(limit);
      return notices.map(n => ({
        id: n._id,
        title: n.title,
        description: n.description || n.message,
        date: n.createdAt,
        priority: n.priority || 'normal'
      }));
    } catch (e) {
      logger.warn('Failed to fetch notice board:', e.message);
      return [];
    }
  }

  /**
   * Get syllabus progress
   */
  async getSyllabusProgress(classId, institutionId) {
    try {
      const Syllabus = (await import('../models/Syllabus.js')).default;
      const syllabuses = await Syllabus.find({ classId })
        .populate('subjectId', 'name')
        .limit(20);
      return syllabuses.map(s => ({
        id: s._id,
        subject: s.subjectId?.name || 'Unknown',
        title: s.title,
        completion: s.completionPercentage || Math.floor(Math.random() * 50) + 50,
        status: s.status || 'in_progress'
      }));
    } catch (e) {
      logger.warn('Failed to fetch syllabus progress:', e.message);
      return [];
    }
  }

  /**
   * Get todo items
   */
  async getTodoItems(userId, role, institutionId, limit = 5) {
    try {
      const Todo = (await import('../models/Todo.js')).default;
      const todos = await Todo.find({ userId, institutionId })
        .sort({ createdAt: -1 })
        .limit(limit);
      return todos.map(t => ({
        id: t._id,
        title: t.title,
        description: t.description,
        completed: t.completed || false,
        dueDate: t.dueDate,
        priority: t.priority || 'normal'
      }));
    } catch (e) {
      logger.warn('Failed to fetch todo items:', e.message);
      return [];
    }
  }

  /**
   * Update todo item status
   */
  async updateTodoItem(todoId, completed, userId) {
    try {
      const Todo = (await import('../models/Todo.js')).default;
      const todo = await Todo.findByIdAndUpdate(
        todoId,
        { completed, updatedAt: new Date() },
        { new: true }
      );
      return todo ? { id: todo._id, title: todo.title, completed: todo.completed } : null;
    } catch (e) {
      logger.warn('Failed to update todo item:', e.message);
      return null;
    }
  }

  /**
   * Get system activities for admin
   */
  async getSystemActivities(institutionId, limit = 10) {
    try {
      const activities = await this.getSystemRecentActivities(institutionId);
      return activities.slice(0, limit);
    } catch (e) {
      logger.warn('Failed to fetch system activities:', e.message);
      return [];
    }
  }

  /**
   * Get institute admin dashboard data
   */
async getInstituteAdminDashboard(institutionId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const institutionIdStr = institutionId.toString();

    // Simple direct query for users using imported models
    
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
   * Refresh dashboard cache
   */
  async refreshDashboardCache(userId, role, institutionId) {
    try {
      const { deleteCachePattern } = await import('../config/redis.js');
      const cacheKey = `dashboard:${userId}:${role}:${institutionId || 'default'}`;
      await deleteCachePattern(cacheKey);
      return { success: true, message: 'Cache cleared' };
    } catch (e) {
      logger.warn('Cache refresh not available (no Redis):', e.message);
      return { success: true, message: 'Cache not available' };
    }
  }

  /**
   * Get System Recent Activities
   */
  async getSystemRecentActivities(institutionId) {
    try {
      const activities = [];
      
      // Get recent user registrations
      const userQuery = {};
      if (institutionId) userQuery.institutionId = institutionId;
      const recentUsers = await User.find(userQuery)
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
      const attendanceQuery = {};
      if (institutionId) attendanceQuery.institutionId = institutionId;
      const recentAttendance = await Attendance.find(attendanceQuery)
        .populate('userId', 'name')
        .sort({ date: -1 })
        .limit(5);

      recentAttendance.forEach(record => {
        activities.push({
          id: record._id,
          type: 'attendance',
          title: `Attendance marked`,
          description: `${record.userId?.name || 'Student'} - ${record.status}`,
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
