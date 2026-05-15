import Geofence from '../models/geofence.js';
import { logger } from '../utils/logger.js';

// Middleware to validate location within geofence for attendance
export const validateGeofenceForAttendance = async (req, res, next) => {
  try {
    const { latitude, longitude, userType } = req.body;
    const institutionId = req.user.institution;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for geofence validation'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates for geofence validation'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    // Find geofences that contain this location
    const geofences = await Geofence.find({
      institution: institutionId,
      isActive: true,
      isDeleted: false
    });

    let isValidLocation = false;
    const violations = [];

    for (const geofence of geofences) {
      // Check if location is within boundary
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
          isValidLocation = true;
          break; // Found a valid geofence
        }
      }
    }

    if (!isValidLocation) {
      logger.warn(`Geofence validation failed for attendance: lat=${latitude}, lon=${longitude}, user=${req.user.name}, violations=${violations.length}`);
      
      return res.status(403).json({
        success: false,
        message: 'Attendance not allowed: Outside campus boundaries or time restrictions',
        code: 'GEOFENCE_VIOLATION',
        violations
      });
    }

    // Add geofence info to request
    req.geofenceValidation = {
      isValid: true,
      coordinates,
      timestamp: new Date().toISOString()
    };

    logger.info(`Geofence validation passed for attendance: lat=${latitude}, lon=${longitude}, user=${req.user.name}`);

    next();

  } catch (error) {
    logger.error('Error validating geofence for attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during geofence validation'
    });
  }
};

// Middleware to validate location within geofence for transport tracking
export const validateGeofenceForTransport = async (req, res, next) => {
  try {
    const { latitude, longitude, vehicleId } = req.body;
    const institutionId = req.user.institution;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for transport geofence validation'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates for transport geofence validation'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    // Find transport geofences
    const transportGeofences = await Geofence.find({
      institution: institutionId,
      type: 'transport',
      isActive: true,
      isDeleted: false
    });

    let isWithinTransportGeofence = false;
    const violations = [];

    for (const geofence of transportGeofences) {
      let isWithinBoundary = false;

      if (geofence.boundary && geofence.boundary.coordinates) {
        isWithinBoundary = geofence.isWithinBoundary(coordinates);
      } else if (geofence.center && geofence.radius) {
        isWithinBoundary = geofence.isWithinBoundary(coordinates);
      }

      if (isWithinBoundary) {
        isWithinTransportGeofence = true;
        break;
      }
    }

    // For transport, we might want to log when vehicle is outside geofence but not block the request
    if (!isWithinTransportGeofence) {
      logger.warn(`Transport vehicle outside geofence: vehicle=${vehicleId}, lat=${latitude}, lon=${longitude}`);
      
      // Add warning to request but don't block
      req.geofenceValidation = {
        isValid: false,
        isWithinTransportGeofence: false,
        coordinates,
        timestamp: new Date().toISOString(),
        warning: 'Vehicle outside designated transport geofence'
      };
    } else {
      req.geofenceValidation = {
        isValid: true,
        isWithinTransportGeofence: true,
        coordinates,
        timestamp: new Date().toISOString()
      };
    }

    logger.info(`Transport geofence validation: vehicle=${vehicleId}, lat=${latitude}, lon=${longitude}, valid=${isWithinTransportGeofence}`);

    next();

  } catch (error) {
    logger.error('Error validating geofence for transport:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during transport geofence validation'
    });
  }
};

// Middleware to validate location within geofence for general access
export const validateGeofenceForAccess = async (req, res, next) => {
  try {
    const { latitude, longitude, userType, accessType } = req.body;
    const institutionId = req.user.institution;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for access geofence validation'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates for access geofence validation'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    // Find relevant geofences based on access type
    const query = {
      institution: institutionId,
      isActive: true,
      isDeleted: false
    };

    if (accessType) {
      query.type = accessType;
    }

    const geofences = await Geofence.find(query);

    let isValidLocation = false;
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
          isValidLocation = true;
          break;
        }
      }
    }

    if (!isValidLocation) {
      logger.warn(`Access geofence validation failed: lat=${latitude}, lon=${longitude}, user=${req.user.name}, accessType=${accessType}`);
      
      return res.status(403).json({
        success: false,
        message: 'Access denied: Outside authorized area or time restrictions',
        code: 'ACCESS_GEOFENCE_VIOLATION',
        violations
      });
    }

    req.geofenceValidation = {
      isValid: true,
      coordinates,
      accessType,
      timestamp: new Date().toISOString()
    };

    logger.info(`Access geofence validation passed: lat=${latitude}, lon=${longitude}, user=${req.user.name}, accessType=${accessType}`);

    next();

  } catch (error) {
    logger.error('Error validating geofence for access:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during access geofence validation'
    });
  }
};

// Middleware to validate location within campus geofence
export const validateCampusGeofence = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const institutionId = req.user.institution;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required for campus geofence validation'
      });
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Invalid coordinates for campus geofence validation'
      });
    }

    const coordinates = [parseFloat(longitude), parseFloat(latitude)];

    // Find campus geofences
    const campusGeofences = await Geofence.find({
      institution: institutionId,
      type: 'campus',
      isActive: true,
      isDeleted: false
    });

    let isWithinCampus = false;

    for (const geofence of campusGeofences) {
      let isWithinBoundary = false;

      if (geofence.boundary && geofence.boundary.coordinates) {
        isWithinBoundary = geofence.isWithinBoundary(coordinates);
      } else if (geofence.center && geofence.radius) {
        isWithinBoundary = geofence.isWithinBoundary(coordinates);
      }

      if (isWithinBoundary) {
        isWithinCampus = true;
        break;
      }
    }

    if (!isWithinCampus) {
      logger.warn(`Campus geofence validation failed: lat=${latitude}, lon=${longitude}, user=${req.user.name}`);
      
      return res.status(403).json({
        success: false,
        message: 'Action not allowed: Outside campus boundaries',
        code: 'CAMPUS_GEOFENCE_VIOLATION'
      });
    }

    req.geofenceValidation = {
      isValid: true,
      isWithinCampus: true,
      coordinates,
      timestamp: new Date().toISOString()
    };

    logger.info(`Campus geofence validation passed: lat=${latitude}, lon=${longitude}, user=${req.user.name}`);

    next();

  } catch (error) {
    logger.error('Error validating campus geofence:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during campus geofence validation'
    });
  }
};
