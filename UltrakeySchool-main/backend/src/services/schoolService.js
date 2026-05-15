import School from '../models/School.js';

class SchoolService {
  /**
   * Create a new school
   */
  async createSchool(schoolData) {
    const school = await School.create(schoolData);
    return school;
  }

  /**
   * Get all schools with optional filters
   */
  async getSchools(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    const query = { ...filters };
    const skip = (page - 1) * limit;
    
    const [schools, total] = await Promise.all([
      School.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      School.countDocuments(query)
    ]);

    return {
      schools,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get school by ID
   */
  async getSchoolById(id) {
    const school = await School.findById(id);
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  }

  /**
   * Get school by code
   */
  async getSchoolByCode(code) {
    const school = await School.findOne({ code: code.toUpperCase() });
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  }

  /**
   * Update school
   */
  async updateSchool(id, updates) {
    const school = await School.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  }

  /**
   * Delete school (soft delete)
   */
  async deleteSchool(id) {
    const school = await School.findByIdAndUpdate(
      id,
      { $set: { status: 'inactive' } },
      { new: true }
    );
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  }

  /**
   * Get schools by type
   */
  async getSchoolsByType(type) {
    return await School.find({ type, status: { $ne: 'inactive' } });
  }

  /**
   * Get schools by category
   */
  async getSchoolsByCategory(category) {
    return await School.find({ category, status: { $ne: 'inactive' } });
  }

  /**
   * Get schools by subscription status
   */
  async getSchoolsBySubscriptionStatus(status) {
    return await School.find({ 'subscription.status': status });
  }

  /**
   * Get schools with expiring subscriptions
   */
  async getSchoolsWithExpiringSubscriptions(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return await School.find({
      'subscription.status': 'active',
      'subscription.endDate': { $lte: futureDate, $gt: new Date() }
    });
  }

  /**
   * Search schools by name or email
   */
  async searchSchools(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return await School.find({
      $or: [
        { name: regex },
        { code: regex },
        { 'administration.principalEmail': regex },
        { 'contact.email': regex }
      ],
      status: { $ne: 'inactive' }
    }).limit(limit);
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    const [schools, totalRevenue, monthlyRevenue] = await Promise.all([
      School.find({ status: { $ne: 'inactive' } }),
      School.aggregate([
        { $match: { status: { $ne: 'inactive' } } },
        { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
      ]),
      School.aggregate([
        { $match: { status: { $ne: 'inactive' } } },
        { $group: { _id: null, total: { $sum: '$monthlyRevenue' } } }
      ])
    ]);

    const planDistribution = {};
    const statusDistribution = {};
    const typeDistribution = {};

    schools.forEach(school => {
      planDistribution[school.subscription.planName] = (planDistribution[school.subscription.planName] || 0) + 1;
      statusDistribution[school.subscription.status] = (statusDistribution[school.subscription.status] || 0) + 1;
      typeDistribution[school.type] = (typeDistribution[school.type] || 0) + 1;
    });

    return {
      totalSchools: schools.length,
      totalRevenue: totalRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      averageRevenuePerSchool: schools.length > 0 
        ? (totalRevenue[0]?.total || 0) / schools.length 
        : 0,
      planDistribution,
      statusDistribution,
      typeDistribution,
      activeSubscriptions: schools.filter(s => s.subscription.status === 'active').length,
      expiringSubscriptions: (await this.getSchoolsWithExpiringSubscriptions()).length
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalSchools,
      activeSchools,
      totalStudents,
      totalTeachers,
      expiringSubscriptions,
      activeSubscriptions
    ] = await Promise.all([
      School.countDocuments(),
      School.countDocuments({ status: 'active' }),
      School.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$totalStudents' } } }
      ]),
      School.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$totalTeachers' } } }
      ]),
      this.getSchoolsWithExpiringSubscriptions(),
      School.countDocuments({ 'subscription.status': 'active' })
    ]);

    return {
      totalSchools,
      activeSchools,
      inactiveSchools: totalSchools - activeSchools,
      totalStudents: totalStudents[0]?.total || 0,
      totalTeachers: totalTeachers[0]?.total || 0,
      expiringSubscriptions: expiringSubscriptions.length,
      activeSubscriptions,
      totalRevenue: (await this.getSubscriptionAnalytics()).totalRevenue
    };
  }

  /**
   * Get school performance metrics
   */
  async getSchoolMetrics(schoolId) {
    const school = await this.getSchoolById(schoolId);
    const { performance, facilities, totalStudents, totalTeachers } = school;

    return {
      studentTeacherRatio: totalTeachers > 0 ? totalStudents / totalTeachers : 0,
      classroomUtilization: facilities.classrooms > 0 ? totalStudents / (facilities.classrooms * 25) : 0,
      facilityScore: (
        facilities.classrooms +
        facilities.labs.science +
        facilities.labs.computer +
        facilities.auditoriums * 2 +
        (facilities.library.books > 10000 ? 2 : 1) +
        (facilities.sportsFacilities?.length || 0)
      ) / 10,
      performanceScore: (
        (performance?.academic?.averageGrade || 0) / 20 +
        (performance?.academic?.passPercentage || 0) / 20 +
        (performance?.attendance?.studentAttendance || 0) / 20 +
        (performance?.satisfaction?.studentSatisfaction || 0) +
        (performance?.satisfaction?.parentSatisfaction || 0) +
        (performance?.satisfaction?.teacherSatisfaction || 0)
      ) / 6,
      academicExcellence: (performance?.academic?.averageGrade || 0) >= 85,
      highAttendance: (performance?.attendance?.studentAttendance || 0) >= 90
    };
  }

  /**
   * Update subscription status for expired subscriptions
   */
  async updateExpiredSubscriptions() {
    const expiredSchools = await School.find({
      'subscription.status': 'active',
      'subscription.endDate': { $lt: new Date() }
    });

    for (const school of expiredSchools) {
      school.subscription.status = 'expired';
      school.status = 'expired';
      await school.save();
    }

    return expiredSchools.length;
  }

  /**
   * Get schools by city
   */
  async getSchoolsByCity(city) {
    return await School.find({ 
      'contact.address.city': new RegExp(city, 'i'),
      status: { $ne: 'inactive' }
    });
  }

  /**
   * Get schools by state
   */
  async getSchoolsByState(state) {
    return await School.find({ 
      'contact.address.state': new RegExp(state, 'i'),
      status: { $ne: 'inactive' }
    });
  }

  /**
   * Get schools by accreditation
   */
  async getSchoolsByAccreditation(accreditation) {
    return await School.find({ 
      accreditation: { $in: [accreditation] },
      status: { $ne: 'inactive' }
    });
  }
}

export default new SchoolService();
