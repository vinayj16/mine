import HomeWork from '../models/HomeWork.js';

class HomeWorkService {
  /**
   * Create a new homework
   */
  async createHomeWork(schoolId, homeWorkData) {
    const homeWork = await HomeWork.create({
      ...homeWorkData,
      schoolId
    });
    return homeWork;
  }

  /**
   * Get all homework with filters
   */
  async getHomeWorks(schoolId, filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const query = { schoolId, ...filters };
    const skip = (page - 1) * limit;
    
    const [homeWorks, total] = await Promise.all([
      HomeWork.find(query)
        .populate('classId', 'name code')
        .populate('sectionId', 'name')
        .populate('subjectId', 'name code')
        .populate('teacherId', 'firstName lastName')
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      HomeWork.countDocuments(query)
    ]);

    return {
      homeWorks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get homework by ID
   */
  async getHomeWorkById(homeWorkId, schoolId) {
    const homeWork = await HomeWork.findOne({ _id: homeWorkId, schoolId })
      .populate('classId', 'name code')
      .populate('sectionId', 'name')
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName email')
      .populate('submissions.studentId', 'firstName lastName studentId');
    
    if (!homeWork) {
      throw new Error('Homework not found');
    }
    return homeWork;
  }

  /**
   * Update homework
   */
  async updateHomeWork(homeWorkId, schoolId, updates) {
    const homeWork = await HomeWork.findOneAndUpdate(
      { _id: homeWorkId, schoolId },
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!homeWork) {
      throw new Error('Homework not found');
    }
    return homeWork;
  }

  /**
   * Delete homework
   */
  async deleteHomeWork(homeWorkId, schoolId) {
    const homeWork = await HomeWork.findOneAndDelete({ _id: homeWorkId, schoolId });
    if (!homeWork) {
      throw new Error('Homework not found');
    }
    return homeWork;
  }

  /**
   * Get homework by class
   */
  async getHomeWorksByClass(schoolId, classId) {
    return await HomeWork.find({ schoolId, classId, isActive: true })
      .populate('subjectId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .sort({ dueDate: 1 });
  }

  /**
   * Get homework by teacher
   */
  async getHomeWorksByTeacher(schoolId, teacherId) {
    return await HomeWork.find({ schoolId, teacherId })
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });
  }

  /**
   * Get homework by subject
   */
  async getHomeWorksBySubject(schoolId, subjectId) {
    return await HomeWork.find({ schoolId, subjectId, isActive: true })
      .populate('classId', 'name code')
      .populate('teacherId', 'firstName lastName')
      .sort({ dueDate: 1 });
  }

  /**
   * Get pending homework (not yet due)
   */
  async getPendingHomeWorks(schoolId) {
    return await HomeWork.find({ 
      schoolId, 
      dueDate: { $gt: new Date() },
      status: 'published',
      isActive: true 
    })
      .populate('classId', 'name code')
      .populate('subjectId', 'name code')
      .sort({ dueDate: 1 });
  }

  /**
   * Submit homework
   */
  async submitHomeWork(homeWorkId, schoolId, studentId, submissionData) {
    const homeWork = await HomeWork.findOne({ _id: homeWorkId, schoolId });
    if (!homeWork) {
      throw new Error('Homework not found');
    }

    const existingSubmission = homeWork.submissions.find(
      s => s.studentId.toString() === studentId
    );

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.submittedAt = new Date();
      existingSubmission.status = submissionData.isLate ? 'late' : 'submitted';
      if (submissionData.attachments) {
        existingSubmission.attachments = submissionData.attachments;
      }
    } else {
      // Add new submission
      homeWork.submissions.push({
        studentId,
        submittedAt: new Date(),
        status: submissionData.isLate ? 'late' : 'submitted',
        attachments: submissionData.attachments || []
      });
    }

    await homeWork.save();
    return homeWork;
  }

  /**
   * Grade submission
   */
  async gradeSubmission(homeWorkId, schoolId, studentId, gradeData) {
    const homeWork = await HomeWork.findOne({ _id: homeWorkId, schoolId });
    if (!homeWork) {
      throw new Error('Homework not found');
    }

    const submission = homeWork.submissions.find(
      s => s.studentId.toString() === studentId
    );

    if (!submission) {
      throw new Error('Submission not found');
    }

    submission.marks = gradeData.marks;
    submission.feedback = gradeData.feedback;
    submission.status = 'graded';

    await homeWork.save();
    return homeWork;
  }

  /**
   * Get homework analytics
   */
  async getAnalytics(schoolId, classId = null) {
    const query = { schoolId };
    if (classId) query.classId = classId;

    const homeWorks = await HomeWork.find(query)
      .populate('submissions.studentId', 'firstName lastName');

    const totalHomeWorks = homeWorks.length;
    const publishedHomeWorks = homeWorks.filter(h => h.status === 'published').length;
    const totalSubmissions = homeWorks.reduce((sum, h) => sum + h.submissions.length, 0);
    const gradedSubmissions = homeWorks.reduce(
      (sum, h) => sum + h.submissions.filter(s => s.status === 'graded').length, 
      0
    );

    const averageMarks = homeWorks.reduce((sum, h) => {
      const gradedSubmissions = h.submissions.filter(s => s.marks !== undefined);
      if (gradedSubmissions.length === 0) return sum;
      const marksSum = gradedSubmissions.reduce((s, sub) => s + (sub.marks || 0), 0);
      return sum + (marksSum / gradedSubmissions.length);
    }, 0);

    return {
      totalHomeWorks,
      publishedHomeWorks,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions,
      averageMarks: Math.round(averageMarks * 100) / 100,
      submissionRate: totalSubmissions > 0 
        ? Math.round((totalSubmissions / (totalHomeWorks * 30)) * 100) 
        : 0
    };
  }
}

export default new HomeWorkService();
