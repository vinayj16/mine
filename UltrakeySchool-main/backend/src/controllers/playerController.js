import Player from '../models/Player.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_STATUSES = ['active', 'inactive', 'injured', 'suspended', 'retired'];
const VALID_POSITIONS = ['forward', 'midfielder', 'defender', 'goalkeeper', 'striker', 'winger', 'center', 'guard', 'point-guard', 'shooting-guard', 'small-forward', 'power-forward', 'batsman', 'bowler', 'all-rounder', 'wicket-keeper'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_JERSEY_NUMBER = 999;

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

// Helper function to validate date format
const validateDate = (date, fieldName = 'Date') => {
  if (!date) return null; // Date is optional
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

// Create player
const createPlayer = async (req, res) => {
  try {
    logger.info('Creating player');
    
    const { studentId, sportId, sportName, jerseyNumber, position, status, joinDate, achievements, description } = req.body;
    const tenantId = req.tenantId;
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    const sportIdError = validateObjectId(sportId, 'Sport ID');
    if (sportIdError) errors.push(sportIdError);
    
    if (sportName && sportName.length > MAX_NAME_LENGTH) {
      errors.push('Sport name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (jerseyNumber !== undefined) {
      if (typeof jerseyNumber !== 'number' || jerseyNumber < 1 || jerseyNumber > MAX_JERSEY_NUMBER) {
        errors.push('Jersey number must be between 1 and ' + MAX_JERSEY_NUMBER);
      }
    }
    
    if (position && !VALID_POSITIONS.includes(position)) {
      errors.push('Invalid position. Must be one of: ' + VALID_POSITIONS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (joinDate) {
      const joinDateError = validateDate(joinDate, 'Join date');
      if (joinDateError) errors.push(joinDateError);
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Generate player ID
    const count = await Player.countDocuments({ institution: tenantId });
    const playerId = 'SP' + String(count + 1).padStart(6, '0');
    
    const player = new Player({
      ...req.body,
      playerId,
      institution: tenantId,
      createdBy: userId
    });
    
    await player.save();
    
    logger.info('Player created successfully:', { playerId: player.playerId, playerDbId: player._id });
    return createdResponse(res, player, 'Player created successfully');
  } catch (error) {
    logger.error('Error creating player:', error);
    return errorResponse(res, error.message);
  }
};

// Get all players
const getAllPlayers = async (req, res) => {
  try {
    logger.info('Fetching all players');
    
    const { page, limit, status, sportId, sportName, position, search } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (sportId) {
      const sportIdError = validateObjectId(sportId, 'Sport ID');
      if (sportIdError) errors.push(sportIdError);
    }
    
    if (position && !VALID_POSITIONS.includes(position)) {
      errors.push('Invalid position. Must be one of: ' + VALID_POSITIONS.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    // Build query
    const query = { institution: tenantId };
    if (status) query.status = status;
    if (sportId) query.sportId = sportId;
    if (position) query.position = position;
    if (sportName) query.sportName = new RegExp(sportName, 'i');
    if (search) {
      query.$or = [
        { playerId: { $regex: search, $options: 'i' } },
        { sportName: { $regex: search, $options: 'i' } },
        { position: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (pageNum - 1) * limitNum;
    const players = await Player.find(query)
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Player.countDocuments(query);
    
    logger.info('Players fetched successfully');
    return successResponse(res, {
      players,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Players retrieved successfully');
  } catch (error) {
    logger.error('Error fetching players:', error);
    return errorResponse(res, error.message);
  }
};

// Get player by ID
const getPlayerById = async (req, res) => {
  try {
    logger.info('Fetching player by ID');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Player ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const player = await Player.findOne({
      _id: id,
      institution: tenantId
    })
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category')
      .populate('createdBy', 'name');
    
    if (!player) {
      return notFoundResponse(res, 'Player not found');
    }
    
    logger.info('Player fetched successfully:', { playerId: id });
    return successResponse(res, player, 'Player retrieved successfully');
  } catch (error) {
    logger.error('Error fetching player:', error);
    return errorResponse(res, error.message);
  }
};

// Update player
const updatePlayer = async (req, res) => {
  try {
    logger.info('Updating player');
    
    const { id } = req.params;
    const { sportName, jerseyNumber, position, status, joinDate, description } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Player ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (sportName !== undefined && sportName.length > MAX_NAME_LENGTH) {
      errors.push('Sport name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (jerseyNumber !== undefined) {
      if (typeof jerseyNumber !== 'number' || jerseyNumber < 1 || jerseyNumber > MAX_JERSEY_NUMBER) {
        errors.push('Jersey number must be between 1 and ' + MAX_JERSEY_NUMBER);
      }
    }
    
    if (position !== undefined && !VALID_POSITIONS.includes(position)) {
      errors.push('Invalid position. Must be one of: ' + VALID_POSITIONS.join(', '));
    }
    
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (joinDate !== undefined) {
      const joinDateError = validateDate(joinDate, 'Join date');
      if (joinDateError) errors.push(joinDateError);
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const player = await Player.findOneAndUpdate(
      { _id: id, institution: tenantId },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category');
    
    if (!player) {
      return notFoundResponse(res, 'Player not found');
    }
    
    logger.info('Player updated successfully:', { playerId: id });
    return successResponse(res, player, 'Player updated successfully');
  } catch (error) {
    logger.error('Error updating player:', error);
    return errorResponse(res, error.message);
  }
};

// Delete player
const deletePlayer = async (req, res) => {
  try {
    logger.info('Deleting player');
    
    const { id } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Player ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const player = await Player.findOneAndDelete({
      _id: id,
      institution: tenantId
    });
    
    if (!player) {
      return notFoundResponse(res, 'Player not found');
    }
    
    logger.info('Player deleted successfully:', { playerId: id });
    return successResponse(res, null, 'Player deleted successfully');
  } catch (error) {
    logger.error('Error deleting player:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete players
const bulkDeletePlayers = async (req, res) => {
  try {
    logger.info('Bulk deleting players');
    
    const { playerIds } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!playerIds || !Array.isArray(playerIds)) {
      errors.push('Player IDs must be an array');
    } else if (playerIds.length === 0) {
      errors.push('Player IDs array cannot be empty');
    } else if (playerIds.length > 100) {
      errors.push('Cannot delete more than 100 players at once');
    } else {
      for (const id of playerIds) {
        const idError = validateObjectId(id, 'Player ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Player.deleteMany({
      _id: { $in: playerIds },
      institution: tenantId
    });
    
    logger.info('Players bulk deleted successfully:', { count: result.deletedCount });
    return successResponse(res, { deletedCount: result.deletedCount }, 'Players deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting players:', error);
    return errorResponse(res, error.message);
  }
};

// Get players by sport
const getPlayersBySport = async (req, res) => {
  try {
    logger.info('Fetching players by sport');
    
    const { sportId } = req.params;
    const { page, limit, status } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const sportIdError = validateObjectId(sportId, 'Sport ID');
    if (sportIdError) errors.push(sportIdError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: tenantId, sportId };
    if (status) query.status = status;
    
    const skip = (pageNum - 1) * limitNum;
    const players = await Player.find(query)
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Player.countDocuments(query);
    
    logger.info('Players fetched by sport successfully:', { sportId });
    return successResponse(res, {
      players,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Players retrieved successfully');
  } catch (error) {
    logger.error('Error fetching players by sport:', error);
    return errorResponse(res, error.message);
  }
};

// Get players by status
const getPlayersByStatus = async (req, res) => {
  try {
    logger.info('Fetching players by status');
    
    const { status } = req.params;
    const { page, limit } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const skip = (pageNum - 1) * limitNum;
    const players = await Player.find({ institution: tenantId, status })
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    
    const total = await Player.countDocuments({ institution: tenantId, status });
    
    logger.info('Players fetched by status successfully:', { status });
    return successResponse(res, {
      players,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }, 'Players retrieved successfully');
  } catch (error) {
    logger.error('Error fetching players by status:', error);
    return errorResponse(res, error.message);
  }
};

// Update player status
const updatePlayerStatus = async (req, res) => {
  try {
    logger.info('Updating player status');
    
    const { id } = req.params;
    const { status } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Player ID');
    if (idError) errors.push(idError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const player = await Player.findOneAndUpdate(
      { _id: id, institution: tenantId },
      { status, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category');
    
    if (!player) {
      return notFoundResponse(res, 'Player not found');
    }
    
    logger.info('Player status updated successfully:', { playerId: id, status });
    return successResponse(res, player, 'Player status updated successfully');
  } catch (error) {
    logger.error('Error updating player status:', error);
    return errorResponse(res, error.message);
  }
};

// Get player statistics
const getPlayerStatistics = async (req, res) => {
  try {
    logger.info('Fetching player statistics');
    
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const totalPlayers = await Player.countDocuments({ institution: tenantId });
    const activePlayers = await Player.countDocuments({ institution: tenantId, status: 'active' });
    const inactivePlayers = await Player.countDocuments({ institution: tenantId, status: 'inactive' });
    const injuredPlayers = await Player.countDocuments({ institution: tenantId, status: 'injured' });
    const suspendedPlayers = await Player.countDocuments({ institution: tenantId, status: 'suspended' });
    
    const playersBySport = await Player.aggregate([
      { $match: { institution: tenantId } },
      { $group: { _id: '$sportId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    const playersByPosition = await Player.aggregate([
      { $match: { institution: tenantId } },
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const recentPlayers = await Player.find({ institution: tenantId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('studentId', 'firstName lastName')
      .populate('sportId', 'name')
      .select('playerId sportName position status createdAt');
    
    const statistics = {
      totalPlayers,
      activePlayers,
      inactivePlayers,
      injuredPlayers,
      suspendedPlayers,
      playersBySport: playersBySport.map(item => ({
        sportId: item._id,
        count: item.count
      })),
      playersByPosition: playersByPosition.map(item => ({
        position: item._id,
        count: item.count
      })),
      recentPlayers
    };
    
    logger.info('Player statistics fetched successfully');
    return successResponse(res, statistics, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching player statistics:', error);
    return errorResponse(res, error.message);
  }
};

// Export players
const exportPlayers = async (req, res) => {
  try {
    logger.info('Exporting players data');
    
    const { format, status, sportId } = req.query;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (status && !VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (sportId) {
      const sportIdError = validateObjectId(sportId, 'Sport ID');
      if (sportIdError) errors.push(sportIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const query = { institution: tenantId };
    if (status) query.status = status;
    if (sportId) query.sportId = sportId;
    
    const players = await Player.find(query)
      .populate('studentId', 'firstName lastName email')
      .populate('sportId', 'name category')
      .sort({ createdAt: -1 });
    
    const exportData = {
      format: format.toLowerCase(),
      exportedAt: new Date().toISOString(),
      totalPlayers: players.length,
      players: players.map(p => ({
        playerId: p.playerId,
        studentName: p.studentId ? p.studentId.firstName + ' ' + p.studentId.lastName : 'N/A',
        sportName: p.sportName,
        position: p.position,
        jerseyNumber: p.jerseyNumber,
        status: p.status,
        joinDate: p.joinDate
      }))
    };
    
    logger.info('Players data exported successfully:', { format, count: players.length });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting players data:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update player status
const bulkUpdatePlayerStatus = async (req, res) => {
  try {
    logger.info('Bulk updating player status');
    
    const { playerIds, status } = req.body;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (!playerIds || !Array.isArray(playerIds)) {
      errors.push('Player IDs must be an array');
    } else if (playerIds.length === 0) {
      errors.push('Player IDs array cannot be empty');
    } else if (playerIds.length > 100) {
      errors.push('Cannot update more than 100 players at once');
    } else {
      for (const id of playerIds) {
        const idError = validateObjectId(id, 'Player ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!status) {
      errors.push('Status is required');
    } else if (!VALID_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_STATUSES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await Player.updateMany(
      { _id: { $in: playerIds }, institution: tenantId },
      { $set: { status, updatedAt: new Date() } }
    );
    
    logger.info('Player status bulk updated successfully:', { count: result.modifiedCount, status });
    return successResponse(res, { updatedCount: result.modifiedCount }, 'Player status updated successfully');
  } catch (error) {
    logger.error('Error bulk updating player status:', error);
    return errorResponse(res, error.message);
  }
};

// Get player by student ID
const getPlayerByStudentId = async (req, res) => {
  try {
    logger.info('Fetching player by student ID');
    
    const { studentId } = req.params;
    const tenantId = req.tenantId;
    
    // Validation
    const errors = [];
    
    const studentIdError = validateObjectId(studentId, 'Student ID');
    if (studentIdError) errors.push(studentIdError);
    
    if (!tenantId) {
      errors.push('Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const players = await Player.find({
      studentId,
      institution: tenantId
    })
      .populate('studentId', 'firstName lastName email avatar classId sectionId')
      .populate('sportId', 'name category')
      .sort({ createdAt: -1 });
    
    logger.info('Players fetched by student ID successfully:', { studentId, count: players.length });
    return successResponse(res, players, 'Players retrieved successfully');
  } catch (error) {
    logger.error('Error fetching player by student ID:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createPlayer,
  getAllPlayers,
  getPlayerById,
  updatePlayer,
  deletePlayer,
  bulkDeletePlayers,
  getPlayersBySport,
  getPlayersByStatus,
  updatePlayerStatus,
  getPlayerStatistics,
  exportPlayers,
  bulkUpdatePlayerStatus,
  getPlayerByStudentId
};
