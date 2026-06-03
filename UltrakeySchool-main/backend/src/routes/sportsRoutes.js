import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import Sport from '../models/Sport.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const institutionId = req.query.institution || req.query.institutionId || req.user?.institutionId || req.user?.institution;

    if (!institutionId) {
      return res.json({ success: true, data: [], pagination: { total: 0, page: 1, pages: 0 } });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = { institution: institutionId };

    const [sportsData, total] = await Promise.all([
      Sport.find(filter).sort({ name: 1 }).skip(skip).limit(limitNum),
      Sport.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: sportsData,
      pagination: { total, page: pageNum, pages: Math.ceil(total / limitNum) }
    });
  } catch (error) {
    logger.error('Error fetching sports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sports', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sport = await Sport.findById(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, data: sport });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sport', error: error.message });
  }
});

router.post('/', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const institutionId = req.body.institution || req.query.institution || req.query.institutionId || req.user?.institutionId || req.user?.institution;
    if (!institutionId) return res.status(400).json({ success: false, message: 'Institution ID is required' });

    const sportData = {
      ...req.body,
      institution: institutionId,
      sportId: req.body.sportId || req.body.name?.toLowerCase().replace(/\s+/g, '-') || 'sport-' + Date.now(),
      createdBy: req.user?.id || req.user?._id
    };

    const sport = await Sport.create(sportData);
    logger.info('Sport created:', { id: sport._id, name: sport.name });
    res.status(201).json({ success: true, data: sport, message: 'Sport created successfully' });
  } catch (error) {
    logger.error('Error creating sport:', error);
    res.status(500).json({ success: false, message: 'Failed to create sport', error: error.message });
  }
});

router.put('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const sport = await Sport.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, data: sport, message: 'Sport updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update sport', error: error.message });
  }
});

router.delete('/:id', authorize(['admin', 'principal', 'institution_admin']), async (req, res) => {
  try {
    const sport = await Sport.findByIdAndDelete(req.params.id);
    if (!sport) return res.status(404).json({ success: false, message: 'Sport not found' });
    res.json({ success: true, message: 'Sport deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete sport', error: error.message });
  }
});

export default router;
