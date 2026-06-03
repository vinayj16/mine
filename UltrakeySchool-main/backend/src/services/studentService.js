import mongoose from 'mongoose';
import Student from '../models/Student.js';
import StudentLeave from '../models/StudentLeave.js';
import StudentResult from '../models/StudentResult.js';
import ClassTimetable from '../models/ClassTimetable.js';
import StudentHostel from '../models/StudentHostel.js';
import StudentTransport from '../models/StudentTransport.js';
import Attendance from '../models/Attendance.js';
import Fee from '../models/Fee.js';
import HostelFee from '../models/hostelFee.js';
import TransportFee from '../models/TransportFee.js';

function withinstitutionId(base, institutionId) {
  if (institutionId) base.institutionId = institutionId;
  return base;
}

class StudentService {
  async getStudentDetails(studentId, institutionId) {
    const student = await Student.findOne(withinstitutionId({ _id: studentId, isActive: true }, institutionId))
      .populate('classId', 'name grade')
      .populate('sectionId', 'name')
      .populate('parentId', 'firstName lastName email phone')
      .populate('guardianId', 'firstName lastName email phone');
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    return student;
  }

  async getStudentTimetable(studentId, institutionId) {
    // Try multiple lookup strategies to find the student
    let student = await Student.findOne(withinstitutionId({ _id: studentId }, institutionId));
    if (!student) {
      student = await Student.findOne(withinstitutionId({ userId: studentId }, institutionId));
    }
    if (!student && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    }
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }
    
    if (!student) {
      return [];
    }
    
