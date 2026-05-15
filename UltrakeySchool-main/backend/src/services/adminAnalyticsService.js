import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import Complaint from '../models/Complaint.js';
import Leave from '../models/Leave.js';
import Class from '../models/Class.js';

class AdminAnalyticsService {
  /**
   * Get comprehensive admin analytics dashboard data
   */
  async getAdminAnalytics(schoolId, period = 'month') {
    const [
      admissionsData,
      attendanceData,
      feesData,
      staffData,
      complaintsData
    ] = await Promise.all([
      this.getAdmissionsAnalytics(schoolId, period),
      this.getAttendanceAnalytics(schoolId, period),
      this.getFeesAnalytics(schoolId, period),
      this.getStaffAnalytics(schoolId, period),
      this.getComplaintsAnalytics(schoolId, period)
    ]);

    return {
      admissions: admissionsData,
      attendance: attendanceData,
      fees: feesData,
      staff: staffData,
      complaints: complaintsData
    };
  }

  /**
   * Get Admissions Analytics
   */
  async getAdmissionsAnalytics(schoolId, period) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Total admissions this year
    const totalAdmissions = await Student.countDocuments({
      schoolId,
      createdAt: { $gte: startOfYear }
    });

    // New admissions this month
    const newAdmissionsMonth = await Student.countDocuments({
      schoolId,
      createdAt: { $gte: startOfMonth }
    });

    // Total students
    const totalStudents = await Student.countDocuments({ schoolId, isActive: true });

