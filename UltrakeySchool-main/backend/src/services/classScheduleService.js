import ClassSchedule from '../models/ClassSchedule.js';
import mongoose from 'mongoose';

class ClassScheduleService {
  async createSchedule(scheduleData) {
    const conflictingSchedule = await ClassSchedule.findOne({
      day: scheduleData.day,
      startTime: scheduleData.startTime,
      $or: [
        { teacherId: scheduleData.teacherId },
        { room: scheduleData.room, classId: scheduleData.classId }
      ],
      academicYear: scheduleData.academicYear,
      institutionId: scheduleData.institutionId,
      status: { $ne: 'cancelled' },
      isDeleted: false
    });

    if (conflictingSchedule) {
      throw new Error('Schedule conflict: Teacher or room is already booked for this time slot');
    }

    const schedule = new ClassSchedule(scheduleData);
    return await schedule.save();
  }

  async getScheduleById(scheduleId) {
    return await ClassSchedule.findById(scheduleId)
      .populate('classId', 'name section students')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .populate('institutionId', 'name');
  }

  async getScheduleByScheduleId(scheduleId) {
    return await ClassSchedule.findOne({ scheduleId, isDeleted: false })
      .populate('classId', 'name section students')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');
  }

  async getAllSchedules(filters = {}, options = {}) {
    const {
      className,
      section,
      day,
      status,
      teacherId,
      classId,
      academicYear,
      institutionId,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'day',
      sortOrder = 'asc'
    } = options;

    const query = { isDeleted: false };

    if (className) query.className = className;
    if (section) query.section = section;
    if (day) query.day = day;
    if (status) query.status = status;
    if (teacherId) query.teacherId = teacherId;
    if (classId) query.classId = classId;
    if (academicYear) query.academicYear = academicYear;
    if (institutionId) query.institutionId = institutionId;

    if (search) {
      query.$or = [
        { scheduleId: { $regex: search, $options: 'i' } },
        { className: { $regex: search, $options: 'i' } },
        { section: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { teacher: { $regex: search, $options: 'i' } },
        { room: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [schedules, total] = await Promise.all([
      ClassSchedule.find(query)
        .populate('classId', 'name section students')
        .populate('teacherId', 'name email')
        .populate('subjectId', 'name code')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      ClassSchedule.countDocuments(query)
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

  async updateSchedule(scheduleId, updateData) {
    const schedule = await ClassSchedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (updateData.day || updateData.startTime || updateData.teacherId || updateData.room) {
      const conflictingSchedule = await ClassSchedule.findOne({
        _id: { $ne: scheduleId },
        day: updateData.day || schedule.day,
        startTime: updateData.startTime || schedule.startTime,
        $or: [
          { teacherId: updateData.teacherId || schedule.teacherId },
          { room: updateData.room || schedule.room, classId: schedule.classId }
        ],
        academicYear: schedule.academicYear,
        institutionId: schedule.institutionId,
        status: { $ne: 'cancelled' },
        isDeleted: false
      });

      if (conflictingSchedule) {
        throw new Error('Schedule conflict: Teacher or room is already booked for this time slot');
      }
    }

    Object.assign(schedule, updateData);
    return await schedule.save();
  }

  async deleteSchedule(scheduleId) {
    const schedule = await ClassSchedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    schedule.isDeleted = true;
    return await schedule.save();
  }

  async getSchedulesByClass(classId, day) {
    const query = { classId, isDeleted: false, status: 'active' };
    if (day) query.day = day;

    return await ClassSchedule.find(query)
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ day: 1, startTime: 1 });
  }

  async getSchedulesByTeacher(teacherId, day) {
    const query = { teacherId, isDeleted: false, status: 'active' };
    if (day) query.day = day;

    return await ClassSchedule.find(query)
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .sort({ day: 1, startTime: 1 });
  }

  async getSchedulesByDay(day, institutionId) {
    const query = { day, isDeleted: false, status: 'active' };
    if (institutionId) query.institutionId = institutionId;

    return await ClassSchedule.find(query)
      .populate('classId', 'name section')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ startTime: 1 });
  }

  async getSchedulesByRoom(room, day) {
    const query = { room, isDeleted: false, status: 'active' };
    if (day) query.day = day;

    return await ClassSchedule.find(query)
      .populate('classId', 'name section')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ day: 1, startTime: 1 });
  }

  async getWeeklySchedule(classId) {
    const schedules = await ClassSchedule.find({
      classId,
      isDeleted: false,
      status: 'active'
    })
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ day: 1, startTime: 1 });

    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    schedules.forEach(schedule => {
      weeklySchedule[schedule.day].push(schedule);
    });

