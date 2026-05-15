/**
 * Academic Engine Controller
 * Handles academic structure configuration for different institution types
 * Supports: Schools, Inter Colleges, Degree Colleges
 */

import academicEngineService from '../services/academicEngineService.js';
import ApiResponse from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

// Cache for academic configurations (in-memory, consider Redis for production)
const configCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Validate institution type
 */
const validateInstitutionType = (type) => {
  const validTypes = ['SCHOOL', 'INTER_COLLEGE', 'DEGREE_COLLEGE'];
  if (!type) {
    throw new Error('Institution type is required');
  }
  if (!validTypes.includes(type.toUpperCase())) {
    throw new Error(`Invalid institution type. Must be one of: ${validTypes.join(', ')}`);
  }
  return type.toUpperCase();
};

/**
 * Get from cache or fetch
 */
const getCachedOrFetch = (key, fetchFn) => {
  const cached = configCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug(`Cache hit for key: ${key}`);
    return cached.data;
  }
  
  const data = fetchFn();
  configCache.set(key, { data, timestamp: Date.now() });
  logger.debug(`Cache miss for key: ${key}, fetched fresh data`);
  return data;
};

/**
 * Clear cache for specific type or all
 */
const clearCache = async (req, res, next) => {
  try {
    const { type } = req.params;
    
    if (type) {
      const validatedType = validateInstitutionType(type);
      // Clear specific type cache
      for (const [key] of configCache) {
        if (key.includes(validatedType)) {
          configCache.delete(key);
        }
      }
      logger.info(`Cache cleared for institution type: ${validatedType}`);
      return ApiResponse.success(res, `Cache cleared for ${validatedType}`);
    }
    
    // Clear all cache
    configCache.clear();
    logger.info('All cache cleared');
    return ApiResponse.success(res, 'All cache cleared successfully');
  } catch (error) {
    logger.error('Error clearing cache:', error);
    next(error);
  }
};

/**
 * Get academic structure for institution type
 * @route GET /api/v1/academic-engine/:type/structure
 */
const getAcademicStructure = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const structure = getCachedOrFetch(
      `structure_${type}_${institutionId}`,
      () => academicEngineService.getAcademicStructure(type, institutionId)
    );
    
    logger.info(`Academic structure retrieved for: ${type}`, {
      userId: req.user?.id,
      institutionType: type,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'Academic structure retrieved successfully',
      structure
    );
  } catch (error) {
    logger.error('Error getting academic structure:', error);
    next(error);
  }
};

/**
 * Get available modules for institution type
 * @route GET /api/v1/academic-engine/:type/modules
 */
const getAvailableModules = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const modules = getCachedOrFetch(
      `modules_${type}_${institutionId}`,
      () => academicEngineService.getAvailableModules(type, institutionId)
    );
    
    logger.info(`Available modules retrieved for: ${type}`, {
      userId: req.user?.id,
      moduleCount: modules.length,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'Available modules retrieved successfully',
      {
        institutionType: type,
        modules,
        totalModules: modules.length
      }
    );
  } catch (error) {
    logger.error('Error getting available modules:', error);
    next(error);
  }
};

/**
 * Get student grouping logic for institution type
 * @route GET /api/v1/academic-engine/:type/grouping
 */
const getStudentGroupingLogic = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const logic = getCachedOrFetch(
      `grouping_${type}_${institutionId}`,
      () => academicEngineService.getStudentGroupingLogic(type, institutionId)
    );
    
    if (!logic) {
      return ApiResponse.notFound(res, `No grouping logic found for ${type}`);
    }
    
    logger.info(`Student grouping logic retrieved for: ${type}`, {
      userId: req.user?.id,
      groupBy: logic.groupBy,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'Student grouping logic retrieved successfully',
      {
        institutionType: type,
        ...logic
      }
    );
  } catch (error) {
    logger.error('Error getting student grouping logic:', error);
    next(error);
  }
};

