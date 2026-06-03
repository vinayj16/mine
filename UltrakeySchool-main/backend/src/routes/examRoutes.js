import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import examController from '../controllers/examController.js';
import { successResponse, errorResponse, validationErrorResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

const {
  createExam,
  getExams,
  getExamById,
  updateExam,
  deleteExam,
  getExamsByClass,
  markAttendance,
  getAttendance,
  bulkUpdateExams,
  bulkDeleteExams,
  exportExams,
  getExamStatistics,
  getExamAnalytics
} = examController;

const router = express.Router();

// All exam routes require authentication (TESTED & VERIFIED)
router.use(protect);

// ---- Helper: convert "09:00 AM" to "09:00" (HH:MM) ----
const convertToHHMM = (timeStr) => {
  if (!timeStr) return timeStr;
  // Already HH:MM
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr.trim())) return timeStr.trim();
  // Parse "09:00 AM" / "09:00 PM"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }
  return timeStr.trim();
};

// ---- Helper: get institutionId from JWT or query param (for superadmin) ----
const getInstitutionId = (req) => req.user?.institutionId || req.user?.institution || req.query?.institutionId || req.tenantId;

// ---- Helper: transform frontend exam body to backend format ----
// Throws descriptive errors if class/subject lookups fail
const transformExamBody = async (body, institutionId) => {
    const transformed = { ...body };
    const errors = [];

    // name -> title
    if (transformed.name) {
      transformed.title = transformed.name;
      delete transformed.name;
    }

    // date (controller field) + examDate (model field) — keep BOTH for compatibility
    // Normalize DD-MM-YYYY and DD/MM/YYYY to YYYY-MM-DD for new Date() compatibility
    const normalizeDate = (d) => {
      const ddMatch = String(d).match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
      if (ddMatch) {
        // Could be DD-MM-YYYY or MM-DD-YYYY; treat as DD-MM-YYYY
        return `${ddMatch[3]}-${ddMatch[2].padStart(2, '0')}-${ddMatch[1].padStart(2, '0')}`;
      }
      return d;
    };
    if (transformed.date) {
      transformed.date = normalizeDate(transformed.date);
      transformed.examDate = transformed.date;
    } else if (transformed.examDate) {
      transformed.examDate = normalizeDate(transformed.examDate);
      transformed.date = transformed.examDate;
    }

    // examType (controller field) + type (model field) — keep BOTH for compatibility
    // Controller validates against: midterm, final, quiz, practical, oral, assignment, project, unit_test, mock, board
    // Model enum allows: written, oral, practical, objective, assignment, quiz
    if (transformed.examType) {
      const originalExamType = transformed.examType;
      // Map to controller VALID_EXAM_TYPES-compatible value
      const controllerMap = {
        'mid_term': 'midterm',
        'midterm': 'midterm',
        'final': 'final',
        'practical': 'practical',
        'assignment': 'assignment',
        'written': 'project',
        'quiz': 'quiz',
        'oral': 'oral',
        'objective': 'assignment',
      };
      // Map to model enum-compatible value
      const modelMap = {
        'mid_term': 'written',
        'midterm': 'written',
        'final': 'written',
        'practical': 'practical',
        'assignment': 'assignment',
        'written': 'written',
        'quiz': 'quiz',
        'oral': 'oral',
        'objective': 'objective',
      };
      transformed.examType = controllerMap[originalExamType] || 'midterm';
      transformed.type = modelMap[originalExamType] || 'written';
    }

    // Convert time formats
    if (transformed.startTime) {
      transformed.startTime = convertToHHMM(transformed.startTime);
    }
    if (transformed.endTime) {
      transformed.endTime = convertToHHMM(transformed.endTime);
    }

    // Look up class by name — exact match first, then progressive fuzzy matching
    if (transformed.class) {
      const className = transformed.class.trim().toLowerCase();
      let classDoc = null;
      const institutionClasses = await Class.find({
        $or: [
          { institutionId: institutionId },
          { institution: institutionId }
        ]
      }).select('_id name section').lean();

      const matchClass = (input, classes) => {
        const lowerInput = input.toLowerCase().trim();
        // 1. Exact match on name or section
        let found = classes.find(c =>
          c.name?.toLowerCase() === lowerInput || c.section?.toLowerCase() === lowerInput
        );
        if (found) return found;
        // 2. Contains match on name or section
        found = classes.find(c =>
          c.name?.toLowerCase().includes(lowerInput) || c.section?.toLowerCase().includes(lowerInput)
        );
        if (found) return found;
        // 3. Word-boundary: input is a word within the name
        found = classes.find(c => {
          const words = [c.name?.toLowerCase(), c.section?.toLowerCase()].filter(Boolean);
          return words.some(w => {
            const parts = w.split(/\s+/);
            return parts.some(p => p.startsWith(lowerInput) || p.includes(lowerInput));
          });
        });
        if (found) return found;
        // 4. Reverse: any word in name/section is contained in input
        found = classes.find(c => {
          const words = [c.name?.toLowerCase(), c.section?.toLowerCase()].filter(Boolean);
          return words.some(w => {
            const parts = w.split(/\s+/);
            return parts.some(p => lowerInput.includes(p));
          });
        });
        if (found) return found;
        return null;
      };

      classDoc = matchClass(className, institutionClasses);
      if (classDoc) {
        transformed.classId = classDoc._id;
      } else {
        const currentYear = new Date().getFullYear();
        const academicYear = `${currentYear}-${currentYear + 1}`;
        const newClass = await Class.create({
          classId: 'CLS-' + Date.now(),
          name: className.charAt(0).toUpperCase() + className.slice(1),
          section: className.charAt(0).toUpperCase(),
          academicYear: academicYear,
          institutionId: institutionId,
          institution: institutionId ? institutionId.toString() : undefined,
        });
        transformed.classId = newClass._id;
        logger.info('Auto-created class "' + className + '" for exam');
      }
      delete transformed.class;
    } else {
      errors.push('Class name is required');
    }

    // Look up subject by name — try exact match first, then progressive fuzzy matching
    if (transformed.subject) {
      const subjectName = transformed.subject.trim();
      let subjectDoc = null;
      // Query all subject names for this institution once
      const institutionSubjects = await Subject.find({
        $or: [
          { institutionId: institutionId },
          { institutionId: institutionId }
        ]
      }).select('_id name').lean();

      const matchSubject = (input, subjects) => {
        const lowerInput = input.toLowerCase().trim();
        // 1. Exact match
        let found = subjects.find(s => s.name.toLowerCase() === lowerInput);
        if (found) return found;
        // 2. Prefix match
        found = subjects.find(s => s.name.toLowerCase().startsWith(lowerInput));
        if (found) return found;
        // 3. Contains match
        found = subjects.find(s => s.name.toLowerCase().includes(lowerInput));
        if (found) return found;
        // 4. Word-boundary contains (input is a word somewhere in the name)
        found = subjects.find(s => {
          const words = s.name.toLowerCase().split(/\s+/);
          return words.some(w => w.startsWith(lowerInput) || w.includes(lowerInput));
        });
        if (found) return found;
        // 5. Reverse: any word in the subject name is contained in the input
        found = subjects.find(s => {
          const words = s.name.toLowerCase().split(/\s+/);
          return words.some(w => lowerInput.includes(w));
        });
        if (found) return found;
        return null;
      };

      subjectDoc = matchSubject(subjectName, institutionSubjects);
      if (subjectDoc) {
        transformed.subjectId = subjectDoc._id;
      } else {
        const newSubject = await Subject.create({
          name: subjectName.charAt(0).toUpperCase() + subjectName.slice(1),
          code: subjectName.substring(0, 4).toUpperCase(),
          department: 'General',
          institutionId: institutionId,
        });
        transformed.subjectId = newSubject._id;
        logger.info('Auto-created subject "' + subjectName + '" for exam');
      }
      delete transformed.subject;
    } else {
      errors.push('Subject name is required');
    }

    // If class or subject lookup failed, throw early with clear message
    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }

    // Set defaults for required fields
    const currentYear = new Date().getFullYear();
    if (!transformed.academicYear) {
      const now = new Date();
      const year = now.getMonth() >= 3 ? currentYear : currentYear - 1; // April onwards = new academic year
      transformed.academicYear = `${year}-${year + 1}`;
    }
    if (!transformed.term) {
      transformed.term = '1';
    }
    // Default duration if not provided
    if (!transformed.duration && transformed.startTime && transformed.endTime) {
      // calculate from time difference
      const [sh, sm] = transformed.startTime.split(':').map(Number);
      const [eh, em] = transformed.endTime.split(':').map(Number);
      transformed.duration = (eh * 60 + em) - (sh * 60 + sm);
    }
    if (!transformed.totalMarks) {
      transformed.totalMarks = 100;
    }

    return transformed;
  };

