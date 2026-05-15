import express from 'express';
import timetableController from '../controllers/classTimetableController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';

const router = express.Router();

// Authentication middleware for all routes (TESTED & VERIFIED)
router.use(protect);  

// CRUD Operations with authorization (TESTED & VERIFIED)
router.post('/',  
  authorize(['admin', 'principal',   'institution_admin']),
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
  authorize(['admin', 'principal', 'institution_admin']),
  timetableController.updateTimetable
);

router.delete('/:timetableId',  
  authorize(['admin', 'principal', 'institution_admin']),
  timetableController.deleteTimetable
);

export default router;
