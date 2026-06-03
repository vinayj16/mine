import mongoose from 'mongoose';
import Subject from '../models/Subject.js';

class SubjectService {
  async createSubject(institutionId, subjectData) {
    institutionId = subjectData.institutionId || institutionId;
    const subject = await Subject.create({ ...subjectData, institutionId });
    return subject;
  }

  async getSubjects(institutionId, filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const queryInstitutionId = institutionId || filters.institutionId;
    const query = {};
    if (queryInstitutionId) {
      query.$or = [
        { institutionId: queryInstitutionId },
        { institutionId: new mongoose.Types.ObjectId(queryInstitutionId) }
      ];
    }
    Object.assign(query, filters);
    delete query.institutionId;
    const skip = (page - 1) * limit;

    const [subjects, total] = await Promise.all([
      Subject.find(query).skip(skip).limit(limit),
      Subject.countDocuments(query)
    ]);

    return { subjects, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getSubjectById(subjectId, institutionId) {
    const subject = await Subject.findOne({ _id: subjectId, institutionId });
    if (!subject) throw new Error('Subject not found');
    return subject;
  }

  async updateSubject(subjectId, institutionId, updates) {
    const subject = await Subject.findOneAndUpdate(
      { _id: subjectId, institutionId },
      { $set: updates },
      { new: true }
    );
    if (!subject) throw new Error('Subject not found');
    return subject;
  }

  async deleteSubject(subjectId, institutionId) {
    const subject = await Subject.findOneAndDelete({ _id: subjectId, institutionId });
    if (!subject) throw new Error('Subject not found');
    return subject;
  }

  async getSubjectsByDepartment(institutionId, department) {
    return await Subject.find({ institutionId, department, isActive: true });
  }

  async getSubjectsByType(institutionId, type) {
    return await Subject.find({ institutionId, type, isActive: true });
  }

  async searchSubjects(institutionId, query) {
    const regex = new RegExp(query, 'i');
    return await Subject.find({
      institutionId,
      isActive: true,
      $or: [{ name: regex }, { code: regex }]
    });
  }
}

export default new SubjectService();
