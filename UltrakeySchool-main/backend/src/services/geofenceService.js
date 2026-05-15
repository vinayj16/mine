/**
 * Geofence Service
 * Handles geofence management operations
 */

const Geofence = require('../models/geofence');
const { logger } = require('../utils/logger');

class GeofenceService {
  /**
   * Create a new geofence
   */
  async createGeofence(data, institutionId, createdBy) {
    try {
      const {
        name,
        description,
        type,
        locationType,
        boundary,
        center,
        radius,
        timeRestrictions,
        allowedUserTypes,
        isActive
      } = data;

      // Validate required fields
      if (!name || !type) {
        throw new Error('Name and type are required');
      }

      // Validate geofence type
      const validTypes = ['campus', 'transport', 'access', 'attendance'];
      if (!validTypes.includes(type)) {
        throw new Error(`Invalid geofence type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Validate location type
      const validLocationTypes = ['circular', 'polygon'];
      if (!validLocationTypes.includes(locationType)) {
        throw new Error(`Invalid location type. Must be one of: ${validLocationTypes.join(', ')}`);
      }

      // Validate coordinates
      if (locationType === 'circular') {
        if (!center || !radius) {
          throw new Error('Center coordinates and radius are required for circular geofences');
        }
        if (!Array.isArray(center.coordinates) || center.coordinates.length !== 2) {
          throw new Error('Invalid center coordinates format');
        }
        if (radius <= 0) {
          throw new Error('Radius must be greater than 0');
        }
      } else if (locationType === 'polygon') {
        if (!boundary || !boundary.coordinates) {
          throw new Error('Boundary coordinates are required for polygon geofences');
        }
        if (!Array.isArray(boundary.coordinates) || boundary.coordinates.length < 3) {
          throw new Error('Polygon must have at least 3 coordinates');
        }
      }

      // Create geofence
      const geofence = new Geofence({
        name,
        description,
        type,
        locationType,
        boundary,
        center,
        radius,
        timeRestrictions,
        allowedUserTypes,
        isActive: isActive !== false,
        institution: institutionId,
        metadata: {
          createdBy,
          createdAt: new Date()
        }
      });

      await geofence.save();

      logger.info(`Geofence created: ${geofence.name} by user: ${createdBy}`);
      
      return {
        success: true,
        data: {
          id: geofence._id,
          name: geofence.name,
          description: geofence.description,
          type: geofence.type,
          locationType: geofence.locationType,
          boundary: geofence.boundary,
          center: geofence.center,
          radius: geofence.radius,
          timeRestrictions: geofence.timeRestrictions,
          allowedUserTypes: geofence.allowedUserTypes,
          isActive: geofence.isActive,
          createdAt: geofence.createdAt
        }
      };
    } catch (error) {
      logger.error('Error creating geofence:', error);
      throw error;
    }
  }

  /**
   * Validate location within geofence
   */
  async validateLocation(coordinates, institutionId, userType, accessType) {
    try {
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error('Invalid coordinates format');
      }

      const [latitude, longitude] = coordinates;

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Coordinates must be numbers');
      }

      // Find geofences that contain this location
      const geofences = await Geofence.find({
        institution: institutionId,
        isActive: true
      });

      const violations = [];
      const validGeofences = [];
      let isValidLocation = false;

      for (const geofence of geofences) {
        let isWithinBoundary = false;

        if (geofence.boundary && geofence.boundary.coordinates) {
          // Polygon check (simplified)
          isWithinBoundary = geofence.isWithinBoundary(coordinates);
        } else if (geofence.center && geofence.radius) {
          // Circular check
          isWithinBoundary = geofence.isWithinBoundary(coordinates);
        }

        if (isWithinBoundary) {
          // Check time restrictions
          const isTimeRestricted = geofence.isTimeRestricted();

          // Check user type restrictions
          const canAccess = geofence.canAccess(userType);

          if (isTimeRestricted || !canAccess) {
            violations.push({
              geofence: {
                id: geofence._id,
                name: geofence.name,
                type: geofence.type
              },
              violations: [
                ...(isTimeRestricted ? ['time_restriction'] : []),
                ...(canAccess ? [] : ['user_type_restriction'])
              ]
            });
          } else {
            isValidLocation = true;
            validGeofences.push({
              id: geofence._id,
              name: geofence.name,
              type: geofence.type,
              locationType: geofence.locationType
            });
            break; // Found a valid geofence
          }
        }
      }

      return {
        success: true,
        data: {
          isValid: isValidLocation,
          coordinates,
          userType,
          accessType,
          validGeofences,
          violations,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      logger.error('Error validating location:', error);
      throw error;
    }
  }

  /**
   * Get all geofences
   */
  async getGeofences(institutionId, filters = {}) {
    try {
      const query = {
        institution: institutionId,
        ...filters
      };

      const geofences = await Geofence.find(query)
        .populate('metadata.createdBy', 'name email')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: geofences,
        pagination: {
          total: geofences.length,
          page: 1,
          limit: geofences.length
        }
      };
    } catch (error) {
      logger.error('Error fetching geofences:', error);
      throw error;
    }
  }

  /**
   * Get geofence by ID
   */
  async getGeofenceById(id, institutionId) {
    try {
      const geofence = await Geofence.findOne({
        _id: id,
        institution: institutionId
      }).populate('metadata.createdBy', 'name email');

      if (!geofence) {
        return {
          success: false,
          message: 'Geofence not found'
        };
      }

      return {
        success: true,
        data: geofence
      };
    } catch (error) {
      logger.error('Error fetching geofence:', error);
      throw error;
    }
  }

  /**
   * Update geofence
   */
  async updateGeofence(id, data, institutionId, updatedBy) {
    try {
      const geofence = await Geofence.findOne({
        _id: id,
        institution: institutionId
      });

      if (!geofence) {
        return {
          success: false,
          message: 'Geofence not found'
        };
      }

      // Update fields
      if (data.name) geofence.name = data.name;
      if (data.description !== undefined) geofence.description = data.description;
      if (data.boundary) geofence.boundary = data.boundary;
      if (data.center) geofence.center = data.center;
      if (data.radius) geofence.radius = data.radius;
      if (data.type) geofence.type = data.type;
      if (data.locationType) geofence.locationType = data.locationType;
      if (data.timeRestrictions) geofence.timeRestrictions = data.timeRestrictions;
      if (data.allowedUserTypes) geofence.allowedUserTypes = data.allowedUserTypes;
      if (data.isActive !== undefined) geofence.isActive = data.isActive;

      geofence.metadata.updatedBy = updatedBy;
      await geofence.save();

      logger.info(`Geofence updated: ${geofence.name} by user: ${updatedBy}`);
      
      return {
        success: true,
        data: {
          id: geofence._id,
          name: geofence.name,
          type: geofence.type,
          locationType: geofence.locationType,
          isActive: geofence.isActive,
          updatedAt: geofence.updatedAt
        }
      };
    } catch (error) {
      logger.error('Error updating geofence:', error);
      throw error;
    }
  }

  /**
   * Delete geofence
   */
  async deleteGeofence(id, institutionId, deletedBy) {
    try {
      const geofence = await Geofence.findOne({
        _id: id,
        institution: institutionId
      });

      if (!geofence) {
        return {
          success: false,
          message: 'Geofence not found'
        };
      }

      // Soft delete
      geofence.isDeleted = true;
      geofence.isActive = false;
      geofence.metadata.updatedBy = deletedBy;
      await geofence.save();

      logger.info(`Geofence deleted: ${geofence.name} by user: ${deletedBy}`);
      
      return {
        success: true,
        message: 'Geofence deleted successfully'
      };
    } catch (error) {
      logger.error('Error deleting geofence:', error);
      throw error;
    }
  }

  /**
   * Get campus geofences
   */
  async getCampusGeofences(institutionId) {
    try {
      const geofences = await Geofence.getCampusGeofences(institutionId);

      return {
        success: true,
        data: geofences
      };
    } catch (error) {
      logger.error('Error fetching campus geofences:', error);
      throw error;
    }
  }

  /**
   * Get transport geofences
   */
  async getTransportGeofences(institutionId) {
    try {
      const geofences = await Geofence.getTransportGeofences(institutionId);

      return {
        success: true,
        data: geofences
      };
    } catch (error) {
      logger.error('Error fetching transport geofences:', error);
      throw error;
    }
  }

  /**
   * Get geofence statistics
   */
  async getGeofenceStatistics(institutionId) {
    try {
      const totalGeofences = await Geofence.countDocuments({
        institution: institutionId,
        isDeleted: { $ne: true }
      });

      const activeGeofences = await Geofence.countDocuments({
        institution: institutionId,
        isActive: true,
        isDeleted: { $ne: true }
      });

      const inactiveGeofences = await Geofence.countDocuments({
        institution: institutionId,
        isActive: false,
        isDeleted: { $ne: true }
      });

      const typeStats = await Geofence.aggregate([
        {
          $match: {
            institution: institutionId,
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]);

      const locationTypeStats = await Geofence.aggregate([
        {
          $match: {
            institution: institutionId,
            isDeleted: { $ne: true }
          }
        },
        {
          $group: {
            _id: '$locationType',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        success: true,
        data: {
          totalGeofences,
          activeGeofences,
          inactiveGeofences,
          typeStats,
          locationTypeStats
        }
      };
    } catch (error) {
      logger.error('Error fetching geofence statistics:', error);
      throw error;
    }
  }

  /**
   * Bulk create geofences
   */
  async bulkCreateGeofences(geofencesData, institutionId, createdBy) {
    try {
      if (!Array.isArray(geofencesData) || geofencesData.length === 0) {
        throw new Error('Geofences data must be a non-empty array');
      }

      const createdGeofences = [];
      const errors = [];

      for (const geofenceData of geofencesData) {
        try {
          const {
            name,
            description,
            type,
            locationType,
            boundary,
            center,
            radius,
            timeRestrictions,
            allowedUserTypes
          } = geofenceData;

          if (!name) {
            errors.push({ data: geofenceData, error: 'Name is required' });
            continue; // Skip invalid geofences
          }

          const geofence = new Geofence({
            name,
            description,
            type,
            locationType,
            boundary,
            center,
            radius,
            timeRestrictions,
            allowedUserTypes,
            isActive: true,
            institution: institutionId,
            metadata: {
              createdBy,
              createdAt: new Date()
            }
          });

          await geofence.save();
          createdGeofences.push(geofence);
        } catch (error) {
          errors.push({ data: geofenceData, error: error.message });
        }
      }

      logger.info(`Bulk geofences created: ${createdGeofences.length} by user: ${createdBy}`);
      
      return {
        success: true,
        message: `Successfully created ${createdGeofences.length} geofences`,
        data: createdGeofences,
        errors
      };
    } catch (error) {
      logger.error('Error bulk creating geofences:', error);
      throw error;
    }
  }

  /**
   * Check data retention compliance
   */
  async checkDataRetentionCompliance(institutionId) {
    try {
      // This would typically check for geofence data that should be archived or deleted
      // based on data retention policies
      
      const activeGeofences = await Geofence.countDocuments({
        institution: institutionId,
        isActive: true,
        isDeleted: { $ne: true }
      });

      const totalGeofences = await Geofence.countDocuments({
        institution: institutionId,
        isDeleted: { $ne: true }
      });

      return {
        success: true,
        data: {
          activeGeofences,
          totalGeofences,
          complianceStatus: 'compliant', // This would be calculated based on actual retention policies
          recommendations: []
        }
      };
    } catch (error) {
      logger.error('Error checking data retention compliance:', error);
      throw error;
    }
  }

  /**
   * Find geofences by location
   */
  async findGeofencesByLocation(coordinates, institutionId) {
    try {
      if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        throw new Error('Invalid coordinates format');
      }

      const geofences = await Geofence.findByLocation(coordinates, institutionId);

      return {
        success: true,
        data: geofences
      };
    } catch (error) {
      logger.error('Error finding geofences by location:', error);
      throw error;
    }
  }

  /**
   * Get geofence by name
   */
  async getGeofenceByName(name, institutionId) {
    try {
      const geofence = await Geofence.findOne({
        name,
        institution: institutionId,
        isDeleted: { $ne: true }
      }).populate('metadata.createdBy', 'name email');

      if (!geofence) {
        return {
          success: false,
          message: 'Geofence not found'
        };
      }

      return {
        success: true,
        data: geofence
      };
    } catch (error) {
      logger.error('Error fetching geofence by name:', error);
      throw error;
    }
  }
}

module.exports = new GeofenceService();