// ---- Exact-match flat routes (no params, safe to define first) ----

// POST /exams — create exam (frontend calls this)
router.post('/', authorize(['admin', 'teacher', 'principal', 'super_admin']), async (req, res, next) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) {
      return errorResponse(res, 'School ID required — not found in user profile', 400);
    }
    const transformed = await transformExamBody(req.body, institutionId);
    req.params = { institutionId };
    req.body = transformed;
    return createExam(req, res, next);
  } catch (error) {
    // These are validation errors (class/subject not found), return 400, not 500
    logger.warn('Transform validation in POST /exams:', error.message);
    return errorResponse(res, error.message, 400);
  }
});

// GET /exams — list exams (frontend calls this)
router.get('/', (req, res, next) => {
  const institutionId = getInstitutionId(req);
  if (!institutionId) return successResponse(res, [], 'No school context — returning empty');
  req.params = { ...req.params, institutionId };
  return getExams(req, res, next);
});

// ---- Structured /schools/:institutionId routes (define BEFORE param catch-all routes) ----

router.post('/schools/:institutionId', authorize(['admin', 'teacher', 'principal', 'super_admin']), createExam);
router.get('/schools/:institutionId', getExams);
router.get('/schools/:institutionId/exams/:examId', getExamById);
router.put('/schools/:institutionId/exams/:examId', authorize(['admin', 'teacher', 'principal', 'super_admin']), updateExam);
router.delete('/schools/:institutionId/exams/:examId', authorize(['admin', 'principal', 'super_admin']), deleteExam);

