import Student from '../models/Student.js';
import StudentLeave from '../models/StudentLeave.js';
import StudentResult from '../models/StudentResult.js';
import StudentLibrary from '../models/StudentLibrary.js';
import StudentTimetable from '../models/StudentTimetable.js';
import StudentHostel from '../models/StudentHostel.js';
import StudentTransport from '../models/StudentTransport.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';

class StudentService {
  async getStudentDetails(studentId, schoolId) {
    const student = await Student.findOne({ _id: studentId, schoolId, isActive: true })
      .populate('classId', 'name grade')
      .populate('sectionId', 'name')
      .populate('parentId', 'firstName lastName email phone')
      .populate('guardianId', 'firstName lastName email phone');
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  async getStudentTimetable(studentId, schoolId) {
    const student = await Student.findOne({ _id: studentId, schoolId, isActive: true });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    const timetables = await StudentTimetable.find({
      schoolId,
      classId: student.classId,
      sectionId: student.sectionId,
      isActive: true
    })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName')
      .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });
    
    return timetables;
  }

  async getStudentLeaves(studentId, schoolId, filters = {}) {
    const query = { studentId, schoolId };
    
    if (filters.status) query.status = filters.status;
    if (filters.startDate) query.startDate = { $gte: new Date(filters.startDate) };
    if (filters.endDate) query.endDate = { $lte: new Date(filters.endDate) };
    
    const leaves = await StudentLeave.find(query)
      .populate('appliedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });
    
    return leaves;
  }

  async applyLeave(studentId, schoolId, leaveData, appliedBy) {
    const student = await Student.findOne({ _id: studentId, schoolId, isActive: true });
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const leave = await StudentLeave.create({
      schoolId,
      studentId,
      leaveType: leaveData.leaveType,
      startDate,
      endDate,
      totalDays,
      reason: leaveData.reason,
      appliedBy,
      attachments: leaveData.attachments || []
    });
    
    return leave;
  }

  async reviewLeave(leaveId, schoolId, reviewData, reviewedBy) {
    const leave = await StudentLeave.findOne({ _id: leaveId, schoolId });
    
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

  async getStudentAttendance(studentId, schoolId, filters = {}) {
    const query = { userId: studentId, schoolId, userType: 'student' };
    
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

  async getStudentFees(studentId, schoolId, filters = {}) {
    const query = { studentId, schoolId };
    
    if (filters.status) query.status = filters.status;
    if (filters.feeType) query.feeType = filters.feeType;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    
    const fees = await Fee.find(query)
      .sort({ dueDate: -1 });
    
    const summary = await Fee.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
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
      fees,
      summary: {
        pending: summaryObj.pending || { amount: 0, count: 0 },
        paid: summaryObj.paid || { amount: 0, count: 0 },
        overdue: summaryObj.overdue || { amount: 0, count: 0 },
        partial: summaryObj.partial || { amount: 0, count: 0 }
      }
    };
  }

  async getStudentResults(studentId, schoolId, filters = {}) {
    const query = { studentId, schoolId };
    
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.term) query.term = filters.term;
    if (filters.status) query.status = filters.status;
    
    const results = await StudentResult.find(query)
      .populate('examId', 'name type date')
      .populate('classId', 'name grade')
      .sort({ 'examId.date': -1 });
    
    return results;
  }

  async getStudentLibraryRecords(studentId, schoolId, filters = {}) {
    const query = { studentId, schoolId };
    
    if (filters.status) query.status = filters.status;
    
    const records = await StudentLibrary.find(query)
      .populate('bookId', 'title author category')
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
      totalFine: records.reduce((sum, r) => sum + r.fineAmount, 0),
      unpaidFine: records.filter(r => !r.finePaid).reduce((sum, r) => sum + r.fineAmount, 0)
    };
    
    return {
      records,
      stats
    };
  }

  async getStudentDashboardData(studentId, schoolId) {
    const [student, leaves, attendance, fees, library] = await Promise.all([
      this.getStudentDetails(studentId, schoolId),
      this.getStudentLeaves(studentId, schoolId, { status: 'pending' }),
      this.getStudentAttendance(studentId, schoolId, { 
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)) 
      }),
      this.getStudentFees(studentId, schoolId, { status: 'pending' }),
      this.getStudentLibraryRecords(studentId, schoolId, { status: 'issued' })
    ]);
    
    return {
      student,
      pendingLeaves: leaves.length,
      attendancePercentage: attendance.stats.total > 0 
        ? ((attendance.stats.present / attendance.stats.total) * 100).toFixed(2)
        : 0,
      pendingFees: fees.summary.pending.amount,
      issuedBooks: library.stats.issued,
      overdueBooks: library.stats.overdue,
      totalFine: library.stats.unpaidFine
    };
  }

  async getStudentSidebarData(studentId, schoolId) {
    const student = await Student.findOne({ _id: studentId, schoolId, isActive: true })
      .populate('classId', 'name grade')
      .populate('sectionId', 'name')
      .populate('parentId', 'firstName lastName email phone')
      .populate('guardianId', 'firstName lastName email phone');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const [hostelInfo, transportInfo, siblings] = await Promise.all([
      this.getStudentHostelInfo(studentId, schoolId),
      this.getStudentTransportInfo(studentId, schoolId),
      this.getStudentSiblings(studentId, schoolId)
    ]);

    const basicInfo = [
      { label: 'Class', value: student.classId?.name || 'N/A' },
      { label: 'Section', value: student.sectionId?.name || 'N/A' },
      { label: 'Gender', value: student.gender.charAt(0).toUpperCase() + student.gender.slice(1) },
      { label: 'Date of Birth', value: new Date(student.dateOfBirth).toLocaleDateString() },
      { label: 'Blood Group', value: student.bloodGroup || 'N/A' },
      { label: 'Admission Date', value: new Date(student.admissionDate).toLocaleDateString() }
    ];

    const primaryContact = {
      phone: student.phone || student.parentId?.phone || 'N/A',
      email: student.email || student.parentId?.email || 'N/A'
    };

    return {
      name: student.fullName,
      admissionNo: student.admissionNumber,
      rollNo: student.rollNumber || 'N/A',
      avatar: student.documents?.find(doc => doc.type === 'photo')?.url || '/assets/img/default-avatar.png',
      status: student.status.charAt(0).toUpperCase() + student.status.slice(1),
      basicInfo,
      primaryContact,
      siblings,
      hostel: hostelInfo,
      transport: transportInfo
    };
  }

  async getStudentHostelInfo(studentId, schoolId) {
    const hostelRecord = await StudentHostel.findOne({ 
      studentId, 
      schoolId, 
      status: 'active' 
    }).populate('hostelId', 'name');

    if (!hostelRecord) {
      return {
        name: 'Not Assigned',
        room: 'N/A'
      };
    }

    return {
      name: hostelRecord.hostelName || hostelRecord.hostelId?.name || 'N/A',
      room: hostelRecord.roomNumber ? `Room ${hostelRecord.roomNumber}` : 'N/A',
      bedNumber: hostelRecord.bedNumber,
      admissionDate: hostelRecord.admissionDate
    };
  }

  async getStudentTransportInfo(studentId, schoolId) {
    const transportRecord = await StudentTransport.findOne({ 
      studentId, 
      schoolId, 
      status: 'active' 
    }).populate('transportId', 'routeName vehicleNumber');

    if (!transportRecord) {
      return {
        route: 'Not Assigned',
        busNumber: 'N/A',
        pickupPoint: 'N/A'
      };
    }

    return {
      route: transportRecord.routeName || transportRecord.transportId?.routeName || 'N/A',
      busNumber: transportRecord.vehicleNumber || transportRecord.transportId?.vehicleNumber || 'N/A',
      pickupPoint: transportRecord.pickupPoint || 'N/A',
      pickupTime: transportRecord.pickupTime
    };
  }

  async getStudentSiblings(studentId, schoolId) {
    const student = await Student.findOne({ _id: studentId, schoolId, isActive: true });
    
    if (!student || !student.parentId) {
      return [];
    }

    const siblings = await Student.find({
      schoolId,
      parentId: student.parentId,
      _id: { $ne: studentId },
      isActive: true
    })
      .populate('classId', 'name grade')
      .select('firstName lastName classId documents')
      .limit(5);

    return siblings.map(sibling => ({
      name: `${sibling.firstName} ${sibling.lastName}`,
      classLabel: sibling.classId ? `${sibling.classId.name} - ${sibling.classId.grade}` : 'N/A',
      avatar: sibling.documents?.find(doc => doc.type === 'photo')?.url || '/assets/img/default-avatar.png'
    }));
  }
}

export default new StudentService();
