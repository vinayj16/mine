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

router.get('/schools/:schoolId', validators.schoolIdValidator, validate, guardianController.getAllGuardians);  
router.get('/schools/:schoolId/stats', validators.schoolIdValidator, validate, guardianController.getGuardianStats);  
router.get('/schools/:schoolId/search', validators.searchValidator, validate, guardianController.searchGuardians);  
router.get('/schools/:schoolId/permission/:permission', validators.permissionValidator, validate, guardianController.getGuardiansWithPermission);  
router.get('/schools/:schoolId/:guardianId', validators.schoolIdValidator, validate, validators.guardianIdValidator, validate, guardianController.getGuardianById);  
router.get('/schools/:schoolId/student/:studentId', validators.schoolIdValidator, validate, validators.studentIdValidator, validate, guardianController.getGuardiansByStudentId);  
router.get('/schools/:schoolId/student/:studentId/primary', validators.schoolIdValidator, validate, validators.studentIdValidator, validate, guardianController.getPrimaryGuardian);  
router.get('/schools/:schoolId/student/:studentId/emergency', validators.schoolIdValidator, validate, validators.studentIdValidator, validate, guardianController.getEmergencyContacts);  
router.post('/schools/:schoolId', validators.createGuardianValidator, validate, guardianController.createGuardian);  
router.put('/schools/:schoolId/:guardianId', validators.updateGuardianValidator, validate, guardianController.updateGuardian);  
router.delete('/schools/:schoolId/:guardianId', validators.schoolIdValidator, validate, validators.guardianIdValidator, validate, guardianController.deleteGuardian);  
router.post('/schools/:schoolId/:guardianId/children', validators.addChildValidator, validate, guardianController.addChildToGuardian);  
router.delete('/schools/:schoolId/:guardianId/children/:studentId', validators.schoolIdValidator, validate, validators.guardianIdValidator, validate, validators.studentIdValidator, validate, guardianController.removeChildFromGuardian);  
router.put('/schools/:schoolId/:guardianId/children/:studentId/relationship', validators.schoolIdValidator, validate, validators.guardianIdValidator, validate, validators.studentIdValidator, validate, guardianController.updateChildRelationship);  
router.put('/schools/:schoolId/:guardianId/permissions', validators.updatePermissionsValidator, validate, guardianController.updateGuardianPermissions);  

export default router;
