import StudentAttendance from '../models/StudentAttendance.js';

class StudentAttendanceService {
  async markAttendance(attendanceData) {
    const attendance = new StudentAttendance(attendanceData);
    return await attendance.save();
  }

  async bulkMarkAttendance(attendanceRecords) {
    const operations = attendanceRecords.map(record => ({
      updateOne: {
        filter: {
          studentId: record.studentId,
          date: record.date,
          period: record.period || null
        },
        update: { $set: record },
        upsert: true
      }
    }));

    return await StudentAttendance.bulkWrite(operations);
  }

  async getAttendanceById(id) {
    return await StudentAttendance.findById(id).populate('studentId', 'name email avatar');
  }

  async getAttendanceByDate(date, filters = {}) {
    const query = { date: new Date(date) };
    
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.className) query.className = filters.className;
    if (filters.section) query.section = filters.section;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.period) query.period = filters.period;

    return await StudentAttendance.find(query).sort('rollNo');
  }

  async getStudentAttendance(studentId, filters = {}) {
    const query = { studentId };
    
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }
    
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.attendance) query.attendance = filters.attendance;

    const sort = filters.sortBy || '-date';
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      StudentAttendance.find(query).sort(sort).skip(skip).limit(limit),
      StudentAttendance.countDocuments(query)
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getAllAttendance(filters = {}) {
    const query = {};
    
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.className) query.className = filters.className;
    if (filters.section) query.section = filters.section;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.attendance) query.attendance = filters.attendance;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.admissionNo) query.admissionNo = filters.admissionNo;
    if (filters.rollNo) query.rollNo = filters.rollNo;
    
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }

    const sort = filters.sortBy || '-date';
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      StudentAttendance.find(query).sort(sort).skip(skip).limit(limit),
      StudentAttendance.countDocuments(query)
    ]);

    return {
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateAttendance(id, updateData, modifiedBy, modifiedByName) {
    const attendance = await StudentAttendance.findById(id);
    if (!attendance) throw new Error('Attendance record not found');

    // Track modification history
    if (updateData.attendance && updateData.attendance !== attendance.attendance) {
      attendance.modificationHistory.push({
        modifiedBy,
        modifiedByName,
        previousAttendance: attendance.attendance,
        newAttendance: updateData.attendance,
        modifiedAt: new Date(),
        reason: updateData.modificationReason || 'Updated'
      });
      attendance.isModified = true;
    }

    Object.assign(attendance, updateData);
    return await attendance.save();
  }

  async deleteAttendance(id) {
    return await StudentAttendance.findByIdAndDelete(id);
  }

  async getAttendanceStatistics(filters = {}) {
    const query = {};
    
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.className) query.className = filters.className;
    if (filters.section) query.section = filters.section;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.studentId) query.studentId = filters.studentId;
    
    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) query.date.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.date.$lte = new Date(filters.dateTo);
    }

    const [
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      holidayCount,
      byClass,
      byDate
    ] = await Promise.all([
      StudentAttendance.countDocuments(query),
      StudentAttendance.countDocuments({ ...query, attendance: 'present' }),
      StudentAttendance.countDocuments({ ...query, attendance: 'absent' }),
      StudentAttendance.countDocuments({ ...query, attendance: 'late' }),
      StudentAttendance.countDocuments({ ...query, attendance: 'halfday' }),
      StudentAttendance.countDocuments({ ...query, attendance: 'holiday' }),
      StudentAttendance.aggregate([
        { $match: query },
        { $group: { _id: { className: '$className', section: '$section' }, count: { $sum: 1 } } }
      ]),
      StudentAttendance.aggregate([
        { $match: query },
        { $group: { _id: '$date', count: { $sum: 1 } } },
        { $sort: { _id: -1 } },
        { $limit: 30 }
      ])
    ]);

    const attendancePercentage = totalRecords > 0 
      ? ((presentCount + (halfDayCount * 0.5)) / totalRecords * 100).toFixed(2)
      : 0;

    return {
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      holidayCount,
      attendancePercentage,
      byClass: byClass.reduce((acc, item) => {
        const key = `${item._id.className}-${item._id.section}`;
        acc[key] = item.count;
        return acc;
      }, {}),
      byDate: byDate.map(item => ({
        date: item._id,
        count: item.count
      }))
    };
  }

  async getStudentAttendancePercentage(studentId, academicYear, institutionId) {
    const query = { studentId, academicYear, institutionId };

    const [total, present, halfDay] = await Promise.all([
      StudentAttendance.countDocuments(query),
      StudentAttendance.countDocuments({ ...query, attendance: 'present' }),
      StudentAttendance.countDocuments({ ...query, attendance: 'halfday' })
    ]);

    const percentage = total > 0 
      ? ((present + (halfDay * 0.5)) / total * 100).toFixed(2)
      : 0;

    return {
      total,
      present,
      absent: await StudentAttendance.countDocuments({ ...query, attendance: 'absent' }),
      late: await StudentAttendance.countDocuments({ ...query, attendance: 'late' }),
      halfDay,
      holiday: await StudentAttendance.countDocuments({ ...query, attendance: 'holiday' }),
      percentage
    };
  }

  async getClassAttendanceReport(className, section, date, institutionId) {
    const query = {
      className,
      section,
      date: new Date(date),
      institutionId
    };

    const records = await StudentAttendance.find(query).sort('rollNo');
    
    const summary = {
      totalStudents: records.length,
      present: records.filter(r => r.attendance === 'present').length,
      absent: records.filter(r => r.attendance === 'absent').length,
      late: records.filter(r => r.attendance === 'late').length,
      halfDay: records.filter(r => r.attendance === 'halfday').length,
      holiday: records.filter(r => r.attendance === 'holiday').length
    };

    summary.attendancePercentage = summary.totalStudents > 0
      ? ((summary.present + (summary.halfDay * 0.5)) / summary.totalStudents * 100).toFixed(2)
      : 0;

    return {
      records,
      summary
    };
  }

  async getDefaultersList(institutionId, academicYear, threshold = 75) {
    const allStudents = await StudentAttendance.aggregate([
      {
        $match: {
          institutionId: new mongoose.Types.ObjectId(institutionId),
          academicYear
        }
      },
      {
        $group: {
          _id: '$studentId',
          studentName: { $first: '$studentName' },
          admissionNo: { $first: '$admissionNo' },
          rollNo: { $first: '$rollNo' },
          className: { $first: '$className' },
          section: { $first: '$section' },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ['$attendance', 'present'] }, 1, 0] }
          },
          halfDay: {
            $sum: { $cond: [{ $eq: ['$attendance', 'halfday'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          studentId: '$_id',
          studentName: 1,
          admissionNo: 1,
          rollNo: 1,
          className: 1,
          section: 1,
          total: 1,
          present: 1,
          halfDay: 1,
          percentage: {
            $multiply: [
              {
                $divide: [
                  { $add: ['$present', { $multiply: ['$halfDay', 0.5] }] },
                  '$total'
                ]
              },
              100
            ]
          }
        }
      },
      {
        $match: {
          percentage: { $lt: threshold }
        }
      },
      {
        $sort: { percentage: 1 }
      }
    ]);

    return allStudents;
  }

  async getMonthlyAttendanceReport(institutionId, academicYear, month, year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const query = {
      institutionId,
      academicYear,
      date: { $gte: startDate, $lte: endDate }
    };

    const records = await StudentAttendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: {
            studentId: '$studentId',
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
          },
          studentName: { $first: '$studentName' },
          admissionNo: { $first: '$admissionNo' },
          rollNo: { $first: '$rollNo' },
          className: { $first: '$className' },
          section: { $first: '$section' },
          attendance: { $first: '$attendance' }
        }
      },
      {
        $group: {
          _id: '$_id.studentId',
          studentName: { $first: '$studentName' },
          admissionNo: { $first: '$admissionNo' },
          rollNo: { $first: '$rollNo' },
          className: { $first: '$className' },
          section: { $first: '$section' },
          attendanceRecords: {
            $push: {
              date: '$_id.date',
              attendance: '$attendance'
            }
          }
        }
      },
      { $sort: { rollNo: 1 } }
    ]);

    return records;
  }
}

export default new StudentAttendanceService();
