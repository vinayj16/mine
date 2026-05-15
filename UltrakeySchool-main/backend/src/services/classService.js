import Class from '../models/Class.js';
import '../models/Institution.js';
import '../models/User.js';
import mongoose from 'mongoose';

class ClassService {
  buildActiveClassQuery(filters = {}) {
    const {
      name,
      section,
      status,
      academicYear,
      institutionId,
      institutionCode,
      search
    } = filters;

    const query = {
      isDeleted: { $ne: true }
    };
    const andFilters = [];

    if (name) query.name = name;
    if (section) query.section = section;
    if (status) query.status = status;
    if (academicYear) query.academicYear = academicYear;

    if (institutionId || institutionCode) {
      const institutionFilters = [];

      if (institutionId) {
        const id = String(institutionId);
        institutionFilters.push(
          { institutionId: id },
          { institution: id },
          { schoolId: id }
        );

        if (mongoose.Types.ObjectId.isValid(id)) {
          const objectId = new mongoose.Types.ObjectId(id);
          institutionFilters.push(
            { institutionId: objectId },
            { institution: objectId },
            { schoolId: objectId }
          );
        }
      }

      if (institutionCode) {
        const code = String(institutionCode);
        institutionFilters.push(
          { institutionCode: code },
          { instituteCode: code },
          { schoolCode: code },
          { code: code }
        );
      }

      andFilters.push({ $or: institutionFilters });
    }

    if (search) {
      andFilters.push({
        $or: [
          { classId: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { section: { $regex: search, $options: 'i' } },
          { room: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (andFilters.length > 0) {
      query.$and = andFilters;
    }

    return query;
  }

  async createClass(classData) {
    // Build query for duplicate check - check both institutionId and institution fields
    const duplicateQuery = {
      name: classData.name,
      section: classData.section,
      academicYear: classData.academicYear,
      isDeleted: { $ne: true }
    };
    
    // Add institution filter - could be ObjectId or string
    if (classData.institutionId) {
      duplicateQuery.institutionId = classData.institutionId;
    } else if (classData.institution) {
      duplicateQuery.institution = classData.institution;
    }
    
    const existingClass = await Class.findOne(duplicateQuery);

    if (existingClass) {
      throw new Error(`Class "${classData.name}" with section "${classData.section}" already exists for academic year "${classData.academicYear}"`);
    }

    const newClass = new Class(classData);
    return await newClass.save();
  }

  async getClassById(classId) {
    return await Class.findById(classId)
      .populate('classTeacher', 'name email')
      .populate('institutionId', 'name')
      .populate('metadata.createdBy', 'name')
      .populate('metadata.updatedBy', 'name');
  }

  async getClassByClassId(classId) {
    return await Class.findOne({ classId, isDeleted: { $ne: true } })
      .populate('classTeacher', 'name email')
      .populate('institutionId', 'name');
  }

  async getAllClasses(filters = {}, options = {}) {
    const {
      name,
      section,
      status,
      academicYear,
      institutionId,
      search
    } = filters;

    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const query = this.buildActiveClassQuery(filters);

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('classTeacher', 'name email')
        .populate('institutionId', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Class.countDocuments(query)
    ]);

    return {
      classes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async updateClass(classId, updateData) {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error('Class not found');
    }

    if (updateData.name || updateData.section || updateData.academicYear) {
      const existingClass = await Class.findOne({
        _id: { $ne: classId },
        name: updateData.name || classDoc.name,
        section: updateData.section || classDoc.section,
        academicYear: updateData.academicYear || classDoc.academicYear,
        institutionId: classDoc.institutionId,
        isDeleted: { $ne: true }
      });

      if (existingClass) {
        throw new Error('Class with this name and section already exists for this academic year');
      }
    }

    Object.assign(classDoc, updateData);
    return await classDoc.save();
  }

  async deleteClass(classId) {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error('Class not found');
    }

    classDoc.isDeleted = true;
    return await classDoc.save();
  }

  async getClassesByInstitution(institutionId, academicYear) {
    const query = this.buildActiveClassQuery({ institutionId, academicYear });
    return await Class.find(query)
      .populate('classTeacher', 'name email')
      .sort({ name: 1, section: 1 });
  }

  async getClassesByStatus(status, institutionId) {
    const query = this.buildActiveClassQuery({ status, institutionId });

    return await Class.find(query)
      .populate('classTeacher', 'name email')
      .sort({ name: 1, section: 1 });
  }

  async getClassStatistics(institutionId, academicYear) {
    const match = this.buildActiveClassQuery({ institutionId, academicYear });

    const [
      totalClasses,
      activeClasses,
      inactiveClasses,
      totalStudents,
      avgStudentsPerClass,
      classesByName
    ] = await Promise.all([
      Class.countDocuments(match),
      Class.countDocuments({ ...match, status: 'active' }),
      Class.countDocuments({ ...match, status: 'inactive' }),
      Class.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: '$students' } } }
      ]),
      Class.aggregate([
        { $match: match },
        { $group: { _id: null, avg: { $avg: '$students' } } }
      ]),
      Class.aggregate([
        { $match: match },
        { $group: { _id: '$name', count: { $sum: 1 }, students: { $sum: '$students' } } },
        { $sort: { _id: 1 } }
      ])
    ]);

    return {
      totalClasses,
      activeClasses,
      inactiveClasses,
      totalStudents: totalStudents[0]?.total || 0,
      avgStudentsPerClass: Math.round(avgStudentsPerClass[0]?.avg || 0),
      classesByName
    };
  }

