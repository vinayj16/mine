import userProfileService from '../services/userProfileService.js';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, notFoundResponse } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// Validation constants
const MAX_NAME_LENGTH = 100;
const MAX_BIO_LENGTH = 500;
const MAX_ADDRESS_LENGTH = 200;
const MAX_PHONE_LENGTH = 20;
const VALID_GENDERS = ['male', 'female', 'other', 'prefer_not_to_say'];
const VALID_PRIVACY_SETTINGS = ['public', 'private', 'friends'];

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

// Helper function to validate email
const validateEmail = (email) => {
  if (!email) return null;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return 'Invalid email format';
  }
  return null;
};

// Helper function to validate phone number
const validatePhone = (phone) => {
  if (!phone) return null;
  const phonePattern = /^\+?[1-9]\d{1,14}$/;
  if (!phonePattern.test(phone) || phone.length > MAX_PHONE_LENGTH) {
    return 'Invalid phone number format';
  }
  return null;
};

// Helper function to validate date
const validateDate = (dateString, fieldName = 'Date') => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid ' + fieldName + ' format';
  }
  return null;
};

export const getUserProfile = async (req, res) => {
  try {
    logger.info('Fetching user profile');
    
    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Validation
    const errors = [];
    
    // For agents, schoolId is optional
    if (userRole !== 'agent') {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const profile = await userProfileService.getUserProfile(schoolId, userId, userRole);
    
    if (!profile) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    const permissions = await userProfileService.getUserPermissions(userId);
    
    logger.info('User profile fetched successfully:', { userId });
    return successResponse(res, { ...profile, permissions }, 'Profile retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    return errorResponse(res, error.message);
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    logger.info('Updating user profile');

    const schoolId = req.user?.schoolId;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { name, firstName, lastName, email, phone, bio, dateOfBirth, gender, address } = req.body;

    // Validation
    const errors = [];

    // For agents, schoolId is optional
    if (userRole !== 'agent') {
      const schoolIdError = validateObjectId(schoolId, 'School ID');
      if (schoolIdError) errors.push(schoolIdError);
    }

    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);

    // Handle both 'name' and 'firstName/lastName' for compatibility
    const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();
    if (fullName && fullName.length > MAX_NAME_LENGTH) {
      errors.push('Name must not exceed ' + MAX_NAME_LENGTH + ' characters');
    }

    if (email) {
      const emailError = validateEmail(email);
      if (emailError) errors.push(emailError);
    }

    if (phone) {
      const phoneError = validatePhone(phone);
      if (phoneError) errors.push(phoneError);
    }

    if (bio && bio.length > MAX_BIO_LENGTH) {
      errors.push('Bio must not exceed ' + MAX_BIO_LENGTH + ' characters');
    }

    if (dateOfBirth) {
      const dateError = validateDate(dateOfBirth, 'Date of birth');
      if (dateError) errors.push(dateError);
    }

    if (gender && !VALID_GENDERS.includes(gender.toLowerCase())) {
      errors.push('Invalid gender. Must be one of: ' + VALID_GENDERS.join(', '));
    }

    // Address can be an object (street, city, state, etc.) or a string
    if (address && typeof address === 'string' && address.length > MAX_ADDRESS_LENGTH) {
      errors.push('Address must not exceed ' + MAX_ADDRESS_LENGTH + ' characters');
    }

    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const profile = await userProfileService.updateUserProfile(schoolId, userId, req.body);
    
    if (!profile) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    logger.info('User profile updated successfully:', { userId });
    return successResponse(res, profile, 'Profile updated successfully');
  } catch (error) {
    logger.error('Error updating user profile:', error);
    return errorResponse(res, error.message);
  }
};

export const getUserPermissions = async (req, res) => {
  try {
    logger.info('Fetching user permissions');
    
    const userId = req.user?.id;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const permissions = await userProfileService.getUserPermissions(userId);
    
    logger.info('User permissions fetched successfully:', { userId });
    return successResponse(res, { permissions }, 'Permissions retrieved successfully');
  } catch (error) {
    logger.error('Error fetching user permissions:', error);
    return errorResponse(res, error.message);
  }
};

const getProfileById = async (req, res) => {
  try {
    logger.info('Fetching profile by ID');
    
    const { id } = req.params;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const idError = validateObjectId(id, 'Profile ID');
    if (idError) errors.push(idError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const profile = await userProfileService.getUserProfile(schoolId, id);
    
    if (!profile) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    logger.info('Profile fetched successfully:', { id });
    return successResponse(res, profile, 'Profile retrieved successfully');
  } catch (error) {
    logger.error('Error fetching profile by ID:', error);
    return errorResponse(res, error.message);
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    logger.info('Updating profile picture');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const { avatarUrl } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!avatarUrl || avatarUrl.trim().length === 0) {
      errors.push('Avatar URL is required');
    } else {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(avatarUrl)) {
        errors.push('Invalid avatar URL format');
      }
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const profile = await userProfileService.updateProfilePicture(schoolId, userId, avatarUrl);
    
    if (!profile) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    logger.info('Profile picture updated successfully:', { userId });
    return successResponse(res, profile, 'Profile picture updated successfully');
  } catch (error) {
    logger.error('Error updating profile picture:', error);
    return errorResponse(res, error.message);
  }
};

const updatePrivacySettings = async (req, res) => {
  try {
    logger.info('Updating privacy settings');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const { profileVisibility, emailVisibility, phoneVisibility } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (profileVisibility && !VALID_PRIVACY_SETTINGS.includes(profileVisibility)) {
      errors.push('Invalid profile visibility. Must be one of: ' + VALID_PRIVACY_SETTINGS.join(', '));
    }
    
    if (emailVisibility && !VALID_PRIVACY_SETTINGS.includes(emailVisibility)) {
      errors.push('Invalid email visibility. Must be one of: ' + VALID_PRIVACY_SETTINGS.join(', '));
    }
    
    if (phoneVisibility && !VALID_PRIVACY_SETTINGS.includes(phoneVisibility)) {
      errors.push('Invalid phone visibility. Must be one of: ' + VALID_PRIVACY_SETTINGS.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await userProfileService.updatePrivacySettings(schoolId, userId, req.body);
    
    if (!settings) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    logger.info('Privacy settings updated successfully:', { userId });
    return successResponse(res, settings, 'Privacy settings updated successfully');
  } catch (error) {
    logger.error('Error updating privacy settings:', error);
    return errorResponse(res, error.message);
  }
};

const getPrivacySettings = async (req, res) => {
  try {
    logger.info('Fetching privacy settings');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const settings = await userProfileService.getPrivacySettings(schoolId, userId);
    
    logger.info('Privacy settings fetched successfully:', { userId });
    return successResponse(res, settings, 'Privacy settings retrieved successfully');
  } catch (error) {
    logger.error('Error fetching privacy settings:', error);
    return errorResponse(res, error.message);
  }
};

const updateNotificationPreferences = async (req, res) => {
  try {
    logger.info('Updating notification preferences');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const { emailNotifications, smsNotifications, pushNotifications } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (emailNotifications !== undefined && typeof emailNotifications !== 'boolean') {
      errors.push('Email notifications must be a boolean');
    }
    
    if (smsNotifications !== undefined && typeof smsNotifications !== 'boolean') {
      errors.push('SMS notifications must be a boolean');
    }
    
    if (pushNotifications !== undefined && typeof pushNotifications !== 'boolean') {
      errors.push('Push notifications must be a boolean');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await userProfileService.updateNotificationPreferences(schoolId, userId, req.body);
    
    if (!preferences) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    logger.info('Notification preferences updated successfully:', { userId });
    return successResponse(res, preferences, 'Notification preferences updated successfully');
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    return errorResponse(res, error.message);
  }
};

const getNotificationPreferences = async (req, res) => {
  try {
    logger.info('Fetching notification preferences');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const preferences = await userProfileService.getNotificationPreferences(schoolId, userId);
    
    logger.info('Notification preferences fetched successfully:', { userId });
    return successResponse(res, preferences, 'Notification preferences retrieved successfully');
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    return errorResponse(res, error.message);
  }
};

const changePassword = async (req, res) => {
  try {
    logger.info('Changing password');
    
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    if (!currentPassword || currentPassword.trim().length === 0) {
      errors.push('Current password is required');
    }
    
    if (!newPassword || newPassword.trim().length === 0) {
      errors.push('New password is required');
    } else if (newPassword.length < 8) {
      errors.push('New password must be at least 8 characters long');
    }
    
    if (!confirmPassword || confirmPassword.trim().length === 0) {
      errors.push('Confirm password is required');
    } else if (newPassword !== confirmPassword) {
      errors.push('New password and confirm password do not match');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await userProfileService.changePassword(userId, currentPassword, newPassword);
    
    logger.info('Password changed successfully:', { userId });
    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    logger.error('Error changing password:', error);
    return errorResponse(res, error.message);
  }
};

const updateSocialLinks = async (req, res) => {
  try {
    logger.info('Updating social links');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const { facebook, twitter, linkedin, instagram, website } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const urlPattern = /^https?:\/\/.+/;
    
    if (facebook && !urlPattern.test(facebook)) {
      errors.push('Invalid Facebook URL format');
    }
    
    if (twitter && !urlPattern.test(twitter)) {
      errors.push('Invalid Twitter URL format');
    }
    
    if (linkedin && !urlPattern.test(linkedin)) {
      errors.push('Invalid LinkedIn URL format');
    }
    
    if (instagram && !urlPattern.test(instagram)) {
      errors.push('Invalid Instagram URL format');
    }
    
    if (website && !urlPattern.test(website)) {
      errors.push('Invalid website URL format');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const profile = await userProfileService.updateSocialLinks(schoolId, userId, req.body);
    
    if (!profile) {
      return notFoundResponse(res, 'User profile not found');
    }
    
    logger.info('Social links updated successfully:', { userId });
    return successResponse(res, profile, 'Social links updated successfully');
  } catch (error) {
    logger.error('Error updating social links:', error);
    return errorResponse(res, error.message);
  }
};

const getSocialLinks = async (req, res) => {
  try {
    logger.info('Fetching social links');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const socialLinks = await userProfileService.getSocialLinks(schoolId, userId);
    
    logger.info('Social links fetched successfully:', { userId });
    return successResponse(res, socialLinks, 'Social links retrieved successfully');
  } catch (error) {
    logger.error('Error fetching social links:', error);
    return errorResponse(res, error.message);
  }
};

const getProfileCompleteness = async (req, res) => {
  try {
    logger.info('Fetching profile completeness');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const completeness = await userProfileService.getProfileCompleteness(schoolId, userId);
    
    logger.info('Profile completeness fetched successfully:', { userId });
    return successResponse(res, completeness, 'Profile completeness retrieved successfully');
  } catch (error) {
    logger.error('Error fetching profile completeness:', error);
    return errorResponse(res, error.message);
  }
};

const getActivityLog = async (req, res) => {
  try {
    logger.info('Fetching activity log');
    
    const userId = req.user?.id;
    const { page, limit } = req.query;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
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
    
    const result = await userProfileService.getActivityLog(userId, {
      page: pageNum,
      limit: limitNum
    });
    
    logger.info('Activity log fetched successfully:', { userId });
    return successResponse(res, result, 'Activity log retrieved successfully');
  } catch (error) {
    logger.error('Error fetching activity log:', error);
    return errorResponse(res, error.message);
  }
};

const deleteAccount = async (req, res) => {
  try {
    logger.info('Deleting user account');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const { password, confirmDeletion } = req.body;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    if (!password || password.trim().length === 0) {
      errors.push('Password is required to delete account');
    }
    
    if (!confirmDeletion || confirmDeletion !== true) {
      errors.push('Account deletion must be confirmed');
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    await userProfileService.deleteAccount(schoolId, userId, password);
    
    logger.info('User account deleted successfully:', { userId });
    return successResponse(res, null, 'Account deleted successfully');
  } catch (error) {
    logger.error('Error deleting account:', error);
    return errorResponse(res, error.message);
  }
};

const exportProfileData = async (req, res) => {
  try {
    logger.info('Exporting profile data');
    
    const userId = req.user?.id;
    const schoolId = req.user?.schoolId;
    const { format } = req.query;
    
    // Validation
    const errors = [];
    
    const userIdError = validateObjectId(userId, 'User ID');
    if (userIdError) errors.push(userIdError);
    
    const schoolIdError = validateObjectId(schoolId, 'School ID');
    if (schoolIdError) errors.push(schoolIdError);
    
    const validFormats = ['json', 'csv', 'pdf'];
    const formatValue = format || 'json';
    
    if (!validFormats.includes(formatValue)) {
      errors.push('Invalid format. Must be one of: ' + validFormats.join(', '));
    }
    
    if (errors.length > 0) {
      return validationErrorResponse(res, errors);
    }
    
    const exportData = await userProfileService.exportProfileData(schoolId, userId, formatValue);
    
    logger.info('Profile data exported successfully:', { userId, format: formatValue });
    return successResponse(res, exportData, 'Profile data exported successfully');
  } catch (error) {
    logger.error('Error exporting profile data:', error);
    return errorResponse(res, error.message);
  }
};

const getAllUsers = async (req, res) => {
  try {
    logger.info('Fetching all users for communication');
    
    const User = (await import('../models/User.js')).default;
    const UserCredential = (await import('../models/UserCredential.js')).default;
    const Agent = (await import('../models/Agent.js')).default;

    const currentUserId = req.user?.id?.toString();
    const currentRole = req.user?.role;
    const isGlobalUser = ['superadmin', 'super_admin', 'agent'].includes(currentRole);

    const currentUser =
      await User.findById(currentUserId).select('institutionId institutionCode').lean() ||
      await UserCredential.findById(currentUserId).select('institution institutionId instituteCode').lean();

    const currentInstitutionId = (
      currentUser?.institutionId ||
      currentUser?.institution ||
      req.user?.institutionId ||
      ''
    )?.toString?.() || '';
    const currentInstitutionCode = currentUser?.institutionCode || currentUser?.instituteCode || '';

    const userQuery = {
      _id: { $ne: req.user.id },
      status: 'active'
    };

    if (!isGlobalUser) {
      userQuery.$or = [
        ...(currentInstitutionId ? [{ institutionId: currentInstitutionId }, { institution: currentInstitutionId }] : []),
        ...(currentInstitutionCode ? [{ institutionCode: currentInstitutionCode }, { instituteCode: currentInstitutionCode }] : [])
      ];

      if (userQuery.$or.length === 0) {
        userQuery._id = null;
      }
    }

    const users = await User.find(userQuery)
      .select('name email role institutionId institutionCode avatar status')
      .lean();

    const agentQuery = isGlobalUser
      ? { status: 'Active' }
      : {
          status: 'Active',
          ...(currentInstitutionId ? { institutionId: currentInstitutionId } : { _id: null })
        };

    const agents = await Agent.find(agentQuery)
      .select('name email role institutionId profilePhoto status')
      .lean();

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId?.toString?.() || '',
      institutionCode: user.institutionCode || '',
      avatar: user.avatar,
      status: user.status,
      isVisibleToAgents: true,
      isVisibleToSuperAdmin: true,
      onlineStatus: 'online',
      lastSeen: new Date().toISOString()
    }));

    const formattedAgents = agents.map(agent => ({
      id: agent._id.toString(),
      name: agent.name,
      email: agent.email,
      role: 'agent',
      institutionId: agent.institutionId?.toString?.() || '',
      institutionCode: '',
      avatar: agent.profilePhoto,
      status: agent.status,
      isVisibleToAgents: true,
      isVisibleToSuperAdmin: true,
      onlineStatus: 'online',
      lastSeen: new Date().toISOString()
    }));

    return successResponse(res, [...formattedUsers, ...formattedAgents], 'Users retrieved successfully');
  } catch (error) {
    logger.error('Error fetching all users:', error);
    return errorResponse(res, error.message);
  }
};

// Export all functions
export default {
  getUserProfile,
  updateUserProfile,
  getUserPermissions,
  getProfileById,
  updateProfilePicture,
  getAllUsers,
  updatePrivacySettings,
  getPrivacySettings,
  updateNotificationPreferences,
  getNotificationPreferences,
  changePassword,
  updateSocialLinks,
  getSocialLinks,
  getProfileCompleteness,
  getActivityLog,
  deleteAccount,
  exportProfileData
};