    const timetables = await ClassTimetable.find(withinstitutionId({
      classId: student.classId,
      sectionId: student.sectionId,
      isActive: true
    }, institutionId))
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'name email avatar')
      .sort({ dayOfWeek: 1, 'periods.periodNumber': 1 });
    
    // Transform data to match frontend expected format
    const transformedSessions = [];
    
    timetables.forEach(timetable => {
      const dayName = timetable.dayOfWeek.charAt(0).toUpperCase() + timetable.dayOfWeek.slice(1);
      
      timetable.periods.forEach(period => {
        if (!period.isBreak) {
          transformedSessions.push({
            _id: `${timetable._id}-${period.periodNumber}`,
            day: dayName,
            startTime: period.startTime,
            endTime: period.endTime,
            subject: period.subjectName || period.subjectId?.name || 'N/A',
            teacherId: period.teacherId ? {
              _id: period.teacherId._id,
              name: period.teacherId.name,
              firstName: period.teacherId.firstName || '',
              lastName: period.teacherId.lastName || '',
              avatar: period.teacherId.avatar
            } : undefined,
            roomNumber: period.roomNumber
          });
        }
      });
    });
    
    return transformedSessions;
  }

  async createSampleTimetable(studentId, institutionId) {
    // Try multiple lookup strategies to find the student
    let student = await Student.findOne(withinstitutionId({ _id: studentId }, institutionId));
    if (!student) {
      student = await Student.findOne(withinstitutionId({ userId: studentId }, institutionId));
    }
    if (!student && mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    }
    if (!student) {
      student = await Student.findOne({ userId: studentId });
    }
    if (!student) {
      return [];
    }

    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    const effectiveinstitutionId = institutionId || student.institutionId;
    
    if (!effectiveinstitutionId) {
      throw new Error('School ID is required to create timetable');
    }
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const subjectNames = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Computer Science', 'Physical Education'];
    const rooms = ['Room 101', 'Room 102', 'Room 103', 'Lab 1', 'Lab 2'];
    
    // Create placeholder subject ObjectIds to satisfy validation
    const placeholderSubjectIds = subjectNames.map(() => new mongoose.Types.ObjectId());
    
    const sampleSessions = [];
    
    days.forEach((day, dayIndex) => {
      const periods = [];
      
      // Morning periods
      for (let i = 1; i <= 6; i++) {
        const startHour = 8 + i - 1;
        const endHour = startHour + 1;
        
        periods.push({
          periodNumber: i,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          subjectId: placeholderSubjectIds[(dayIndex + i) % placeholderSubjectIds.length],
          roomNumber: rooms[i % rooms.length],
          periodType: 'lecture'
        });
      }
      
      // Lunch break
      periods.push({
        periodNumber: 7,
        startTime: '13:00',
        endTime: '14:00',
        subjectId: placeholderSubjectIds[0],
        roomNumber: 'Cafeteria',
        periodType: 'lunch'
      });
      
      // Afternoon periods
      for (let i = 8; i <= 9; i++) {
        const startHour = 14 + (i - 8);
        const endHour = startHour + 1;
        
        periods.push({
          periodNumber: i,
          startTime: `${startHour.toString().padStart(2, '0')}:00`,
          endTime: `${endHour.toString().padStart(2, '0')}:00`,
          subjectId: placeholderSubjectIds[(dayIndex + i) % placeholderSubjectIds.length],
          roomNumber: rooms[i % rooms.length],
          periodType: 'lecture'
        });
      }
      
      sampleSessions.push({
        institutionId: effectiveinstitutionId,
        classId: student.classId,
        sectionId: student.sectionId,
        academicYear,
        dayOfWeek: day,
        periods,
        isActive: true
      });
    });
    
    await ClassTimetable.insertMany(sampleSessions);
    
    // Return transformed data
    return this.getStudentTimetable(studentId, institutionId);
  }

  async getStudentLeaves(studentId, institutionId, filters = {}) {
    const query = withinstitutionId({ studentId }, institutionId);
    
    if (filters.status) query.status = filters.status;
    if (filters.startDate) query.startDate = { $gte: new Date(filters.startDate) };
    if (filters.endDate) query.endDate = { $lte: new Date(filters.endDate) };
    
    const leaves = await StudentLeave.find(query)
      .populate('appliedBy', 'name email')
      .populate('reviewedBy', 'name email')
      .sort({ appliedDate: -1 });
    
    return leaves;
  }

  async applyLeave(studentId, institutionId, leaveData, appliedBy) {
    const student = await Student.findOne(withinstitutionId({ _id: studentId, isActive: true }, institutionId));
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    const startDate = new Date(leaveData.startDate);
    const endDate = new Date(leaveData.endDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    const leave = await StudentLeave.create({
      institutionId,
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

  async reviewLeave(leaveId, institutionId, reviewData, reviewedBy) {
    const leave = await StudentLeave.findOne(withinstitutionId({ _id: leaveId }, institutionId));
    
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

  async getStudentAttendance(studentId, institutionId, filters = {}) {
    // First get the student to resolve the actual userId
    const student = await Student.findById(studentId).lean();
    const userId = student?.userId || studentId;
    
    const query = withinstitutionId({ userId, userType: 'student' }, institutionId);
    
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

  async getStudentFees(studentId, institutionId, filters = {}) {
    // Resolve studentId: if it's a User _id, find the matching Student doc
    let resolvedStudentId = studentId;
    let student = await Student.findById(studentId).lean();
    if (!student) {
      student = await Student.findOne({ userId: studentId }).lean();
      if (student) resolvedStudentId = student._id.toString();
    }

    // Fetch general fees - the Fee model uses studentId = Student._id (not User._id)
    const generalQuery = withinstitutionId({ studentId: resolvedStudentId }, institutionId);
    if (filters.academicYear) generalQuery.academicYear = filters.academicYear;
    const generalFees = await Fee.find(generalQuery).lean();

    // 2. institutionId passed from caller is already the correct institution

    // 3. Fetch hostel fees
    const hostelQuery = { student: resolvedStudentId };
    if (institutionId) hostelQuery.institution = institutionId;
    const hostelFees = await HostelFee.find(hostelQuery).lean();

    // 4. Fetch transport fees
    const transportQuery = { studentId: resolvedStudentId };
    if (institutionId) transportQuery.institutionId = institutionId;
    if (filters.academicYear) transportQuery.academicYear = filters.academicYear;
    const transportFees = await TransportFee.find(transportQuery).lean();

    // 5. Map and unify all fees into a unified schema
    const unifiedFees = [];

    // Map General Fees - handle both flat structure and nested feeItems array
    generalFees.forEach(fee => {
      if (fee.feeItems && Array.isArray(fee.feeItems) && fee.feeItems.length > 0) {
        // Nested feeItems structure
        fee.feeItems.forEach((item, idx) => {
          const itemStatus = item.status || fee.status || 'pending';
          let mappedStatus = itemStatus;
          if (itemStatus === 'pending' || itemStatus === 'overdue') mappedStatus = 'unpaid';
          
          unifiedFees.push({
            _id: fee._id,  // Use parent _id so Razorpay payment lookup works
            feeGroup: item.feeType || fee.feeGroup || 'General Fees',
            feeCode: fee.feeCode || 'FEE',
            type: 'general',
            dueDate: item.dueDate || fee.dueDate,
            amount: item.amount || item.dueAmount || 0,
            status: mappedStatus,
            referenceId: fee.referenceId || '',
            paymentMode: fee.paymentMode || item.paymentMode || '',
            paidOn: fee.paidOn || fee.paidAt || item.paidOn || '',
            discount: fee.discount || item.discount || 0,
            fine: fee.fine || item.fine || 0,
            academicYear: fee.academicYear
          });
        });
      } else {
        // Flat fee structure
        let mappedStatus = fee.status;
        if (fee.status === 'pending' || fee.status === 'overdue') mappedStatus = 'unpaid';
        
        unifiedFees.push({
          _id: fee._id,
          feeGroup: fee.feeGroup || 'General Fees',
          feeCode: fee.feeCode || fee.feeType || 'GEN',
          type: 'general',
          dueDate: fee.dueDate,
          amount: fee.amount,
          status: mappedStatus,
          referenceId: fee.referenceId || '',
          paymentMode: fee.paymentMode || '',
          paidOn: fee.paidOn || fee.paidAt || '',
          discount: fee.discount || 0,
          fine: fee.fine || 0,
          academicYear: fee.academicYear
        });
      }
    });

    // Map Hostel Fees
    hostelFees.forEach(fee => {
      let mappedStatus = fee.status;
      if (fee.status === 'pending' || fee.status === 'overdue') mappedStatus = 'unpaid';

      unifiedFees.push({
        _id: fee._id,
        feeGroup: 'Hostel Fee',
        feeCode: fee.description || 'Hostel Rent',
        type: 'hostel',
        dueDate: fee.dueDate,
        amount: fee.amount,
        status: mappedStatus,
        referenceId: fee.transactionReference || '',
        paymentMode: fee.paymentMode || 'online',
        paidOn: fee.paidAt || '',
        discount: 0,
        fine: 0,
        academicYear: filters.academicYear || '2024/2025'
      });
    });

    // Map Transport Fees
    transportFees.forEach(fee => {
      let mappedStatus = fee.paymentStatus;
      if (fee.paymentStatus === 'pending' || fee.paymentStatus === 'overdue') mappedStatus = 'unpaid';

      unifiedFees.push({
        _id: fee._id,
        feeGroup: 'Transport Fee',
        feeCode: fee.remarks || 'Bus Fare',
        type: 'transport',
        dueDate: fee.dueDate,
        amount: fee.feeAmount,
        status: mappedStatus,
        referenceId: fee.paymentReference || '',
        paymentMode: fee.paymentMethod || '',
        paidOn: fee.paidDate || '',
        discount: fee.discount || 0,
        fine: fee.lateFee || 0,
        academicYear: fee.academicYear
      });
    });

    // Filter by status/type if provided
    let filteredFees = unifiedFees;
    if (filters.status) {
      const filterStatus = filters.status === 'pending' ? 'unpaid' : filters.status;
      filteredFees = unifiedFees.filter(fee => fee.status === filterStatus);
    }
    if (filters.feeType) {
      filteredFees = filteredFees.filter(fee => fee.type === filters.feeType);
    }

    // Sort by due date descending
    filteredFees.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    // Calculate Summary across ALL unified fees
    const summary = {
      pending: { amount: 0, count: 0 },
      paid: { amount: 0, count: 0 },
      overdue: { amount: 0, count: 0 },
      partial: { amount: 0, count: 0 }
    };

    unifiedFees.forEach(fee => {
      const amt = fee.amount - (fee.discount || 0) + (fee.fine || 0);
      if (fee.status === 'paid') {
        summary.paid.amount += amt;
        summary.paid.count += 1;
      } else if (fee.status === 'partial') {
        summary.partial.amount += amt;
        summary.partial.count += 1;
      } else {
        // unpaid / pending
        const isOverdue = new Date(fee.dueDate) < new Date() && fee.status !== 'paid';
        if (isOverdue) {
          summary.overdue.amount += amt;
          summary.overdue.count += 1;
        } else {
          summary.pending.amount += amt;
          summary.pending.count += 1;
        }
      }
    });

    return {
      fees: filteredFees,
      summary
    };
  }

  async getStudentResults(studentId, institutionId, filters = {}) {
    let student = await Student.findById(studentId).lean();
    if (!student) {
      student = await Student.findOne({ userId: studentId }).lean();
    }
    const resolvedStudentId = student?._id?.toString() || studentId.toString();
    const query = withinstitutionId({ studentId: resolvedStudentId }, institutionId);
    
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.term) query.term = filters.term;
    if (filters.status) query.status = filters.status;
    
    const docs = await StudentResult.find(query).lean();
    
    if (!docs || docs.length === 0) return [];

    const transformed = [];
    for (const doc of docs) {
      const hasSubjects = !!doc.subjects;
      const hasResults = !!doc.results;
      // Format 1: document has subjects (schema) or results (raw insert) sub-array
      const subjectArray = (doc.subjects && doc.subjects.length > 0) ? doc.subjects : (doc.results || []);
      if (subjectArray.length > 0) {
        const subjects = subjectArray.map(s => ({
          subjectName: s.subjectName || '',
          maxMarks: s.maxMarks || s.totalMarks || 100,
          minMarks: 0,
          marksObtained: s.marksObtained || s.obtainedMarks || 0,
          status: (s.grade && s.grade !== 'F' && s.grade !== 'E') ? 'pass' : 'fail'
        }));
        const passed = subjects.every(s => s.status === 'pass');
        transformed.push({
          _id: doc._id,
          examName: subjectArray[0]?.examName || doc.examName || doc.examType || 'Exam',
          examDate: subjectArray[0]?.examDate || doc.examDate || doc.createdAt || new Date().toISOString(),
          subjects,
          totalMarks: doc.totalMaxMarks || subjects.reduce((sum, s) => sum + s.maxMarks, 0),
          marksObtained: doc.totalObtainedMarks || subjects.reduce((sum, s) => sum + s.marksObtained, 0),
          percentage: doc.overallPercentage ?? 0,
          rank: doc.rank || null,
          result: passed ? 'pass' : 'fail',
          academicYear: doc.academicYear || ''
        });
        continue;
      }

      // Format 2: flat per-subject documents, group by examType+term+academicYear
      // (handled below after loop)
    }

    // If no docs had sub-arrays, group flat documents
    if (transformed.length === 0 && docs.length > 0) {
      const grouped = {};
      for (const doc of docs) {
        const key = doc.examId?.toString() || (doc.examType || '') + '-' + (doc.term || '') + '-' + (doc.academicYear || '');
        if (!grouped[key]) {
          grouped[key] = {
            _id: doc._id,
            examName: doc.examType || doc.examName || 'Exam',
            examDate: doc.createdAt || doc.publishedDate || new Date().toISOString(),
            subjects: [],
            totalMarks: 0,
            marksObtained: 0,
            percentage: 0,
            rank: doc.rank || null,
            result: 'pass',
            academicYear: doc.academicYear || ''
          };
        }
        const g = grouped[key];
        if (doc.subjectName) {
          const passed = doc.grade && doc.grade !== 'F' && doc.grade !== 'E' ? true : (doc.marks >= (doc.maxMarks || 100) * 0.35);
          g.subjects.push({
            subjectName: doc.subjectName,
            maxMarks: doc.maxMarks || 100,
            minMarks: 0,
            marksObtained: doc.marks || doc.marksObtained || 0,
            status: passed ? 'pass' : 'fail'
          });
          g.totalMarks += doc.maxMarks || 100;
          g.marksObtained += doc.marks || doc.marksObtained || 0;
        }
      }
      for (const g of Object.values(grouped)) {
        g.percentage = g.totalMarks > 0 ? Math.round((g.marksObtained / g.totalMarks) * 10000) / 100 : 0;
        g.result = g.percentage >= 35 ? 'pass' : 'fail';
        if (g.subjects.some(s => s.status === 'fail')) g.result = 'fail';
        transformed.push(g);
      }
    }

    return transformed.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  }

  async getStudentLibraryRecords(studentId, institutionId, filters = {}) {
    const { BookIssue, Book } = await import('../models/library.js');
    
    let student = await Student.findById(studentId).lean();
    if (!student) {
      student = await Student.findOne({ userId: studentId }).lean();
    }
    const resolvedStudentId = student?._id?.toString() || studentId.toString();
    
    const query = mongoose.Types.ObjectId.isValid(resolvedStudentId)
      ? { studentId: new mongoose.Types.ObjectId(resolvedStudentId) }
      : { studentId: resolvedStudentId };
    if (filters.status) {
      const statusMap = {
        issued: 'Issued',
        returned: 'Returned',
        overdue: 'Overdue',
        lost: 'Lost'
      };
      query.status = statusMap[filters.status.toLowerCase()] || filters.status;
    }
    
    const records = await BookIssue.find(query).lean();
      
    // Resolve book details from the Book collection since the schema uses 'book' field
    // but documents store bookId. Also populate any embedded book data.
    const mappedRecords = [];
    for (const r of records) {
      let bookData = {
        _id: r.bookId || r.book || r._id,
        title: r.bookTitle || 'Unknown Book',
        author: r.author || r.bookAuthor || '',
        isbn: r.isbn || '',
        coverImage: r.coverImage || ''
      };
      
      // Try to populate book details if bookId exists
      if (r.bookId && (!r.bookTitle || r.bookTitle === 'Unknown Book')) {
        try {
          const book = await Book.findById(r.bookId).select('title author isbn coverImage').lean();
          if (book) {
            bookData = { ...bookData, ...book };
          }
        } catch {}
      }
      
      mappedRecords.push({
        _id: r._id,
        bookId: bookData,
        issueDate: r.issueDate,
        dueDate: r.dueDate,
        returnDate: r.returnDate,
        status: (r.status || 'issued').toLowerCase(),
        fine: r.fine || 0,
        fineAmount: r.fine || 0,
        finePaid: r.fineStatus === 'Paid'
      });
    }
    
    const stats = {
      issued: mappedRecords.filter(r => r.status === 'issued').length,
      returned: mappedRecords.filter(r => r.status === 'returned').length,
      overdue: mappedRecords.filter(r => r.status === 'overdue').length,
      totalFine: mappedRecords.reduce((sum, r) => sum + (r.fine || 0), 0),
      unpaidFine: mappedRecords.filter(r => !r.finePaid).reduce((sum, r) => sum + (r.fine || 0), 0)
    };
    
    return {
      records: mappedRecords,
      stats
    };
  }

  async getStudentDashboardData(studentId, institutionId) {
    const [student, leaves, attendance, fees, library] = await Promise.all([
      this.getStudentDetails(studentId, institutionId),
      this.getStudentLeaves(studentId, institutionId, { status: 'pending' }),
      this.getStudentAttendance(studentId, institutionId, { 
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)) 
      }),
      this.getStudentFees(studentId, institutionId, { status: 'pending' }),
      this.getStudentLibraryRecords(studentId, institutionId, { status: 'issued' })
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

  async getStudentSidebarData(studentId, institutionId) {
    const student = await Student.findOne(withinstitutionId({ _id: studentId, isActive: true }, institutionId))
      .populate('classId', 'name grade')
      .populate('sectionId', 'name')
      .populate('parentId', 'firstName lastName email phone')
      .populate('guardianId', 'firstName lastName email phone');
    
    if (!student) {
      throw new Error('Student not found');
    }

    const [hostelInfo, transportInfo, siblings] = await Promise.all([
      this.getStudentHostelInfo(studentId, institutionId),
      this.getStudentTransportInfo(studentId, institutionId),
      this.getStudentSiblings(studentId, institutionId)
    ]);

    const basicInfo = [
      { label: 'Class', value: student.classId?.name || 'N/A' },
      { label: 'Section', value: student.sectionId?.name || 'N/A' },
      { label: 'Gender', value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'N/A' },
      { label: 'Date of Birth', value: student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A' },
      { label: 'Blood Group', value: student.bloodGroup || 'N/A' },
      { label: 'Admission Date', value: student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'N/A' }
    ];

    const primaryContact = {
      phone: student.phone || student.parentId?.phone || 'N/A',
      email: student.email || student.parentId?.email || 'N/A'
    };

    return {
      name: student.name || student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student',
      admissionNo: student.admissionNumber,
      rollNo: student.rollNumber || student.rollNo || 'N/A',
      avatar: student.documents?.find(doc => doc.type === 'photo')?.url || '/assets/img/default-avatar.png',
      status: student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Active',
      basicInfo,
      primaryContact,
      siblings,
      hostel: hostelInfo,
      transport: transportInfo
    };
  }

  async getStudentHostelInfo(studentId, institutionId) {
    let hostelRecord;
    try {
      hostelRecord = await StudentHostel.findOne(withinstitutionId({ 
        studentId, 
        status: 'active' 
      }, institutionId));
    } catch {
      hostelRecord = null;
    }

    if (!hostelRecord) {
      return {
        name: 'Not Assigned',
        room: 'N/A'
      };
    }

    return {
      name: hostelRecord.hostelName || 'N/A',
      room: hostelRecord.roomNumber ? `Room ${hostelRecord.roomNumber}` : 'N/A',
      bedNumber: hostelRecord.bedNumber,
      admissionDate: hostelRecord.admissionDate
    };
  }

  async getStudentTransportInfo(studentId, institutionId) {
    let transportRecord;
    try {
      transportRecord = await StudentTransport.findOne(withinstitutionId({ 
        studentId, 
        status: 'active' 
      }, institutionId));
    } catch {
      transportRecord = null;
    }

    if (!transportRecord) {
      return {
        route: 'Not Assigned',
        busNumber: 'N/A',
        pickupPoint: 'N/A'
      };
    }

    return {
      route: transportRecord.routeName || 'N/A',
      busNumber: transportRecord.vehicleNumber || 'N/A',
      pickupPoint: transportRecord.pickupPoint || 'N/A',
      pickupTime: transportRecord.pickupTime
    };
  }

  async getStudentSiblings(studentId, institutionId) {
    const student = await Student.findOne(withinstitutionId({ _id: studentId, isActive: true }, institutionId));
    
    if (!student || !student.parentId) {
      return [];
    }

    const siblings = await Student.find({
      institutionId,
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
