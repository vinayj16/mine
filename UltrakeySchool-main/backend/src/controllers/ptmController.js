import ptmService from '../services/ptmService.js';
import notificationService from '../services/notificationService.js';
import Teacher from '../models/Teacher.js';
import User from '../models/User.js';
import Guardian from '../models/Guardian.js';

export const getPTMSlots = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { date, teacherId, status, page, limit } = req.query;
    const result = await ptmService.getPTMSlots(institutionId, { date, teacherId, status, page, limit });
    res.json({ success: true, data: result.slots, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
};

export const getPTMSlotById = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const slot = await ptmService.getPTMSlotById(institutionId, req.params.id);
    res.json({ success: true, data: slot });
  } catch (error) {
    next(error);
  }
};

export const createPTMSlots = async (req, res, next) => {
  try {
    const institutionId = req.user.institutionId || req.body.institutionId || req.tenantId;
    if (!req.body.slots || !Array.isArray(req.body.slots) || req.body.slots.length === 0) {
      return res.status(400).json({ success: false, message: 'slots array is required' });
    }
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution context is required' });
    }
    const slots = await ptmService.createPTMSlots(institutionId, req.user.id, req.body.slots);
    res.status(201).json({ success: true, data: slots, message: 'PTM slots created successfully' });
  } catch (error) {
    next(error);
  }
};

export const updatePTMSlot = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const slot = await ptmService.updatePTMSlot(institutionId, req.params.id, req.body);
    res.json({ success: true, data: slot, message: 'PTM slot updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const deletePTMSlot = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const result = await ptmService.deletePTMSlot(institutionId, req.params.id);
    res.json({ success: true, ...result, message: 'PTM slot deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const bulkDeletePTMSlots = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const result = await ptmService.bulkDeletePTMSlots(institutionId, req.body.slotIds);
    res.json({ success: true, ...result, message: 'PTM slots deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const assignPTMToParent = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { studentId, parentId } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId is required' });

    const slot = await ptmService.bookPTMSlot(institutionId, req.params.id, studentId, req.user.id, { notes: 'Assigned by teacher' });

    const parentUserId = parentId || null;
    if (!parentUserId) {
      const guardian = await Guardian.findOne({ institutionId, 'children.studentId': studentId });
      if (guardian?.userId) {
        const parentUser = await User.findById(guardian.userId);
        if (parentUser) {
          await notificationService.createNotification(institutionId, {
            recipientId: parentUser._id,
            type: 'ptm_booking',
            title: 'PTM Meeting Scheduled',
            message: `A teacher has scheduled a PTM meeting for your child on ${new Date(slot.date).toLocaleDateString()} at ${slot.startTime}`,
            actionUrl: '/dashboard/parent',
            actionText: 'View Details',
            senderId: req.user.id,
            metadata: { ptmSlotId: req.params.id, studentId }
          });
        }
      }
    } else {
      const parentUser = await User.findById(parentUserId);
      if (parentUser) {
        await notificationService.createNotification(institutionId, {
          recipientId: parentUser._id,
          type: 'ptm_booking',
          title: 'PTM Meeting Scheduled',
          message: `A teacher has scheduled a PTM meeting for your child on ${new Date(slot.date).toLocaleDateString()} at ${slot.startTime}`,
          actionUrl: '/dashboard/parent',
          actionText: 'View Details',
          senderId: req.user.id,
          metadata: { ptmSlotId: req.params.id, studentId }
        });
      }
    }

    res.json({ success: true, data: slot, message: 'PTM slot assigned to parent successfully' });
  } catch (error) { next(error); }
};

export const bookPTMSlot = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { studentId, notes } = req.body;
    const slot = await ptmService.bookPTMSlot(institutionId, req.params.id, studentId, req.user.id, { notes });

    const populated = await ptmService.getPTMSlotById(institutionId, req.params.id);
    if (populated.teacherId) {
      const teacherUser = await User.findOne({ email: populated.teacherId.email });
      if (teacherUser) {
        await notificationService.createNotification(institutionId, {
          recipientId: teacherUser._id,
          type: 'ptm_booking',
          title: 'New PTM Booking',
          message: `A parent has booked a PTM slot on ${new Date(populated.date).toLocaleDateString()} at ${populated.startTime}`,
          actionUrl: `/dashboard/teacher/ptm`,
          actionText: 'View Booking',
          senderId: req.user.id,
          metadata: { ptmSlotId: req.params.id, studentId }
        });
      }
    }

    res.json({ success: true, data: slot, message: 'PTM slot booked successfully' });
  } catch (error) {
    next(error);
  }
};

export const cancelPTMBooking = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { reason } = req.body;
    const slot = await ptmService.cancelPTMBooking(institutionId, req.params.id, req.user.id, { reason, adminOverride: req.body.adminOverride });

    if (slot.bookedBy) {
      const parentUser = await User.findById(slot.bookedBy);
      if (parentUser) {
        await notificationService.createNotification(institutionId, {
          recipientId: parentUser._id,
          type: 'ptm_cancellation',
          title: 'PTM Booking Cancelled',
          message: reason ? `Your PTM booking has been cancelled. Reason: ${reason}` : 'Your PTM booking has been cancelled.',
          actionUrl: `/dashboard/parent`,
          actionText: 'View Dashboard',
          senderId: req.user.id,
          metadata: { ptmSlotId: req.params.id }
        });
      }
    }

    res.json({ success: true, data: slot, message: 'PTM booking cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

export const reschedulePTMSlot = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const slot = await ptmService.reschedulePTMSlot(institutionId, req.params.id, req.user.id, req.body);
    res.json({ success: true, data: slot, message: 'PTM slot rescheduled successfully' });
  } catch (error) {
    next(error);
  }
};

export const completePTMSlot = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const slot = await ptmService.completePTMSlot(institutionId, req.params.id, req.body);
    res.json({ success: true, data: slot, message: 'PTM slot completed successfully' });
  } catch (error) {
    next(error);
  }
};

export const sendPTMReminder = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const result = await ptmService.sendPTMReminder(institutionId, req.params.id, req.body);
    res.json({ success: true, ...result, message: 'PTM reminder sent' });
  } catch (error) {
    next(error);
  }
};

export const scheduleVideoMeeting = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const slot = await ptmService.scheduleVideoMeeting(institutionId, req.params.id, req.body);
    res.json({ success: true, data: slot, message: 'Video meeting scheduled successfully' });
  } catch (error) {
    next(error);
  }
};

export const getPTMStatistics = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { startDate, endDate } = req.query;
    const stats = await ptmService.getPTMStatistics(institutionId, startDate, endDate);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getPTMSlotsByTeacher = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { teacherId } = req.params;
    const slots = await ptmService.getPTMSlotsByTeacher(institutionId, teacherId, req.query);
    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

export const getPTMBookingsByParent = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { parentId } = req.params;
    const slots = await ptmService.getPTMBookingsByParent(institutionId, parentId, req.query);
    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

export const getAvailablePTMSlots = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const slots = await ptmService.getAvailablePTMSlots(institutionId, req.query);
    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

export const exportPTMData = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const format = req.query.format || 'json';
    const result = await ptmService.exportPTMData(institutionId, format, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const getPTMAttendanceReport = async (req, res, next) => {
  try {
    const { institutionId } = req.user;
    const { startDate, endDate } = req.query;
    const report = await ptmService.getPTMAttendanceReport(institutionId, startDate, endDate);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
