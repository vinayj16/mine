import ClassTimetable from '../models/ClassTimetable.js';

class ClassTimetableService {
  async createTimetable(institutionId, data) {
    institutionId = data.institutionId || institutionId;
    // Provide defaults for required fields if not provided
    const defaultData = {
      ...data,
      institutionId,
      dayOfWeek: data.dayOfWeek || 'monday',
      status: data.status || 'active'
    };
    return await ClassTimetable.create(defaultData);
  }

  async getTimetables(institutionId, filters = {}) {
    return await ClassTimetable.find({ institutionId, ...filters })
      .populate('classId', 'name section')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'name email avatar');
  }

  async getTimetableById(timetableId, institutionId) {
    const timetable = await ClassTimetable.findOne({ _id: timetableId, institutionId })
      .populate('classId', 'name section')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'name email avatar');
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async getWeeklyTimetable(institutionId, classId) {
    return await ClassTimetable.find({ institutionId, classId, isActive: true })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'name email avatar')
      .sort({ dayOfWeek: 1 });
  }

  async getTimetableByDay(institutionId, classId, dayOfWeek) {
    return await ClassTimetable.findOne({ institutionId, classId, dayOfWeek, isActive: true })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'name email avatar');
  }

  async getTimetableById(timetableId, institutionId) {
    const timetable = await ClassTimetable.findOne({ _id: timetableId, institutionId })
      .populate('classId', 'name section')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName');
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async updateTimetable(timetableId, institutionId, updates) {
    const timetable = await ClassTimetable.findOneAndUpdate(
      { _id: timetableId, institutionId },
      { $set: updates },
      { new: true }
    );
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async deleteTimetable(timetableId, institutionId) {
    const timetable = await ClassTimetable.findOneAndDelete({ _id: timetableId, institutionId });
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async getWeeklyTimetable(institutionId, classId) {
    return await ClassTimetable.find({ institutionId, classId, isActive: true })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName')
      .sort({ dayOfWeek: 1 });
  }

  async getTimetableByDay(institutionId, classId, dayOfWeek) {
    return await ClassTimetable.findOne({ institutionId, classId, dayOfWeek, isActive: true })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName');
  }

  async addPeriod(timetableId, institutionId, periodData) {
    const timetable = await ClassTimetable.findOne({ _id: timetableId, institutionId });
    if (!timetable) throw new Error('Timetable not found');
    if (!timetable.periods) timetable.periods = [];
    timetable.periods.push({
      periodNumber: timetable.periods.length + 1,
      subjectId: periodData.subjectId,
      teacherId: periodData.teacherId,
      startTime: periodData.startTime,
      endTime: periodData.endTime,
      roomNumber: periodData.roomNumber || periodData.roomId || '',
    });
    await timetable.save();
    return timetable;
  }

  async removePeriod(timetableId, institutionId, periodId) {
    const timetable = await ClassTimetable.findOne({ _id: timetableId, institutionId });
    if (!timetable) throw new Error('Timetable not found');
    timetable.periods = timetable.periods.filter(p => p._id.toString() !== periodId);
    await timetable.save();
    return timetable;
  }
}

export default new ClassTimetableService();
