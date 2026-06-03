import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import homeworkController from '../controllers/homeWorkController.js';

const router = express.Router();

// Middleware to resolve institutionId from query params or JWT user context
// The frontend sends institutionId as a query param — map it to institutionId
const resolveinstitutionId = (req, res, next) => {
  req.params.institutionId = req.query.institutionId || req.body?.institutionId || req.user?.institutionId || req.tenantId;
  next();
};

// Middleware to support :id aliased as :homeWorkId (controller expects homeWorkId)
const resolveHomeWorkId = (req, res, next) => {
  if (req.params.id && !req.params.homeWorkId) {
    req.params.homeWorkId = req.params.id;
  }
  next();
};

// Apply school ID resolution to ALL homework routes
router.use(resolveinstitutionId);

// GET /homework — list with filters
router.get('/', authenticate, homeworkController.getHomeWorks);

// GET /homework/:id — get by ID
router.get('/:id', authenticate, resolveHomeWorkId, homeworkController.getHomeWorkById);

// POST /homework — create
router.post('/', authenticate, homeworkController.createHomeWork);

// PUT /homework/:id — update
router.put('/:id', authenticate, resolveHomeWorkId, homeworkController.updateHomeWork);

// DELETE /homework/:id — delete
router.delete('/:id', authenticate, resolveHomeWorkId, homeworkController.deleteHomeWork);

export default router;
