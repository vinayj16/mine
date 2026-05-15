import Holiday from '../models/Holiday.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'cancelled', 'archived'];
const VALID_TYPES = ['national', 'regional', 'school', 'religious', 'cultural', 'optional', 'restricted'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];

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

// Helper function to validate date
const validateDate = (date, fieldName = 'Date') => {
  if (!date) {
    return fieldName + ' is required';
  }
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Helper function to validate date range
const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (start > end) {
    return 'Start date cannot be after end date';
  }
  return null;
};

const create = async (req, res) => {
  try {
    logger.info('Creating holiday');
    
    const { title, description, date, endDate, type, status, isRecurring, applicableTo } = req.body;
    
    // Validation
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Title is required');
    } else if (title.length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
    
    if (description && description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }
    
    const dateError = validateDate(date, 'Date');
    if (dateError) errors.push(dateError);
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) {
        errors.push(endDateError);
      } else if (date) {
        const rangeError = validateDateRange(date, endDate);
        if (rangeError) errors.push(rangeError);
      }
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (applicableTo && Array.isArray(applicableTo)) {
      for (let i = 0; i < Math.min(applicableTo.length, 10); i++) {
        const idError = validateObjectId(applicableTo[i], 'Applicable to ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Generate holiday ID
    const count = await Holiday.countDocuments({ institution: req.tenantId });
    const holidayId = 'H' + String(count + 1).padStart(6, '0');
    
    const holiday = new Holiday({
      ...req.body,
      holidayId,
      institution: req.tenantId,
      createdBy: req.user?.id
    });
    
    await holiday.save();
    
    logger.info('Holiday created successfully:', { holidayId: holiday._id, title });
    return createdResponse(res, holiday, 'Holiday created successfully');
  } catch (error) {
    logger.error('Error creating holiday:', error);
    return errorResponse(res, error.message);
  }
};

const getAll = async (req, res) => {
  try {
    logger.info('Fetching all holidays');
    
    const { page, limit, status, type, year, month, search, startDate, endDate } = req.query;
    
    // Validation
    const errors = [];
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        errors.push('Invalid year. Must be between 1900 and 2100');
      }
    }
    
    if (month) {
      const monthNum = parseInt(month);
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        errors.push('Invalid month. Must be between 1 and 12');
      }
    }
    
    if (startDate) {
      const startDateError = validateDate(startDate, 'Start date');
      if (startDateError) errors.push(startDateError);
    }
    
    if (endDate) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) errors.push(endDateError);
    }
    
    if (startDate && endDate) {
      const rangeError = validateDateRange(startDate, endDate);
      if (rangeError) errors.push(rangeError);
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: req.tenantId };
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (year || month) {
      const yearNum = parseInt(year) || new Date().getFullYear();
      const monthNum = month ? parseInt(month) - 1 : 0;
      
      if (month) {
        const startOfMonth = new Date(yearNum, monthNum, 1);
        const endOfMonth = new Date(yearNum, monthNum + 1, 0, 23, 59, 59);
        query.date = { $gte: startOfMonth, $lte: endOfMonth };
      } else {
        const startOfYear = new Date(yearNum, 0, 1);
        const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
        query.date = { $gte: startOfYear, $lte: endOfYear };
      }
    } else if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    const [holidays, total] = await Promise.all([
      Holiday.find(query)
        .populate('createdBy', 'name')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum),
      Holiday.countDocuments(query)
    ]);
    
    const result = {
      holidays,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    
    logger.info('Holidays fetched successfully');
    return successResponse(res, result, 'Holidays retrieved successfully');
  } catch (error) {
    logger.error('Error fetching holidays:', error);
    return errorResponse(res, error.message);
  }
};

const getById = async (req, res) => {
  try {
    logger.info('Fetching holiday by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Holiday ID');
    if (idError) errors.push(idError);
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const holiday = await Holiday.findOne({
      _id: id,
      institution: req.tenantId
    }).populate('createdBy', 'name');
    
    if (!holiday) {
      return notFoundResponse(res, 'Holiday not found');
    }
    
    logger.info('Holiday fetched successfully:', { holidayId: id });
    return successResponse(res, holiday, 'Holiday retrieved successfully');
  } catch (error) {
    logger.error('Error fetching holiday:', error);
    return errorResponse(res, error.message);
  }
};