/**
 * Get attendance rules for institution type
 * @route GET /api/v1/academic-engine/:type/attendance-rules
 */
const getAttendanceRules = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const rules = getCachedOrFetch(
      `attendance_${type}_${institutionId}`,
      () => academicEngineService.getAttendanceRules(type, institutionId)
    );
    
    logger.info(`Attendance rules retrieved for: ${type}`, {
      userId: req.user?.id,
      minimumRequired: rules.minimumRequired,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'Attendance rules retrieved successfully',
      {
        institutionType: type,
        ...rules
      }
    );
  } catch (error) {
    logger.error('Error getting attendance rules:', error);
    next(error);
  }
};

/**
 * Get exam system for institution type
 * @route GET /api/v1/academic-engine/:type/exam-system
 */
const getExamSystem = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const system = getCachedOrFetch(
      `exam_${type}_${institutionId}`,
      () => academicEngineService.getExamSystem(type, institutionId)
    );
    
    logger.info(`Exam system retrieved for: ${type}`, {
      userId: req.user?.id,
      examType: system.type,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'Exam system retrieved successfully',
      {
        institutionType: type,
        ...system
      }
    );
  } catch (error) {
    logger.error('Error getting exam system:', error);
    next(error);
  }
};

/**
 * Get required roles for institution type
 * @route GET /api/v1/academic-engine/:type/roles
 */
const getRequiredRoles = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const roles = getCachedOrFetch(
      `roles_${type}_${institutionId}`,
      () => academicEngineService.getRequiredRoles(type, institutionId)
    );
    
    logger.info(`Required roles retrieved for: ${type}`, {
      userId: req.user?.id,
      roleCount: roles.length,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'Required roles retrieved successfully',
      {
        institutionType: type,
        roles,
        totalRoles: roles.length
      }
    );
  } catch (error) {
    logger.error('Error getting required roles:', error);
    next(error);
  }
};

/**
 * Get all configurations for institution type
 * @route GET /api/v1/academic-engine/:type/all
 */
const getAllConfigs = async (req, res, next) => {
  try {
    const type = validateInstitutionType(req.params.type);
    const institutionId = req.user?.institutionId || req.query.institutionId;
    
    if (!institutionId) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    // Check if full config is cached
    const cacheKey = `all_configs_${type}_${institutionId}`;
    const cached = configCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.debug(`Full config cache hit for: ${type}`);
      return ApiResponse.success(
        res,
        'All configurations retrieved successfully',
        cached.data
      );
    }
    
    // Fetch all configs
    const configs = {
      institutionType: type,
      institutionId,
      structure: await academicEngineService.getAcademicStructure(type, institutionId),
      modules: await academicEngineService.getAvailableModules(type, institutionId),
      grouping: await academicEngineService.getStudentGroupingLogic(type, institutionId),
      attendance: await academicEngineService.getAttendanceRules(type, institutionId),
      exam: await academicEngineService.getExamSystem(type, institutionId),
      roles: await academicEngineService.getRequiredRoles(type, institutionId),
      metadata: {
        retrievedAt: new Date().toISOString(),
        cacheEnabled: true,
        cacheTTL: CACHE_TTL / 1000 // in seconds
      }
    };
    
    // Cache the full config
    configCache.set(cacheKey, { data: configs, timestamp: Date.now() });
    
    logger.info(`All configurations retrieved for: ${type}`, {
      userId: req.user?.id,
      moduleCount: configs.modules.length,
      roleCount: configs.roles.length,
      institutionId
    });
    
    return ApiResponse.success(
      res,
      'All configurations retrieved successfully',
      configs
    );
  } catch (error) {
    logger.error('Error getting all configurations:', error);
    next(error);
  }
};

/**
 * Get supported institution types
 * @route GET /api/v1/academic-engine/types
 */