    // Get class-wise strength
    const classStrength = await Student.aggregate([
      { $match: { schoolId, isActive: true } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
      { $lookup: { from: 'classes', localField: '_id', foreignField: '_id', as: 'class' } },
      { $unwind: '$class' },
      { $project: { className: '$class.name', students: '$count', capacity: '$class.capacity' } }
    ]);

    // Monthly admission trend (last 12 months)
    const monthlyTrend = await this.getMonthlyAdmissionTrend(schoolId, 12);

    // Dropout rate
    const inactiveStudents = await Student.countDocuments({ schoolId, isActive: false });
    const dropoutRate = totalStudents > 0 ? ((inactiveStudents / (totalStudents + inactiveStudents)) * 100).toFixed(1) : 0;

    // Recent applications (pending admissions)
    const recentApplications = await Student.find({
      schoolId,
      status: { $in: ['pending', 'applied'] }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('classId', 'name')
      .select('name classId createdAt status');

    return {
      kpis: {
        totalAdmissions,
        newAdmissionsMonth,
        totalStudents,
        dropoutRate,
        seatOccupancy: this.calculateSeatOccupancy(classStrength)
      },
      classStrength,
      monthlyTrend,
      recentApplications: recentApplications.map(app => ({
        name: app.name,
        class: app.classId?.name || 'N/A',
        date: app.createdAt,
        status: app.status
      }))
    };
  }

  /**
   * Get Attendance Analytics
   */
  async getAttendanceAnalytics(schoolId, period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's attendance
    const [totalStudents, presentToday] = await Promise.all([
      Student.countDocuments({ schoolId, isActive: true }),
      Attendance.countDocuments({ schoolId, date: today, status: 'present', userType: 'student' })
    ]);

    const attendancePercentage = totalStudents > 0 ? ((presentToday / totalStudents) * 100).toFixed(1) : 0;

    // Teacher attendance
    const [totalTeachers, teachersPresent] = await Promise.all([
      Teacher.countDocuments({ schoolId, isActive: true }),
      Attendance.countDocuments({ schoolId, date: today, status: 'present', userType: 'teacher' })
    ]);

    const teacherAttendancePercentage = totalTeachers > 0 ? ((teachersPresent / totalTeachers) * 100).toFixed(1) : 0;

    // Monthly attendance trend (last 9 months)
    const monthlyTrend = await this.getMonthlyAttendanceTrend(schoolId, 9);

    // Class-wise attendance
    const classWiseAttendance = await this.getClassWiseAttendance(schoolId, startOfMonth, today);

    // Frequent absentees (students with < 75% attendance)
    const frequentAbsentees = await this.getFrequentAbsentees(schoolId, 30);

    // Weekly attendance (last 5 days)
    const weeklyAttendance = await this.getWeeklyAttendance(schoolId, 5);

    return {
      kpis: {
        studentAttendance: attendancePercentage,
        teacherAttendance: teacherAttendancePercentage,
        presentToday,
        absentToday: totalStudents - presentToday,
        frequentAbsenteesCount: frequentAbsentees.length
      },
      monthlyTrend,
      weeklyAttendance,
      classWiseAttendance,
      frequentAbsentees
    };
  }

  /**
   * Get Fees Analytics
   */
  async getFeesAnalytics(schoolId, period) {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Fees collected this month
    const collectedThisMonth = await Fee.aggregate([
      {
        $match: {
          schoolId,
          status: 'paid',
          paidDate: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);

    const collected = collectedThisMonth[0]?.total || 0;

    // Total pending fees
    const pendingFees = await Fee.aggregate([
      {
        $match: {
          schoolId,
          status: { $in: ['pending', 'overdue'] }
        }
      },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
    ]);

    const pending = pendingFees[0]?.total || 0;

    // Overdue students (60+ days)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const overdueStudents = await Fee.find({
      schoolId,
      status: 'overdue',
      dueDate: { $lt: sixtyDaysAgo }
    })
      .populate('studentId', 'name classId')
      .populate('studentId.classId', 'name')
      .limit(5);

    // Monthly collection trend (last 9 months)
    const monthlyTrend = await this.getMonthlyFeesTrend(schoolId, 9);

    // Payment mode distribution
    const paymentModes = await Fee.aggregate([
      { $match: { schoolId, status: 'paid' } },
      { $group: { _id: '$paymentMode', count: { $sum: 1 } } }
    ]);

    // Pending by class
    const pendingByClass = await Fee.aggregate([
      {
        $match: {
          schoolId,
          status: { $in: ['pending', 'overdue'] }
        }
      },
      {
        $lookup: {
          from: 'students',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      {
        $lookup: {
          from: 'classes',
          localField: 'student.classId',
          foreignField: '_id',
          as: 'class'
        }
      },
      { $unwind: '$class' },
      {
        $group: {
          _id: '$class.name',
          pending: { $sum: { $subtract: ['$amount', '$paidAmount'] } }
        }
      }
    ]);

    return {
      kpis: {
        collectedThisMonth: collected,
        totalPending: pending,
        overdueCount: overdueStudents.length,
        collectionRate: collected > 0 ? ((collected / (collected + pending)) * 100).toFixed(1) : 0
      },
      monthlyTrend,
      paymentModes: paymentModes.map(pm => ({
        name: pm._id || 'Cash',
        value: pm.count
      })),
      pendingByClass: pendingByClass.map(pc => ({
        class: pc._id,
        pending: pc.pending
      })),
      overdueStudents: overdueStudents.map(fee => ({
        name: fee.studentId?.name || 'N/A',
        class: fee.studentId?.classId?.name || 'N/A',
        amount: fee.amount - fee.paidAmount,
        dueDate: fee.dueDate
      }))
    };
  }

  /**
   * Get Staff Analytics
   */
  async getStaffAnalytics(schoolId, period) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Total staff counts
    const [totalTeachers, totalNonTeaching] = await Promise.all([
      Teacher.countDocuments({ schoolId, isActive: true, role: 'teacher' }),
      Teacher.countDocuments({ schoolId, isActive: true, role: { $ne: 'teacher' } })
    ]);

    // Staff attendance today
    const staffPresent = await Attendance.countDocuments({
      schoolId,
      date: today,
      status: 'present',
      userType: 'teacher'
    });

    const staffAttendance = (totalTeachers + totalNonTeaching) > 0
      ? ((staffPresent / (totalTeachers + totalNonTeaching)) * 100).toFixed(1)
      : 0;

    // Pending leave requests
    const pendingLeaves = await Leave.find({
      schoolId,
      status: 'pending'
    })
      .populate('userId', 'name role avatar')
      .limit(5);

    // Department-wise attendance
    const deptAttendance = await this.getDepartmentAttendance(schoolId, today);

    return {
      kpis: {
        totalTeachers,
        totalNonTeaching,
        staffAttendance,
        pendingLeaves: pendingLeaves.length
      },
      deptAttendance,
      leaveRequests: pendingLeaves.map(leave => ({
        name: leave.userId?.name || 'N/A',
        role: leave.userId?.role || 'N/A',
        type: leave.leaveType,
        days: `${leave.startDate.toLocaleDateString()} - ${leave.endDate.toLocaleDateString()}`,
        avatar: leave.userId?.avatar
      }))
    };
  }

  /**
   * Get Complaints Analytics
   */
  async getComplaintsAnalytics(schoolId, period) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    // Total complaints this month
    const totalComplaints = await Complaint.countDocuments({
      schoolId,
      createdAt: { $gte: startOfMonth }
    });

    // Resolved complaints
    const resolvedComplaints = await Complaint.countDocuments({
      schoolId,
      status: 'resolved',
      createdAt: { $gte: startOfMonth }
    });

    // Open complaints
    const openComplaints = await Complaint.countDocuments({
      schoolId,
      status: { $in: ['open', 'pending', 'in-progress'] }
    });

    // Complaints by category
    const byCategory = await Complaint.aggregate([
      { $match: { schoolId } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Recent complaints
    const recentComplaints = await Complaint.find({ schoolId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('complaintId title category status createdAt');

    // Monthly trend (last 6 months)
    const monthlyTrend = await this.getMonthlyComplaintsTrend(schoolId, 6);

    // Average resolution time
    const avgResolutionTime = await this.getAverageResolutionTime(schoolId);

    return {
      kpis: {
        totalComplaints,
        resolvedComplaints,
        openComplaints,
        resolutionRate: totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0,
        avgResolutionTime
      },
      byCategory: byCategory.map(cat => ({
        category: cat._id || 'Others',
        count: cat.count
      })),
      monthlyTrend,
      recentComplaints: recentComplaints.map(c => ({
        id: c.complaintId,
        title: c.title,
        category: c.category,
        status: c.status,
        date: c.createdAt
      }))
    };
  }

  // Helper methods
  async getMonthlyAdmissionTrend(schoolId, months) {
    const result = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const count = await Student.countDocuments({
        schoolId,
        createdAt: { $gte: startDate, $lte: endDate }
      });

      result.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        admissions: count
      });
    }

    return result;
  }

  async getMonthlyAttendanceTrend(schoolId, months) {
    const result = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const [totalDays, studentAttendance, teacherAttendance] = await Promise.all([
        this.getWorkingDays(startDate, endDate),
        this.getAverageAttendance(schoolId, startDate, endDate, 'student'),
        this.getAverageAttendance(schoolId, startDate, endDate, 'teacher')
      ]);

      result.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        students: studentAttendance,
        staff: teacherAttendance
      });
    }

    return result;
  }

  async getMonthlyFeesTrend(schoolId, months) {
    const result = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const [collected, pending] = await Promise.all([
        Fee.aggregate([
          {
            $match: {
              schoolId,
              status: 'paid',
              paidDate: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$paidAmount' } } }
        ]),
        Fee.aggregate([
          {
            $match: {
              schoolId,
              status: { $in: ['pending', 'overdue'] },
              dueDate: { $gte: startDate, $lte: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: { $subtract: ['$amount', '$paidAmount'] } } } }
        ])
      ]);

      result.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        collected: collected[0]?.total || 0,
        pending: pending[0]?.total || 0
      });
    }

    return result;
  }

  async getMonthlyComplaintsTrend(schoolId, months) {
    const result = [];
    const today = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const startDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

      const [raised, resolved] = await Promise.all([
        Complaint.countDocuments({
          schoolId,
          createdAt: { $gte: startDate, $lte: endDate }
        }),
        Complaint.countDocuments({
          schoolId,
          status: 'resolved',
          resolvedAt: { $gte: startDate, $lte: endDate }
        })
      ]);

      result.push({
        month: startDate.toLocaleString('default', { month: 'short' }),
        raised,
        resolved
      });
    }

    return result;
  }

