import ExamSchedule from '../models/ExamSchedule.js';

class ExamScheduleService {
  async createExamSchedule(scheduleData) {
    const conflicting = await ExamSchedule.findOne({
      institutionId: scheduleData.institutionId,
      examDate: scheduleData.examDate,
      roomNo: scheduleData.roomNo,
      isDeleted: false,
      $or: [
        {
          startTime: { $lte: scheduleData.startTime },
          endTime: { $gt: scheduleData.startTime }
        },
        {
          startTime: { $lt: scheduleData.endTime },
          endTime: { $gte: scheduleData.endTime }
        }
      ]
    });

    if (conflicting) {
      throw new Error('Room is already booked for this time slot');
    }

    const schedule = new ExamSchedule(scheduleData);
    return await schedule.save();
  }

  async getExamScheduleById(scheduleId) {
    return await ExamSchedule.findById(scheduleId)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('institutionId', 'name type')
      .populate('invigilatorId', 'name email')
      .populate('metadata.createdBy', 'name')
      .populate('metadata.updatedBy', 'name');
  }

  async getExamScheduleByScheduleId(scheduleId) {
    return await ExamSchedule.findOne({ scheduleId, isDeleted: false })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('institutionId', 'name type');
  }

  async getAllExamSchedules(filters = {}, options = {}) {
    const {
      institutionId,
      academicYear,
      status,
      classId,
      subject,
      examName,
      examDate,
      roomNo,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'examDate',
      sortOrder = 'asc'
    } = options;

    const query = { isDeleted: false };

    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;
    if (status) query.status = status;
    if (classId) query.classId = classId;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (examName) query.examName = new RegExp(examName, 'i');
    if (examDate) query.examDate = new Date(examDate);
    if (roomNo) query.roomNo = roomNo;

    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { examName: { $regex: search, $options: 'i' } },
        { scheduleId: { $regex: search, $options: 'i' } },
        { roomNo: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [schedules, total] = await Promise.all([
      ExamSchedule.find(query)
        .populate('classId', 'name section')
        .populate('subjectId', 'name code')
        .populate('institutionId', 'name type')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ExamSchedule.countDocuments(query)
    ]);

    return {
      schedules,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateExamSchedule(scheduleId, updateData) {
    const schedule = await ExamSchedule.findById(scheduleId);
    
    if (!schedule) {
      throw new Error('Exam schedule not found');
    }

    if (updateData.examDate || updateData.startTime || updateData.endTime || updateData.roomNo) {
      const examDate = updateData.examDate || schedule.examDate;
      const startTime = updateData.startTime || schedule.startTime;
      const endTime = updateData.endTime || schedule.endTime;
      const roomNo = updateData.roomNo || schedule.roomNo;

      const conflicting = await ExamSchedule.findOne({
        _id: { $ne: scheduleId },
        institutionId: schedule.institutionId,
        examDate,
        roomNo,
        isDeleted: false,
        $or: [
          {
            startTime: { $lte: startTime },
            endTime: { $gt: startTime }
          },
          {
            startTime: { $lt: endTime },
            endTime: { $gte: endTime }
          }
        ]
      });

      if (conflicting) {
        throw new Error('Room is already booked for this time slot');
      }
    }

    Object.assign(schedule, updateData);
    return await schedule.save();
  }

  async deleteExamSchedule(scheduleId) {
    const schedule = await ExamSchedule.findById(scheduleId);
    
    if (!schedule) {
      throw new Error('Exam schedule not found');
    }

    schedule.isDeleted = true;
    return await schedule.save();
  }

  async updateStatus(scheduleId, status) {
    return await ExamSchedule.findByIdAndUpdate(
      scheduleId,
      { status },
      { new: true, runValidators: true }
    );
  }

  async getExamSchedulesByClass(classId, academicYear) {
    const query = { 
      classId, 
      isDeleted: false 
    };
    
    if (academicYear) {
      query.academicYear = academicYear;
    }

    return await ExamSchedule.find(query)
      .populate('subjectId', 'name code')
      .sort({ examDate: 1, startTime: 1 });
  }

  async getExamSchedulesByDate(examDate, institutionId) {
    const query = {
      examDate: new Date(examDate),
      isDeleted: false
    };
    
    if (institutionId) {
      query.institutionId = institutionId;
    }

    return await ExamSchedule.find(query)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .sort({ startTime: 1 });
  }

  async getExamSchedulesByRoom(roomNo, institutionId) {
    const query = {
      roomNo,
      isDeleted: false
    };
    
    if (institutionId) {
      query.institutionId = institutionId;
    }

    return await ExamSchedule.find(query)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .sort({ examDate: 1, startTime: 1 });
  }

  async getExamSchedulesByInvigilator(invigilatorId) {
    return await ExamSchedule.find({
      invigilatorId,
      isDeleted: false
    })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .sort({ examDate: 1, startTime: 1 });
  }

  async bulkUpdateStatus(scheduleIds, status) {
    return await ExamSchedule.updateMany(
      { _id: { $in: scheduleIds } },
      { status },
      { runValidators: true }
    );
  }

  async getExamScheduleStatistics(institutionId, academicYear) {
    const query = { isDeleted: false };
    
    if (institutionId) query.institutionId = institutionId;
    if (academicYear) query.academicYear = academicYear;

    const [
      totalSchedules,
      activeSchedules,
      completedSchedules,
      cancelledSchedules,
      schedulesByStatus,
      schedulesByExamName,
      upcomingExams
    ] = await Promise.all([
      ExamSchedule.countDocuments(query),
      ExamSchedule.countDocuments({ ...query, status: 'active' }),
      ExamSchedule.countDocuments({ ...query, status: 'completed' }),
      ExamSchedule.countDocuments({ ...query, status: 'cancelled' }),
      ExamSchedule.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      ExamSchedule.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$examName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      ExamSchedule.countDocuments({
        ...query,
        examDate: { $gte: new Date() },
        status: 'active'
      })
    ]);

    return {
      totalSchedules,
      activeSchedules,
      completedSchedules,
      cancelledSchedules,
      schedulesByStatus,
      schedulesByExamName,
      upcomingExams
    };
  }

  async searchExamSchedules(searchTerm, institutionId) {
    const query = {
      isDeleted: false,
      $or: [
        { subject: { $regex: searchTerm, $options: 'i' } },
        { examName: { $regex: searchTerm, $options: 'i' } },
        { scheduleId: { $regex: searchTerm, $options: 'i' } },
        { roomNo: { $regex: searchTerm, $options: 'i' } }
      ]
    };

    if (institutionId) {
      query.institutionId = institutionId;
    }

    return await ExamSchedule.find(query)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('institutionId', 'name type')
      .sort({ examDate: 1 })
      .limit(20);
  }

  async checkRoomAvailability(roomNo, examDate, startTime, endTime, institutionId) {
    const conflicting = await ExamSchedule.findOne({
      institutionId,
      roomNo,
      examDate: new Date(examDate),
      isDeleted: false,
      status: { $ne: 'cancelled' },
      $or: [
        {
          startTime: { $lte: startTime },
          endTime: { $gt: startTime }
        },
        {
          startTime: { $lt: endTime },
          endTime: { $gte: endTime }
        }
      ]
    });

    return !conflicting;
  }

  async exportExamSchedules(format = 'json', filters = {}) {
    const query = { isDeleted: false };
    
    if (filters.institutionId) query.institutionId = filters.institutionId;
    if (filters.academicYear) query.academicYear = filters.academicYear;
    if (filters.status) query.status = filters.status;

    const schedules = await ExamSchedule.find(query)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('institutionId', 'name type')
      .sort({ examDate: 1, startTime: 1 });

    if (format === 'json') {
      return {
        data: schedules,
        format: 'json',
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      const headers = ['Schedule ID', 'Exam Name', 'Date', 'Start Time', 'End Time', 'Room', 'Class', 'Subject', 'Status'];
      const rows = schedules.map(schedule => [
        schedule.scheduleId,
        schedule.examName,
        schedule.examDate,
        schedule.startTime,
        schedule.endTime,
        schedule.roomNo,
        schedule.classId?.name || 'N/A',
        schedule.subjectId?.name || 'N/A',
        schedule.status
      ]);

      return {
        data: [headers, ...rows],
        format: 'csv',
        exportedAt: new Date()
      };
    }

    throw new Error('Unsupported export format');
  }

  async bulkDeleteExamSchedules(scheduleIds) {
    const result = await ExamSchedule.updateMany(
      { _id: { $in: scheduleIds } },
      { isDeleted: true }
    );
    return result;
  }
}

export default new ExamScheduleService();
