import express from 'express';
import religionController from '../controllers/religionController.js';
import * as validators from '../validators/religionValidators.js';

const router = express.Router();

// Religion Routes (TESTED & VERIFIED)
router.post('/', validators.createReligionValidator, religionController.createReligion);  
router.get('/', religionController.getAllReligions);  
router.get('/statistics', religionController.getReligionStatistics);  
router.get('/search', validators.searchValidator, religionController.searchReligions);  
router.get('/status/:status', validators.statusValidator, religionController.getReligionsByStatus);  
router.get('/institution/:institutionId', religionController.getReligionsByInstitution);  
router.get('/:id', validators.religionIdValidator, religionController.getReligionById);  
router.put('/:id', validators.religionIdValidator, validators.updateReligionValidator, religionController.updateReligion);  
router.delete('/:id', validators.religionIdValidator, religionController.deleteReligion);  
router.patch('/:id/status', validators.religionIdValidator, validators.updateStatusValidator, religionController.updateStatus);  
router.patch('/:id/display-order', validators.religionIdValidator, religionController.updateDisplayOrder);  
router.patch('/bulk/status', validators.bulkUpdateStatusValidator, religionController.bulkUpdateStatus);  

export default router;