  calculateSeatOccupancy(classStrength) {
    if (!classStrength || classStrength.length === 0) return 0;

    const totalStudents = classStrength.reduce((sum, cls) => sum + cls.students, 0);
    const totalCapacity = classStrength.reduce((sum, cls) => sum + (cls.capacity || 0), 0);

    return totalCapacity > 0 ? ((totalStudents / totalCapacity) * 100).toFixed(1) : 0;
  }

  async getClassWiseAttendance(schoolId, startDate, endDate) {
    const classes = await Class.find({ schoolId }).select('name');
    const result = [];

    for (const cls of classes) {
      const students = await Student.countDocuments({ schoolId, classId: cls._id, isActive: true });
      const attendance = await Attendance.countDocuments({
        schoolId,
        classId: cls._id,
        date: { $gte: startDate, $lte: endDate },
        status: 'present'
      });

      const workingDays = await this.getWorkingDays(startDate, endDate);
      const expectedAttendance = students * workingDays;
      const percentage = expectedAttendance > 0 ? ((attendance / expectedAttendance) * 100).toFixed(0) : 0;

      result.push({
        class: cls.name,
        percentage: parseInt(percentage)
      });
    }

    return result;
  }

  async getFrequentAbsentees(schoolId, days) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const students = await Student.find({ schoolId, isActive: true }).select('name classId');
    const result = [];

