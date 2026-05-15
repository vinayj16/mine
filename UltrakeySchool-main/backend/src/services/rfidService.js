/**
 * RFID Service
 * Handles RFID card management operations
 */

const RfidCard = require('../models/rfidCard');
const User = require('../models/User');
const { logger } = require('../utils/logger');

class RfidService {
  /**
   * Create a new RFID card
   */
  async createRfidCard(data, institutionId, createdBy) {
    try {
      const { cardId, serialNumber, userId, userType, location, metadata } = data;

      // Validate required fields
      if (!cardId || !userId) {
        throw new Error('Card ID and User ID are required');
      }

      // Check if card ID already exists
      const existingCard = await RfidCard.findOne({
        cardId,
        institution: institutionId
      });

      if (existingCard) {
        throw new Error('RFID card with this ID already exists');
      }

      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Create RFID card
      const rfidCard = new RfidCard({
        cardId,
        serialNumber,
        userId,
        userType: userType || user.role,
        location: location || 'office',
        institution: institutionId,
        metadata: {
          createdBy,
          assignedAt: new Date(),
          ...metadata
        }
      });

      await rfidCard.save();

      logger.info(`RFID card created: ${rfidCard.cardId} for user: ${user.name} by: ${createdBy}`);
      
      return {
        success: true,
        data: {
          id: rfidCard._id,
          cardId: rfidCard.cardId,
          serialNumber: rfidCard.serialNumber,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
          },
          userType: rfidCard.userType,
          location: rfidCard.location,
          status: rfidCard.status,
          assignedAt: rfidCard.assignedAt
        }
      };
    } catch (error) {
      logger.error('Error creating RFID card:', error);
      throw error;
    }
  }

  /**
   * Validate RFID card
   */
  async validateRfidCard(cardId, institutionId, location) {
    try {
      const rfidCard = await RfidCard.findOne({
        cardId,
        institution: institutionId,
        isActive: true,
        status: 'active'
      }).populate('userId', 'name email role');

      if (!rfidCard) {
        logger.warn(`Invalid RFID card validation attempt: ${cardId} at location: ${location}`);
        return {
          success: false,
          message: 'Invalid or inactive RFID card'
        };
      }

      // Update last used timestamp
      await rfidCard.updateLastUsed();

      // Update location if provided
      if (location && location !== rfidCard.location) {
        rfidCard.location = location;
        await rfidCard.save();
      }

      logger.info(`RFID card validated: ${cardId} for user: ${rfidCard.userId.name} at location: ${location}`);
      
      return {
        success: true,
        data: {
          cardId: rfidCard.cardId,
          user: {
            id: rfidCard.userId._id,
            name: rfidCard.userId.name,
            email: rfidCard.userId.email,
            role: rfidCard.userId.role
          },
          userType: rfidCard.userType,
          location: location || rfidCard.location,
          lastUsed: rfidCard.lastUsed,
          status: rfidCard.status
        }
      };
    } catch (error) {
      logger.error('Error validating RFID card:', error);
      throw error;
    }
  }

  /**
   * Get all RFID cards
   */
  async getRfidCards(institutionId, filters = {}) {
    try {
      const query = {
        institution: institutionId,
        ...filters
      };

      const rfidCards = await RfidCard.find(query)
        .populate('userId', 'name email role')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: rfidCards
      };
    } catch (error) {
      logger.error('Error fetching RFID cards:', error);
      throw error;
    }
  }

  /**
   * Get RFID card by ID
   */
  async getRfidCardById(id, institutionId) {
    try {
      const rfidCard = await RfidCard.findOne({
        _id: id,
        institution: institutionId
      }).populate('userId', 'name email role');

      if (!rfidCard) {
        return {
          success: false,
          message: 'RFID card not found'
        };
      }

      return {
        success: true,
        data: rfidCard
      };
    } catch (error) {
      logger.error('Error fetching RFID card:', error);
      throw error;
    }
  }

  /**
   * Update RFID card
   */
  async updateRfidCard(id, data, institutionId, updatedBy) {
    try {
      const rfidCard = await RfidCard.findOne({
        _id: id,
        institution: institutionId
      });

      if (!rfidCard) {
        return {
          success: false,
          message: 'RFID card not found'
        };
      }

      // Update fields
      if (data.status && ['active', 'inactive', 'lost', 'blocked'].includes(data.status)) {
        rfidCard.status = data.status;
        if (data.status === 'blocked' || data.status === 'lost') {
          rfidCard.isActive = false;
        } else if (data.status === 'active') {
          rfidCard.isActive = true;
        }
      }

      if (data.location && ['gate', 'library', 'transport', 'classroom', 'office'].includes(data.location)) {
        rfidCard.location = data.location;
      }

      if (data.metadata) {
        rfidCard.metadata = { ...rfidCard.metadata, ...data.metadata };
      }

      rfidCard.updatedBy = updatedBy;
      await rfidCard.save();

      logger.info(`RFID card updated: ${rfidCard.cardId} by user: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: rfidCard._id,
          cardId: rfidCard.cardId,
          status: rfidCard.status,
          location: rfidCard.location,
          isActive: rfidCard.isActive,
          updatedBy,
          updatedAt: rfidCard.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error updating RFID card:', error);
      throw error;
    }
  }

  /**
   * Delete RFID card
   */
  async deleteRfidCard(id, institutionId, deletedBy) {
    try {
      const rfidCard = await RfidCard.findOne({
        _id: id,
        institution: institutionId
      });

      if (!rfidCard) {
        return {
          success: false,
          message: 'RFID card not found'
        };
      }

      // Soft delete
      rfidCard.isActive = false;
      rfidCard.status = 'inactive';
      rfidCard.updatedBy = deletedBy;
      await rfidCard.save();

      logger.info(`RFID card deleted: ${rfidCard.cardId} by user: ${deletedBy}`);
      
      return {
        success: true,
        message: 'RFID card deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting RFID card:', error);
      throw error;
    }
  }

  /**
   * Block RFID card
   */
  async blockRfidCard(id, reason, institutionId, blockedBy) {
    try {
      const rfidCard = await RfidCard.findOne({
        _id: id,
        institution: institutionId
      });

      if (!rfidCard) {
        return {
          success: false,
          message: 'RFID card not found'
        };
      }

      await rfidCard.blockCard(reason || 'Manual block');

      logger.info(`RFID card blocked: ${rfidCard.cardId} by user: ${blockedBy}, reason: ${reason}`);
      
      return {
        success: true,
        message: 'RFID card blocked successfully'
      };
    } catch (error) {
      logger.error('Error blocking RFID card:', error);
      throw error;
    }
  }

  /**
   * Activate RFID card
   */
  async activateRfidCard(id, institutionId, activatedBy) {
    try {
      const rfidCard = await RfidCard.findOne({
        _id: id,
        institution: institutionId
      });

      if (!rfidCard) {
        return {
          success: false,
          message: 'RFID card not found'
        };
      }

      await rfidCard.activateCard();

      logger.info(`RFID card activated: ${rfidCard.cardId} by user: ${activatedBy}`);
      
      return {
        success: true,
        message: 'RFID card activated successfully'
      };
    } catch (error) {
      logger.error('Error activating RFID card:', error);
      throw error;
    }
  }

  /**
   * Get RFID card statistics
   */
  async getRfidStatistics(institutionId) {
    try {
      const totalCards = await RfidCard.countDocuments({
        institution: institutionId,
        isActive: true
      });

      const activeCards = await RfidCard.countDocuments({
        institution: institutionId,
        isActive: true,
        status: 'active'
      });

      const blockedCards = await RfidCard.countDocuments({
        institution: institutionId,
        status: 'blocked'
      });

      const lostCards = await RfidCard.countDocuments({
        institution: institutionId,
        status: 'lost'
      });

      const userTypeStats = await RfidCard.aggregate([
        {
          $match: {
            institution: institutionId,
            isActive: true
          }
        },
        {
          $group: {
            _id: '$userType',
            count: { $sum: 1 }
          }
        }
      ]);

      const locationStats = await RfidCard.aggregate([
        {
          $match: {
            institution: institutionId,
            isActive: true
          }
        },
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: {
          totalCards,
          activeCards,
          blockedCards,
          lostCards,
          userTypeStats,
          locationStats
        }
      };
    } catch (error) {
      logger.error('Error fetching RFID statistics:', error);
      throw error;
    }
  }

  /**
   * Find RFID card by card ID
   */
  async findByCardId(cardId, institutionId) {
    try {
      const rfidCard = await RfidCard.findOne({
        cardId,
        institution: institutionId,
        isActive: true
      }).populate('userId', 'name email role');

      return rfidCard;
    } catch (error) {
      logger.error('Error finding RFID card by ID:', error);
      throw error;
    }
  }

  /**
   * Find RFID cards by user ID
   */
  async findByUserId(userId, institutionId) {
    try {
      const rfidCards = await RfidCard.find({
        userId,
        institution: institutionId,
        isActive: true
      }).populate('userId', 'name email role');

      return rfidCards;
    } catch (error) {
      logger.error('Error finding RFID cards by user ID:', error);
      throw error;
    }
  }
}

module.exports = new RfidService();