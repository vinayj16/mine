/**
 * Testimonial Service
 * Handles testimonial management operations
 */

const Testimonial = require('../models/Testimonial');
const User = require('../models/User');
const { logger } = require('../utils/logger');

class TestimonialService {
  /**
   * Create a new testimonial
   */
  async createTestimonial(data, institutionId, createdBy) {
    try {
      const {
        title,
        content,
        authorName,
        authorRole,
        authorImage,
        rating,
        isFeatured,
        tags,
        metadata
      } = data;

      // Validate required fields
      if (!title || !content || !authorName) {
        throw new Error('Title, content, and author name are required');
      }

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Create testimonial
      const testimonial = new Testimonial({
        title,
        content,
        authorName,
        authorRole,
        authorImage,
        rating,
        isFeatured: isFeatured || false,
        tags: tags || [],
        institution: institutionId,
        metadata: {
          createdBy,
          createdAt: new Date(),
          ...metadata
        }
      });

      await testimonial.save();

      logger.info(`Testimonial created: "${testimonial.title}" by: ${createdBy}`);
      
      return {
        success: true,
        data: {
          id: testimonial._id,
          title: testimonial.title,
          content: testimonial.content,
          authorName: testimonial.authorName,
          authorRole: testimonial.authorRole,
          authorImage: testimonial.authorImage,
          rating: testimonial.rating,
          isFeatured: testimonial.isFeatured,
          tags: testimonial.tags,
          createdAt: testimonial.createdAt,
          status: testimonial.status
        }
      };
    } catch (error) {
      logger.error('Error creating testimonial:', error);
      throw error;
    }
  }

