import mongoose from 'mongoose';
import Exam from '../models/Exam.js';

class ExamService {
  async createExam(institutionId, data) {
    return await Exam.create({ ...data, institutionId });
  }

  async getExams(institutionId, filters = {}) {
    const { page, limit, search, startDate, endDate, ...queryFilters } = filters;
    const query = { institutionId, ...queryFilters };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (startDate || endDate) {
      query.examDate = {};
      if (startDate) query.examDate.$gte = new Date(startDate);
      if (endDate) query.examDate.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [exams, total] = await Promise.all([
      Exam.find(query)
        .populate('classId', 'name section')
        .populate('subjectId', 'name code')
        .populate('invigilator', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Exam.countDocuments(query)
    ]);

    return {
      data: exams,
      meta: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
    };
  }

  async getExamById(examId, institutionId) {
    const exam = await Exam.findOne({ _id: examId, institutionId })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilator', 'firstName lastName')
      .populate('attendance.studentId', 'firstName lastName studentId');
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async updateExam(examId, institutionId, updates) {
    const exam = await Exam.findOneAndUpdate(
      { _id: examId, institutionId },
      { $set: updates },
      { new: true }
    );
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async deleteExam(examId, institutionId) {
    const exam = await Exam.findOneAndDelete({ _id: examId, institutionId });
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async getExamsByClass(institutionId, classId) {
    return await Exam.find({ institutionId, classId, isActive: true })
      .populate('subjectId', 'name code')
      .sort({ examDate: 1 });
  }

  async markAttendance(examId, institutionId, studentId, status) {
    const exam = await Exam.findOne({ _id: examId, institutionId });
    if (!exam) throw new Error('Exam not found');
    
    const existing = exam.attendance.find(a => a.studentId.toString() === studentId);
    if (existing) {
      existing.status = status;
    } else {
      exam.attendance.push({ studentId, status });
    }
    await exam.save();
    return exam;
  }

  async getAttendance(examId, institutionId) {
    const exam = await Exam.findOne({ _id: examId, institutionId })
      .populate('attendance.studentId', 'firstName lastName studentId');
    if (!exam) throw new Error('Exam not found');
    return exam.attendance;
  }

  async bulkUpdateExams(institutionId, examIds, updates) {
    const result = await Exam.updateMany(
      { _id: { $in: examIds }, institutionId },
      { $set: updates }
    );
    return result;
  }

  async bulkDeleteExams(institutionId, examIds) {
    const result = await Exam.deleteMany({ _id: { $in: examIds }, institutionId });
    return result;
  }

  async exportExams(institutionId, format = 'json') {
    const exams = await Exam.find({ institutionId, isActive: true })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilator', 'firstName lastName')
      .sort({ examDate: 1 });

    if (format === 'json') {
      return {
        data: exams,
        format: 'json',
        exportedAt: new Date()
      };
    } else if (format === 'csv') {
      const headers = ['Title', 'Subject', 'Class', 'Exam Date', 'Duration', 'Total Marks', 'Status'];
      const rows = exams.map(exam => [
        exam.title,
        exam.subjectId?.name || 'N/A',
        exam.classId?.name || 'N/A',
        exam.examDate,
        exam.duration,
        exam.totalMarks,
        exam.status
      ]);

      return {
        data: [headers, ...rows],
        format: 'csv',
        exportedAt: new Date()
      };
    }

    throw new Error('Unsupported export format');
  }

  async getExamStatistics(institutionId) {
    const totalExams = await Exam.countDocuments({ institutionId, isActive: true });
    const upcomingExams = await Exam.countDocuments({
      institutionId,
      examDate: { $gte: new Date() },
      isActive: true
    });
    const completedExams = await Exam.countDocuments({
      institutionId,
      examDate: { $lt: new Date() },
      isActive: true
    });

    const examsBySubject = await Exam.aggregate([
      { $match: { institutionId: new mongoose.Types.ObjectId(institutionId), isActive: true } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } }
    ]);

    return {
      totalExams,
      upcomingExams,
      completedExams,
      examsBySubject
    };
  }

  async getExamAnalytics(institutionId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExams = await Exam.find({
      institutionId,
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true
    }).sort({ createdAt: -1 });

    const totalStudents = recentExams.reduce((sum, exam) => sum + (exam.attendance?.length || 0), 0);
    const averageAttendance = recentExams.length > 0 ? totalStudents / recentExams.length : 0;

    return {
      recentExamsCount: recentExams.length,
      totalStudents,
      averageAttendance,
      recentExams: recentExams.slice(0, 10)
    };
  }
}

export default new ExamService();
