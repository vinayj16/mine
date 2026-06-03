import Syllabus from '../models/Syllabus.js';

class SyllabusService {
  async createSyllabus(institutionId, data) {
    institutionId = data.institutionId || institutionId;
    const syllabus = await Syllabus.create({ ...data, institutionId });
    return syllabus;
  }

  async getSyllabi(institutionId, filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const query = { institutionId, ...filters };
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

  async getSyllabusById(syllabusId, institutionId) {
    const syllabus = await Syllabus.findOne({ _id: syllabusId, institutionId })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code');
    if (!syllabus) throw new Error('Syllabus not found');
    return syllabus;
  }

  async updateSyllabus(syllabusId, institutionId, updates) {
    const syllabus = await Syllabus.findOneAndUpdate(
      { _id: syllabusId, institutionId },
      { $set: updates },
      { new: true }
    );
    if (!syllabus) throw new Error('Syllabus not found');
    return syllabus;
  }

  async deleteSyllabus(syllabusId, institutionId) {
    const syllabus = await Syllabus.findOneAndDelete({ _id: syllabusId, institutionId });
    if (!syllabus) throw new Error('Syllabus not found');
    return syllabus;
  }

  async getSyllabusByClass(institutionId, classId) {
    return await Syllabus.find({ institutionId, classId, isActive: true })
      .populate('subjectId', 'name code');
  }

  async getSyllabusBySubject(institutionId, classId, subjectId) {
    return await Syllabus.findOne({ institutionId, classId, subjectId, isActive: true })
      .populate('subjectId', 'name code');
  }

  async markTopicComplete(syllabusId, institutionId, topicId, isCompleted) {
    const syllabus = await Syllabus.findOne({ _id: syllabusId, institutionId });
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