const update = async (req, res) => {
  try {
    logger.info('Updating holiday');
    
    const { id } = req.params;
    const { title, description, date, endDate, type, status } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Holiday ID');
    if (idError) errors.push(idError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Title cannot be empty');
      } else if (title.length > 200) {
        errors.push('Title must not exceed 200 characters');
      }
    }
    
    if (description !== undefined && description.length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }
    
    if (date !== undefined) {
      const dateError = validateDate(date, 'Date');
      if (dateError) errors.push(dateError);
    }
    
    if (endDate !== undefined) {
      const endDateError = validateDate(endDate, 'End date');
      if (endDateError) {
        errors.push(endDateError);
      } else if (date) {
        const rangeError = validateDateRange(date, endDate);
        if (rangeError) errors.push(rangeError);
      }
    }
    
    if (type !== undefined && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const holiday = await Holiday.findOneAndUpdate(
      { _id: id, institution: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');
    
    if (!holiday) {
      return notFoundResponse(res, 'Holiday not found');
    }
    
    logger.info('Holiday updated successfully:', { holidayId: id });
    return successResponse(res, holiday, 'Holiday updated successfully');
  } catch (error) {
    logger.error('Error updating holiday:', error);
    return errorResponse(res, error.message);
  }
};

const deleteHoliday = async (req, res) => {
  try {
    logger.info('Deleting holiday');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Holiday ID');
    if (idError) errors.push(idError);
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const holiday = await Holiday.findOneAndDelete({
      _id: id,
      institution: req.tenantId
    });
    
    if (!holiday) {
      return notFoundResponse(res, 'Holiday not found');
    }
    
    logger.info('Holiday deleted successfully:', { holidayId: id });
    return successResponse(res, null, 'Holiday deleted successfully');
  } catch (error) {
    logger.error('Error deleting holiday:', error);
    return errorResponse(res, error.message);
  }
};

const getUpcomingHolidays = async (req, res) => {
  try {
    logger.info('Fetching upcoming holidays');
    
    const { limit, days } = req.query;
    
    // Validation
    const errors = [];
    
    const limitNum = parseInt(limit) || 10;
    const daysNum = parseInt(days) || 30;
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (daysNum < 1 || daysNum > 365) {
      errors.push('Days must be between 1 and 365');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysNum);
    futureDate.setHours(23, 59, 59, 999);
    
    const holidays = await Holiday.find({
      institution: req.tenantId,
      date: { $gte: today, $lte: futureDate },
      status: 'active'
    })
      .sort({ date: 1 })
      .limit(limitNum)
      .populate('createdBy', 'name');
    
    logger.info('Upcoming holidays fetched successfully');
    return successResponse(res, holidays, 'Upcoming holidays retrieved successfully');
  } catch (error) {
    logger.error('Error fetching upcoming holidays:', error);
    return errorResponse(res, error.message);
  }
};

const getHolidaysByType = async (req, res) => {
  try {
    logger.info('Fetching holidays by type');
    
    const { type } = req.params;
    const { page, limit, year } = req.query;
    
    // Validation
    const errors = [];
    
    if (!type || type.trim().length === 0) {
      errors.push('Type is required');
    } else if (!VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        errors.push('Invalid year. Must be between 1900 and 2100');
      }
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = {
      institution: req.tenantId,
      type: type
    };
    
    if (year) {
      const yearNum = parseInt(year);
      const startOfYear = new Date(yearNum, 0, 1);
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
      query.date = { $gte: startOfYear, $lte: endOfYear };
    }
    
    const skip = (pageNum - 1) * limitNum;
    
    const [holidays, total] = await Promise.all([
      Holiday.find(query)
        .populate('createdBy', 'name')
        .sort({ date: 1 })
        .skip(skip)
        .limit(limitNum),
      Holiday.countDocuments(query)
    ]);
    
    const result = {
      holidays,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
    
    logger.info('Holidays fetched successfully by type:', { type });
    return successResponse(res, result, 'Holidays retrieved successfully');
  } catch (error) {
    logger.error('Error fetching holidays by type:', error);
    return errorResponse(res, error.message);
  }
};

const getHolidayStatistics = async (req, res) => {
  try {
    logger.info('Fetching holiday statistics');
    
    const { year } = req.query;
    
    // Validation
    const errors = [];
    
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        errors.push('Invalid year. Must be between 1900 and 2100');
      }
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: req.tenantId };
    
    if (year) {
      const yearNum = parseInt(year);
      const startOfYear = new Date(yearNum, 0, 1);
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
      query.date = { $gte: startOfYear, $lte: endOfYear };
    }
    
    const [
      totalHolidays,
      byType,
      byStatus,
      upcomingCount
    ] = await Promise.all([
      Holiday.countDocuments(query),
      Holiday.aggregate([
        { $match: query },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Holiday.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Holiday.countDocuments({
        ...query,
        date: { $gte: new Date() },
        status: 'active'
      })
    ]);
    
    const statistics = {
      total: totalHolidays,
      upcoming: upcomingCount,
      byType: byType.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    };
    
    logger.info('Holiday statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching holiday statistics:', error);
    return errorResponse(res, error.message);
  }
};

const bulkCreateHolidays = async (req, res) => {
  try {
    logger.info('Bulk creating holidays');
    
    const { holidays } = req.body;
    
    // Validation
    const errors = [];
    
    if (!holidays || !Array.isArray(holidays) || holidays.length === 0) {
      errors.push('Holidays array is required and must not be empty');
    } else {
      if (holidays.length > 50) {
        errors.push('Cannot create more than 50 holidays at once');
      }
      
      for (let i = 0; i < Math.min(holidays.length, 10); i++) {
        const holiday = holidays[i];
        
        if (!holiday.title || holiday.title.trim().length === 0) {
          errors.push('Title is required for holiday at index ' + i);
          break;
        }
        
        if (!holiday.date) {
          errors.push('Date is required for holiday at index ' + i);
          break;
        }
        
        const dateError = validateDate(holiday.date, 'Date at index ' + i);
        if (dateError) {
          errors.push(dateError);
          break;
        }
      }
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const count = await Holiday.countDocuments({ institution: req.tenantId });
    
    const holidaysToCreate = holidays.map((holiday, index) => ({
      ...holiday,
      holidayId: 'H' + String(count + index + 1).padStart(6, '0'),
      institution: req.tenantId,
      createdBy: req.user?.id
    }));
    
    const createdHolidays = await Holiday.insertMany(holidaysToCreate);
    
    logger.info('Holidays created successfully:', { count: createdHolidays.length });
    return createdResponse(res, { holidays: createdHolidays, count: createdHolidays.length }, 'Holidays created successfully');
  } catch (error) {
    logger.error('Error bulk creating holidays:', error);
    return errorResponse(res, error.message);
  }
};

const bulkDeleteHolidays = async (req, res) => {
  try {
    logger.info('Bulk deleting holidays');
    
    const { holidayIds } = req.body;
    
    // Validation
    const errors = [];
    
    if (!holidayIds || !Array.isArray(holidayIds) || holidayIds.length === 0) {
      errors.push('Holiday IDs array is required and must not be empty');
    } else {
      if (holidayIds.length > 100) {
        errors.push('Cannot delete more than 100 holidays at once');
      }
      
      for (let i = 0; i < Math.min(holidayIds.length, 10); i++) {
        const idError = validateObjectId(holidayIds[i], 'Holiday ID at index ' + i);
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Holiday.deleteMany({
      _id: { $in: holidayIds },
      institution: req.tenantId
    });
    
    logger.info('Holidays deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Holidays deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting holidays:', error);
    return errorResponse(res, error.message);
  }
};

const exportHolidays = async (req, res) => {
  try {
    logger.info('Exporting holidays');
    
    const { format, year, type, status } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (year) {
      const yearNum = parseInt(year);
      if (isNaN(yearNum) || yearNum < 1900 || yearNum > 2100) {
        errors.push('Invalid year. Must be between 1900 and 2100');
      }
    }
    
    if (type && !VALID_TYPES.includes(type)) {
      errors.push('Invalid type. Must be one of: ' + VALID_TYPES.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (!req.tenantId) {
      errors.push('Institution information is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: req.tenantId };
    
    if (type) query.type = type;
    if (status) query.status = status;
    
    if (year) {
      const yearNum = parseInt(year);
      const startOfYear = new Date(yearNum, 0, 1);
      const endOfYear = new Date(yearNum, 11, 31, 23, 59, 59);
      query.date = { $gte: startOfYear, $lte: endOfYear };
    }
    
    const holidays = await Holiday.find(query)
      .populate('createdBy', 'name')
      .sort({ date: 1 });
    
    const exportData = {
      format: format.toLowerCase(),
      data: holidays,
      count: holidays.length,
      exportedAt: new Date()
    };
    
    logger.info('Holidays exported successfully:', { format, count: holidays.length });
    return successResponse(res, exportData, 'Holidays exported successfully');
  } catch (error) {
    logger.error('Error exporting holidays:', error);
    return errorResponse(res, error.message);
  }
};


export default {
  create,
  getAll,
  getById,
  update,
  deleteHoliday,
  getUpcomingHolidays,
  getHolidaysByType,
  getHolidayStatistics,
  bulkCreateHolidays,
  bulkDeleteHolidays,
  exportHolidays
};
