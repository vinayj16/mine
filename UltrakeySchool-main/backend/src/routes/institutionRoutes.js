import express from 'express';
import multer from 'multer';
import { authenticate, authorize, optionalAuth } from '../middleware/authMiddleware.js';
import { validateInput as validate } from '../middleware/validation.js';
import institutionController from '../controllers/institutionController.js';
import * as validators from '../validators/institutionValidators.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

// Dashboard and analytics routes (TESTED & VERIFIED)
router.get('/dashboard/stats', institutionController.getDashboardStats);  
router.get('/:institutionId/dashboard/stats', institutionController.getDashboardStatsById);  
router.get('/:institutionId/fees/summary', institutionController.getInstitutionFeesSummary);
router.get('/:institutionId/attendance/summary', institutionController.getInstitutionAttendanceSummary);
router.get('/:institutionId/staff/summary', institutionController.getInstitutionStaffSummary);
router.get('/:institutionId/alerts/summary', institutionController.getInstitutionAlertsSummary);
router.get('/analytics/subscriptions', institutionController.getSubscriptionAnalytics);  
router.get('/analytics/compliance', institutionController.getComplianceStatus);  
router.get('/analytics/revenue', institutionController.getRevenueReport);  

// Institution CRUD operations (TESTED & VERIFIED)
// IMPORTANT: Place specific routes BEFORE parameterized routes
router.get('/working', optionalAuth, async (req, res) => {
  try {
    let { type } = req.query;
    
    if (type) {
      type = decodeURIComponent(type);
    }
    
    const Institution = (await import('../models/Institution.js')).default;
    
    const query = {};
    
    if (type) {
      const typeMap = {
        'School': 'School',
        'Inter College': 'Inter College', 
        'Inter+College': 'Inter College',
        'Degree College': 'Degree College',
        'Degree+College': 'Degree College',
        'Engineering College': 'Engineering College',
        'Engineering+College': 'Engineering College'
      };
      
      const dbType = typeMap[type] || type;
      query.type = dbType;
    }
    
    const institutions = await Institution.find(query).limit(500).lean();

    res.json({
      success: true,
      data: {
        institutions: institutions,
        pagination: {
          total: institutions.length,
          page: 1,
          limit: 500,
          pages: 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        institutions: [],
        pagination: { total: 0 }
      },
      error: error.message
    });
  }
});

router.post('/working', optionalAuth, async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    const institution = await Institution.create(req.body);
    res.status(201).json({
      success: true,
      data: institution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/working/:id', optionalAuth, async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    const institution = await Institution.findById(req.params.id).lean();
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }
    res.json({
      success: true,
      data: institution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/working/:id', optionalAuth, async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    const updateData = { ...req.body };
    
    // Remove immutable / internal fields
    delete updateData._id;
    delete updateData.id;
    delete updateData.__v;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Fetch existing document to merge contact instead of overwriting
    const existing = await Institution.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }

    // Handle contactEmail/contactPhone/website -> contact sub-document merge
    if (updateData.contactEmail !== undefined || updateData.contactPhone !== undefined || updateData.website !== undefined) {
      const existingContact = existing.contact || {};
      updateData.contact = {
        ...existingContact,
        email: updateData.contactEmail !== undefined ? updateData.contactEmail : existingContact.email,
        phone: updateData.contactPhone !== undefined ? updateData.contactPhone : existingContact.phone,
        website: updateData.website !== undefined ? updateData.website : existingContact.website
      };
      delete updateData.contactEmail;
      delete updateData.contactPhone;
      delete updateData.website;
    }

    // Handle address merge into contact.address
    if (updateData.address && typeof updateData.address === 'object') {
      if (updateData.contact) {
        updateData.contact.address = {
          ...(updateData.contact.address || {}),
          ...updateData.address
        };
        delete updateData.address;
      }
    }

    // Handle flat address/city/state/country/pincode -> contact.address merge
    if (typeof updateData.address === 'string' || updateData.city || updateData.state || updateData.country || updateData.postalCode) {
      const existingAddr = existing.contact?.address || {};
      if (!updateData.contact) {
        updateData.contact = { ...(existing.contact || {}), address: { ...existingAddr } };
      }
      if (!updateData.contact.address) {
        updateData.contact.address = { ...existingAddr };
      }
      if (typeof updateData.address === 'string') {
        updateData.contact.address.street = updateData.address;
        delete updateData.address;
      }
      if (updateData.city) {
        updateData.contact.address.city = updateData.city;
        delete updateData.city;
      }
      if (updateData.state) {
        updateData.contact.address.state = updateData.state;
        delete updateData.state;
      }
      if (updateData.country) {
        updateData.contact.address.country = updateData.country;
        delete updateData.country;
      }
      if (updateData.postalCode) {
        updateData.contact.address.postalCode = updateData.postalCode;
        delete updateData.postalCode;
      }
    }

    // Handle empty instituteCode: $unset instead of setting to undefined
    const unsetFields = {};
    if (updateData.instituteCode === '') {
      unsetFields.instituteCode = '';
      delete updateData.instituteCode;
    }

    // Build the update object: $set for fields to update, $unset for fields to remove
    const mongoUpdate = {};
    if (Object.keys(updateData).length > 0) {
      mongoUpdate.$set = updateData;
    }
    if (Object.keys(unsetFields).length > 0) {
      mongoUpdate.$unset = unsetFields;
    }

    if (Object.keys(mongoUpdate).length === 0) {
      return res.json({ success: true, message: 'No changes to apply', data: existing });
    }

    const institution = await Institution.findByIdAndUpdate(
      req.params.id,
      mongoUpdate,
      { new: true, runValidators: false }
    );

    res.json({
      success: true,
      data: institution
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.delete('/working/:id', optionalAuth, async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    const institution = await Institution.findByIdAndDelete(req.params.id);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: 'Institution not found'
      });
    }
    res.json({
      success: true,
      message: 'Institution deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Then simple routes with validator
router.get('/', validators.getInstitutionsValidator, institutionController.getInstitutions);  

// Simple fallback route for impersonate
router.get('/list-all', optionalAuth, async (req, res) => {
  try {
    const Institution = (await import('../models/Institution.js')).default;
    const { type, status, limit } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    const limitNum = parseInt(limit) || 100;
    const institutions = await Institution.find(query)
      .select('name instituteCode type status email phone plan subscriptionExpiry expiryDate monthlyCost currentUsers subscription contact principalName principalEmail principalPhone website address createdAt updatedAt')
      .limit(limitNum)
      .lean();
    res.json({
      success: true,
      data: {
        institutions: institutions,
        pagination: { total: institutions.length, page: 1, limit: limitNum, pages: 1 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});  
// Agent-specific routes (Moved up to avoid being shadowed by /:id)
router.get('/agent', institutionController.getAgentInstitutions);
router.post('/agent', institutionController.createAgentInstitution);
router.get('/agent/:id', institutionController.getInstitutionById);
router.put('/agent/:id', institutionController.updateInstitution);
router.delete('/agent/:id', institutionController.deleteInstitution);

// Public endpoints for institution admin dashboard - no auth required (TESTED & VERIFIED)
router.get('/teachers', optionalAuth, async (req, res) => {  
  try {
    const { institutionId } = req.query;
    institutionId = institutionId || req.tenantId;
    
    const query = {
      $or: [
        { institutionId: institutionId },
        { institution: institutionId }
      ],
      role: 'teacher'
    };
    
    const User = (await import('../models/User.js')).default;
    const teachers = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        totalTeachers: teachers.length,
        activeTeachers: teachers.filter(t => t.status === 'active').length,
        newTeachers: teachers.filter(t => {
          const created = new Date(t.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
        departmentsCount: [...new Set(teachers.map(t => t.department).filter(Boolean))].length,
        recentTeachers: teachers.slice(0, 5),
        teachersByDepartment: teachers.reduce((acc, t) => {
          const dept = t.department || 'Unassigned';
          if (!acc[dept]) acc[dept] = [];
          acc[dept].push(t);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teachers', error: error.message });
  }
});  

router.get('/students', optionalAuth, async (req, res) => {  
  try {
    const { institutionId } = req.query;
    institutionId = institutionId || req.tenantId;
    
    const query = {
      $or: [
        { institutionId: institutionId },
        { institution: institutionId }
      ],
      role: 'student'
    };
    
    const User = (await import('../models/User.js')).default;
    const students = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        newStudents: students.filter(s => {
          const created = new Date(s.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
        graduatedStudents: 0,
        recentStudents: students.slice(0, 5),
        studentsByGrade: students.reduce((acc, s) => {
          const grade = s.class || 'Unassigned';
          if (!acc[grade]) acc[grade] = [];
          acc[grade].push(s);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});  

router.get('/parents', optionalAuth, async (req, res) => {  
  try {
    const { institutionId } = req.query;
    institutionId = institutionId || req.tenantId;
    
    const query = {
      $or: [
        { institutionId: institutionId },
        { institution: institutionId }
      ],
      role: 'parent'
    };
    
    const User = (await import('../models/User.js')).default;
    const parents = await User.find(query).select('-password').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: {
        totalParents: parents.length,
        activeParents: parents.filter(p => p.status === 'active').length,
        recentParents: parents.slice(0, 5),
        parentsByGrade: parents.reduce((acc, p) => {
          const grade = p.class || 'Unassigned';
          if (!acc[grade]) acc[grade] = [];
          acc[grade].push(p);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch parents', error: error.message });
  }
});  

router.get('/finance', optionalAuth, async (req, res) => {  
  try {
    const { institutionId: queryInstitutionId } = req.query;
    const institutionId = queryInstitutionId || req.tenantId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution id is required' });
    }

    const [Invoice, Payment, financeModels] = await Promise.all([
      import('../models/Invoice.js').then((m) => m.default),
      import('../models/Payment.js').then((m) => m.default),
      import('../models/finance.js').then((m) => m)
    ]);
    const { Budget, Salary } = financeModels;

    const tenantQuery = {
      $or: [
        { institutionId },
        { institution: institutionId }
      ]
    };

    const [invoices, payments, budgets, salaries] = await Promise.all([
      Invoice.find(tenantQuery).lean(),
      Payment.find(tenantQuery).lean(),
      Budget.find(tenantQuery).lean(),
      Salary.find(tenantQuery).lean()
    ]);

    const totalIncome = (invoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)) +
      payments.filter((p) => p.type === 'income').reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalExpense = payments.filter((p) => p.type === 'expense').reduce((sum, p) => sum + (p.amount || 0), 0) +
      salaries.reduce((sum, s) => sum + (s.netSalary || 0), 0) +
      budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);

    const pendingFees = invoices.filter((inv) => ['sent', 'overdue', 'pending'].includes(inv.status)).reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

    const recentTransactions = payments
      .sort((a, b) => new Date(b.createdAt || b.processedAt || 0) - new Date(a.createdAt || a.processedAt || 0))
      .slice(0, 10)
      .map((tx) => ({
        id: tx._id,
        amount: tx.amount || 0,
        type: tx.type || 'expense',
        status: tx.status || 'pending',
        date: tx.processedAt || tx.createdAt,
        description: tx.description || tx.reference || ''
      }));

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        pendingFees,
        recentTransactions,
        incomeByCategory: [],
        expenseByCategory: []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch finance data', error: error.message });
  }
});  

// Also add routes at root level for /api/v1/teachers/institution etc (TESTED & VERIFIED)
router.get('/teachers/institution', optionalAuth, async (req, res) => {  
  try {
    const { institutionId } = req.query;
    institutionId = institutionId || req.tenantId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution id is required' });
    }

    const User = (await import('../models/User.js')).default;
    const query = {
      $or: [
        { institutionId },
        { institution: institutionId }
      ],
      role: 'teacher'
    };

    const teachers = await User.find(query)
      .select('firstName lastName email department status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const recentTeachers = teachers.slice(0, 5).map((teacher) => ({
      ...teacher,
      name: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim()
    }));

    res.json({
      success: true,
      data: {
        totalTeachers: teachers.length,
        activeTeachers: teachers.filter((t) => t.status === 'active').length,
        newTeachers: teachers.filter((t) => {
          const created = new Date(t.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
        departmentsCount: [...new Set(teachers.map((t) => t.department).filter(Boolean))].length,
        recentTeachers,
        teachersByDepartment: teachers.reduce((acc, t) => {
          const dept = t.department || 'Unassigned';
          if (!acc[dept]) acc[dept] = [];
          acc[dept].push({
            _id: t._id,
            name: `${t.firstName || ''} ${t.lastName || ''}`.trim(),
            email: t.email,
            status: t.status
          });
          return acc;
        }, {})
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch teachers', error: error.message });
  }
});  

router.get('/students/institution', optionalAuth, async (req, res) => {  
  try {
    const { institutionId: queryInstitutionId, limit = 200 } = req.query;
    const institutionId = queryInstitutionId || req.tenantId;
    if (!institutionId) {
      return res.status(400).json({ success: false, message: 'Institution id is required' });
    }

    const User = (await import('../models/User.js')).default;
    const query = {
      $or: [
        { institutionId },
        { institution: institutionId }
      ],
      role: 'student'
    };

    const students = await User.find(query)
      .select('firstName lastName email admissionNumber rollNumber class status createdAt')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .lean();

    const studentNames = students.map((student) => `${student.firstName || ''} ${student.lastName || ''}`.trim()).filter(Boolean);

    res.json({
      success: true,
      data: {
        totalStudents: students.length,
        activeStudents: students.filter((s) => s.status === 'active').length,
        newStudents: students.filter((s) => {
          const created = new Date(s.createdAt);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created > weekAgo;
        }).length,
        graduatedStudents: students.filter((s) => s.status === 'graduated').length,
        recentStudents: students.slice(0, 5).map((student) => ({
          ...student,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim()
        })),
        studentsByGrade: students.reduce((acc, s) => {
          const grade = s.class || 'Unassigned';
          if (!acc[grade]) acc[grade] = [];
          acc[grade].push({
            _id: s._id,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim(),
            rollNumber: s.rollNumber,
            email: s.email
          });
          return acc;
        }, {}),
        studentNames,
        students
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch students', error: error.message });
  }
});  

router.get('/my', authenticate, institutionController.getMyInstitution);

router.get('/:id', institutionController.getInstitutionById);  

// Institution logo upload
router.post('/:id/logo', authenticate, upload.single('logo'), institutionController.uploadLogo);

// Institution settings sub-resources (for frontend InstitutionSettingsPage)
const SETTING_TYPES = ['modules', 'profile', 'security', 'notifications', 'localization', 'email-config', 'sms-config', 'payment-gateway', 'tax-settings', 'storage'];
SETTING_TYPES.forEach(type => {
  router.get(`/:id/${type}`, (req, res, next) => { req.settingType = type; next(); }, institutionController.getSetting);
  router.put(`/:id/${type}`, (req, res, next) => { req.settingType = type; next(); }, institutionController.updateSetting);
});

// Export router
export default router;
