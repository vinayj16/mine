import BlogComment from '../models/BlogComment.js';
import Blog from '../models/Blog.js';

// Get all comments
const getAllComments = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    
    const query = schoolId ? { schoolId } : {};
    
    const comments = await BlogComment.find(query)
      .populate('blogId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message
    });
  }
};

// Get comments for a specific blog
const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;
    
    const comments = await BlogComment.find({ 
      blogId,
      status: 'published'
    })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching blog comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog comments',
      error: error.message
    });
  }
};

// Create a new comment
const createComment = async (req, res) => {
  try {
    const { comment, rating, blogId } = req.body;
    const userId = req.user?._id;
    const schoolId = req.user?.schoolId;

    if (!comment || !blogId) {
      return res.status(400).json({
        success: false,
        message: 'Comment and blog ID are required'
      });
    }

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    const newComment = new BlogComment({
      comment,
      rating: rating || 5,
      blogId,
      userId,
      schoolId,
      status: 'pending'
    });

    await newComment.save();
    
    const populatedComment = await BlogComment.findById(newComment._id)
      .populate('blogId', 'title')
      .populate('userId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Comment created successfully',
      data: populatedComment
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create comment',
      error: error.message
    });
  }
};

// Update comment status
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['published', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const comment = await BlogComment.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate('blogId', 'title')
      .populate('userId', 'name email');

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await BlogComment.findByIdAndDelete(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};

// Get all blog posts
const getAllBlogs = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    
    const query = schoolId ? { schoolId } : {};
    
    const blogs = await Blog.find(query)
      .populate('author', 'name email avatar')
      .populate('category', 'name')
      .populate('tags', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: blogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
};

// Get a single blog post
const getBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id)
      .populate('author', 'name email avatar')
      .populate('category', 'name')
      .populate('tags', 'name');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Increment views
    blog.views = (blog.views || 0) + 1;
    await blog.save();

    res.status(200).json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blog',
      error: error.message
    });
  }
};

// Create a new blog post
const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, category, tags, status, featuredImage } = req.body;
    const author = req.user?._id;
    const schoolId = req.user?.schoolId;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const newBlog = new Blog({
      title,
      content,
      excerpt,
      author,
      category: category || undefined,
      tags: tags || [],
      status: status || 'draft',
      featuredImage,
      schoolId,
      publishedAt: status === 'published' ? new Date() : undefined
    });

    await newBlog.save();
    
    const populatedBlog = await Blog.findById(newBlog._id)
      .populate('author', 'name email avatar')
      .populate('category', 'name')
      .populate('tags', 'name');

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: populatedBlog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create blog',
      error: error.message
    });
  }
};

// Update a blog post
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, category, tags, status, featuredImage } = req.body;

    const updateData = {
      title,
      content,
      excerpt,
      category,
      tags,
      status,
      featuredImage
    };

    // If status is being changed to published, set publishedAt
    if (status === 'published') {
      const existingBlog = await Blog.findById(id);
      if (existingBlog && existingBlog.status !== 'published') {
        updateData.publishedAt = new Date();
      }
    }

    const blog = await Blog.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('author', 'name email avatar')
      .populate('category', 'name')
      .populate('tags', 'name');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update blog',
      error: error.message
    });
  }
};

// Delete a blog post
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findByIdAndDelete(id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }

    // Also delete all comments associated with this blog
    await BlogComment.deleteMany({ blogId: id });

    res.status(200).json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete blog',
      error: error.message
    });
  }
};

// Import BlogTag model
import BlogTag from '../models/BlogTag.js';

// Get all blog tags
const getAllTags = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    
    const query = schoolId ? { schoolId } : {};
    
    const tags = await BlogTag.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags',
      error: error.message
    });
  }
};

// Get a single tag
const getTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await BlogTag.findById(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      data: tag
    });
  } catch (error) {
    console.error('Error fetching tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tag',
      error: error.message
    });
  }
};

// Create a new tag
const createTag = async (req, res) => {
  try {
    const { name, status } = req.body;
    const schoolId = req.user?.schoolId;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Check if tag already exists
    const existingTag = await BlogTag.findOne({ 
      name: name.trim(),
      schoolId: schoolId || null
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const newTag = new BlogTag({
      name: name.trim(),
      status: status || 'active',
      schoolId
    });

    await newTag.save();

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data: newTag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create tag',
      error: error.message
    });
  }
};

// Update a tag
const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Tag name is required'
      });
    }

    // Check if another tag with the same name exists
    const existingTag = await BlogTag.findOne({ 
      name: name.trim(),
      _id: { $ne: id }
    });

    if (existingTag) {
      return res.status(400).json({
        success: false,
        message: 'Tag with this name already exists'
      });
    }

    const tag = await BlogTag.findByIdAndUpdate(
      id,
      { name: name.trim(), status },
      { new: true, runValidators: true }
    );

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tag updated successfully',
      data: tag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tag',
      error: error.message
    });
  }
};

// Delete a tag
const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await BlogTag.findByIdAndDelete(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: 'Tag not found'
      });
    }

    // Remove this tag from all blogs that reference it
    await Blog.updateMany(
      { tags: id },
      { $pull: { tags: id } }
    );

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete tag',
      error: error.message
    });
  }
};


export default {
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
};
