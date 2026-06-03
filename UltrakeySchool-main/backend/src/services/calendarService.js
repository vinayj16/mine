import HomeWork from '../models/HomeWork.js';
import Exam from '../models/Exam.js';
import Event from '../models/Event.js';
import Schedule from '../models/Schedule.js';

class CalendarService {
  async getCalendarEvents(institutionId, startDate, endDate, filters = {}) {
    const { entityTypes } = filters;
    
    const query = {
      institutionId,
      $or: []
    };

    const events = [];

    // Get Homework events
    if (!entityTypes || entityTypes.includes('homework')) {
      const homeworks = await HomeWork.find({
        institutionId,
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
        institutionId,
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
        institutionId,
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
        institutionId,
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

  async getCalendarAnalytics(institutionId, startDate, endDate) {
    const [homeworkCount, examCount, eventCount, scheduleCount] = await Promise.all([
      HomeWork.countDocuments({
        institutionId,
        dueDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }),
      Exam.countDocuments({
        institutionId,
        examDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }),
      Event.countDocuments({
        institutionId,
        startDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        isActive: true
      }),
      Schedule.countDocuments({
        institutionId,
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

  async createCalendarEvent(institutionId, eventData) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = new EventModel({
      institutionId,
      ...eventData,
      isActive: true
    });
    return await event.save();
  }

  async updateCalendarEvent(institutionId, eventId, updateData) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = await EventModel.findOneAndUpdate(
      { _id: eventId, institutionId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!event) throw new Error('Event not found');
    return event;
  }

  async deleteCalendarEvent(institutionId, eventId) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = await EventModel.findOneAndUpdate(
      { _id: eventId, institutionId },
      { isActive: false },
      { new: true }
    );
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getCalendarEventById(institutionId, eventId) {
    const EventModel = (await import('../models/Event.js')).default;
    const event = await EventModel.findOne({ _id: eventId, institutionId, isActive: true })
      .populate('organizer', 'firstName lastName');
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getUpcomingEvents(institutionId, options = {}) {
    const { days = 7, entityTypes, limit = 10 } = options;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const events = [];
    
    if (!entityTypes || entityTypes.includes('homework')) {
      const homeworks = await HomeWork.find({
        institutionId,
        dueDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }).limit(limit);
      homeworks.forEach(hw => events.push({ type: 'homework', ...hw.toObject() }));
    }

    if (!entityTypes || entityTypes.includes('exam')) {
      const exams = await Exam.find({
        institutionId,
        examDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }).limit(limit);
      exams.forEach(exam => events.push({ type: 'exam', ...exam.toObject() }));
    }

    if (!entityTypes || entityTypes.includes('event')) {
      const EventModel = (await import('../models/Event.js')).default;
      const schoolEvents = await EventModel.find({
        institutionId,
        startDate: { $gte: startDate, $lte: endDate },
        isActive: true
      }).limit(limit);
      schoolEvents.forEach(event => events.push({ type: 'event', ...event.toObject() }));
    }

    events.sort((a, b) => new Date(a.startDate || a.dueDate || a.examDate) - new Date(b.startDate || b.dueDate || b.examDate));
    return events.slice(0, limit);
  }

  async exportCalendarEvents(institutionId, startDate, endDate, options = {}) {
    const { format = 'json', entityTypes } = options;
    const events = await this.getCalendarEvents(institutionId, startDate, endDate, { entityTypes });
    return events;
  }

  async getCalendarConflicts(institutionId, startDate, endDate, options = {}) {
    const { resourceId } = options;
    const EventModel = (await import('../models/Event.js')).default;
    const ScheduleModel = (await import('../models/Schedule.js')).default;
    
    const conflicts = [];
    
    const events = await EventModel.find({
      institutionId,
      $or: [
        { startDate: { $gte: startDate, $lte: endDate } },
        { endDate: { $gte: startDate, $lte: endDate } }
      ],
      isActive: true
    });

    const schedules = await ScheduleModel.find({
      institutionId,
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
