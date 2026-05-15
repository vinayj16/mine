import HomeWork from '../models/HomeWork.js';
import Exam from '../models/Exam.js';
import Event from '../models/Event.js';
import Schedule from '../models/Schedule.js';

class CalendarService {
  async getCalendarEvents(schoolId, startDate, endDate, filters = {}) {
    const { entityTypes } = filters;
    
    const query = {
      schoolId,
      $or: []
    };

    const events = [];

    // Get Homework events
    if (!entityTypes || entityTypes.includes('homework')) {
      const homeworks = await HomeWork.find({
        schoolId,
        dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }).populate('subjectId', 'name code');
      
      homeworks.forEach(hw => {
        events.push({
          id: hw._id,
          type: 'homework',
          title: hw.title,
          date: hw.dueDate,
          color: '#4caf50',
          details: hw
        });
      });
    }

    // Get Exam events
    if (!entityTypes || entityTypes.includes('exam')) {
      const exams = await Exam.find({
        schoolId,
        examDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }).populate('subjectId', 'name code');
      
      exams.forEach(exam => {
        events.push({
          id: exam._id,
          type: 'exam',
          title: exam.title,
          date: exam.examDate,
          color: '#f44336',
          details: exam
        });
      });
    }

    // Get Event events
    if (!entityTypes || entityTypes.includes('event')) {
      const schoolEvents = await Event.find({
        schoolId,
        $or: [
          { startDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { endDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        ],
        isActive: true
      }).populate('organizer', 'firstName lastName');
      
      schoolEvents.forEach(event => {
        events.push({
          id: event._id,
          type: 'event',
          title: event.title,
          date: event.startDate,
          endDate: event.endDate,
          color: '#2196f3',
          details: event
        });
      });
    }

    // Get Schedule events
    if (!entityTypes || entityTypes.includes('schedule')) {
      const schedules = await Schedule.find({
        schoolId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isDeleted: false
      });
      
      schedules.forEach(schedule => {
        events.push({
          id: schedule._id,
          type: 'schedule',
          title: schedule.title,
          date: schedule.date,
          color: '#9c27b0',
          details: schedule
        });
      });
    }

    // Sort by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    return events;
  }

  async getCalendarAnalytics(schoolId, startDate, endDate) {
    const [homeworkCount, examCount, eventCount, scheduleCount] = await Promise.all([
      HomeWork.countDocuments({
        schoolId,
        dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }),
      Exam.countDocuments({
        schoolId,
        examDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }),
      Event.countDocuments({
        schoolId,
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }),
      Schedule.countDocuments({
        schoolId,
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isDeleted: false
      })
    ]);

    return {
      homework: homeworkCount,
      exams: examCount,
      events: eventCount,
      schedules: scheduleCount,
      total: homeworkCount + examCount + eventCount + scheduleCount
    };
  }

  async createCalendarEvent(schoolId, eventData) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = new EventModel({
      schoolId,
      ...eventData,
      isActive: true
    });
    return await event.save();
  }

  async updateCalendarEvent(schoolId, eventId, updateData) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = await EventModel.findOneAndUpdate(
      { _id: eventId, schoolId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!event) throw new Error('Event not found');
    return event;
  }

  async deleteCalendarEvent(schoolId, eventId) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = await EventModel.findOneAndUpdate(
      { _id: eventId, schoolId },
      { isActive: false },
      { new: true }
    );
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getCalendarEventById(schoolId, eventId) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = await EventModel.findOne({ _id: eventId, schoolId, isActive: true })
      .populate('organizer', 'firstName lastName');
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getUpcomingEvents(schoolId, options = {}) {
    const { days = 7, entityTypes, limit = 10 } = options;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const events = [];
    
    if (!entityTypes || entityTypes.includes('homework')) {
      const homeworks = await HomeWork.find({
        schoolId,
        dueDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }).limit(limit);
      homeworks.forEach(hw => events.push({ type: 'homework', ...hw.toObject() }));
    }

    if (!entityTypes || entityTypes.includes('exam')) {
      const exams = await Exam.find({
        schoolId,
        examDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }).limit(limit);
      exams.forEach(exam => events.push({ type: 'exam', ...exam.toObject() }));
    }

    if (!entityTypes || entityTypes.includes('event')) {
      const EventModel = (await import('../models/Event.js')).default;
      const schoolEvents = await EventModel.find({
        schoolId,
        startDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }).limit(limit);
      schoolEvents.forEach(event => events.push({ type: 'event', ...event.toObject() }));
    }

    events.sort((a, b) => new Date(a.startDate || a.dueDate || a.examDate) - new Date(b.startDate || b.dueDate || b.examDate));
    return events.slice(0, limit);
  }

  async exportCalendarEvents(schoolId, startDate, endDate, options = {}) {
    const { format = 'json', entityTypes } = options;
    const events = await this.getCalendarEvents(schoolId, startDate, endDate, { entityTypes });
    return events;
  }

  async getCalendarConflicts(schoolId, startDate, endDate, options = {}) {
    const { resourceId } = options;
    const EventModel = (await import('../models/Event.js')).default;
    const ScheduleModel = (await import('../models/Schedule.js')).default;
    
    const conflicts = [];
    
    const events = await EventModel.find({
      schoolId,
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ],
      isActive: true
    });

    const schedules = await ScheduleModel.find({
      schoolId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false
    });

    if (resourceId) {
      events.filter(e => e.resourceId === resourceId).forEach(e => conflicts.push({ type: 'event', ...e.toObject() }));
      schedules.filter(s => s.roomId === resourceId).forEach(s => conflicts.push({ type: 'schedule', ...s.toObject() }));
    } else {
      events.forEach(e => conflicts.push({ type: 'event', ...e.toObject() }));
      schedules.forEach(s => conflicts.push({ type: 'schedule', ...s.toObject() }));
    }

    return conflicts;
  }
}

export default new CalendarService();
