import ClassTimetable from '../models/ClassTimetable.js';

class ClassTimetableService {
  async createTimetable(schoolId, data) {
    const institutionId = data.institutionId || schoolId;
    // Provide defaults for required fields if not provided
    const defaultData = {
      ...data,
      institutionId,
      schoolId,
      dayOfWeek: data.dayOfWeek || 'monday',
      status: data.status || 'active'
    };
    return await ClassTimetable.create(defaultData);
  }

  async getTimetables(schoolId, filters = {}) {
    return await ClassTimetable.find({ schoolId, ...filters })
      .populate('classId', 'name section')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName');
  }

  async getTimetableById(timetableId, schoolId) {
    const timetable = await ClassTimetable.findOne({ _id: timetableId, schoolId })
      .populate('classId', 'name section')
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName');
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async updateTimetable(timetableId, schoolId, updates) {
    const timetable = await ClassTimetable.findOneAndUpdate(
      { _id: timetableId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async deleteTimetable(timetableId, schoolId) {
    const timetable = await ClassTimetable.findOneAndDelete({ _id: timetableId, schoolId });
    if (!timetable) throw new Error('Timetable not found');
    return timetable;
  }

  async getWeeklyTimetable(schoolId, classId) {
    return await ClassTimetable.find({ schoolId, classId, isActive: true })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName')
      .sort({ dayOfWeek: 1 });
  }

  async getTimetableByDay(schoolId, classId, dayOfWeek) {
    return await ClassTimetable.findOne({ schoolId, classId, dayOfWeek, isActive: true })
      .populate('periods.subjectId', 'name code')
      .populate('periods.teacherId', 'firstName lastName');
  }
}

export default new ClassTimetableService();