  async updateStudentCount(classId, count) {
    return await Class.findByIdAndUpdate(
      classId,
      { students: count },
      { new: true }
    );
  }

  async updateSubjectCount(classId, count) {
    return await Class.findByIdAndUpdate(
      classId,
      { subjects: count },
      { new: true }
    );
  }

  async assignClassTeacher(classId, teacherId, userId) {
    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      throw new Error('Class not found');
    }

    classDoc.classTeacher = teacherId;
    classDoc.metadata.updatedBy = userId;
    return await classDoc.save();
  }

  async getClassesByTeacher(teacherId) {
    return await Class.find({
      classTeacher: teacherId,
      isDeleted: false
    })
      .populate('institutionId', 'name')
      .sort({ name: 1, section: 1 });
  }

  async bulkUpdateStatus(classIds, status, userId) {
    return await Class.updateMany(
      { _id: { $in: classIds }, isDeleted: { $ne: true } },
      {
        $set: {
          status,
          'metadata.updatedBy': userId,
          updatedAt: new Date()
        }
      }
    );
  }

  async searchClasses(searchTerm, institutionId) {
    const query = this.buildActiveClassQuery({ institutionId, search: searchTerm });

    return await Class.find(query)
      .populate('classTeacher', 'name email')
      .populate('institutionId', 'name')
      .sort({ name: 1, section: 1 })
      .limit(50);
  }

  async exportClasses(options = {}) {
    const { institutionId, academicYear, status, format } = options;
    const query = this.buildActiveClassQuery({ institutionId, academicYear, status });
    return await Class.find(query).populate('classTeacher', 'name email');
  }

  async getClassAnalytics(options = {}) {
    const { institutionId, academicYear, groupBy = 'status' } = options;
    const match = this.buildActiveClassQuery({ institutionId, academicYear });

    const groupField = groupBy === 'status' ? '$status' : 
                      groupBy === 'academicYear' ? '$academicYear' :
                      groupBy === 'capacity' ? '$capacity' : '$institutionId';

    const analytics = await Class.aggregate([
      { $match: match },
      { $group: { _id: groupField, count: { $sum: 1 }, totalStudents: { $sum: '$students' } } },
      { $sort: { _id: 1 } }
    ]);

    return analytics;
  }

  async getClassCapacityReport(options = {}) {
    const { institutionId, academicYear, threshold = 80 } = options;
    const match = this.buildActiveClassQuery({ institutionId, academicYear });

    const report = await Class.aggregate([
      { $match: match },
      { $project: { name: 1, section: 1, students: 1, capacity: 1, utilization: { $multiply: [{ $divide: ['$students', '$capacity.maxStudents'] }, 100] } } },
      { $match: { utilization: { $gte: threshold } } }
    ]);

    return report;
  }

  async bulkAssignTeachers(assignments, userId) {
    const results = { successful: 0, failed: 0, errors: [] };
    
    for (const assignment of assignments) {
      try {
        await Class.findByIdAndUpdate(
          assignment.classId,
          { classTeacher: assignment.teacherId, 'metadata.updatedBy': userId },
          { new: true }
        );
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({ classId: assignment.classId, error: error.message });
      }
    }

    return results;
  }

  async bulkDeleteClasses(classIds) {
    const result = await Class.updateMany(
      { _id: { $in: classIds }, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date() }
    );
    return { deletedCount: result.modifiedCount };
  }

  async getClassesByAcademicYear(academicYear, options = {}) {
    const { institutionId, status, page = 1, limit = 20 } = options;
    const query = this.buildActiveClassQuery({ institutionId, academicYear, status });

    const skip = (page - 1) * limit;
    const [classes, total] = await Promise.all([
      Class.find(query).populate('classTeacher', 'name email').skip(skip).limit(limit),
      Class.countDocuments(query)
    ]);

    return { classes, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }

  async getClassEnrollmentTrends(options = {}) {
    const { institutionId, startYear, endYear } = options;
    const match = this.buildActiveClassQuery({ institutionId });
    if (startYear) match.academicYear = { $gte: startYear };
    if (endYear) match.academicYear = { $lte: endYear };

    const trends = await Class.aggregate([
      { $match: match },
      { $group: { _id: '$academicYear', totalStudents: { $sum: '$students' }, totalClasses: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return trends;
  }
}

export default new ClassService();
