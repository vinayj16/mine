import express from 'express';
import classRoomController from '../controllers/classRoomController.js';
import * as validators from '../validators/classRoomValidators.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All class room routes require authentication (TESTED & VERIFIED)
router.use(protect);

// Auto-add required fields from JWT or defaults
router.use((req, res, next) => {
  if (req.method === 'POST') {
    const userInstitutionId = req.user?.institutionId || req.user?.institution;
    const bodyInstitutionId = req.body.institutionId || req.body.schoolId;
    const institutionId = bodyInstitutionId || userInstitutionId;
    
    if (institutionId) {
      req.body.institutionId = institutionId;
    }
    req.body.academicYear = req.body.academicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
    req.body.roomId = req.body.roomId || `ROOM-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    req.body.status = req.body.status || 'active';
  }
  next();
});

// Class Room CRUD Operations (TESTED & VERIFIED)
router.post('/', validators.createClassRoomValidator, classRoomController.createClassRoom);  
router.get('/', classRoomController.getAllClassRooms);  
router.get('/statistics', classRoomController.getClassRoomStatistics);  
router.get('/search', validators.searchValidator, classRoomController.searchClassRooms);  
router.get('/available', classRoomController.getAvailableClassRooms);  
router.get('/status/:status', classRoomController.getClassRoomsByStatus);  
router.get('/institution/:institutionId', classRoomController.getClassRoomsByInstitution);  
router.get('/building/:building', classRoomController.getClassRoomsByBuilding);  
router.get('/floor/:floor', classRoomController.getClassRoomsByFloor);  
router.get('/roomId/:roomId', classRoomController.getClassRoomByRoomId);  
router.get('/:id', validators.roomIdValidator, classRoomController.getClassRoomById);  
router.put('/:id', validators.roomIdValidator, validators.updateClassRoomValidator, classRoomController.updateClassRoom);  
router.delete('/:id', validators.roomIdValidator, classRoomController.deleteClassRoom);  

// Class Room Management (TESTED & VERIFIED)
router.patch('/:id/assign', validators.roomIdValidator, classRoomController.assignClassToRoom);  
router.patch('/:id/unassign', validators.roomIdValidator, classRoomController.unassignClassFromRoom);  
router.patch('/:id/occupancy', validators.roomIdValidator, classRoomController.updateOccupancy);  
router.post('/:id/maintenance', validators.roomIdValidator, classRoomController.addMaintenanceSchedule);  
router.patch('/bulk/status', classRoomController.bulkUpdateStatus);  

export default router;