    return weeklySchedule;
  }

  async getTeacherWeeklySchedule(teacherId) {
    const schedules = await ClassSchedule.find({
      teacherId,
      isDeleted: false,
      status: 'active'
    })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .sort({ day: 1, startTime: 1 });

    const weeklySchedule = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: []
    };

    schedules.forEach(schedule => {
      weeklySchedule[schedule.day].push(schedule);
    });

    return weeklySchedule;
  }

  async checkScheduleConflict(teacherId, day, startTime, endTime, excludeScheduleId) {
    const query = {
      teacherId,
      day,
      isDeleted: false,
      status: { $ne: 'cancelled' },
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
        { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } }
      ]
    };

    if (excludeScheduleId) {
      query._id = { $ne: excludeScheduleId };
    }

    return await ClassSchedule.findOne(query);
  }

  async getScheduleStatistics(institutionId, academicYear) {
    const match = { isDeleted: false };
    if (institutionId) match.institutionId = mongoose.Types.ObjectId(institutionId);
    if (academicYear) match.academicYear = academicYear;

    const [
      totalSchedules,
      activeSchedules,
      schedulesByDay,
      schedulesBySubject,
      teacherWorkload
    ] = await Promise.all([
      ClassSchedule.countDocuments(match),
      ClassSchedule.countDocuments({ ...match, status: 'active' }),
      ClassSchedule.aggregate([
        { $match: match },
        { $group: { _id: '$day', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      ClassSchedule.aggregate([
        { $match: match },
        { $group: { _id: '$subject', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      ClassSchedule.aggregate([
        { $match: match },
        { $group: { _id: '$teacherId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalSchedules,
      activeSchedules,
      schedulesByDay,
      schedulesBySubject,
      teacherWorkload
    };
  }

  async bulkUpdateStatus(scheduleIds, status, userId) {
    return await ClassSchedule.updateMany(
      { _id: { $in: scheduleIds }, isDeleted: false },
      {
        $set: {
          status,
          'metadata.updatedBy': userId,
          updatedAt: new Date()
        }
      }
    );
  }

  async cancelSchedule(scheduleId, userId) {
    const schedule = await ClassSchedule.findById(scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    schedule.status = 'cancelled';
    schedule.metadata.updatedBy = userId;
    return await schedule.save();
  }

  async searchSchedules(searchTerm, institutionId) {
    const query = {
      $or: [
        { scheduleId: { $regex: searchTerm, $options: 'i' } },
        { className: { $regex: searchTerm, $options: 'i' } },
        { section: { $regex: searchTerm, $options: 'i' } },
        { subject: { $regex: searchTerm, $options: 'i' } },
        { teacher: { $regex: searchTerm, $options: 'i' } },
        { room: { $regex: searchTerm, $options: 'i' } }
      ],
      isDeleted: false
    };

    if (institutionId) query.institutionId = institutionId;

    return await ClassSchedule.find(query)
      .populate('classId', 'name section')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code')
      .sort({ day: 1, startTime: 1 })
      .limit(50);
  }

  async exportSchedules(options = {}) {
    const { institutionId, classId, teacherId, day, status, format } = options;
    const query = { isDeleted: false };
    if (institutionId) query.institutionId = institutionId;
    if (classId) query.classId = classId;
    if (teacherId) query.teacherId = teacherId;
    if (day) query.day = day;
    if (status) query.status = status;
    return await ClassSchedule.find(query)
      .populate('classId', 'name section')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');
  }

  async getScheduleConflicts(options = {}) {
    const { institutionId, teacherId, classId, roomId } = options;
    const query = { isDeleted: false, status: { $ne: 'cancelled' } };
    if (institutionId) query.institutionId = institutionId;
    if (teacherId) query.teacherId = teacherId;
    if (classId) query.classId = classId;
    if (roomId) query.room = roomId;

    const schedules = await ClassSchedule.find(query)
      .populate('classId', 'name section')
      .populate('teacherId', 'name email')
      .populate('subjectId', 'name code');

    const conflicts = [];
    for (let i = 0; i < schedules.length; i++) {
      for (let j = i + 1; j < schedules.length; j++) {
        const s1 = schedules[i];
        const s2 = schedules[j];
        if (s1.day === s2.day && this.timeOverlap(s1.startTime, s1.endTime, s2.startTime, s2.endTime)) {
          conflicts.push({ schedule1: s1, schedule2: s2 });
        }
      }
    }

    return conflicts;
  }

  timeOverlap(start1, end1, start2, end2) {
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };
    const s1 = toMinutes(start1);
    const e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    const e2 = toMinutes(end2);
    return s1 < e2 && s2 < e1;
  }

  async bulkCreateSchedules(schedules, userId) {
    const results = { successful: 0, failed: 0, errors: [] };
    
    for (const scheduleData of schedules) {
      try {
        const schedule = new ClassSchedule({
          ...scheduleData,
          metadata: { createdBy: userId }
        });
        await schedule.save();
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ data: scheduleData, error: error.message });
      }
    }

    return results;
  }

  async bulkDeleteSchedules(scheduleIds) {
    const result = await ClassSchedule.updateMany(
      { _id: { $in: scheduleIds }, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );
    return { deletedCount: result.modifiedCount };
  }

  async getScheduleAnalytics(options = {}) {
    const { institutionId, groupBy = 'day' } = options;
    const match = { isDeleted: false };
    if (institutionId) match.institutionId = mongoose.Types.ObjectId(institutionId);

    const groupField = groupBy === 'day' ? '$day' : 
                      groupBy === 'teacher' ? '$teacherId' :
                      groupBy === 'class' ? '$classId' :
                      groupBy === 'status' ? '$status' : '$subjectId';

    const analytics = await ClassSchedule.aggregate([
      { $match: match },
      { $group: { _id: groupField, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return analytics;
  }

  async rescheduleClass(scheduleId, newSchedule, userId) {
    const schedule = await ClassSchedule.findById(scheduleId);
    if (!schedule) throw new Error('Schedule not found');

    schedule.day = newSchedule.newDay;
    schedule.startTime = newSchedule.newStartTime;
    schedule.endTime = newSchedule.newEndTime;
    schedule.reason = newSchedule.reason;
    schedule.rescheduledAt = new Date();
    schedule.metadata.updatedBy = userId;
    schedule.status = 'rescheduled';

    return await schedule.save();
  }

  async getTeacherWorkload(options = {}) {
    const { institutionId, startDate, endDate } = options;
    const match = { isDeleted: false, status: 'active' };
    if (institutionId) match.institutionId = mongoose.Types.ObjectId(institutionId);
    if (startDate && endDate) {
      match.startDate = { $gte: new Date(startDate) };
      match.endDate = { $lte: new Date(endDate) };
    }

    const workload = await ClassSchedule.aggregate([
      { $match: match },
      { $group: { _id: '$teacherId', totalHours: { $sum: 1 }, schedules: { $push: '$$ROOT' } } },
      { $sort: { totalHours: -1 } }
    ]);

    return workload;
  }
}

export default new ClassScheduleService();
