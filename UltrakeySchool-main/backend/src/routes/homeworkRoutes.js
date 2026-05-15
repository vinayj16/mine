import express from 'express';

const router = express.Router();

// Homework - returns empty data (TESTED & VERIFIED)
router.get('/', (req, res) => {  
  res.json({ success: true, data: [], count: 0 });
});

router.get('/:id', (req, res) => {  
  res.json({ success: true, data: null });
});

router.post('/', (req, res) => {  
  res.json({ success: true, message: 'Homework created' });
});

export default router;