import mongoose from 'mongoose';

const sidebarPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true
  },
  isCollapsed: {
    type: Boolean,
    default: false
  },
  pinnedItems: [{
    id: String,
    label: String,
    path: String,
    icon: String,
    order: Number
  }],
  recentItems: [{
    id: String,
    label: String,
    path: String,
    icon: String,
    lastAccessed: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    id: String,
    label: String,
    path: String,
    icon: String,
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  quickActions: [{
    id: String,
    label: String,
    icon: String,
    shortcut: String,
    category: {
      type: String,
      enum: ['frequent', 'recent', 'bookmarked', 'custom'],
      default: 'custom'
    },
    order: Number,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  hiddenMenuItems: [{
    type: String
  }],
  expandedMenus: [{
    type: String
  }],
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  sidebarWidth: {
    type: Number,
    default: 260
  },
  maxRecentItems: {
    type: Number,
    default: 5,
    min: 1,
    max: 20
  },
  showQuickActions: {
    type: Boolean,
    default: true
  },
  showRecentItems: {
    type: Boolean,
    default: true
  },
  showBookmarks: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

sidebarPreferenceSchema.index({ userId: 1, schoolId: 1 }, { unique: true });

sidebarPreferenceSchema.methods.addRecentItem = function(item) {
  const existingIndex = this.recentItems.findIndex(r => r.path === item.path);
  
  if (existingIndex > -1) {
    this.recentItems.splice(existingIndex, 1);
  }
  
  this.recentItems.unshift({
    id: item.id || Date.now().toString(),
    label: item.label,
    path: item.path,
    icon: item.icon || 'ti ti-link',
    lastAccessed: new Date()
  });
  
  if (this.recentItems.length > this.maxRecentItems) {
    this.recentItems = this.recentItems.slice(0, this.maxRecentItems);
  }
  
  return this.save();
};

sidebarPreferenceSchema.methods.addBookmark = function(bookmark) {
  const exists = this.bookmarks.some(b => b.path === bookmark.path);
  
  if (!exists) {
    this.bookmarks.push({
      id: bookmark.id || Date.now().toString(),
      label: bookmark.label,
      path: bookmark.path,
      icon: bookmark.icon || 'ti ti-bookmark',
      addedAt: new Date()
    });
    return this.save();
  }
  
  return this;
};

sidebarPreferenceSchema.methods.removeBookmark = function(bookmarkId) {
  this.bookmarks = this.bookmarks.filter(b => b.id !== bookmarkId);
  return this.save();
};

sidebarPreferenceSchema.methods.toggleQuickAction = function(actionId, enabled) {
  const action = this.quickActions.find(a => a.id === actionId);
  if (action) {
    action.enabled = enabled;
    return this.save();
  }
  return this;
};

const SidebarPreference = mongoose.model('SidebarPreference', sidebarPreferenceSchema);

export default SidebarPreference;
