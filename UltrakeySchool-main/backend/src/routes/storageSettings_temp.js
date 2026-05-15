import express from 'express';
// Temporarily simplified to avoid errors
const router = express.Router();

// TODO: Implement proper storage settings routes
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Storage settings - Under development' });
});

export default router;
