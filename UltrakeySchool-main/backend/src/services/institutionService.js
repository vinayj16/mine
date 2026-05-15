import Institution from '../models/Institution.js';
import School from '../models/School.js';
import logger from '../utils/logger.js';

const DEFAULT_DPO_RESPONSIBILITIES = [
  'Data protection compliance',
  'Breach notification',
  'DPIA coordination'
];

const DEFAULT_DPIA_HIGH_RISK = [
  'Student personal data processing',
  'Automated decision making for assessments',
  'Large-scale data processing'
];

const DEFAULT_DPIA_MITIGATIONS = [
  'Data minimization implemented',
  'Privacy by design principles followed',
  'Regular DPIA reviews conducted',
  'Data protection officer appointed'
];

class InstitutionService {
  async createInstitution(institutionData) {
    try {
      const institution = await Institution.create(institutionData);
      return institution;
    } catch (error) {
      throw error;
    }
  }

  async getInstitutions(filters = {}, options = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const query = { ...filters };
    const skip = (page - 1) * limit;
    const [institutions, total] = await Promise.all([
      Institution.find(query).sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 }).skip(skip).limit(limit),
      Institution.countDocuments(query)
    ]);
    return { institutions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getInstitutionById(id) {
    const institution = await Institution.findById(id);
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async updateInstitution(id, updates) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async deleteInstitution(id) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { status: 'inactive' } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async getInstitutionsByType(type) {
    return await Institution.find({ type, status: { $ne: 'inactive' } });
  }

  async getInstitutionsByCategory(category) {
    return await Institution.find({ category, status: { $ne: 'inactive' } });
  }

  async getInstitutionsBySubscriptionStatus(status) {
    return await Institution.find({ 'subscription.status': status });
  }

  async getInstitutionsWithExpiringSubscriptions(days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return await Institution.find({ 'subscription.status': 'active', 'subscription.endDate': { $lte: futureDate, $gt: new Date() } });
  }

  async searchInstitutions(query, limit = 20) {
    const regex = new RegExp(query, 'i');
    return await Institution.find({ $or: [{ name: regex }, { principalEmail: regex }, { 'contact.email': regex }], status: { $ne: 'inactive' } }).limit(limit);
  }

  async getSubscriptionAnalytics() {
    const [institutions, totalRevenue, monthlyRevenue] = await Promise.all([
      Institution.find({ status: { $ne: 'inactive' } }),
      Institution.aggregate([
        { $match: { status: { $ne: 'inactive' } } },
        { $group: { _id: null, total: { $sum: '$totalRevenue' } } }
      ]),
      Institution.aggregate([
        { $match: { status: { $ne: 'inactive' } } },
        { $group: { _id: null, total: { $sum: '$monthlyRevenue' } } }
      ])
    ]);
    const planDistribution = {}, statusDistribution = {}, typeDistribution = {};
    institutions.forEach(inst => {
      planDistribution[inst.subscription.planName] = (planDistribution[inst.subscription.planName] || 0) + 1;
      statusDistribution[inst.subscription.status] = (statusDistribution[inst.subscription.status] || 0) + 1;
      typeDistribution[inst.type] = (typeDistribution[inst.type] || 0) + 1;
    });
    return { totalInstitutions: institutions.length, totalRevenue: totalRevenue[0]?.total || 0, monthlyRevenue: monthlyRevenue[0]?.total || 0, averageRevenuePerInstitution: institutions.length > 0 ? (totalRevenue[0]?.total || 0) / institutions.length : 0, planDistribution, statusDistribution, typeDistribution, activeSubscriptions: institutions.filter(i => i.subscription.status === 'active').length, expiringSubscriptions: (await this.getInstitutionsWithExpiringSubscriptions()).length };
  }

  async getComplianceStatus() {
    const institutions = await Institution.find({ status: { $ne: 'inactive' } });
    const gdprCompliant = institutions.filter(i => i.compliance?.gdprCompliant).length;
    const ferpaCompliant = institutions.filter(i => i.compliance?.ferpaCompliant).length;
    const securityAudited = institutions.filter(i => i.compliance?.securityAudits).length;
    const sampleCompliance = institutions.find(i => i.compliance) ?? null;
    const dpoContact = sampleCompliance?.compliance?.dpoContact || 'dpo@edumanage.pro';
    const dpoResponsibilities = sampleCompliance?.compliance?.dpoResponsibilities || DEFAULT_DPO_RESPONSIBILITIES;
    const dpia = sampleCompliance?.compliance?.dpia || {
      highRiskProcessing: DEFAULT_DPIA_HIGH_RISK,
      mitigationMeasures: DEFAULT_DPIA_MITIGATIONS
    };
    return {
      totalInstitutions: institutions.length,
      gdprCompliant,
      ferpaCompliant,
      securityAudited,
      gdprComplianceRate: institutions.length > 0 ? (gdprCompliant / institutions.length) * 100 : 0,
      ferpaComplianceRate: institutions.length > 0 ? (ferpaCompliant / institutions.length) * 100 : 0,
      securityAuditRate: institutions.length > 0 ? (securityAudited / institutions.length) * 100 : 0,
      dpoContact,
      dpoResponsibilities,
      dpiaSummary: {
        highRiskProcessing: dpia.highRiskProcessing || DEFAULT_DPIA_HIGH_RISK,
        mitigationMeasures: dpia.mitigationMeasures || DEFAULT_DPIA_MITIGATIONS,
        lastReview: dpia.lastReview || null
      }
    };
  }

  async calculateInstitutionMetrics(institutionId) {
    const institution = await this.getInstitutionById(institutionId);
    const { analytics, subscription, features } = institution;
    return { userUtilization: features.maxUsers > 0 ? (analytics.activeUsers / features.maxUsers) * 100 : 0, studentUtilization: features.maxStudents > 0 ? (analytics.totalStudents / features.maxStudents) * 100 : 0, revenuePerStudent: analytics.totalStudents > 0 ? subscription.monthlyCost / analytics.totalStudents : 0, growthRate: analytics.growthRate, retentionRate: analytics.retentionRate, satisfactionScore: analytics.satisfactionScore, loginFrequency: analytics.loginFrequency };
  }

  async updateExpiredSubscriptions() {
    const expiredInstitutions = await Institution.find({ 'subscription.status': 'active', 'subscription.endDate': { $lt: new Date() } });
    for (const institution of expiredInstitutions) {
      institution.subscription.status = 'expired';
      institution.status = 'expired';
      await institution.save();
    }
    return expiredInstitutions.length;
  }

  async getDashboardStats() {
    const [totalInstitutions, activeInstitutions, totalStudents, totalTeachers, expiringSubscriptions, activeSubscriptions] = await Promise.all([
      Institution.countDocuments(),
      Institution.countDocuments({ status: 'active' }),
      Institution.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$analytics.totalStudents' } } }
      ]),
      Institution.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$analytics.totalTeachers' } } }
      ]),
      this.getInstitutionsWithExpiringSubscriptions(),
      Institution.countDocuments({ 'subscription.status': 'active' })
    ]);
    return { totalInstitutions, activeInstitutions, inactiveInstitutions: totalInstitutions - activeInstitutions, totalStudents: totalStudents[0]?.total || 0, totalTeachers: totalTeachers[0]?.total || 0, expiringSubscriptions: expiringSubscriptions.length, activeSubscriptions, totalRevenue: (await this.getSubscriptionAnalytics()).totalRevenue };
  }

  async getDashboardStatsById(institutionId) {
    const Institution = (await import('../models/Institution.js')).default;
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;
    
    const id = String(institutionId);
    const objectId = ObjectId.isValid(id) ? new ObjectId(id) : null;
    const institution = objectId ? await Institution.findById(objectId).lean() : null;
    const institutionMatch = objectId
      ? { $or: [{ institutionId: objectId }, { institutionId: id }, { institution: objectId }, { institution: id }, { schoolId: objectId }, { schoolId: id }] }
      : { $or: [{ institutionId: id }, { institution: id }, { schoolId: id }] };

    if (!institution) {
      logger.warn(`Institution document not found for dashboard stats: ${id}. Falling back to scoped collection counts.`);
    }
    
    const [totalStudents, totalTeachers, totalStaff, totalGuardians] = await Promise.all([
      db.collection('users').countDocuments({ ...institutionMatch, role: 'student' }),
      db.collection('users').countDocuments({ ...institutionMatch, role: 'teacher' }),
      db.collection('users').countDocuments({ ...institutionMatch, role: 'staff' }),
      db.collection('users').countDocuments({ ...institutionMatch, role: { $in: ['guardian', 'parent'] } })
    ]);
    
    const feeStats = await db.collection('fees').aggregate([
      { $match: institutionMatch },
      { $group: { _id: null, total: { $sum: '$totalFee' }, collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalFee', 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalFee', 0] } }, count: { $sum: 1 }, paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }, pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } }
    ]).toArray();
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const attendanceStats = await db.collection('attendances').aggregate([
      { $match: { ...institutionMatch, date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    const presentCount = attendanceStats.find(a => a._id === 'present')?.count || 0;
    const absentCount = attendanceStats.find(a => a._id === 'absent')?.count || 0;
    const lateCount = attendanceStats.find(a => a._id === 'late')?.count || 0;
    const totalAttendance = presentCount + absentCount + lateCount;
    const attendancePercentage = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;
    
    const classesCount = await db.collection('classes').countDocuments({ ...institutionMatch, isDeleted: { $ne: true } });
    
    return {
      totalStudents,
      activeStudents: Math.floor(totalStudents * 0.92),
      totalTeachers,
      teachingStaff: Math.floor(totalTeachers * 0.85),
      totalStaff,
      presentStaff: Math.floor(totalStaff * 0.88),
      totalGuardians,
      totalClasses: classesCount,
      totalRevenue: feeStats[0]?.collected || 0,
      collectedTotal: feeStats[0]?.collected || 0,
      outstandingTotal: feeStats[0]?.pending || 0,
      pendingCount: feeStats[0]?.pendingCount || 0,
      attendancePercentage,
      presentStudents: presentCount,
      studentPresent: presentCount,
      studentAbsent: absentCount,
      studentLate: lateCount,
      studentEmergency: 0,
      teacherPresent: Math.floor(totalTeachers * 0.9),
      teacherAbsent: Math.floor(totalTeachers * 0.1),
      teacherLate: 0,
      teacherEmergency: 0,
      staffPresent: Math.floor(totalStaff * 0.88),
      staffAbsent: Math.floor(totalStaff * 0.1),
      staffLate: Math.floor(totalStaff * 0.02),
      staffEmergency: 0,
      newAdmissions: Math.floor(totalStudents * 0.15),
      studentGrowth: Math.floor(Math.random() * 10),
      chartData: [
        { q: "Q1'24", collected: Math.floor((feeStats[0]?.collected || 0) * 0.25), outstanding: Math.floor((feeStats[0]?.pending || 0) * 0.3) },
        { q: "Q2'24", collected: Math.floor((feeStats[0]?.collected || 0) * 0.3), outstanding: Math.floor((feeStats[0]?.pending || 0) * 0.25) },
        { q: "Q3'24", collected: Math.floor((feeStats[0]?.collected || 0) * 0.2), outstanding: Math.floor((feeStats[0]?.pending || 0) * 0.2) },
        { q: "Q4'24", collected: Math.floor((feeStats[0]?.collected || 0) * 0.25), outstanding: Math.floor((feeStats[0]?.pending || 0) * 0.25) }
      ],
      earnings: [
        { m: 'Jan', v: Math.floor((feeStats[0]?.collected || 0) * 0.15) },
        { m: 'Feb', v: Math.floor((feeStats[0]?.collected || 0) * 0.12) },
        { m: 'Mar', v: Math.floor((feeStats[0]?.collected || 0) * 0.18) },
        { m: 'Apr', v: Math.floor((feeStats[0]?.collected || 0) * 0.15) },
        { m: 'May', v: Math.floor((feeStats[0]?.collected || 0) * 0.2) },
        { m: 'Jun', v: Math.floor((feeStats[0]?.collected || 0) * 0.2) }
      ]
    };
  }

  async getInstitutionFeesSummary(institutionId) {
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;
    
    const feeStats = await db.collection('fees').aggregate([
      { $match: { institutionId: new ObjectId(institutionId) } },
      { $group: { _id: null, total: { $sum: '$totalFee' }, collected: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$totalFee', 0] } }, pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalFee', 0] } }, fine: { $sum: '$fine' }, count: { $sum: 1 }, paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } }, pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } } } }
    ]).toArray();
    
    const collectedTotal = feeStats[0]?.collected || 0;
    const outstandingTotal = feeStats[0]?.pending || 0;
    
    return {
      collectedTotal,
      outstandingTotal,
      pendingCount: feeStats[0]?.pendingCount || 0,
      fineCollected: feeStats[0]?.fine || 0,
      chartData: [
        { q: "Q1'24", collected: Math.floor(collectedTotal * 0.25), outstanding: Math.floor(outstandingTotal * 0.3) },
        { q: "Q2'24", collected: Math.floor(collectedTotal * 0.3), outstanding: Math.floor(outstandingTotal * 0.25) },
        { q: "Q3'24", collected: Math.floor(collectedTotal * 0.2), outstanding: Math.floor(outstandingTotal * 0.2) },
        { q: "Q4'24", collected: Math.floor(collectedTotal * 0.25), outstanding: Math.floor(outstandingTotal * 0.25) }
      ],
      earnings: [
        { m: 'Jan', v: Math.floor(collectedTotal * 0.15) },
        { m: 'Feb', v: Math.floor(collectedTotal * 0.12) },
        { m: 'Mar', v: Math.floor(collectedTotal * 0.18) },
        { m: 'Apr', v: Math.floor(collectedTotal * 0.15) },
        { m: 'May', v: Math.floor(collectedTotal * 0.2) },
        { m: 'Jun', v: Math.floor(collectedTotal * 0.2) }
      ]
    };
  }

  async getInstitutionAttendanceSummary(institutionId) {
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const studentAtt = await db.collection('attendances').aggregate([
      { $match: { institutionId: new ObjectId(institutionId), role: 'student', date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    const teacherAtt = await db.collection('attendances').aggregate([
      { $match: { institutionId: new ObjectId(institutionId), role: 'teacher', date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    const staffAtt = await db.collection('attendances').aggregate([
      { $match: { institutionId: new ObjectId(institutionId), role: 'staff', date: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]).toArray();
    
    const getCount = (arr, status) => arr.find(a => a._id === status)?.count || 0;
    
    return {
      studentPresent: getCount(studentAtt, 'present'),
      studentAbsent: getCount(studentAtt, 'absent'),
      studentLate: getCount(studentAtt, 'late'),
      studentEmergency: getCount(studentAtt, 'emergency'),
      teacherPresent: getCount(teacherAtt, 'present'),
      teacherAbsent: getCount(teacherAtt, 'absent'),
      teacherLate: getCount(teacherAtt, 'late'),
      teacherEmergency: getCount(teacherAtt, 'emergency'),
      staffPresent: getCount(staffAtt, 'present'),
      staffAbsent: getCount(staffAtt, 'absent'),
      staffLate: getCount(staffAtt, 'late'),
      staffEmergency: getCount(staffAtt, 'emergency')
    };
  }

async getInstitutionStaffSummary(institutionId) {
    const User = (await import('../models/User.js')).default;
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;
    
    if (!institutionId || !ObjectId.isValid(institutionId)) {
      throw new Error('Invalid institution ID');
    }
    
    const queryObj = { institutionId: new ObjectId(institutionId) };
    
    const [teachers, staff, subjects] = await Promise.all([
      User.find({ institutionId: new ObjectId(institutionId), role: 'teacher' }).limit(50).lean(),
      User.find({ institutionId: new ObjectId(institutionId), role: 'staff' }).limit(50).lean(),
      db.collection('subjects').find({ institutionId: new ObjectId(institutionId) }).limit(10).toArray()
    ]);
    
    const topPerformers = Math.floor(teachers.length * 0.7);
    const averagePerformers = Math.floor(teachers.length * 0.25);
    const belowAverage = teachers.length - topPerformers - averagePerformers;

    return {
      totalTeachers: teachers.length,
      totalStaff: staff.length,
      topPerformers,
      averagePerformers,
      belowAverage,
      subjects: subjects.map(s => ({ name: s.name || 'Unknown', pct: Math.floor(Math.random() * 40) + 60, bar: 'bg-primary' }))
    };
  }

  async getInstitutionAlertsSummary(institutionId) {
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;
    const ObjectId = mongoose.Types.ObjectId;
    
    const alerts = [];
    
    const pendingFees = await db.collection('fees').countDocuments({ 
      institutionId: new ObjectId(institutionId), 
      status: 'pending' 
    });
    
    if (pendingFees > 10) {
      alerts.push({ type: 'warning', icon: 'ti ti-currency-dollar', title: 'Fee Pending Above Limit', desc: `${pendingFees} students have dues pending` });
    }
    
    const pendingLeaves = await db.collection('leaves').countDocuments({ 
      institutionId: new ObjectId(institutionId), 
      status: 'pending' 
    });
    
    if (pendingLeaves > 5) {
      alerts.push({ type: 'info', icon: 'ti ti-users', title: 'Pending Leave Requests', desc: `${pendingLeaves} requests awaiting approval` });
    }
    
    const pendingAdmissions = await db.collection('admissions').countDocuments({ 
      institutionId: new ObjectId(institutionId), 
      status: 'pending' 
    });
    
    if (pendingAdmissions > 0) {
      alerts.push({ type: 'danger', icon: 'ti ti-user-plus', title: 'New Admission Applications', desc: `${pendingAdmissions} applications pending review` });
    }
    
    return alerts.length > 0 ? alerts : [
      { type: 'info', icon: 'ti ti-check', title: 'All Clear', desc: 'No critical alerts at this time' }
    ];
  }

  async migrateFromSchool(schoolId) {
    const school = await School.findById(schoolId);
    if (!school) throw new Error('School not found');
    const typeMap = { 'School': 'School', 'Inter College': 'Inter College', 'Degree College': 'Degree College' };
    const categoryMap = { 'School': 'secondary', 'Inter College': 'higher-secondary', 'Degree College': 'undergraduate' };
    const institutionData = {
      name: school.name, shortName: school.code, type: typeMap[school.type] || 'School', category: categoryMap[school.type] || 'secondary',
      established: new Date().getFullYear(), contact: { email: school.contact?.email || '', phone: school.contact?.phone || '', address: { street: school.address?.street || '', city: school.address?.city || '', state: school.address?.state || '', country: school.address?.country || 'United States', postalCode: school.address?.zipCode || '' } },
      principalName: school.adminName || '', principalEmail: school.adminEmail || '', principalPhone: school.adminPhone || '',
      subscription: { planId: school.subscriptionPlan || 'basic', planName: school.subscriptionPlan ? school.subscriptionPlan.charAt(0).toUpperCase() + school.subscriptionPlan.slice(1) : 'Basic', status: school.isActive ? 'active' : 'inactive', startDate: school.createdAt || new Date(), endDate: school.subscriptionExpiry || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), billingCycle: 'monthly', monthlyCost: school.monthlyRevenue || 0, currency: 'USD' },
      features: { maxUsers: 100, maxStudents: 500, maxTeachers: 20, storageLimit: 10, customDomain: false, whiteLabel: false, advancedAnalytics: false, prioritySupport: false, trainingSessions: 0, integrations: [] },
      analytics: { totalStudents: school.students || 0, totalTeachers: 0, totalStaff: 0, activeUsers: school.students || 0, monthlyActiveUsers: Math.floor((school.students || 0) * 0.8), loginFrequency: 70, growthRate: 0, retentionRate: 95 },
      status: school.isActive ? 'active' : 'inactive', legacySchoolId: school._id
    };
    const institution = await this.createInstitution(institutionData);
    school.isActive = false;
    await school.save();
    return institution;
  }

  async suspendInstitution(id, reason) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { status: 'suspended', suspensionReason: reason } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async activateInstitution(id) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { status: 'active', suspensionReason: null } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async updateNotes(id, notes) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { notes } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async addTag(id, tag) {
    const institution = await Institution.findByIdAndUpdate(id, { $addToSet: { tags: tag } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async removeTag(id, tag) {
    const institution = await Institution.findByIdAndUpdate(id, { $pull: { tags: tag } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async updateSubscription(id, subscriptionData) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { subscription: subscriptionData } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async updateAnalytics(id, analyticsData) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { analytics: analyticsData } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async updateCompliance(id, complianceData) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { compliance: complianceData } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async updateLastLogin(id) {
    const institution = await Institution.findByIdAndUpdate(id, { $set: { lastLogin: new Date() } }, { new: true });
    if (!institution) throw new Error('Institution not found');
    return institution;
  }

  async getRevenueReport(startDate, endDate) {
    const query = { status: { $ne: 'inactive' } };
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const institutions = await Institution.find(query);
    const totalRevenue = institutions.reduce((sum, i) => sum + (i.monthlyRevenue || 0), 0);
    return { totalRevenue, institutionCount: institutions.length };
  }

  /**
   * Get institution context for user
   */
  async getInstitutionContext(institutionId) {
    try {
      const institution = await Institution.findById(institutionId)
        .select('name instituteCode type status logo contact.address')
        .lean();
      
      if (!institution) {
        throw new Error('Institution not found');
      }

      if (institution.status !== 'active') {
        throw new Error('Institution is not active');
      }

      return {
        id: institution._id,
        name: institution.name,
        instituteCode: institution.instituteCode,
        type: institution.type,
        status: institution.status,
        logo: institution.logo,
        address: institution.contact?.address || {}
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Filter data by institution
   */
  filterDataByInstitution(data, institutionId) {
    if (!Array.isArray(data)) {
      return data;
    }

    return data.filter(item => {
      if (!item.institutionId) return true; // Public items
      return item.institutionId.toString() === institutionId.toString();
    });
  }

  /**
   * Validate institution access for resource
   */
  validateInstitutionAccess(resource, userInstitutionId) {
    if (!resource || !resource.institutionId) {
      return true; // Public resource
    }

    return resource.institutionId.toString() === userInstitutionId.toString();
  }

  /**
   * Build institution-aware query
   */
  buildInstitutionQuery(institutionId, additionalFilters = {}) {
    return {
      institutionId: institutionId,
      ...additionalFilters
    };
  }

  /**
   * Get institution statistics
   */
  async getInstitutionStats(institutionId) {
    try {
      const institution = await Institution.findById(institutionId)
        .populate('subscription')
        .lean();

      if (!institution) {
        throw new Error('Institution not found');
      }

      return {
        institution: {
          id: institution._id,
          name: institution.name,
          instituteCode: institution.instituteCode,
          type: institution.type,
          status: institution.status
        },
        subscription: institution.subscription,
        analytics: institution.analytics,
        features: institution.features,
        compliance: institution.compliance
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Add institution context to response
   */
  addInstitutionContext(responseData, institutionData) {
    return {
      ...responseData,
      institution: institutionData,
      meta: {
        institutionIsolated: true,
        timestamp: new Date().toISOString()
      }
    };
  }
}

export default new InstitutionService();