    for (const student of students) {
      const totalDays = await this.getWorkingDays(startDate, new Date());
      const presentDays = await Attendance.countDocuments({
        schoolId,
        userId: student._id,
        date: { $gte: startDate },
        status: 'present'
      });

      const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(0) : 0;

      if (percentage < 75) {
        const classInfo = await Class.findById(student.classId).select('name');
        result.push({
          name: student.name,
          class: classInfo?.name || 'N/A',
          absences: totalDays - presentDays,
          percentage: `${percentage}%`
        });
      }
    }

    return result.slice(0, 10);
  }

  async getWeeklyAttendance(schoolId, days) {
    const result = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const [present, absent] = await Promise.all([
        Attendance.countDocuments({ schoolId, date, status: 'present', userType: 'student' }),
        Attendance.countDocuments({ schoolId, date, status: 'absent', userType: 'student' })
      ]);

      result.push({
        day: date.toLocaleString('default', { weekday: 'short' }),
        present,
        absent
      });
    }

    return result;
  }

  async getDepartmentAttendance(schoolId, date) {
    const departments = ['Science', 'Maths', 'English', 'Social', 'Non-Teaching'];
    const result = [];

    for (const dept of departments) {
      const total = await Teacher.countDocuments({ schoolId, department: dept, isActive: true });
      const present = await Attendance.countDocuments({
        schoolId,
        date,
        status: 'present',
        userType: 'teacher',
        department: dept
      });

      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      result.push({
        department: dept,
        attendance: percentage
      });
    }

    return result;
  }

  async getAverageAttendance(schoolId, startDate, endDate, userType) {
    const workingDays = await this.getWorkingDays(startDate, endDate);
    if (workingDays === 0) return 0;

    const totalUsers = userType === 'student'
      ? await Student.countDocuments({ schoolId, isActive: true })
      : await Teacher.countDocuments({ schoolId, isActive: true });

    const totalPresent = await Attendance.countDocuments({
      schoolId,
      date: { $gte: startDate, $lte: endDate },
      status: 'present',
      userType
    });

    const expectedAttendance = totalUsers * workingDays;
    return expectedAttendance > 0 ? Math.round((totalPresent / expectedAttendance) * 100) : 0;
  }

  async getWorkingDays(startDate, endDate) {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) { // Exclude weekends
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  async getAverageResolutionTime(schoolId) {
    const resolvedComplaints = await Complaint.find({
      schoolId,
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    if (resolvedComplaints.length === 0) return 0;

    const totalDays = resolvedComplaints.reduce((sum, complaint) => {
      const days = Math.ceil((complaint.resolvedAt - complaint.createdAt) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return (totalDays / resolvedComplaints.length).toFixed(1);
  }
}

export default new AdminAnalyticsService();
