import Subject from '../models/Subject.js';

class SubjectService {
  async createSubject(schoolId, subjectData) {
    // Map schoolId to institutionId (model uses institutionId)
    const institutionId = subjectData.institutionId || schoolId;
    const subject = await Subject.create({ ...subjectData, institutionId, schoolId });
    return subject;
  }

  async getSubjects(schoolId, filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    // Fix: Use institutionId from schoolId or filters if available for proper filtering
    const querySchoolId = schoolId || filters.schoolId || filters.institutionId;
    const query = querySchoolId ? { schoolId: querySchoolId, ...filters } : { ...filters };
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      Subject.find(query).skip(skip).limit(limit),
      Subject.countDocuments(query)
    ]);

    return { subjects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSubjectById(subjectId, schoolId) {
    const subject = await Subject.findOne({ _id: subjectId, schoolId });
    if (!subject) throw new Error('Subject not found');
    return subject;
  }

  async updateSubject(subjectId, schoolId, updates) {
    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!subject) throw new Error('Subject not found');
    return subject;
  }

  async deleteSubject(subjectId, schoolId) {
    const subject = await Subject.findOneAndDelete({ _id: subjectId, schoolId });
    if (!subject) throw new Error('Subject not found');
    return subject;
  }

  async getSubjectsByDepartment(schoolId, department) {
    return await Subject.find({ schoolId, department, isActive: true });
  }

  async getSubjectsByType(schoolId, type) {
    return await Subject.find({ schoolId, type, isActive: true });
  }

  async searchSubjects(schoolId, query) {
    const regex = new RegExp(query, 'i');
    return await Subject.find({
      schoolId,
      isActive: true,
      $or: [{ name: regex }, { code: regex }]
    });
  }
}

export default new SubjectService();
