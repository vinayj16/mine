import { body, param } from 'express-validator';

export const updatePreferencesValidator = [
  body('isCollapsed').optional().isBoolean().withMessage('isCollapsed must be a boolean'),
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme value'),
  body('sidebarWidth').optional().isInt({ min: 200, max: 400 }).withMessage('Sidebar width must be between 200 and 400'),
  body('maxRecentItems').optional().isInt({ min: 1, max: 20 }).withMessage('Max recent items must be between 1 and 20'),
  body('showQuickActions').optional().isBoolean().withMessage('showQuickActions must be a boolean'),
  body('showRecentItems').optional().isBoolean().withMessage('showRecentItems must be a boolean'),
  body('showBookmarks').optional().isBoolean().withMessage('showBookmarks must be a boolean')
];

export const toggleCollapsedValidator = [
  body('isCollapsed').isBoolean().withMessage('isCollapsed is required and must be a boolean')
];

export const addRecentItemValidator = [
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('path').trim().notEmpty().withMessage('Path is required'),
  body('icon').optional().trim()
];

export const addBookmarkValidator = [
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('path').trim().notEmpty().withMessage('Path is required'),
  body('icon').optional().trim()
];

export const bookmarkIdValidator = [
  param('bookmarkId').trim().notEmpty().withMessage('Bookmark ID is required')
];

export const updateBookmarkOrderValidator = [
  body('bookmarks').isArray({ min: 1 }).withMessage('Bookmarks must be a non-empty array'),
  body('bookmarks.*.id').trim().notEmpty().withMessage('Each bookmark must have an id'),
  body('bookmarks.*.label').trim().notEmpty().withMessage('Each bookmark must have a label'),
  body('bookmarks.*.path').trim().notEmpty().withMessage('Each bookmark must have a path')
];

export const addQuickActionValidator = [
  body('id').trim().notEmpty().withMessage('Action ID is required'),
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('icon').trim().notEmpty().withMessage('Icon is required'),
  body('category').isIn(['frequent', 'recent', 'bookmarked', 'custom']).withMessage('Invalid category'),
  body('shortcut').optional().trim(),
  body('enabled').optional().isBoolean().withMessage('enabled must be a boolean')
];

export const actionIdValidator = [
  param('actionId').trim().notEmpty().withMessage('Action ID is required')
];

export const toggleQuickActionValidator = [
  param('actionId').trim().notEmpty().withMessage('Action ID is required'),
  body('enabled').isBoolean().withMessage('enabled is required and must be a boolean')
];

export const updateQuickActionOrderValidator = [
  body('quickActions').isArray({ min: 1 }).withMessage('Quick actions must be a non-empty array'),
  body('quickActions.*.id').trim().notEmpty().withMessage('Each action must have an id'),
  body('quickActions.*.order').isInt({ min: 0 }).withMessage('Each action must have a valid order')
];

export const updateExpandedMenusValidator = [
  body('expandedMenus').isArray().withMessage('Expanded menus must be an array'),
  body('expandedMenus.*').trim().notEmpty().withMessage('Each menu ID must be a non-empty string')
];

export const menuItemIdValidator = [
  param('menuItemId').trim().notEmpty().withMessage('Menu item ID is required')
];

export const updateMenuCustomizationValidator = [
  body('menuItems').optional().isArray().withMessage('Menu items must be an array'),
  body('hiddenSections').optional().isArray().withMessage('Hidden sections must be an array'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean')
];

export const addCustomMenuItemValidator = [
  body('label').trim().notEmpty().withMessage('Label is required'),
  body('icon').trim().notEmpty().withMessage('Icon is required'),
  body('to').trim().notEmpty().withMessage('Path is required'),
  body('section').optional().trim(),
  body('order').optional().isInt({ min: 0 }).withMessage('Order must be a non-negative integer'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
];

export const updateMenuItemVisibilityValidator = [
  param('menuItemId').trim().notEmpty().withMessage('Menu item ID is required'),
  body('visible').isBoolean().withMessage('visible is required and must be a boolean')
];

export const importPreferencesValidator = [
  body('isCollapsed').optional().isBoolean().withMessage('isCollapsed must be a boolean'),
  body('pinnedItems').optional().isArray().withMessage('pinnedItems must be an array'),
  body('bookmarks').optional().isArray().withMessage('bookmarks must be an array'),
  body('quickActions').optional().isArray().withMessage('quickActions must be an array'),
  body('hiddenMenuItems').optional().isArray().withMessage('hiddenMenuItems must be an array'),
  body('expandedMenus').optional().isArray().withMessage('expandedMenus must be an array'),
  body('theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme value'),
  body('maxRecentItems').optional().isInt({ min: 1, max: 20 }).withMessage('Max recent items must be between 1 and 20')
];
