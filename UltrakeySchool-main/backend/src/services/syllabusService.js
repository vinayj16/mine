import Syllabus from '../models/Syllabus.js';

class SyllabusService {
  async createSyllabus(schoolId, data) {
    // Map schoolId to institutionId if model requires it
    const institutionId = data.institutionId || schoolId;
    const syllabus = await Syllabus.create({ ...data, institutionId, schoolId });
    return syllabus;
  }

  async getSyllabi(schoolId, filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const query = { schoolId, ...filters };
    const skip = (page - 1) * limit;

    const [syllabi, total] = await Promise.all([
      Syllabus.find(query)
        .populate('classId', 'name section')
        .populate('subjectId', 'name code')
        .skip(skip).limit(limit),
      Syllabus.countDocuments(query)
    ]);

    return { syllabi, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSyllabusById(syllabusId, schoolId) {
    const syllabus = await Syllabus.findOne({ _id: syllabusId, schoolId })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code');
    if (!syllabus) throw new Error('Syllabus not found');
    return syllabus;
  }

  async updateSyllabus(syllabusId, schoolId, updates) {
    const syllabus = await Syllabus.findOneAndUpdate(
      { _id: syllabusId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!syllabus) throw new Error('Syllabus not found');
    return syllabus;
  }

  async deleteSyllabus(syllabusId, schoolId) {
    const syllabus = await Syllabus.findOneAndDelete({ _id: syllabusId, schoolId });
    if (!syllabus) throw new Error('Syllabus not found');
    return syllabus;
  }

  async getSyllabusByClass(schoolId, classId) {
    return await Syllabus.find({ schoolId, classId, isActive: true })
      .populate('subjectId', 'name code');
  }

  async getSyllabusBySubject(schoolId, classId, subjectId) {
    return await Syllabus.findOne({ schoolId, classId, subjectId, isActive: true })
      .populate('subjectId', 'name code');
  }

  async markTopicComplete(syllabusId, schoolId, topicId, isCompleted) {
    const syllabus = await Syllabus.findOne({ _id: syllabusId, schoolId });
    if (!syllabus) throw new Error('Syllabus not found');
    
    const topic = syllabus.topics.id(topicId);
    if (!topic) throw new Error('Topic not found');
    
    topic.isCompleted = isCompleted;
    topic.completedDate = isCompleted ? new Date() : null;
    await syllabus.save();
    return syllabus;
  }
}

export default new SyllabusService();