  /**
   * Get all testimonials
   */
  async getTestimonials(institutionId, filters = {}) {
    try {
      const query = {
        institution: institutionId,
        status: 'active',
        ...filters
      };

      const testimonials = await Testimonial.find(query)
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: testimonials,
        pagination: {
          total: testimonials.length,
          page: 1,
          limit: testimonials.length
        }
      };
    } catch (error) {
      logger.error('Error fetching testimonials:', error);
      throw error;
    }
  }

  /**
   * Get featured testimonials
   */
  async getFeaturedTestimonials(institutionId, limit = 10) {
    try {
      const testimonials = await Testimonial.find({
        institution: institutionId,
        status: 'active',
        isFeatured: true
      })
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching featured testimonials:', error);
      throw error;
    }
  }

  /**
   * Get testimonials by rating
   */
  async getTestimonialsByRating(institutionId, minRating = 4) {
    try {
      const testimonials = await Testimonial.find({
        institution: institutionId,
        status: 'active',
        rating: { $gte: minRating }
      })
        .populate('metadata.createdBy', 'name email')
        .sort({ rating: -1, createdAt: -1 });

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching testimonials by rating:', error);
      throw error;
    }
  }

  /**
   * Get testimonials by tags
   */
  async getTestimonialsByTags(institutionId, tags) {
    try {
      if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error('Tags must be a non-empty array');
      }

      const testimonials = await Testimonial.find({
        institution: institutionId,
        status: 'active',
        tags: { $in: tags }
      })
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching testimonials by tags:', error);
      throw error;
    }
  }

  /**
   * Get testimonial by ID
   */
  async getTestimonialById(id, institutionId) {
    try {
      const testimonial = await Testimonial.findOne({
        _id: id,
        institution: institutionId
      }).populate('metadata.createdBy', 'name email');

      if (!testimonial) {
        return {
          success: false,
          message: 'Testimonial not found'
        };
      }

      return {
        success: true,
        data: testimonial
      };
    } catch (error) {
      logger.error('Error fetching testimonial:', error);
      throw error;
    }
  }

  /**
   * Update testimonial
   */
  async updateTestimonial(id, data, institutionId, updatedBy) {
    try {
      const testimonial = await Testimonial.findOne({
        _id: id,
        institution: institutionId
      });

      if (!testimonial) {
        return {
          success: false,
          message: 'Testimonial not found'
        };
      }

      // Update fields
      if (data.title) testimonial.title = data.title;
      if (data.content) testimonial.content = data.content;
      if (data.authorName) testimonial.authorName = data.authorName;
      if (data.authorRole !== undefined) testimonial.authorRole = data.authorRole;
      if (data.authorImage !== undefined) testimonial.authorImage = data.authorImage;
      if (data.rating !== undefined) {
        if (data.rating < 1 || data.rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
        testimonial.rating = data.rating;
      }
      if (data.isFeatured !== undefined) testimonial.isFeatured = data.isFeatured;
      if (data.tags !== undefined) testimonial.tags = data.tags;
      if (data.status !== undefined) {
        const validStatuses = ['active', 'inactive', 'pending'];
        if (!validStatuses.includes(data.status)) {
          throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
        testimonial.status = data.status;
      }

      testimonial.metadata.updatedBy = updatedBy;
      await testimonial.save();

      logger.info(`Testimonial updated: "${testimonial.title}" by: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: testimonial._id,
          title: testimonial.title,
          content: testimonial.content,
          authorName: testimonial.authorName,
          authorRole: testimonial.authorRole,
          rating: testimonial.rating,
          isFeatured: testimonial.isFeatured,
          status: testimonial.status,
          updatedAt: testimonial.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error updating testimonial:', error);
      throw error;
    }
  }

  /**
   * Delete testimonial
   */
  async deleteTestimonial(id, institutionId, deletedBy) {
    try {
      const testimonial = await Testimonial.findOne({
        _id: id,
        institution: institutionId
      });

      if (!testimonial) {
        return {
          success: false,
          message: 'Testimonial not found'
        };
      }

      // Soft delete
      testimonial.status = 'inactive';
      testimonial.metadata.updatedBy = deletedBy;
      await testimonial.save();

      logger.info(`Testimonial deleted: "${testimonial.title}" by: ${deletedBy}`);
      
      return {
        success: true,
        message: 'Testimonial deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting testimonial:', error);
      throw error;
    }
  }

  /**
   * Get testimonial statistics
   */
  async getTestimonialStatistics(institutionId) {
    try {
      const totalTestimonials = await Testimonial.countDocuments({
        institution: institutionId,
        status: 'active'
      });

      const featuredTestimonials = await Testimonial.countDocuments({
        institution: institutionId,
        status: 'active',
        isFeatured: true
      });

      const averageRating = await Testimonial.aggregate([
        {
          $match: {
            institution: institutionId,
            status: 'active',
            rating: { $exists: true }
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' }
          }
        }
      ]);

      const ratingDistribution = await Testimonial.aggregate([
        {
          $match: {
            institution: institutionId,
            status: 'active',
            rating: { $exists: true }
          }
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]);

      const statusStats = await Testimonial.aggregate([
        {
          $match: {
            institution: institutionId
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const tagStats = await Testimonial.aggregate([
        {
          $match: {
            institution: institutionId,
            status: 'active',
            tags: { $exists: true, $not: { $size: 0 } }
          }
        },
        {
          $unwind: '$tags'
        },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: 10
        }
      ]);

      return {
        success: true,
        data: {
          totalTestimonials,
          featuredTestimonials,
          averageRating: averageRating[0]?.averageRating || 0,
          ratingDistribution,
          statusStats,
          topTags: tagStats
        }
      };
    } catch (error) {
      logger.error('Error fetching testimonial statistics:', error);
      throw error;
    }
  }

  /**
   * Feature/unfeature testimonial
   */
  async toggleFeaturedTestimonial(id, isFeatured, institutionId, updatedBy) {
    try {
      const testimonial = await Testimonial.findOne({
        _id: id,
        institution: institutionId
      });

      if (!testimonial) {
        return {
          success: false,
          message: 'Testimonial not found'
        };
      }

      testimonial.isFeatured = isFeatured;
      testimonial.metadata.updatedBy = updatedBy;
      await testimonial.save();

      logger.info(`Testimonial ${isFeatured ? 'featured' : 'unfeatured'}: "${testimonial.title}" by: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: testimonial._id,
          isFeatured: testimonial.isFeatured,
          updatedAt: testimonial.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error toggling featured testimonial:', error);
      throw error;
    }
  }

  /**
   * Bulk update testimonial status
   */
  async bulkUpdateStatus(testimonialIds, status, institutionId, updatedBy) {
    try {
      if (!Array.isArray(testimonialIds) || testimonialIds.length === 0) {
        throw new Error('Testimonial IDs must be a non-empty array');
      }

      const validStatuses = ['active', 'inactive', 'pending'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const result = await Testimonial.updateMany(
        {
          _id: { $in: testimonialIds },
          institution: institutionId
        },
        {
          $set: {
            status,
            'metadata.updatedBy': updatedBy,
            updatedAt: new Date()
          }
        }
      );

      logger.info(`Bulk updated ${result.modifiedCount} testimonials to status: ${status} by: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          modifiedCount: result.modifiedCount,
          status
        }
      };
    } catch (error) {
      logger.error('Error bulk updating testimonial status:', error);
      throw error;
    }
  }

  /**
   * Search testimonials
   */
  async searchTestimonials(institutionId, searchTerm, filters = {}) {
    try {
      const query = {
        institution: institutionId,
        status: 'active',
        $or: [
          { title: { $regex: searchTerm, $options: 'i' } },
          { content: { $regex: searchTerm, $options: 'i' } },
          { authorName: { $regex: searchTerm, $options: 'i' } }
        ],
        ...filters
      };

      const testimonials = await Testimonial.find(query)
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error searching testimonials:', error);
      throw error;
    }
  }

  /**
   * Get testimonials by date range
   */
  async getTestimonialsByDateRange(institutionId, startDate, endDate) {
    try {
      const testimonials = await Testimonial.find({
        institution: institutionId,
        status: 'active',
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching testimonials by date range:', error);
      throw error;
    }
  }

  /**
   * Get testimonials by author
   */
  async getTestimonialsByAuthor(institutionId, authorName) {
    try {
      const testimonials = await Testimonial.find({
        institution: institutionId,
        status: 'active',
        authorName: { $regex: authorName, $options: 'i' }
      })
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching testimonials by author:', error);
      throw error;
    }
  }

  /**
   * Get testimonial by title
   */
  async getTestimonialByTitle(title, institutionId) {
    try {
      const testimonial = await Testimonial.findOne({
        title: { $regex: title, $options: 'i' },
        institution: institutionId,
        status: 'active'
      }).populate('metadata.createdBy', 'name email');

      if (!testimonial) {
        return {
          success: false,
          message: 'Testimonial not found'
        };
      }

      return {
        success: true,
        data: testimonial
      };
    } catch (error) {
      logger.error('Error fetching testimonial by title:', error);
      throw error;
    }
  }

  /**
   * Get random testimonials
   */
  async getRandomTestimonials(institutionId, limit = 5) {
    try {
      const testimonials = await Testimonial.aggregate([
        {
          $match: {
            institution: institutionId,
            status: 'active'
          }
        },
        {
          $sample: { size: limit }
        }
      ]);

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching random testimonials:', error);
      throw error;
    }
  }

  /**
   * Get testimonials for public display
   */
  async getPublicTestimonials(institutionId, limit = 10) {
    try {
      const testimonials = await Testimonial.find({
        institution: institutionId,
        status: 'active',
        isFeatured: true
      })
        .select('title content authorName authorRole authorImage rating createdAt')
        .sort({ createdAt: -1 })
        .limit(limit);

      return {
        success: true,
        data: testimonials
      };
    } catch (error) {
      logger.error('Error fetching public testimonials:', error);
      throw error;
    }
  }
}

module.exports = new TestimonialService();