import themeService from '../services/themeService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const VALID_THEME_MODES = ['light', 'dark', 'auto', 'system'];
const VALID_COLOR_SCHEMES = ['default', 'blue', 'green', 'purple', 'red', 'orange', 'custom'];
const VALID_FONT_SIZES = ['small', 'medium', 'large', 'extra-large'];
const VALID_LAYOUTS = ['default', 'compact', 'comfortable', 'spacious'];
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

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

// Helper function to validate hex color
const validateHexColor = (color) => {
  if (!color) return null;
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (!hexRegex.test(color)) {
    return 'Invalid hex color format. Expected format: #RRGGBB or #RGB';
  }
  return null;
};

/**
 * Get user theme preferences
 */
const getUserTheme = async (req, res) => {
  try {
    logger.info('Fetching user theme preferences');
    
    const { userId } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.getUserTheme(userId);

    if (!theme) {
      return notFoundResponse(res, 'User theme preferences not found');
    }

    logger.info('User theme preferences fetched successfully:', { userId });
    return successResponse(res, theme, 'Theme preferences retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user theme preferences:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Update user theme preferences
 */
const updateUserTheme = async (req, res) => {
  try {
    logger.info('Updating user theme preferences');
    
    const { userId } = req.user;
    const { mode, colorScheme, fontSize, layout, primaryColor, secondaryColor } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (mode && !VALID_THEME_MODES.includes(mode)) {
      errors.push('Invalid theme mode. Must be one of: ' + VALID_THEME_MODES.join(', '));
    }
    
    if (colorScheme && !VALID_COLOR_SCHEMES.includes(colorScheme)) {
      errors.push('Invalid color scheme. Must be one of: ' + VALID_COLOR_SCHEMES.join(', '));
    }
    
    if (fontSize && !VALID_FONT_SIZES.includes(fontSize)) {
      errors.push('Invalid font size. Must be one of: ' + VALID_FONT_SIZES.join(', '));
    }
    
    if (layout && !VALID_LAYOUTS.includes(layout)) {
      errors.push('Invalid layout. Must be one of: ' + VALID_LAYOUTS.join(', '));
    }
    
    if (primaryColor) {
      const primaryColorError = validateHexColor(primaryColor);
      if (primaryColorError) errors.push('Primary color: ' + primaryColorError);
    }
    
    if (secondaryColor) {
      const secondaryColorError = validateHexColor(secondaryColor);
      if (secondaryColorError) errors.push('Secondary color: ' + secondaryColorError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.updateUserTheme(userId, req.body);

    logger.info('User theme preferences updated successfully:', { userId });
    return successResponse(res, theme, 'Theme preferences updated successfully');
  } catch (error) {
    logger.error('Error updating user theme preferences:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get system theme configuration
 */
const getSystemTheme = async (req, res) => {
  try {
    logger.info('Fetching system theme configuration');
    
    const { schoolId } = req.user;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.getSystemTheme(schoolId);

    if (!theme) {
      return notFoundResponse(res, 'System theme configuration not found');
    }

    logger.info('System theme configuration fetched successfully:', { schoolId });
    return successResponse(res, theme, 'System theme retrieved successfully');
  } catch (error) {
    logger.error('Error fetching system theme configuration:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Update system theme configuration
 */
const updateSystemTheme = async (req, res) => {
  try {
    logger.info('Updating system theme configuration');
    
    const { schoolId } = req.user;
    const { name, description, mode, colorScheme, primaryColor, secondaryColor, accentColor } = req.body;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (mode && !VALID_THEME_MODES.includes(mode)) {
      errors.push('Invalid theme mode. Must be one of: ' + VALID_THEME_MODES.join(', '));
    }
    
    if (colorScheme && !VALID_COLOR_SCHEMES.includes(colorScheme)) {
      errors.push('Invalid color scheme. Must be one of: ' + VALID_COLOR_SCHEMES.join(', '));
    }
    
    if (primaryColor) {
      const primaryColorError = validateHexColor(primaryColor);
      if (primaryColorError) errors.push('Primary color: ' + primaryColorError);
    }
    
    if (secondaryColor) {
      const secondaryColorError = validateHexColor(secondaryColor);
      if (secondaryColorError) errors.push('Secondary color: ' + secondaryColorError);
    }
    
    if (accentColor) {
      const accentColorError = validateHexColor(accentColor);
      if (accentColorError) errors.push('Accent color: ' + accentColorError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.updateSystemTheme(schoolId, req.body);

    logger.info('System theme configuration updated successfully:', { schoolId });
    return successResponse(res, theme, 'System theme updated successfully');
  } catch (error) {
    logger.error('Error updating system theme configuration:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get available themes
 */
const getAvailableThemes = async (req, res) => {
  try {
    logger.info('Fetching available themes');

    const themes = themeService.getAvailableThemes();

    logger.info('Available themes fetched successfully:', { count: themes.length });
    return successResponse(res, themes, 'Available themes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching available themes:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get design tokens
 */
const getDesignTokens = async (req, res) => {
  try {
    logger.info('Fetching design tokens');

    const tokens = themeService.getDesignTokens();

    logger.info('Design tokens fetched successfully');
    return successResponse(res, tokens, 'Design tokens retrieved successfully');
  } catch (error) {
    logger.error('Error fetching design tokens:', error);
    return errorResponse(res, error.message);
  }
};


/**
 * Reset user theme to default
 */
const resetUserTheme = async (req, res) => {
  try {
    logger.info('Resetting user theme to default');
    
    const { userId } = req.user;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.resetUserTheme(userId);

    logger.info('User theme reset to default successfully:', { userId });
    return successResponse(res, theme, 'Theme reset to default successfully');
  } catch (error) {
    logger.error('Error resetting user theme:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get theme by ID
 */
const getThemeById = async (req, res) => {
  try {
    logger.info('Fetching theme by ID');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Theme ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.getThemeById(id);

    if (!theme) {
      return notFoundResponse(res, 'Theme not found');
    }

    logger.info('Theme fetched successfully:', { themeId: id });
    return successResponse(res, theme, 'Theme retrieved successfully');
  } catch (error) {
    logger.error('Error fetching theme:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Create custom theme
 */
const createCustomTheme = async (req, res) => {
  try {
    logger.info('Creating custom theme');
    
    const { schoolId } = req.user;
    const { name, description, mode, colorScheme, primaryColor, secondaryColor, accentColor } = req.body;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!name || name.trim().length === 0) {
      errors.push('Theme name is required');
    } else if (name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (description && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (!mode) {
      errors.push('Theme mode is required');
    } else if (!VALID_THEME_MODES.includes(mode)) {
      errors.push('Invalid theme mode. Must be one of: ' + VALID_THEME_MODES.join(', '));
    }
    
    if (colorScheme && !VALID_COLOR_SCHEMES.includes(colorScheme)) {
      errors.push('Invalid color scheme. Must be one of: ' + VALID_COLOR_SCHEMES.join(', '));
    }
    
    if (primaryColor) {
      const primaryColorError = validateHexColor(primaryColor);
      if (primaryColorError) errors.push('Primary color: ' + primaryColorError);
    }
    
    if (secondaryColor) {
      const secondaryColorError = validateHexColor(secondaryColor);
      if (secondaryColorError) errors.push('Secondary color: ' + secondaryColorError);
    }
    
    if (accentColor) {
      const accentColorError = validateHexColor(accentColor);
      if (accentColorError) errors.push('Accent color: ' + accentColorError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.createCustomTheme(schoolId, req.body);

    logger.info('Custom theme created successfully:', { themeId: theme._id, name });
    return createdResponse(res, theme, 'Custom theme created successfully');
  } catch (error) {
    logger.error('Error creating custom theme:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Update custom theme
 */
const updateCustomTheme = async (req, res) => {
  try {
    logger.info('Updating custom theme');
    
    const { id } = req.params;
    const { name, description, mode, colorScheme, primaryColor, secondaryColor, accentColor } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Theme ID');
    if (idError) errors.push(idError);
    
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        errors.push('Theme name cannot be empty');
      } else if (name.length > MAX_NAME_LENGTH) {
        errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
      }
    }
    
    if (description !== undefined && description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push('Description must not exceed ' + MAX_DESCRIPTION_LENGTH + ' characters');
    }
    
    if (mode !== undefined && !VALID_THEME_MODES.includes(mode)) {
      errors.push('Invalid theme mode. Must be one of: ' + VALID_THEME_MODES.join(', '));
    }
    
    if (colorScheme !== undefined && !VALID_COLOR_SCHEMES.includes(colorScheme)) {
      errors.push('Invalid color scheme. Must be one of: ' + VALID_COLOR_SCHEMES.join(', '));
    }
    
    if (primaryColor !== undefined) {
      const primaryColorError = validateHexColor(primaryColor);
      if (primaryColorError) errors.push('Primary color: ' + primaryColorError);
    }
    
    if (secondaryColor !== undefined) {
      const secondaryColorError = validateHexColor(secondaryColor);
      if (secondaryColorError) errors.push('Secondary color: ' + secondaryColorError);
    }
    
    if (accentColor !== undefined) {
      const accentColorError = validateHexColor(accentColor);
      if (accentColorError) errors.push('Accent color: ' + accentColorError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.updateCustomTheme(id, req.body);

    if (!theme) {
      return notFoundResponse(res, 'Theme not found');
    }

    logger.info('Custom theme updated successfully:', { themeId: id });
    return successResponse(res, theme, 'Custom theme updated successfully');
  } catch (error) {
    logger.error('Error updating custom theme:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Delete custom theme
 */
const deleteCustomTheme = async (req, res) => {
  try {
    logger.info('Deleting custom theme');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Theme ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    await themeService.deleteCustomTheme(id);

    logger.info('Custom theme deleted successfully:', { themeId: id });
    return successResponse(res, null, 'Custom theme deleted successfully');
  } catch (error) {
    logger.error('Error deleting custom theme:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get custom themes by school
 */
const getCustomThemesBySchool = async (req, res) => {
  try {
    logger.info('Fetching custom themes by school');
    
    const { schoolId } = req.params;
    
    // Validation
    const errors = [];
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const themes = await themeService.getCustomThemesBySchool(schoolId);

    logger.info('Custom themes fetched by school successfully:', { schoolId, count: themes.length });
    return successResponse(res, themes, 'Custom themes retrieved successfully');
  } catch (error) {
    logger.error('Error fetching custom themes by school:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Apply theme to user
 */
const applyThemeToUser = async (req, res) => {
  try {
    logger.info('Applying theme to user');
    
    const { userId } = req.user;
    const { themeId } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!themeId) {
      errors.push('Theme ID is required');
    } else {
      const themeIdError = validateObjectId(themeId, 'Theme ID');
      if (themeIdError) errors.push(themeIdError);
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.applyThemeToUser(userId, themeId);

    logger.info('Theme applied to user successfully:', { userId, themeId });
    return successResponse(res, theme, 'Theme applied successfully');
  } catch (error) {
    logger.error('Error applying theme to user:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Clone theme
 */
const cloneTheme = async (req, res) => {
  try {
    logger.info('Cloning theme');
    
    const { id } = req.params;
    const { schoolId } = req.user;
    const { name } = req.body;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Theme ID');
    if (idError) errors.push(idError);
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (name && name.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.cloneTheme(id, schoolId, name);

    if (!theme) {
      return notFoundResponse(res, 'Theme not found');
    }

    logger.info('Theme cloned successfully:', { originalId: id, newId: theme._id });
    return createdResponse(res, theme, 'Theme cloned successfully');
  } catch (error) {
    logger.error('Error cloning theme:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Export theme configuration
 */
const exportThemeConfig = async (req, res) => {
  try {
    logger.info('Exporting theme configuration');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Theme ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const config = await themeService.exportThemeConfig(id);

    if (!config) {
      return notFoundResponse(res, 'Theme not found');
    }

    logger.info('Theme configuration exported successfully:', { themeId: id });
    return successResponse(res, config, 'Theme configuration exported successfully');
  } catch (error) {
    logger.error('Error exporting theme configuration:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Import theme configuration
 */
const importThemeConfig = async (req, res) => {
  try {
    logger.info('Importing theme configuration');
    
    const { schoolId } = req.user;
    const { config } = req.body;
    
    // Validation
    const errors = [];
    
    if (schoolId) {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    if (!config) {
      errors.push('Theme configuration is required');
    } else if (typeof config !== 'object') {
      errors.push('Theme configuration must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const theme = await themeService.importThemeConfig(schoolId, config);

    logger.info('Theme configuration imported successfully:', { themeId: theme._id });
    return createdResponse(res, theme, 'Theme configuration imported successfully');
  } catch (error) {
    logger.error('Error importing theme configuration:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Get theme preview
 */
const getThemePreview = async (req, res) => {
  try {
    logger.info('Fetching theme preview');
    
    const { id } = req.params;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Theme ID');
    if (idError) errors.push(idError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const preview = await themeService.getThemePreview(id);

    if (!preview) {
      return notFoundResponse(res, 'Theme not found');
    }

    logger.info('Theme preview fetched successfully:', { themeId: id });
    return successResponse(res, preview, 'Theme preview retrieved successfully');
  } catch (error) {
    logger.error('Error fetching theme preview:', error);
    return errorResponse(res, error.message);
  }
};

/**
 * Validate theme configuration
 */
const validateThemeConfig = async (req, res) => {
  try {
    logger.info('Validating theme configuration');
    
    const { config } = req.body;
    
    // Validation
    const errors = [];
    
    if (!config) {
      errors.push('Theme configuration is required');
    } else if (typeof config !== 'object') {
      errors.push('Theme configuration must be an object');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }

    const validation = themeService.validateThemeConfig(config);

    logger.info('Theme configuration validated');
    return successResponse(res, validation, 'Theme configuration validated successfully');
  } catch (error) {
    logger.error('Error validating theme configuration:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getUserTheme,
  updateUserTheme,
  getSystemTheme,
  updateSystemTheme,
  getAvailableThemes,
  getDesignTokens,
  resetUserTheme,
  getThemeById,
  createCustomTheme,
  updateCustomTheme,
  deleteCustomTheme,
  getCustomThemesBySchool,
  applyThemeToUser,
  cloneTheme,
  exportThemeConfig,
  importThemeConfig,
  getThemePreview,
  validateThemeConfig
};
