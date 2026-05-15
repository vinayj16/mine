import Teacher from '../models/Teacher.js';
import TeacherLeave from '../models/TeacherLeave.js';
import TeacherRoutine from '../models/TeacherRoutine.js';
import TeacherSalary from '../models/TeacherSalary.js';
import TeacherLibrary from '../models/TeacherLibrary.js';
import Attendance from '../models/Attendance.js';

class TeacherService {
  async getTeacherDetails(teacherId, schoolId) {
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId, isActive: true })
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code')
      .populate('classes.classId', 'name grade')
      .populate('classes.sectionId', 'name')
      .populate('classes.subjectId', 'name code');
    
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    return teacher;
  }

  async getTeacherRoutine(teacherId, schoolId, filters = {}) {
    const query = { teacherId, schoolId, isActive: true };
    
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.term) query.term = filters.term;
    if (filters.dayOfWeek !== undefined) query.dayOfWeek = parseInt(filters.dayOfWeek);
    
    const routines = await TeacherRoutine.find(query)
      .populate('periods.subjectId', 'name code')
      .populate('periods.classId', 'name grade')
      .populate('periods.sectionId', 'name')
      .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });
    
    return routines;
  }

  async getTeacherLeaves(teacherId, schoolId, filters = {}) {
    const query = { teacherId, schoolId };
    
    if (filters.status) query.status = filters.status;
    if (filters.leaveType) query.leaveType = filters.leaveType;
    if (filters.startDate) query.startDate = { $gte: new Date(filters.startDate) };
    if (filters.endDate) query.endDate = { $lte: new Date(filters.endDate) };
    
    const leaves = await TeacherLeave.find(query)
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });
    
    const stats = await TeacherLeave.aggregate([
      { $match: { teacherId: query.teacherId, schoolId: query.schoolId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDays: { $sum: '$totalDays' }
        }
      }
    ]);
    
    const statsObj = stats.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        days: item.totalDays
      };
      return acc;
    }, {});
    
    return {
      leaves,
      stats: {
        pending: statsObj.pending || { count: 0, days: 0 },
        approved: statsObj.approved || { count: 0, days: 0 },
        rejected: statsObj.rejected || { count: 0, days: 0 },
        cancelled: statsObj.cancelled || { count: 0, days: 0 }
      }
    };
  }

  async applyLeave(teacherId, schoolId, leaveData) {
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId, isActive: true });
    
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const leave = await TeacherLeave.create({
      schoolId,
      teacherId,
      leaveType: leaveData.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: leaveData.reason,
      attachments: leaveData.attachments || []
    });
    
    return leave;
  }

  async reviewLeave(leaveId, schoolId, reviewData, reviewedBy) {
    const leave = await TeacherLeave.findOne({ _id: leaveId, schoolId });
    
    if (!leave) {
      throw new Error('Leave application not found');
    }
    
    leave.status = reviewData.status;
    leave.reviewedBy = reviewedBy;
    leave.reviewedDate = new Date();
    leave.reviewComments = reviewData.comments;
    
    await leave.save();
    return leave;
  }

  async getTeacherAttendance(teacherId, schoolId, filters = {}) {
    const query = { userId: teacherId, schoolId, userType: 'teacher' };
    
    if (filters.startDate) query.date = { $gte: new Date(filters.startDate) };
    if (filters.endDate) query.date = { ...query.date, $lte: new Date(filters.endDate) };
    if (filters.status) query.status = filters.status;
    
    const attendance = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(filters.limit || 100);
    
    const stats = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statsObj = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    
    return {
      records: attendance,
      stats: {
        present: statsObj.present || 0,
        absent: statsObj.absent || 0,
        late: statsObj.late || 0,
        emergency: statsObj.emergency || 0,
        total: attendance.length
      }
    };
  }

  async getTeacherSalary(teacherId, schoolId, filters = {}) {
    const query = { teacherId, schoolId };
    
    if (filters.month) query.month = parseInt(filters.month);
    if (filters.year) query.year = parseInt(filters.year);
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    
    const salaries = await TeacherSalary.find(query)
      .sort({ year: -1, month: -1 })
      .limit(filters.limit || 12);
    
    const summary = await TeacherSalary.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$paymentStatus',
          totalAmount: { $sum: '$netSalary' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const summaryObj = summary.reduce((acc, item) => {
      acc[item._id] = {
        amount: item.totalAmount,
        count: item.count
      };
      return acc;
    }, {});
    
    return {
      salaries,
      summary: {
        pending: summaryObj.pending || { amount: 0, count: 0 },
        processing: summaryObj.processing || { amount: 0, count: 0 },
        paid: summaryObj.paid || { amount: 0, count: 0 },
        failed: summaryObj.failed || { amount: 0, count: 0 }
      }
    };
  }

  async createSalary(teacherId, schoolId, salaryData) {
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId, isActive: true });
    
    if (!teacher) {
      throw new Error('Teacher not found');
    }
    
    const existingSalary = await TeacherSalary.findOne({
      teacherId,
      schoolId,
      month: salaryData.month,
      year: salaryData.year
    });
    
    if (existingSalary) {
      throw new Error('Salary record already exists for this month');
    }
    
    const salary = await TeacherSalary.create({
      schoolId,
      teacherId,
      ...salaryData
    });
    
    return salary;
  }

  async updateSalaryStatus(salaryId, schoolId, statusData) {
    const salary = await TeacherSalary.findOne({ _id: salaryId, schoolId });
    
    if (!salary) {
      throw new Error('Salary record not found');
    }
    
    salary.paymentStatus = statusData.status;
    if (statusData.status === 'paid') {
      salary.paymentDate = statusData.paymentDate || new Date();
      salary.transactionId = statusData.transactionId;
    }
    salary.remarks = statusData.remarks;
    
    await salary.save();
    return salary;
  }

  async getTeacherLibraryRecords(teacherId, schoolId, filters = {}) {
    const query = { teacherId, schoolId };
    
    if (filters.status) query.status = filters.status;
    
    const records = await TeacherLibrary.find(query)
      .populate('bookId', 'title author category isbn')
      .populate('issuedBy', 'name')
      .populate('returnedTo', 'name')
      .sort({ issueDate: -1 });
    
    records.forEach(record => {
      if (record.status === 'issued') {
        record.calculateFine();
      }
    });
    
    const stats = {
      issued: records.filter(r => r.status === 'issued').length,
      returned: records.filter(r => r.status === 'returned').length,
      overdue: records.filter(r => r.status === 'overdue').length,
      lost: records.filter(r => r.status === 'lost').length,
      totalFine: records.reduce((sum, r) => sum + r.fineAmount, 0),
      unpaidFine: records.filter(r => !r.finePaid).reduce((sum, r) => sum + r.fineAmount, 0)
    };
    
    return {
      records,
      stats
    };
  }

  async getTeacherDashboardData(teacherId, schoolId) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const thirtyDaysAgo = new Date(currentDate.setDate(currentDate.getDate() - 30));
    
    const [teacher, leaves, attendance, salary, library, routine] = await Promise.all([
      this.getTeacherDetails(teacherId, schoolId),
      this.getTeacherLeaves(teacherId, schoolId, { status: 'pending' }),
      this.getTeacherAttendance(teacherId, schoolId, { startDate: thirtyDaysAgo }),
      this.getTeacherSalary(teacherId, schoolId, { month: currentMonth, year: currentYear }),
      this.getTeacherLibraryRecords(teacherId, schoolId, { status: 'issued' }),
      this.getTeacherRoutine(teacherId, schoolId)
    ]);
    
    return {
      teacher,
      pendingLeaves: leaves.leaves.length,
      attendancePercentage: attendance.stats.total > 0 
        ? ((attendance.stats.present / attendance.stats.total) * 100).toFixed(2)
        : 0,
      currentMonthSalary: salary.salaries[0] || null,
      issuedBooks: library.stats.issued,
      overdueBooks: library.stats.overdue,
      totalFine: library.stats.unpaidFine,
      totalClasses: teacher.classes.length,
      weeklyPeriods: routine.reduce((sum, day) => sum + day.periods.length, 0)
    };
  }

  async getTeacherSidebarData(teacherId, schoolId) {
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId, isActive: true })
      .populate('departmentId', 'name code')
      .populate('subjects', 'name code')
      .populate('classes.classId', 'name grade')
      .populate('classes.sectionId', 'name');
    
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    const basicInfo = [
      { label: 'Department', value: teacher.departmentId?.name || 'N/A' },
      { label: 'Designation', value: teacher.designation || 'N/A' },
      { label: 'Gender', value: teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1) },
      { label: 'Date of Birth', value: new Date(teacher.dateOfBirth).toLocaleDateString() },
      { label: 'Blood Group', value: teacher.bloodGroup || 'N/A' },
      { label: 'Joining Date', value: new Date(teacher.joiningDate).toLocaleDateString() }
    ];

    const primaryContact = {
      phone: teacher.phone || 'N/A',
      email: teacher.email || 'N/A'
    };

    const hostelInfo = {
      name: 'Not Assigned',
      room: 'N/A'
    };

    const transportInfo = {
      route: 'Not Assigned',
      busNumber: 'N/A',
      pickupPoint: 'N/A'
    };

    return {
      name: teacher.fullName,
      id: teacher.employeeId,
      joinedOn: new Date(teacher.joiningDate).toLocaleDateString(),
      avatar: teacher.documents?.find(doc => doc.type === 'photo')?.url || '/assets/img/default-avatar.png',
      basicInfo,
      contact: primaryContact,
      panNumber: teacher.documents?.find(doc => doc.type === 'id_proof')?.name || 'N/A',
      hostel: hostelInfo,
      transport: transportInfo
    };
  }
}

export default new TeacherService();
