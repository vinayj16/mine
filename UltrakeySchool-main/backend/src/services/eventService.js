import mongoose from 'mongoose';
import Event from '../models/Event.js';

class EventService {
  async createEvent(institutionId, data) {
    return await Event.create({ ...data, institutionId });
  }

  async getEvents(institutionId, filters = {}) {
    const query = institutionId
      ? { $or: [{ institutionId }, { institutionId: { $exists: false } }, { institutionId: null }], ...filters }
      : { $or: [{ institutionId: { $exists: false } }, { institutionId: null }], ...filters };
    return await Event.find(query)
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });
  }

  async getEventById(eventId, institutionId) {
    const event = await Event.findOne({ _id: eventId, institutionId })
      .populate('organizer', 'firstName lastName')
      .populate('classIds', 'name section');
    if (!event) throw new Error('Event not found');
    return event;
  }

  async updateEvent(eventId, institutionId, updates) {
    const event = await Event.findOneAndUpdate(
      { _id: eventId, institutionId },
      { $set: updates },
      { new: true }
    );
    if (!event) throw new Error('Event not found');
    return event;
  }

  async deleteEvent(eventId, institutionId) {
    const event = await Event.findOneAndDelete({ _id: eventId, institutionId });
    if (!event) throw new Error('Event not found');
    return event;
  }

  async getUpcomingEvents(institutionId) {
    return await Event.find({ 
      institutionId, 
      startDate: { $gte: new Date() },
      status: { $ne: 'cancelled' },
      isActive: true 
    }).populate('organizer', 'firstName lastName').sort({ startDate: 1 });
  }

  async getEventsByType(institutionId, eventType) {
    return await Event.find({ institutionId, eventType, isActive: true })
      .populate('organizer', 'firstName lastName')
      .sort({ startDate: 1 });
  }

  async bulkUpdateEvents(institutionId, eventIds, updates) {
    const result = await Event.updateMany(
      { _id: { $in: eventIds }, institutionId },
      { $set: updates }
    );
    return result;
  }

  async bulkDeleteEvents(institutionId, eventIds) {
    const result = await Event.deleteMany({ _id: { $in: eventIds }, institutionId });
    return result;
  }

  async exportEvents(institutionId, format = 'json') {
    const events = await Event.find({ institutionId, isActive: true })
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

  async getEventStatistics(institutionId) {
    const totalEvents = await Event.countDocuments({ institutionId, isActive: true });
    const upcomingEvents = await Event.countDocuments({
      institutionId,
      startDate: { $gte: new Date() },
      isActive: true
    });
    const pastEvents = await Event.countDocuments({
      institutionId,
      startDate: { $lt: new Date() },
      isActive: true
    });

    const eventsByType = await Event.aggregate([
      { $match: { institutionId: new mongoose.Types.ObjectId(institutionId), isActive: true } },
      { $group: { _id: '$eventType', count: { $sum: 1 } } }
    ]);

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      eventsByType
    };
  }

  async getEventAnalytics(institutionId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEvents = await Event.find({
      institutionId,
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
