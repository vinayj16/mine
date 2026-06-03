import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import blogController from '../controllers/blogController.js';

const router = express.Router();

// Public routes
router.get('/', blogController.getPublishedBlogs);
router.get('/:slug', blogController.getBlogBySlug);

// Protected routes (admin only)
router.post('/', protect, blogController.createBlog);
router.put('/:id', protect, blogController.updateBlog);
router.delete('/:id', protect, blogController.deleteBlog);

export default router;