const getSupportedTypes = async (req, res, next) => {
  try {
    const types = [
      {
        type: 'SCHOOL',
        name: 'School',
        description: 'K-12 educational institutions with class-based structure',
        features: ['Classes', 'Sections', 'Annual Exams', 'Parent Portal']
      },
      {
        type: 'INTER_COLLEGE',
        name: 'Intermediate College',
        description: 'Pre-university colleges with stream-based structure',
        features: ['Streams', 'Board Exams', 'Practicals', 'Year-wise Promotion']
      },
      {
        type: 'DEGREE_COLLEGE',
        name: 'Degree College',
        description: 'Higher education institutions with semester and credit system',
        features: ['Departments', 'Courses', 'Semesters', 'Credits', 'GPA/CGPA', 'Backlogs']
      }
    ];
    
    logger.info('Supported institution types retrieved', {
      userId: req.user?.id,
      typeCount: types.length
    });
    
    return ApiResponse.success(
      res,
      'Supported institution types retrieved successfully',
      {
        types,
        totalTypes: types.length
      }
    );
  } catch (error) {
    logger.error('Error getting supported types:', error);
    next(error);
  }
};

/**
 * Compare configurations between institution types
 * @route GET /api/v1/academic-engine/compare
 */
const compareConfigurations = async (req, res, next) => {
  try {
    const { types, institutionId } = req.query;
    
    if (!types) {
      return ApiResponse.badRequest(res, 'Types parameter is required (comma-separated)');
    }
    
    const institutionIdValue = req.user?.institutionId || institutionId;
    
    if (!institutionIdValue) {
      return ApiResponse.badRequest(res, 'Institution ID is required');
    }
    
    const typeArray = types.split(',').map(t => t.trim().toUpperCase());
    
    // Validate all types
    typeArray.forEach(type => validateInstitutionType(type));
    
    const comparison = {};
    
    for (const type of typeArray) {
      comparison[type] = {
        structure: await academicEngineService.getAcademicStructure(type, institutionIdValue),
        modules: await academicEngineService.getAvailableModules(type, institutionIdValue),
        grouping: await academicEngineService.getStudentGroupingLogic(type, institutionIdValue),
        attendance: await academicEngineService.getAttendanceRules(type, institutionIdValue),
        exam: await academicEngineService.getExamSystem(type, institutionIdValue),
        roles: await academicEngineService.getRequiredRoles(type, institutionIdValue)
      };
    }
    
    logger.info('Configuration comparison generated', {
      userId: req.user?.id,
      types: typeArray,
      institutionId: institutionIdValue
    });
    
    return ApiResponse.success(
      res,
      'Configuration comparison generated successfully',
      {
        comparedTypes: typeArray,
        comparison
      }
    );
  } catch (error) {
    logger.error('Error comparing configurations:', error);
    next(error);
  }
};

/**
 * Get cache statistics
 * @route GET /api/v1/academic-engine/cache-stats
 */
const getCacheStats = async (req, res, next) => {
  try {
    const stats = {
      totalEntries: configCache.size,
      entries: [],
      cacheTTL: CACHE_TTL / 1000, // in seconds
      currentTime: Date.now()
    };
    
    for (const [key, value] of configCache) {
      const age = Date.now() - value.timestamp;
      const remaining = Math.max(0, CACHE_TTL - age);
      
      stats.entries.push({
        key,
        age: Math.floor(age / 1000), // in seconds
        remainingTTL: Math.floor(remaining / 1000), // in seconds
        expired: remaining <= 0
      });
    }
    
    logger.info('Cache statistics retrieved', {
      userId: req.user?.id,
      totalEntries: stats.totalEntries
    });
    
    return ApiResponse.success(
      res,
      'Cache statistics retrieved successfully',
      stats
    );
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    next(error);
  }
};

export default {
  getAcademicStructure,
  getAvailableModules,
  getStudentGroupingLogic,
  getAttendanceRules,
  getExamSystem,
  getRequiredRoles,
  getAllConfigs,
  getSupportedTypes,
  compareConfigurations,
  getCacheStats,
  clearCache
};
