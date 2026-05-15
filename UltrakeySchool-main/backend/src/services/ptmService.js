import PTMSlot from '../models/PTMSlot.js';
import logger from '../utils/logger.js';

class PTMService {
  async getPTMSlots(schoolId, options = {}) {
    const { date, teacherId, status, page = 1, limit = 20 } = options;
    
    const query = { schoolId };
    
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

  async bookPTMSlot(schoolId, slotId, studentId, userId, bookingData) {
    const slot = await PTMSlot.findOne({ _id: slotId, schoolId });
    
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

  async cancelPTMBooking(schoolId, slotId, userId, cancellationData) {
    const slot = await PTMSlot.findOne({ _id: slotId, schoolId });
    
    if (!slot) {
      throw new Error('PTM slot not found');
    }
    
    if (slot.status !== 'booked') {
      throw new Error('Slot is not booked');
    }
    
    if (slot.bookedBy.toString() !== userId && !cancellationData.adminOverride) {
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

  async completePTMSlot(schoolId, slotId, completionData) {
    try {
      const slot = await PTMSlot.findOne({ _id: slotId, schoolId });

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
}

export default new PTMService();
