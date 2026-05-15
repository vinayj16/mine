import Exam from '../models/Exam.js';

class ExamService {
  async createExam(schoolId, data) {
    return await Exam.create({ ...data, schoolId });
  }

  async getExams(schoolId, filters = {}) {
    return await Exam.find({ schoolId, ...filters })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilator', 'firstName lastName');
  }

  async getExamById(examId, schoolId) {
    const exam = await Exam.findOne({ _id: examId, schoolId })
      .populate('classId', 'name section')
      .populate('subjectId', 'name code')
      .populate('invigilator', 'firstName lastName')
      .populate('attendance.studentId', 'firstName lastName studentId');
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async updateExam(examId, schoolId, updates) {
    const exam = await Exam.findOneAndUpdate(
      { _id: examId, schoolId },
      { $set: updates },
      { new: true }
    );
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async deleteExam(examId, schoolId) {
    const exam = await Exam.findOneAndDelete({ _id: examId, schoolId });
    if (!exam) throw new Error('Exam not found');
    return exam;
  }

  async getExamsByClass(schoolId, classId) {
    return await Exam.find({ schoolId, classId, isActive: true })
      .populate('subjectId', 'name code')
      .sort({ examDate: 1 });
  }

  async markAttendance(examId, schoolId, studentId, status) {
    const exam = await Exam.findOne({ _id: examId, schoolId });
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

  async getAttendance(examId, schoolId) {
    const exam = await Exam.findOne({ _id: examId, schoolId })
      .populate('attendance.studentId', 'firstName lastName studentId');
    if (!exam) throw new Error('Exam not found');
    return exam.attendance;
  }

  async bulkUpdateExams(schoolId, examIds, updates) {
    const result = await Exam.updateMany(
      { _id: { $in: examIds }, schoolId },
      { $set: updates }
    );
    return result;
  }

  async bulkDeleteExams(schoolId, examIds) {
    const result = await Exam.deleteMany({ _id: { $in: examIds }, schoolId });
    return result;
  }

  async exportExams(schoolId, format = 'json') {
    const exams = await Exam.find({ schoolId, isActive: true })
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

  async getExamStatistics(schoolId) {
    const totalExams = await Exam.countDocuments({ schoolId, isActive: true });
    const upcomingExams = await Exam.countDocuments({
      schoolId,
      examDate: { $gte: new Date() },
      isActive: true
    });
    const completedExams = await Exam.countDocuments({
      schoolId,
      examDate: { $lt: new Date() },
      isActive: true
    });

    const examsBySubject = await Exam.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), isActive: true } },
      { $group: { _id: '$subjectId', count: { $sum: 1 } } }
    ]);

    return {
      totalExams,
      upcomingExams,
      completedExams,
      examsBySubject
    };
  }

  async getExamAnalytics(schoolId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentExams = await Exam.find({
      schoolId,
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
