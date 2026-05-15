import Geofence from '../models/geofence.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_GEOFENCE_TYPES = ['campus', 'transport', 'custom', 'restricted', 'safe_zone'];
const VALID_LOCATION_TYPES = ['building', 'classroom', 'library', 'playground', 'parking', 'bus_stop', 'custom'];
const VALID_USER_TYPES = ['student', 'teacher', 'staff', 'parent', 'admin', 'visitor'];

// Helper function to validate MongoDB ObjectId
const validateObjectId = (id, fieldName = 'ID') => {
  if (!id) {
    return fieldName + ' is required';
  }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate coordinates
const validateCoordinates = (coordinates, fieldName = 'Coordinates') => {
  if (!Array.isArray(coordinates)) {
    return fieldName + ' must be an array';
  }
  if (coordinates.length !== 2) {
    return fieldName + ' must have exactly 2 values [longitude, latitude]';
  }
  const [lng, lat] = coordinates;
  if (typeof lng !== 'number' || typeof lat !== 'number') {
    return fieldName + ' must contain numeric values';
  }
  if (lng < -180 || lng > 180) {
    return 'Longitude must be between -180 and 180';
  }
  if (lat < -90 || lat > 90) {
    return 'Latitude must be between -90 and 90';
  }
  return null;
};

// Create Geofence
const createGeofence = async (req, res) => {
  try {
    logger.info('Creating geofence');
    
    const {
      name,
      description,
      boundary,
      center,
      radius,
      type,
      locationType,
      timeRestrictions,
      allowedUserTypes
    } = req.body;

    const institutionId = req.user.institution;

    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!name || name.trim().length === 0) {
      errors.push('Geofence name is required');
    } else if (name.length > 200) {
      errors.push('Name must not exceed 200 characters');
    }
    
    if (description && description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }

    if (!boundary && (!center || !radius)) {
      errors.push('Either boundary (polygon) or center with radius (circle) is required');
    }

    // Validate boundary coordinates
    if (boundary) {
      if (!boundary.coordinates || !Array.isArray(boundary.coordinates)) {
        errors.push('Boundary must have coordinates array');
      } else if (boundary.coordinates.length < 3) {
        errors.push('Polygon boundary must have at least 3 points');
      } else {
        for (let i = 0; i < Math.min(boundary.coordinates.length, 5); i++) {
          const coordError = validateCoordinates(boundary.coordinates[i], 'Boundary coordinate at index ' + i);
          if (coordError) {
            errors.push(coordError);
            break;
          }
        }
      }
    }

    // Validate center coordinates
    if (center) {
      if (!center.coordinates) {
        errors.push('Center must have coordinates');
      } else {
        const centerError = validateCoordinates(center.coordinates, 'Center coordinates');
        if (centerError) errors.push(centerError);
      }
    }
    
    if (radius !== undefined) {
      const radiusNum = parseFloat(radius);
      if (isNaN(radiusNum) || radiusNum <= 0) {
        errors.push('Radius must be a positive number');
      } else if (radiusNum > 50000) {
        errors.push('Radius must not exceed 50000 meters');
      }
    }
    
    if (type && !VALID_GEOFENCE_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_GEOFENCE_TYPES.join(', '));
    }
    
    if (locationType && !VALID_LOCATION_TYPES.includes(locationType)) {
      errors.push('Invalid location type. Must be one of: ' + VALID_LOCATION_TYPES.join(', '));
    }
    
    if (allowedUserTypes && Array.isArray(allowedUserTypes)) {
      const invalidTypes = allowedUserTypes.filter(t => !VALID_USER_TYPES.includes(t));
      if (invalidTypes.length > 0) {
        errors.push('Invalid user types: ' + invalidTypes.join(', '));
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    // Create geofence
    const geofence = new Geofence({
      name,
      description,
      institution: institutionId,
      boundary: boundary || undefined,
      center: center || undefined,
      radius: radius || undefined,
      type: type || 'custom',
      locationType: locationType || 'custom',
      timeRestrictions: timeRestrictions || undefined,
      allowedUserTypes: allowedUserTypes || [],
      metadata: {
        createdBy: req.user.id
      }
    });

    await geofence.save();

    logger.info('Geofence created successfully:', { geofenceId: geofence._id, name: geofence.name });

    return createdResponse(res, {
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
    }, 'Geofence created successfully');

  } catch (error) {
    logger.error('Error creating geofence:', error);
    return errorResponse(res, error.message);
  }
};

// Validate Location within Geofence
const validateLocation = async (req, res) => {
  try {
    logger.info('Validating location within geofence');
    
    const { latitude, longitude, userType } = req.body;
    const institutionId = req.user.institution;

    // Validation
    const errors = [];
    
    const institutionIdError = validateObjectId(institutionId, 'Institution ID');
    if (institutionIdError) errors.push(institutionIdError);
    
    if (!latitude) {
      errors.push('Latitude is required');
    } else if (latitude < -90 || latitude > 90) {
      errors.push('Latitude must be between -90 and 90');
    }
    
    if (!longitude) {
      errors.push('Longitude is required');
    } else if (longitude < -180 || longitude > 180) {
      errors.push('Longitude must be between -180 and 180');
    }
    
    if (userType && !VALID_USER_TYPES.includes(userType)) {
      errors.push('Invalid user type. Must be one of: ' + VALID_USER_TYPES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    // Find geofences that contain this location
    const geofences = await Geofence.find({
      institution: institutionId,
      isActive: true,
      isDeleted: false
    });

    const validGeofences = [];
    const violations = [];

    for (const geofence of geofences) {
      let isWithinBoundary = false;

      if (geofence.boundary && geofence.boundary.coordinates) {
        isWithinBoundary = geofence.isWithinBoundary(coordinates);
      } else if (geofence.center && geofence.radius) {
        isWithinBoundary = geofence.isWithinBoundary(coordinates);
      }

      if (isWithinBoundary) {
        const isTimeRestricted = geofence.isTimeRestricted();
        const canAccess = geofence.canAccess(userType || req.user.role);

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
          validGeofences.push({
            id: geofence._id,
            name: geofence.name,
            type: geofence.type,
            locationType: geofence.locationType
          });
        }
      }
    }

    const isValid = validGeofences.length > 0 && violations.length === 0;

    logger.info('Location validated successfully:', { isValid, validCount: validGeofences.length, violationCount: violations.length });

    return successResponse(res, {
      isValid,
      coordinates,
      validGeofences,
      violations,
      timestamp: new Date().toISOString()
    }, 'Location validated successfully');

  } catch (error) {
    logger.error('Error validating location:', error);
    return errorResponse(res, error.message);
  }
};

// Get Geofences
const getGeofences = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, locationType, isActive } = req.query;
    const institutionId = req.user.institution;

    const query = { institution: institutionId, isDeleted: false };

    if (type) {
      query.type = type;
    }

    if (locationType) {
      query.locationType = locationType;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const geofences = await Geofence.find(query)
      .populate('metadata.createdBy', 'name email')
      .populate('metadata.updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Geofence.countDocuments(query);

    res.json({
      success: true,
      data: geofences,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching geofences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Geofence by ID
const getGeofenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.institution;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid geofence ID'
      });
    }

    const geofence = await Geofence.findOne({
      _id: id,
      institution: institutionId,
      isDeleted: false
    }).populate('metadata.createdBy', 'name email')
      .populate('metadata.updatedBy', 'name email');

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    res.json({
      success: true,
      data: geofence
    });

  } catch (error) {
    logger.error('Error fetching geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Update Geofence
const updateGeofence = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      boundary,
      center,
      radius,
      type,
      locationType,
      timeRestrictions,
      allowedUserTypes,
      isActive
    } = req.body;

    const institutionId = req.user.institution;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid geofence ID'
      });
    }

    const geofence = await Geofence.findOne({
      _id: id,
      institution: institutionId,
      isDeleted: false
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Update fields
    if (name) geofence.name = name;
    if (description !== undefined) geofence.description = description;
    if (boundary) geofence.boundary = boundary;
    if (center) geofence.center = center;
    if (radius) geofence.radius = radius;
    if (type) geofence.type = type;
    if (locationType) geofence.locationType = locationType;
    if (timeRestrictions) geofence.timeRestrictions = timeRestrictions;
    if (allowedUserTypes) geofence.allowedUserTypes = allowedUserTypes;
    if (isActive !== undefined) geofence.isActive = isActive;

    geofence.metadata.updatedBy = req.user.id;
    await geofence.save();

    logger.info(`Geofence updated: ${geofence.name} by user: ${req.user.name}`);

    res.json({
      success: true,
      message: 'Geofence updated successfully',
      data: {
        id: geofence._id,
        name: geofence.name,
        type: geofence.type,
        locationType: geofence.locationType,
        isActive: geofence.isActive,
        updatedAt: geofence.updatedAt
      }
    });

  } catch (error) {
    logger.error('Error updating geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete Geofence
const deleteGeofence = async (req, res) => {
  try {
    const { id } = req.params;
    const institutionId = req.user.institution;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid geofence ID'
      });
    }

    const geofence = await Geofence.findOne({
      _id: id,
      institution: institutionId,
      isDeleted: false
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Soft delete
    geofence.isDeleted = true;
    geofence.isActive = false;
    geofence.metadata.updatedBy = req.user.id;
    await geofence.save();

    logger.info(`Geofence deleted: ${geofence.name} by user: ${req.user.name}`);

    res.json({
      success: true,
      message: 'Geofence deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Campus Geofences
const getCampusGeofences = async (req, res) => {
  try {
    const institutionId = req.user.institution;

    const geofences = await Geofence.getCampusGeofences(institutionId);

    res.json({
      success: true,
      data: geofences
    });

  } catch (error) {
    logger.error('Error fetching campus geofences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Transport Geofences
const getTransportGeofences = async (req, res) => {
  try {
    const institutionId = req.user.institution;

    const geofences = await Geofence.getTransportGeofences(institutionId);

    res.json({
      success: true,
      data: geofences
    });

  } catch (error) {
    logger.error('Error fetching transport geofences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get Geofence Statistics
const getGeofenceStatistics = async (req, res) => {
  try {
    const institutionId = req.user.institution;

    const totalGeofences = await Geofence.countDocuments({
      institution: institutionId,
      isDeleted: false
    });

    const activeGeofences = await Geofence.countDocuments({
      institution: institutionId,
      isActive: true,
      isDeleted: false
    });

    const campusGeofences = await Geofence.countDocuments({
      institution: institutionId,
      type: 'campus',
      isDeleted: false
    });

    const transportGeofences = await Geofence.countDocuments({
      institution: institutionId,
      type: 'transport',
      isDeleted: false
    });

    const byType = await Geofence.aggregate([
      {
        $match: {
          institution: new mongoose.Types.ObjectId(institutionId),
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const byLocationType = await Geofence.aggregate([
      {
        $match: {
          institution: new mongoose.Types.ObjectId(institutionId),
          isDeleted: false
        }
      },
      {
        $group: {
          _id: '$locationType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        total: totalGeofences,
        active: activeGeofences,
        campus: campusGeofences,
        transport: transportGeofences,
        byType,
        byLocationType
      }
    });

  } catch (error) {
    logger.error('Error fetching geofence statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Bulk Create Geofences
const bulkCreateGeofences = async (req, res) => {
  try {
    const { geofences } = req.body;
    const institutionId = req.user.institution;

    if (!Array.isArray(geofences) || geofences.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Geofences array is required'
      });
    }

    const createdGeofences = [];

    for (const geofenceData of geofences) {
      const {
        name,
        description,
        boundary,
        center,
        radius,
        type,
        locationType,
        timeRestrictions,
        allowedUserTypes
      } = geofenceData;

      if (!name) {
        continue; // Skip invalid geofences
      }

      const geofence = new Geofence({
        name,
        description,
        institution: institutionId,
        boundary: boundary || undefined,
        center: center || undefined,
        radius: radius || undefined,
        type: type || 'custom',
        locationType: locationType || 'custom',
        timeRestrictions: timeRestrictions || undefined,
        allowedUserTypes: allowedUserTypes || [],
        metadata: {
          createdBy: req.user.id
        }
      });

      await geofence.save();
      createdGeofences.push(geofence);
    }

    logger.info(`Bulk geofences created: ${createdGeofences.length} by user: ${req.user.name}`);

    res.status(201).json({
      success: true,
      message: `Successfully created ${createdGeofences.length} geofences`,
      data: createdGeofences
    });

  } catch (error) {
    logger.error('Error bulk creating geofences:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  createGeofence,
  validateLocation,
  getGeofences,
  getGeofenceById,
  updateGeofence,
  deleteGeofence,
  getCampusGeofences,
  getTransportGeofences,
  getGeofenceStatistics,
  bulkCreateGeofences
};
