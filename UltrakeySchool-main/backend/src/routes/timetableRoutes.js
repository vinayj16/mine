import express from 'express';
import timetableController from '../controllers/classTimetableController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// Authentication middleware for all routes (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations with authorization (TESTED & VERIFIED)
router.post('/',  
  authorize(['admin', 'principal', 'institution_admin', 'teacher']),
  timetableController.createTimetable
);

router.get('/',  
  authorize(['admin', 'principal',   'institution_admin', 'teacher', 'student']),
  timetableController.getTimetables
);

router.get('/:timetableId',  
  authorize(['admin', 'principal',   'institution_admin', 'teacher', 'student']),
  timetableController.getTimetableById
);

router.put('/:timetableId',  
  authorize(['admin', 'principal', 'institution_admin', 'teacher']),
  timetableController.updateTimetable
);

router.delete('/:timetableId',  
  authorize(['admin', 'principal', 'institution_admin', 'teacher']),
  timetableController.deleteTimetable
);

router.post('/:timetableId/periods',  
  authorize(['admin', 'principal', 'institution_admin', 'teacher']),
  timetableController.addPeriod
);

router.delete('/:timetableId/periods/:periodId',  
  authorize(['admin', 'principal', 'institution_admin', 'teacher']),
  timetableController.removePeriod
);

export default router;
