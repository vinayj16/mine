import PTMSlot from '../models/PTMSlot.js';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import notificationService from './notificationService.js';
import logger from '../utils/logger.js';

class PTMService {
  async getPTMSlots(institutionId, options = {}) {
    const { date, teacherId, status, page = 1, limit = 20 } = options;
    
    const query = { institutionId };
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (teacherId) {
      query.teacherId = teacherId;
    }
    
    if (status) {
      query.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const [slots, total] = await Promise.all([
      PTMSlot.find(query)
        .populate('teacherId', 'firstName lastName email')
        .populate('studentId', 'firstName lastName rollNumber')
        .populate('bookedBy', 'firstName lastName email')
        .sort({ date: 1, startTime: 1 })
        .skip(skip)
        .limit(limit),
      PTMSlot.countDocuments(query)
    ]);

    return {
      slots,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async getPTMSlotById(institutionId, slotId) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId })
      .populate('teacherId', 'firstName lastName email')
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('bookedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
      
    if (!slot) {
      throw new Error('PTM slot not found');
    }
    return slot;
  }

  async createPTMSlots(institutionId, createdBy, slotsData) {
    // Look up the Teacher record for the creating user (teacher role)
    let teacherId = createdBy;
    const teacher = await Teacher.findOne({ userId: createdBy, institutionId });
    if (teacher) {
      teacherId = teacher._id;
    }

    const slots = slotsData.map(slot => ({
      institutionId,
      teacherId,
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      duration: slot.duration || 30,
      status: 'available',
      createdBy,
      meetingMode: slot.meetingMode || 'in-person',
      meetingLink: slot.meetingLink || null,
      location: slot.location || null,
    }));

    const created = await PTMSlot.insertMany(slots);
    logger.info(`Created ${created.length} PTM slots for teacher ${teacher?._id || teacherId}`);
    return created;
  }

  async updatePTMSlot(institutionId, slotId, updateData) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId });
    if (!slot) {
      throw new Error('PTM slot not found');
    }

    const allowedFields = ['date', 'startTime', 'endTime', 'duration', 'meetingMode', 'meetingLink', 'location'];
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        slot[field] = updateData[field];
      }
    }

    await slot.save();
    return slot;
  }

  async deletePTMSlot(institutionId, slotId) {
    const slot = await PTMSlot.findOneAndDelete({ _id: slotId, institutionId });
    if (!slot) {
      throw new Error('PTM slot not found');
    }
    logger.info(`PTM slot deleted: ${slotId}`);
    return { deleted: true };
  }

  async bulkDeletePTMSlots(institutionId, slotIds) {
    const result = await PTMSlot.deleteMany({ _id: { $in: slotIds }, institutionId });
    logger.info(`Bulk deleted ${result.deletedCount} PTM slots`);
    return { deleted: result.deletedCount };
  }

  async bookPTMSlot(institutionId, slotId, studentId, userId, bookingData) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId });
    
    if (!slot) {
      throw new Error('PTM slot not found');
    }
    
    if (slot.status !== 'available') {
      throw new Error('Slot is not available for booking');
    }
    
    slot.status = 'booked';
    slot.studentId = studentId;
    slot.bookedBy = userId;
    slot.bookingNotes = bookingData.notes;
    slot.bookedAt = new Date();
    
    await slot.save();
    
    return slot;
  }

  async cancelPTMBooking(institutionId, slotId, userId, cancellationData) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId });
    
    if (!slot) {
      throw new Error('PTM slot not found');
    }
    
    if (slot.status !== 'booked') {
      throw new Error('Slot is not booked');
    }
    
    if (slot.bookedBy?.toString() !== userId && !cancellationData.adminOverride) {
      throw new Error('You do not have permission to cancel this booking');
    }
    
    slot.status = 'available';
    slot.bookedBy = null;
    slot.studentId = null;
    slot.bookingNotes = null;
    slot.bookedAt = null;
    slot.cancellationReason = cancellationData.reason;
    slot.cancelledAt = new Date();
    slot.cancelledBy = userId;
    
    await slot.save();
    
    return slot;
  }

  async reschedulePTMSlot(institutionId, slotId, userId, rescheduleData) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId });
    if (!slot) {
      throw new Error('PTM slot not found');
    }

    slot.date = new Date(rescheduleData.date);
    slot.startTime = rescheduleData.startTime;
    slot.endTime = rescheduleData.endTime;
    slot.status = 'available';
    slot.rescheduledAt = new Date();
    slot.rescheduledBy = userId;

    await slot.save();
    return slot;
  }

  async completePTMSlot(institutionId, slotId, completionData) {
    try {
      const slot = await PTMSlot.findOne({ _id: slotId, institutionId });

      if (!slot) {
        throw new Error('PTM slot not found');
      }

      slot.status = 'completed';
      slot.completedAt = new Date();
      slot.meetingNotes = completionData.notes;
      slot.attendanceStatus = completionData.attendanceStatus || 'attended';

      await slot.save();

      logger.info(`PTM slot completed: ${slotId}`);
      return slot;
    } catch (error) {
      logger.error(`Error completing PTM slot: ${error.message}`);
      throw error;
    }
  }

  async sendPTMReminder(institutionId, slotId, options = {}) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId })
      .populate('teacherId', 'firstName lastName email')
      .populate('studentId', 'firstName lastName')
      .populate('bookedBy', 'email');
    
    if (!slot) {
      throw new Error('PTM slot not found');
    }

    if (slot.bookedBy?.email) {
      const user = await User.findOne({ email: slot.bookedBy.email });
      if (user) {
        await notificationService.createNotification(institutionId, {
          recipientId: user._id,
          type: 'ptm_reminder',
          title: 'PTM Meeting Reminder',
          message: `Reminder: Your PTM with ${slot.teacherId?.firstName || ''} ${slot.teacherId?.lastName || ''} is scheduled on ${new Date(slot.date).toLocaleDateString()} at ${slot.startTime}`,
          actionUrl: `/dashboard/parent/ptm`,
          actionText: 'View Details',
          metadata: { ptmSlotId: slotId, date: slot.date, startTime: slot.startTime }
        });
      }
    }

    logger.info(`PTM reminder sent for slot: ${slotId}`);
    return { sent: true, slot };
  }

  async sendAutomatedReminders(institutionId, hoursBeforeMeeting) {
    const query = { institutionId, status: 'booked' };
    if (hoursBeforeMeeting) {
      const targetDate = new Date();
      targetDate.setHours(targetDate.getHours() + Number(hoursBeforeMeeting));
      const endDate = new Date(targetDate);
      endDate.setMinutes(targetDate.getMinutes() + 30);
      query.date = { $gte: new Date(), $lte: endDate };
    }

    const slots = await PTMSlot.find(query)
      .populate('teacherId', 'firstName lastName email')
      .populate('studentId', 'firstName lastName')
      .populate('bookedBy', 'email');

    let sentCount = 0;
    for (const slot of slots) {
      if (slot.bookedBy?.email) {
        const user = await User.findOne({ email: slot.bookedBy.email });
        if (user) {
          await notificationService.createNotification(institutionId, {
            recipientId: user._id,
            type: 'ptm_reminder',
            title: 'PTM Meeting Reminder',
            message: `Reminder: Your PTM with ${slot.teacherId?.firstName || ''} ${slot.teacherId?.lastName || ''} is scheduled on ${new Date(slot.date).toLocaleDateString()} at ${slot.startTime}`,
            actionUrl: `/dashboard/parent/ptm`,
            actionText: 'View Details',
            metadata: { ptmSlotId: slot._id, date: slot.date, startTime: slot.startTime }
          });
          sentCount++;
        }
      }
    }

    logger.info(`Sent automated reminders for ${slots.length} PTM slots`);
    return { sent: sentCount, total: slots.length };
  }

  async scheduleVideoMeeting(institutionId, slotId, meetingData) {
    const slot = await PTMSlot.findOne({ _id: slotId, institutionId });
    if (!slot) {
      throw new Error('PTM slot not found');
    }

    slot.meetingLink = meetingData.meetingLink || slot.meetingLink;
    slot.meetingPlatform = meetingData.platform || slot.meetingPlatform;
    slot.meetingId = meetingData.meetingId || slot.meetingId;
    slot.meetingPassword = meetingData.password || slot.meetingPassword;

    await slot.save();
    return slot;
  }

  async getPTMStatistics(institutionId, startDate, endDate) {
    const match = { institutionId };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const stats = await PTMSlot.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        }
      }
    ]);

    const result = {
      total: 0,
      available: 0,
      booked: 0,
      completed: 0,
      cancelled: 0,
    };

    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });

    return result;
  }

  async getPTMSlotsByTeacher(institutionId, teacherId, options = {}) {
    const query = { institutionId, teacherId };
    if (options.status) query.status = options.status;
    if (options.date) {
      const d = new Date(options.date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: end };
    }

    const slots = await PTMSlot.find(query)
      .populate('studentId', 'firstName lastName rollNumber')
      .populate('bookedBy', 'firstName lastName email')
      .sort({ date: 1, startTime: 1 });

    return slots;
  }

  async getPTMBookingsByParent(institutionId, parentId, options = {}) {
    const query = { institutionId, bookedBy: parentId };
    if (options.status) query.status = options.status;

    const slots = await PTMSlot.find(query)
      .populate('teacherId', 'firstName lastName email')
      .populate('studentId', 'firstName lastName rollNumber')
      .sort({ date: -1, startTime: 1 });

    return slots;
  }

  async getAvailablePTMSlots(institutionId, options = {}) {
    const query = { institutionId, status: 'available' };
    if (options.date) {
      const d = new Date(options.date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: end };
    }
    if (options.teacherId) query.teacherId = options.teacherId;

    const slots = await PTMSlot.find(query)
      .populate('teacherId', 'firstName lastName email')
      .sort({ date: 1, startTime: 1 });

    return slots;
  }

  async exportPTMData(institutionId, format = 'json', options = {}) {
    const query = { institutionId };
    if (options.date) {
      const d = new Date(options.date);
      d.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: d, $lte: end };
    }
    if (options.status) query.status = options.status;

    const slots = await PTMSlot.find(query)
      .populate('teacherId', 'firstName lastName email')
      .populate('studentId', 'firstName lastName rollNumber')
      .lean();

    return { data: slots, format, count: slots.length };
  }

  async getPTMAttendanceReport(institutionId, startDate, endDate) {
    const match = { institutionId, status: { $in: ['completed', 'booked'] } };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const report = await PTMSlot.aggregate([
      { $match: match },
      {
        $group: {
          _id: { teacherId: '$teacherId', attendanceStatus: '$attendanceStatus' },
          count: { $sum: 1 },
        }
      },
      {
        $group: {
          _id: '$_id.teacherId',
          slots: {
            $push: { status: '$_id.attendanceStatus', count: '$count' }
          },
          total: { $sum: '$count' },
        }
      }
    ]);

    return report;
  }
}

export default new PTMService();
