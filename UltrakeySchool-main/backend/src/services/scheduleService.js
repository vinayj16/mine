import Schedule from '../models/Schedule.js';
import User from '../models/User.js';

class ScheduleService {
  async getSchedules(schoolId, options = {}) {
    const {
      type,
      priority,
      status,
      dateRange,
      search,
      limit = 10,
      skip = 0,
      sortBy = 'date',
      sortOrder = 'asc'
    } = options;

    const query = {
      schoolId,
      isActive: true
    };

    if (type) {
      query.type = type;
    }

    if (priority) {
      query.priority = priority;
    }

    if (status) {
      query.status = status;
    }

    if (dateRange) {
      query.date = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const schedules = await Schedule.find(query)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return schedules.map(this.formatSchedule);
  }

  async getScheduleById(schoolId, scheduleId) {
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      schoolId,
      isActive: true
    }).lean();

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return this.formatSchedule(schedule);
  }

  async getUserSchedules(schoolId, userId, options = {}) {
    const { status, limit = 20, dateRange } = options;

    const query = {
      schoolId,
      isActive: true,
      'participants.userId': userId
    };

    if (status) {
      query.status = status;
    }

    if (dateRange) {
      query.date = {
        $gte: new Date(dateRange.start),
        $lte: new Date(dateRange.end)
      };
    }

    const schedules = await Schedule.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .lean();

    return schedules.map(this.formatSchedule);
  }

  async createSchedule(schoolId, scheduleData) {
    const {
      title,
      description,
      type,
      priority,
      date,
      startTime,
      endTime,
      location,
      virtualLink,
      participantIds,
      organizerId,
      isRecurring,
      recurrencePattern,
      recurrenceEndDate,
      tags,
      notes
    } = scheduleData;

    const participants = await this.buildParticipantsList(participantIds);
    const organizer = organizerId ? await this.buildParticipant(organizerId) : null;

    const schedule = new Schedule({
      schoolId,
      title,
      description,
      type,
      priority: priority || 'medium',
      date: new Date(date),
      startTime,
      endTime,
      location,
      virtualLink,
      participants,
      organizer,
      isRecurring: isRecurring || false,
      recurrencePattern,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      tags: tags || [],
      notes,
      status: 'upcoming'
    });

    await schedule.save();
    return this.formatSchedule(schedule.toObject());
  }

  async updateSchedule(schoolId, scheduleId, updateData) {
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      schoolId,
      isActive: true
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    if (updateData.participantIds) {
      updateData.participants = await this.buildParticipantsList(updateData.participantIds);
      delete updateData.participantIds;
    }

    if (updateData.organizerId) {
      updateData.organizer = await this.buildParticipant(updateData.organizerId);
      delete updateData.organizerId;
    }

    if (updateData.date) {
      updateData.date = new Date(updateData.date);
    }

    if (updateData.recurrenceEndDate) {
      updateData.recurrenceEndDate = new Date(updateData.recurrenceEndDate);
    }

    Object.assign(schedule, updateData);
    await schedule.save();

    return this.formatSchedule(schedule.toObject());
  }

  async deleteSchedule(schoolId, scheduleId) {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: scheduleId, schoolId },
      { $set: { isActive: false, status: 'cancelled' } },
      { new: true }
    );

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    return this.formatSchedule(schedule.toObject());
  }

  async setReminder(schoolId, scheduleId, userId, reminderTime) {
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      schoolId,
      isActive: true
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const existingReminder = schedule.reminders.find(
      r => r.userId.toString() === userId.toString()
    );

    if (existingReminder) {
      existingReminder.reminderTime = new Date(reminderTime);
      existingReminder.sent = false;
    } else {
      schedule.reminders.push({
        userId,
        reminderTime: new Date(reminderTime),
        sent: false
      });
    }

    await schedule.save();
    return this.formatSchedule(schedule.toObject());
  }

  async addParticipant(schoolId, scheduleId, userId) {
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      schoolId,
      isActive: true
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const alreadyParticipant = schedule.participants.some(
      p => p.userId.toString() === userId.toString()
    );

    if (alreadyParticipant) {
      throw new Error('User is already a participant');
    }

    const participant = await this.buildParticipant(userId);
    schedule.participants.push(participant);
    await schedule.save();

    return this.formatSchedule(schedule.toObject());
  }

  async removeParticipant(schoolId, scheduleId, userId) {
    const schedule = await Schedule.findOne({
      _id: scheduleId,
      schoolId,
      isActive: true
    });

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    schedule.participants = schedule.participants.filter(
      p => p.userId.toString() !== userId.toString()
    );

    await schedule.save();
    return this.formatSchedule(schedule.toObject());
  }

  async getUpcomingSchedules(schoolId, limit = 10) {
    const now = new Date();
    
    const schedules = await Schedule.find({
      schoolId,
      isActive: true,
      status: 'upcoming',
      date: { $gte: now }
    })
    .sort({ date: 1 })
    .limit(limit)
    .lean();

    return schedules.map(this.formatSchedule);
  }

  async buildParticipantsList(userIds) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const users = await User.find({ _id: { $in: userIds } }).lean();
    
    return users.map(user => ({
      userId: user._id,
      name: user.name,
      role: user.role,
      avatar: user.profileImage || '/assets/img/placeholder-avatar.webp',
      email: user.email
    }));
  }

  async buildParticipant(userId) {
    const user = await User.findById(userId).lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      userId: user._id,
      name: user.name,
      role: user.role,
      avatar: user.profileImage || '/assets/img/placeholder-avatar.webp',
      email: user.email
    };
  }

  formatSchedule(schedule) {
    return {
      id: schedule._id.toString(),
      title: schedule.title,
      description: schedule.description,
      type: schedule.type,
      priority: schedule.priority,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      location: schedule.location,
      virtualLink: schedule.virtualLink,
      participants: schedule.participants.map(p => ({
        id: p.userId.toString(),
        name: p.name,
        role: p.role,
        avatar: p.avatar,
        email: p.email
      })),
      organizer: schedule.organizer ? {
        id: schedule.organizer.userId.toString(),
        name: schedule.organizer.name,
        role: schedule.organizer.role,
        avatar: schedule.organizer.avatar,
        email: schedule.organizer.email
      } : null,
      status: schedule.status,
      isRecurring: schedule.isRecurring,
      recurrencePattern: schedule.recurrencePattern,
      tags: schedule.tags,
      notes: schedule.notes,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    };
  }
}

export default new ScheduleService();