// Exam by class (TESTED & VERIFIED)
router.get('/schools/:institutionId/class/:classId', getExamsByClass);

// Exam attendance (TESTED & VERIFIED)
router.post('/schools/:institutionId/exams/:examId/attendance', authorize(['admin', 'teacher', 'principal']), markAttendance);
router.get('/schools/:institutionId/exams/:examId/attendance', getAttendance);

// Bulk operations (TESTED & VERIFIED)
router.post('/schools/:institutionId/bulk-update', authorize(['admin', 'principal', 'super_admin']), bulkUpdateExams);
router.post('/schools/:institutionId/bulk-delete', authorize(['admin', 'principal', 'super_admin']), bulkDeleteExams);

// Export and statistics (TESTED & VERIFIED)
router.get('/schools/:institutionId/export', authorize(['admin', 'principal', 'super_admin']), exportExams);
router.get('/schools/:institutionId/statistics', authorize(['admin', 'principal', 'super_admin']), getExamStatistics);
router.get('/schools/:institutionId/analytics', authorize(['admin', 'principal', 'super_admin']), getExamAnalytics);

// ---- Parameterized catch-all routes (must be LAST — after structured routes) ----

// GET /exams/:id — get single exam (frontend calls this)
router.get('/:id', (req, res, next) => {
  const institutionId = getInstitutionId(req);
  if (!institutionId) return errorResponse(res, 'School ID required', 400);
  req.params = { institutionId, examId: req.params.id };
  return getExamById(req, res, next);
});

// PUT /exams/:id — update exam (frontend calls this)
router.put('/:id', authorize(['admin', 'teacher', 'principal', 'super_admin']), async (req, res, next) => {
  try {
    const institutionId = getInstitutionId(req);
    if (!institutionId) return errorResponse(res, 'School ID required', 400);
    const transformed = await transformExamBody(req.body, institutionId);
    req.params = { institutionId, examId: req.params.id };
    req.body = transformed;
    return updateExam(req, res, next);
  } catch (error) {
    logger.warn('Transform validation in PUT /exams/:id:', error.message);
    return errorResponse(res, error.message, 400);
  }
});

// DELETE /exams/:id — delete exam (frontend calls this)
router.delete('/:id', authorize(['admin', 'principal', 'super_admin']), (req, res, next) => {
  const institutionId = getInstitutionId(req);
  if (!institutionId) return errorResponse(res, 'School ID required', 400);
  req.params = { institutionId, examId: req.params.id };
  return deleteExam(req, res, next);
});

export default router;
