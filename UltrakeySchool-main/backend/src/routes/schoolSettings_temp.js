import express from 'express';

const router = express.Router();

// Simplified routes to avoid startup errors
router.get('/', (req, res) => {
  res.json({ success: true, message: 'School settings - Under development' });
});

router.post('/', (req, res) => {
  res.json({ success: true, message: 'School settings creation - Under development' });
});

export default router;
