import HostelAttendance from '../models/hostelAttendance.js';
import { Room, Allocation } from '../models/hostel.js';

class HostelAttendanceService {
  async recordAttendance({ institutionId, roomId, studentId, date, status, remarks, recordedBy }) {
    const allocation = await Allocation.findOne({
      room: roomId,
      student: studentId,
      status: 'active',
      institution: institutionId
    });

    if (!allocation) {
      throw new Error('Student is not allocated to the requested room');
    }

    const attendanceDate = date ? new Date(date) : new Date();
    const attendance = await HostelAttendance.findOneAndUpdate(
      { institution: institutionId, room: roomId, student: studentId, date: attendanceDate },
      { institution: institutionId, room: roomId, student: studentId, date: attendanceDate, status, remarks, recordedBy },
      { upsert: true, new: true }
    );

    return attendance;
  }

  async getAttendance(roomId, institutionId, date) {
    const query = { room: roomId, institution: institutionId };
    if (date) {
      const targetDate = new Date(date);
      query.date = {
        $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        $lte: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }

    return HostelAttendance.find(query)
      .populate('student', 'firstName lastName rollNumber')
      .sort({ date: -1 });
  }

  async getRoomSummary(roomId, institutionId, startDate, endDate) {
    const query = { room: roomId, institution: institutionId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const records = await HostelAttendance.find(query);
    const summary = records.reduce((acc, record) => {
      acc.total += 1;
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, { total: 0 });

    return {
      summary,
      records
    };
  }

  async recordRoomWalkthrough(roomId, institutionId, notes, recordedBy) {
    const room = await Room.findOne({ _id: roomId, institution: institutionId });
    if (!room) {
      throw new Error('Room not found');
    }

    room.condition = notes.condition || room.condition;
    await room.save();
    return room;
  }
}

export default new HostelAttendanceService();
