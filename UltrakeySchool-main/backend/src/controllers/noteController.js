import noteService from '../services/noteService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_NOTE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const VALID_NOTE_STATUSES = ['active', 'archived', 'trashed'];
const VALID_EXPORT_FORMATS = ['json', 'csv', 'xlsx', 'pdf'];
const MAX_TITLE_LENGTH = 200;
const MAX_CONTENT_LENGTH = 10000;
const MAX_TAG_LENGTH = 50;
const MAX_TAGS_COUNT = 20;

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

// Helper function to validate tags
const validateTags = (tags) => {
  if (!Array.isArray(tags)) {
    return 'Tags must be an array';
  }
  if (tags.length > MAX_TAGS_COUNT) {
    return 'Cannot have more than ' + MAX_TAGS_COUNT + ' tags';
  }
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      return 'All tags must be strings';
    }
    if (tag.length > MAX_TAG_LENGTH) {
      return 'Tag length must not exceed ' + MAX_TAG_LENGTH + ' characters';
    }
  }
  return null;
};

const createNote = async (req, res) => {
  try {
    logger.info('Creating new note');
    
    // Accept both 'content' and 'description' fields
    const { title, content, description, tags, priority, userId, institutionId, userName, userAvatar } = req.body;
    const noteContent = content || description;
    
    // Validation - make fields optional for flexibility
    const errors = [];
    
    if (!title || title.trim().length === 0) {
      errors.push('Note title is required');
    } else if (title.length > MAX_TITLE_LENGTH) {
      errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
    }
    
    // Content is optional - allow empty notes
    if (!noteContent || noteContent.trim().length === 0) {
      // Make content optional, use empty string
    } else if (noteContent.length > MAX_CONTENT_LENGTH) {
      errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
    }
    
    if (tags) {
      const tagsError = validateTags(tags);
      if (tagsError) errors.push(tagsError);
    }
    
    if (priority && !VALID_NOTE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.createNote(req.body);
    
    logger.info('Note created successfully:', { noteId: note._id });
    return createdResponse(res, note, 'Note created successfully');
  } catch (error) {
    logger.error('Error creating note:', error);
    return errorResponse(res, error.message);
  }
};

const getNoteById = async (req, res) => {
  try {
    logger.info('Fetching note by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.getNoteById(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note fetched successfully:', { noteId: id });
    return successResponse(res, note, 'Note retrieved successfully');
  } catch (error) {
    logger.error('Error fetching note:', error);
    return errorResponse(res, error.message);
  }
};

const getAllNotes = async (req, res) => {
  try {
    logger.info('Fetching all notes');
    
    const { page, limit, userId, institutionId, status, priority, search } = req.query;
    
    // Validation
    const errors = [];
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (status && !VALID_NOTE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_NOTE_STATUSES.join(', '));
    }
    
    if (priority && !VALID_NOTE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    if (search && search.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.getAllNotes({
      ...req.query,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Notes fetched successfully');
    return successResponse(res, result, 'Notes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notes:', error);
    return errorResponse(res, error.message);
  }
};

const updateNote = async (req, res) => {
  try {
    logger.info('Updating note');
    
    const { id } = req.params;
    const { title, content, tags, priority } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (title !== undefined) {
      if (!title || title.trim().length === 0) {
        errors.push('Note title cannot be empty');
      } else if (title.length > MAX_TITLE_LENGTH) {
        errors.push('Title must not exceed ' + MAX_TITLE_LENGTH + ' characters');
      }
    }
    
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        errors.push('Note content cannot be empty');
      } else if (content.length > MAX_CONTENT_LENGTH) {
        errors.push('Content must not exceed ' + MAX_CONTENT_LENGTH + ' characters');
      }
    }
    
    if (tags !== undefined) {
      const tagsError = validateTags(tags);
      if (tagsError) errors.push(tagsError);
    }
    
    if (priority !== undefined && !VALID_NOTE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.updateNote(id, req.body);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note updated successfully:', { noteId: id });
    return successResponse(res, note, 'Note updated successfully');
  } catch (error) {
    logger.error('Error updating note:', error);
    return errorResponse(res, error.message);
  }
};

const deleteNote = async (req, res) => {
  try {
    logger.info('Deleting note');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.deleteNote(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note deleted successfully:', { noteId: id });
    return successResponse(res, null, 'Note deleted successfully');
  } catch (error) {
    logger.error('Error deleting note:', error);
    return errorResponse(res, error.message);
  }
};

const toggleImportant = async (req, res) => {
  try {
    logger.info('Toggling note important status');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.toggleImportant(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note important status toggled:', { noteId: id, isImportant: note.isImportant });
    return successResponse(res, note, 'Note status updated successfully');
  } catch (error) {
    logger.error('Error toggling note important status:', error);
    return errorResponse(res, error.message);
  }
};

const moveToTrash = async (req, res) => {
  try {
    logger.info('Moving note to trash');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.moveToTrash(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note moved to trash:', { noteId: id });
    return successResponse(res, note, 'Note moved to trash successfully');
  } catch (error) {
    logger.error('Error moving note to trash:', error);
    return errorResponse(res, error.message);
  }
};

const restoreNote = async (req, res) => {
  try {
    logger.info('Restoring note from trash');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.restoreNote(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note restored from trash:', { noteId: id });
    return successResponse(res, note, 'Note restored successfully');
  } catch (error) {
    logger.error('Error restoring note:', error);
    return errorResponse(res, error.message);
  }
};

const restoreAllNotes = async (req, res) => {
  try {
    logger.info('Restoring all notes from trash');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (!userId && !institutionId) {
      errors.push('Either User ID or Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.restoreAllNotes(userId, institutionId);
    
    logger.info('All notes restored from trash:', { count: result.modifiedCount });
    return successResponse(res, result, 'All notes restored successfully');
  } catch (error) {
    logger.error('Error restoring all notes:', error);
    return errorResponse(res, error.message);
  }
};

const permanentDelete = async (req, res) => {
  try {
    logger.info('Permanently deleting note');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.permanentDelete(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note permanently deleted:', { noteId: id });
    return successResponse(res, null, 'Note permanently deleted');
  } catch (error) {
    logger.error('Error permanently deleting note:', error);
    return errorResponse(res, error.message);
  }
};

const getStatistics = async (req, res) => {
  try {
    logger.info('Fetching note statistics');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const stats = await noteService.getStatistics(userId, institutionId);
    
    logger.info('Note statistics fetched successfully');
    return successResponse(res, stats, 'Statistics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching note statistics:', error);
    return errorResponse(res, error.message);
  }
};

const getNotesByTag = async (req, res) => {
  try {
    logger.info('Fetching notes grouped by tag');
    
    const { userId, institutionId, tag } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (tag && tag.length > MAX_TAG_LENGTH) {
      errors.push('Tag must not exceed ' + MAX_TAG_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const grouped = await noteService.getNotesByTag(userId, institutionId);
    
    logger.info('Notes grouped by tag fetched successfully');
    return successResponse(res, grouped, 'Notes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notes by tag:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk update notes
const bulkUpdateNotes = async (req, res) => {
  try {
    logger.info('Bulk updating notes');
    
    const { noteIds, updateData } = req.body;
    
    // Validation
    const errors = [];
    
    if (!noteIds || !Array.isArray(noteIds)) {
      errors.push('Note IDs must be an array');
    } else if (noteIds.length === 0) {
      errors.push('Note IDs array cannot be empty');
    } else if (noteIds.length > 100) {
      errors.push('Cannot update more than 100 notes at once');
    } else {
      for (const id of noteIds) {
        const idError = validateObjectId(id, 'Note ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (!updateData || typeof updateData !== 'object') {
      errors.push('Update data is required');
    }
    
    if (updateData?.priority && !VALID_NOTE_PRIORITIES.includes(updateData.priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    if (updateData?.tags) {
      const tagsError = validateTags(updateData.tags);
      if (tagsError) errors.push(tagsError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.bulkUpdateNotes(noteIds, updateData);
    
    logger.info('Notes bulk updated successfully:', { count: result.modifiedCount });
    return successResponse(res, {
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    }, 'Notes updated successfully');
  } catch (error) {
    logger.error('Error bulk updating notes:', error);
    return errorResponse(res, error.message);
  }
};

// Bulk delete notes
const bulkDeleteNotes = async (req, res) => {
  try {
    logger.info('Bulk deleting notes');
    
    const { noteIds, permanent } = req.body;
    
    // Validation
    const errors = [];
    
    if (!noteIds || !Array.isArray(noteIds)) {
      errors.push('Note IDs must be an array');
    } else if (noteIds.length === 0) {
      errors.push('Note IDs array cannot be empty');
    } else if (noteIds.length > 100) {
      errors.push('Cannot delete more than 100 notes at once');
    } else {
      for (const id of noteIds) {
        const idError = validateObjectId(id, 'Note ID');
        if (idError) {
          errors.push(idError);
          break;
        }
      }
    }
    
    if (permanent !== undefined && typeof permanent !== 'boolean') {
      errors.push('Permanent must be a boolean value');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.bulkDeleteNotes(noteIds, permanent);
    
    logger.info('Notes bulk deleted successfully:', { count: result.deletedCount || result.modifiedCount });
    return successResponse(res, result, 'Notes deleted successfully');
  } catch (error) {
    logger.error('Error bulk deleting notes:', error);
    return errorResponse(res, error.message);
  }
};

// Export notes data
const exportNotes = async (req, res) => {
  try {
    logger.info('Exporting notes data');
    
    const { format, userId, institutionId, status, priority } = req.query;
    
    // Validation
    const errors = [];
    
    if (!format || format.trim().length === 0) {
      errors.push('Export format is required');
    } else if (!VALID_EXPORT_FORMATS.includes(format.toLowerCase())) {
      errors.push('Invalid export format. Must be one of: ' + VALID_EXPORT_FORMATS.join(', '));
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (status && !VALID_NOTE_STATUSES.includes(status)) {
      errors.push('Invalid status. Must be one of: ' + VALID_NOTE_STATUSES.join(', '));
    }
    
    if (priority && !VALID_NOTE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await noteService.exportNotes({
      format: format.toLowerCase(),
      userId,
      institutionId,
      status,
      priority
    });
    
    logger.info('Notes data exported successfully:', { format, count: exportData.totalRecords });
    return successResponse(res, exportData, 'Data exported successfully');
  } catch (error) {
    logger.error('Error exporting notes data:', error);
    return errorResponse(res, error.message);
  }
};

// Get note analytics
const getNoteAnalytics = async (req, res) => {
  try {
    logger.info('Fetching note analytics');
    
    const { userId, institutionId, startDate, endDate, groupBy } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    const validGroupBy = ['day', 'week', 'month', 'year'];
    if (groupBy && !validGroupBy.includes(groupBy)) {
      errors.push('Invalid groupBy. Must be one of: ' + validGroupBy.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const analytics = await noteService.getNoteAnalytics({
      userId,
      institutionId,
      startDate,
      endDate,
      groupBy
    });
    
    logger.info('Note analytics fetched successfully');
    return successResponse(res, analytics, 'Analytics retrieved successfully');
  } catch (error) {
    logger.error('Error fetching note analytics:', error);
    return errorResponse(res, error.message);
  }
};

// Search notes
const searchNotes = async (req, res) => {
  try {
    logger.info('Searching notes');
    
    const { query, page, limit, userId, institutionId, priority, tags } = req.query;
    
    // Validation
    const errors = [];
    
    if (!query || query.trim().length === 0) {
      errors.push('Search query is required');
    } else if (query.length > 200) {
      errors.push('Search query must not exceed 200 characters');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (priority && !VALID_NOTE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.searchNotes({
      query,
      page: pageNum,
      limit: limitNum,
      userId,
      institutionId,
      priority,
      tags
    });
    
    logger.info('Notes search completed:', { query, count: result.notes?.length || 0 });
    return successResponse(res, result, 'Search completed successfully');
  } catch (error) {
    logger.error('Error searching notes:', error);
    return errorResponse(res, error.message);
  }
};

// Archive note
const archiveNote = async (req, res) => {
  try {
    logger.info('Archiving note');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.archiveNote(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note archived successfully:', { noteId: id });
    return successResponse(res, note, 'Note archived successfully');
  } catch (error) {
    logger.error('Error archiving note:', error);
    return errorResponse(res, error.message);
  }
};

// Unarchive note
const unarchiveNote = async (req, res) => {
  try {
    logger.info('Unarchiving note');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.unarchiveNote(id);
    
    if (!note) {
      return notFoundResponse(res, 'Note not found');
    }
    
    logger.info('Note unarchived successfully:', { noteId: id });
    return successResponse(res, note, 'Note unarchived successfully');
  } catch (error) {
    logger.error('Error unarchiving note:', error);
    return errorResponse(res, error.message);
  }
};

// Duplicate note
const duplicateNote = async (req, res) => {
  try {
    logger.info('Duplicating note');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Note ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const note = await noteService.duplicateNote(id);
    
    if (!note) {
      return notFoundResponse(res, 'Source note not found');
    }
    
    logger.info('Note duplicated successfully:', { sourceId: id, duplicateId: note._id });
    return createdResponse(res, note, 'Note duplicated successfully');
  } catch (error) {
    logger.error('Error duplicating note:', error);
    return errorResponse(res, error.message);
  }
};

// Get notes by priority
const getNotesByPriority = async (req, res) => {
  try {
    logger.info('Fetching notes by priority');
    
    const { priority, userId, institutionId, page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    if (!priority) {
      errors.push('Priority is required');
    } else if (!VALID_NOTE_PRIORITIES.includes(priority)) {
      errors.push('Invalid priority. Must be one of: ' + VALID_NOTE_PRIORITIES.join(', '));
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    
    if (pageNum < 1) {
      errors.push('Page must be greater than 0');
    }
    
    if (limitNum < 1 || limitNum > 100) {
      errors.push('Limit must be between 1 and 100');
    }
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.getNotesByPriority({
      priority,
      userId,
      institutionId,
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Notes fetched by priority successfully:', { priority });
    return successResponse(res, result, 'Notes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notes by priority:', error);
    return errorResponse(res, error.message);
  }
};

// Empty trash (permanently delete all trashed notes)
const emptyTrash = async (req, res) => {
  try {
    logger.info('Emptying trash');
    
    const { userId, institutionId } = req.query;
    
    // Validation
    const errors = [];
    
    if (userId) {
      const userIdError = validateObjectId(userId, 'User ID');
      if (userIdError) errors.push(userIdError);
    }
    
    if (institutionId) {
      const institutionIdError = validateObjectId(institutionId, 'Institution ID');
      if (institutionIdError) errors.push(institutionIdError);
    }
    
    if (!userId && !institutionId) {
      errors.push('Either User ID or Institution ID is required');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const result = await noteService.emptyTrash(userId, institutionId);
    
    logger.info('Trash emptied successfully:', { count: result.deletedCount });
    return successResponse(res, result, 'Trash emptied successfully');
  } catch (error) {
    logger.error('Error emptying trash:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  createNote,
  getNoteById,
  getAllNotes,
  updateNote,
  deleteNote,
  toggleImportant,
  moveToTrash,
  restoreNote,
  restoreAllNotes,
  permanentDelete,
  getStatistics,
  getNotesByTag,
  bulkUpdateNotes,
  bulkDeleteNotes,
  exportNotes,
  getNoteAnalytics,
  searchNotes,
  archiveNote,
  unarchiveNote,
  duplicateNote,
  getNotesByPriority,
  emptyTrash
};
