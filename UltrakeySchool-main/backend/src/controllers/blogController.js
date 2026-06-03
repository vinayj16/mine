import Blog from '../models/Blog.js';
import { successResponse, createdResponse, errorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

export const getPublishedBlogs = async (req, res) => {
  try {
    const { limit = 6, category, featured } = req.query;
    const query = { status: 'published' };
    if (category) query.category = category;
    if (featured === 'true') query.featured = true;

    const blogs = await Blog.find(query)
      .sort({ featured: -1, publishedAt: -1 })
      .limit(parseInt(limit))
      .select('title slug excerpt content coverImage category tags author publishedAt readTime featured meta');

    const total = await Blog.countDocuments(query);

    return successResponse(res, { blogs, total }, 'Blogs fetched successfully');
  } catch (error) {
    logger.error('Error fetching blogs:', error);
    return errorResponse(res, 'Failed to fetch blogs', 500);
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: 'published' });

    if (!blog) {
      return notFoundResponse(res, 'Blog not found');
    }

    // Increment view count
    await Blog.findByIdAndUpdate(blog._id, { $inc: { 'meta.views': 1 } });

    return successResponse(res, blog, 'Blog fetched successfully');
  } catch (error) {
    logger.error('Error fetching blog:', error);
    return errorResponse(res, 'Failed to fetch blog', 500);
  }
};

export const createBlog = async (req, res) => {
  try {
    const blogData = { ...req.body };
    if (!blogData.author?.name) {
      blogData.author = { name: req.user?.name || 'Admin' };
    }
    if (!blogData.publishedAt && blogData.status === 'published') {
      blogData.publishedAt = new Date();
    }
    const blog = await Blog.create(blogData);
    return createdResponse(res, blog, 'Blog created successfully');
  } catch (error) {
    logger.error('Error creating blog:', error);
    return errorResponse(res, error.message, 500);
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndUpdate(id, req.body, { new: true });
    if (!blog) return notFoundResponse(res, 'Blog not found');
    return successResponse(res, blog, 'Blog updated successfully');
  } catch (error) {
    logger.error('Error updating blog:', error);
    return errorResponse(res, error.message, 500);
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findByIdAndDelete(id);
    if (!blog) return notFoundResponse(res, 'Blog not found');
    return successResponse(res, null, 'Blog deleted successfully');
  } catch (error) {
    logger.error('Error deleting blog:', error);
    return errorResponse(res, error.message, 500);
  }
};

export default { getPublishedBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog };
