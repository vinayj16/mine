import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/authGuard.js';
import blogController from '../controllers/blogController.js';

const {
  getAllComments,
  getBlogComments,
  createComment,
  updateComment,
  deleteComment,
  getAllBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  getAllTags,
  getTag,
  createTag,
  updateTag,
  deleteTag
} = blogController;

const router = express.Router();

// Public routes - no auth required for reading
router.get('/posts', getAllBlogs);  
router.get('/posts/:id', getBlog);  
router.get('/tags', getAllTags);  
router.get('/tags/:id', getTag);  

// Protected routes - require authentication
router.use(protect);

// Blog CRUD Operations (TESTED & VERIFIED)
router.post('/posts', authorize(['admin', 'teacher', 'principal']), createBlog);  
router.put('/posts/:id', authorize(['admin', 'teacher', 'principal']), updateBlog);  
router.delete('/posts/:id', authorize(['admin', 'principal']), deleteBlog);  

// Comment Operations (TESTED & VERIFIED)
router.get('/comments', getAllComments);  
router.get('/posts/:blogId/comments', getBlogComments);  
router.post('/posts/:blogId/comments', createComment);  
router.put('/comments/:id', authorize(['admin', 'principal']), updateComment);  
router.delete('/comments/:id', authorize(['admin', 'principal']), deleteComment);  

// Tag Operations (TESTED & VERIFIED)
router.post('/tags', authorize(['admin', 'principal']), createTag);  
router.put('/tags/:id', authorize(['admin', 'principal']), updateTag);  
router.delete('/tags/:id', authorize(['admin', 'principal']), deleteTag);  

export default router;
