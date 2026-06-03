import express from 'express';
import guardianController from '../controllers/guardianController.js';
import * as validators from '../validators/guardianValidators.js';
import { protect } from '../middleware/authMiddleware.js';
import { validationResult } from 'express-validator';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Apply authentication to all routes (TESTED & VERIFIED)
router.use(protect);

// Flat GET / route with query params for superadmin/institution context
router.get('/', async (req, res) => {
  try {
    const Guardian = (await import('../models/Guardian.js')).default;
    const institutionId = req.query.institutionId || req.tenantId || req.user?.institutionId;
    const query = {};
    if (institutionId) {
      query.$or = [
        { institutionId: institutionId },
        { institution: institutionId }
      ];
    }
    const { page = 1, limit = 20, search } = req.query;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [guardians, total] = await Promise.all([
      Guardian.find(query)
        .populate('children.studentId', 'firstName lastName studentId classId section avatar')
        .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Guardian.countDocuments(query)
    ]);
    res.json({
      success: true,
      data: guardians,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch guardians', error: error.message });
  }
});

const mapInstitutionIdParam = (req, _res, next) => {
  req.params.institutionId = req.params.institutionId;
  next();
};

router.get('/institutions/:institutionId', mapInstitutionIdParam, validators.institutionIdValidator, validate, guardianController.getAllGuardians);
router.get('/institutions/:institutionId/stats', mapInstitutionIdParam, validators.institutionIdValidator, validate, guardianController.getGuardianStats);
router.get('/institutions/:institutionId/search', mapInstitutionIdParam, validators.searchValidator, validate, guardianController.searchGuardians);
router.get('/institutions/:institutionId/permission/:permission', mapInstitutionIdParam, validators.permissionValidator, validate, guardianController.getGuardiansWithPermission);
router.get('/institutions/:institutionId/:guardianId', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, guardianController.getGuardianById);
router.get('/institutions/:institutionId/student/:studentId', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.studentIdValidator, validate, guardianController.getGuardiansByStudentId);
router.get('/institutions/:institutionId/student/:studentId/primary', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.studentIdValidator, validate, guardianController.getPrimaryGuardian);
router.get('/institutions/:institutionId/student/:studentId/emergency', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.studentIdValidator, validate, guardianController.getEmergencyContacts);
router.post('/institutions/:institutionId', mapInstitutionIdParam, validators.createGuardianValidator, validate, guardianController.createGuardian);
router.put('/institutions/:institutionId/:guardianId', mapInstitutionIdParam, validators.updateGuardianValidator, validate, guardianController.updateGuardian);
router.delete('/institutions/:institutionId/:guardianId', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, guardianController.deleteGuardian);
router.post('/institutions/:institutionId/:guardianId/children', mapInstitutionIdParam, validators.addChildValidator, validate, guardianController.addChildToGuardian);
router.delete('/institutions/:institutionId/:guardianId/children/:studentId', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, validators.studentIdValidator, validate, guardianController.removeChildFromGuardian);
router.put('/institutions/:institutionId/:guardianId/children/:studentId/relationship', mapInstitutionIdParam, validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, validators.studentIdValidator, validate, guardianController.updateChildRelationship);
router.put('/institutions/:institutionId/:guardianId/permissions', mapInstitutionIdParam, validators.updatePermissionsValidator, validate, guardianController.updateGuardianPermissions);

router.get('/schools/:institutionId', validators.institutionIdValidator, validate, guardianController.getAllGuardians);  
router.get('/schools/:institutionId/stats', validators.institutionIdValidator, validate, guardianController.getGuardianStats);  
router.get('/schools/:institutionId/search', validators.searchValidator, validate, guardianController.searchGuardians);  
router.get('/schools/:institutionId/permission/:permission', validators.permissionValidator, validate, guardianController.getGuardiansWithPermission);  
router.get('/schools/:institutionId/:guardianId', validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, guardianController.getGuardianById);  
router.get('/schools/:institutionId/student/:studentId', validators.institutionIdValidator, validate, validators.studentIdValidator, validate, guardianController.getGuardiansByStudentId);  
router.get('/schools/:institutionId/student/:studentId/primary', validators.institutionIdValidator, validate, validators.studentIdValidator, validate, guardianController.getPrimaryGuardian);  
router.get('/schools/:institutionId/student/:studentId/emergency', validators.institutionIdValidator, validate, validators.studentIdValidator, validate, guardianController.getEmergencyContacts);  
router.post('/schools/:institutionId', validators.createGuardianValidator, validate, guardianController.createGuardian);  
router.put('/schools/:institutionId/:guardianId', validators.updateGuardianValidator, validate, guardianController.updateGuardian);  
router.delete('/schools/:institutionId/:guardianId', validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, guardianController.deleteGuardian);  
router.post('/schools/:institutionId/:guardianId/children', validators.addChildValidator, validate, guardianController.addChildToGuardian);  
router.delete('/schools/:institutionId/:guardianId/children/:studentId', validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, validators.studentIdValidator, validate, guardianController.removeChildFromGuardian);  
router.put('/schools/:institutionId/:guardianId/children/:studentId/relationship', validators.institutionIdValidator, validate, validators.guardianIdValidator, validate, validators.studentIdValidator, validate, guardianController.updateChildRelationship);  
router.put('/schools/:institutionId/:guardianId/permissions', validators.updatePermissionsValidator, validate, guardianController.updateGuardianPermissions);  

export default router;

