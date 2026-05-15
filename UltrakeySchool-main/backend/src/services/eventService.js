import Event from '../models/Event.js';

class EventService {
  async createEvent(schoolId, data) {
    return await Event.create({ ...data, schoolId });
  }

  async getEvents(schoolId, filters = {}) {
    return await Event.find({ schoolId, ...filters })
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });
  }

  async getEventById(eventId, schoolId) {
    const event = await Event.findOne({ _id: eventId, schoolId })
      .populate('organizer', 'firstName lastName')
      .populate('classIds', 'name section');
    if (!event) throw new Error('Event not found');
    return event;
  }

  async updateEvent(eventId, schoolId, updates) {
    const event = await Event.findOneAndUpdate(
      { _id: eventId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!event) throw new Error('Event not found');
    return event;
  }

  async deleteEvent(eventId, schoolId) {
    const event = await Event.findOneAndDelete({ _id: eventId, schoolId });
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getUpcomingEvents(schoolId) {
    return await Event.find({ 
      schoolId, 
      startDate: { $gte: new Date() },
      status: { $ne: 'cancelled' },
      isActive: true 
    }).populate('organizer', 'firstName lastName').sort({ startDate: 1 });
  }

  async getEventsByType(schoolId, eventType) {
    return await Event.find({ schoolId, eventType, isActive: true })
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });
  }

  async bulkUpdateEvents(schoolId, eventIds, updates) {
    const result = await Event.updateMany(
      { _id: { $in: eventIds }, schoolId },
      { $set: updates }
    );
    return result;
  }

  async bulkDeleteEvents(schoolId, eventIds) {
    const result = await Event.deleteMany({ _id: { $in: eventIds }, schoolId });
    return result;
  }

  async exportEvents(schoolId, format = 'json') {
    const events = await Event.find({ schoolId, isActive: true })
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });

    if (format === 'json') {
      return {
        data: events,
        format: 'json',
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      const headers = ['Title', 'Type', 'Start Date', 'End Date', 'Location', 'Status'];
      const rows = events.map(event => [
        event.title,
        event.eventType,
        event.startDate,
        event.endDate,
        event.location,
        event.status
      ]);

      return {
        data: [headers, ...rows],
        format: 'csv',
        exportedAt: new Date()
      };
    }

    throw new Error('Unsupported export format');
  }

  async getEventStatistics(schoolId) {
    const totalEvents = await Event.countDocuments({ schoolId, isActive: true });
    const upcomingEvents = await Event.countDocuments({
      schoolId,
      startDate: { $gte: new Date() },
      isActive: true
    });
    const pastEvents = await Event.countDocuments({
      schoolId,
      startDate: { $lt: new Date() },
      isActive: true
    });

    const eventsByType = await Event.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), isActive: true } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsByType
    };
  }

  async getEventAnalytics(schoolId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEvents = await Event.find({
      schoolId,
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true
    }).sort({ createdAt: -1 });

    const totalParticipants = recentEvents.reduce((sum, event) => sum + (event.participants || 0), 0);
    const averageAttendance = recentEvents.length > 0 ? totalParticipants / recentEvents.length : 0;

    return {
      recentEventsCount: recentEvents.length,
      totalParticipants,
      averageAttendance,
      recentEvents: recentEvents.slice(0, 10)
    };
  }
}

export default new EventService();
