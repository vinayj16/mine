import { apiClient } from '../api/client';

// Types based on backend models
export interface PinnedItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  order: number;
}

export interface RecentItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  lastAccessed: Date;
}

export interface Bookmark {
  id: string;
  label: string;
  path: string;
  icon: string;
  addedAt: Date;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  category: 'frequent' | 'recent' | 'bookmarked' | 'custom';
  order: number;
  enabled: boolean;
}

export interface SidebarPreferences {
  isCollapsed: boolean;
  expandedMenus: string[];
  theme: 'light' | 'dark' | 'auto';
  sidebarWidth: number;
  maxRecentItems: number;
  showQuickActions: boolean;
  showRecentItems: boolean;
  showBookmarks: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  header?: boolean;
  badge?: string;
  order?: number;
  visible?: boolean;
  custom?: boolean;
  section?: string;
  permissions?: string[];
  children?: MenuItem[];
}

export interface MenuSection {
  title: string;
  icon?: string;
  items: MenuItem[];
}

export interface SidebarData {
  preferences: SidebarPreferences;
  menuItems: MenuSection[];
  quickActions: QuickAction[];
  recentItems: RecentItem[];
  bookmarks: Bookmark[];
  pinnedItems: PinnedItem[];
}

export interface MenuCustomization {
  menuItems: MenuItem[];
  customMenuItems: MenuItem[];
  hiddenSections: string[];
  isActive: boolean;
}

class SidebarService {
  // Get sidebar data (includes preferences and menu items)
  async getSidebarData(): Promise<SidebarData> {
    const response = await apiClient.get<SidebarData>('/sidebar/data');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch sidebar data');
    }
    return response.data.data;
  }

  // Get user preferences
  async getUserPreferences(): Promise<SidebarPreferences> {
    const response = await apiClient.get<SidebarPreferences>('/sidebar/preferences');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch user preferences');
    }
    return response.data.data;
  }

  // Update preferences
  async updatePreferences(updates: Partial<SidebarPreferences>): Promise<SidebarPreferences> {
    const response = await apiClient.put<SidebarPreferences>('/sidebar/preferences', updates);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update preferences');
    }
    return response.data.data;
  }

  // Toggle sidebar collapsed state
  async toggleCollapsed(isCollapsed: boolean): Promise<SidebarPreferences> {
    const response = await apiClient.post<SidebarPreferences>('/sidebar/preferences/toggle-collapsed', { isCollapsed });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to toggle sidebar');
    }
    return response.data.data;
  }

  // Add recent item
  async addRecentItem(item: Omit<RecentItem, 'id' | 'lastAccessed'>): Promise<RecentItem[]> {
    const response = await apiClient.post<RecentItem[]>('/sidebar/recent-items', item);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to add recent item');
    }
    return response.data.data;
  }

  // Add bookmark
  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'addedAt'>): Promise<Bookmark[]> {
    const response = await apiClient.post<Bookmark[]>('/sidebar/bookmarks', bookmark);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to add bookmark');
    }
    return response.data.data;
  }

  // Remove bookmark
  async removeBookmark(bookmarkId: string): Promise<Bookmark[]> {
    const response = await apiClient.delete<Bookmark[]>(`/sidebar/bookmarks/${bookmarkId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to remove bookmark');
    }
    return response.data.data;
  }

  // Update bookmark order
  async updateBookmarkOrder(bookmarks: Bookmark[]): Promise<Bookmark[]> {
    const response = await apiClient.put<Bookmark[]>('/sidebar/bookmarks/order', { bookmarks });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update bookmark order');
    }
    return response.data.data;
  }

  // Add quick action
  async addQuickAction(action: Omit<QuickAction, 'order' | 'enabled'>): Promise<QuickAction[]> {
    const response = await apiClient.post<QuickAction[]>('/sidebar/quick-actions', action);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to add quick action');
    }
    return response.data.data;
  }

  // Remove quick action
  async removeQuickAction(actionId: string): Promise<QuickAction[]> {
    const response = await apiClient.delete<QuickAction[]>(`/sidebar/quick-actions/${actionId}`);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to remove quick action');
    }
    return response.data.data;
  }

  // Toggle quick action
  async toggleQuickAction(actionId: string, enabled: boolean): Promise<QuickAction[]> {
    const response = await apiClient.patch<QuickAction[]>(`/sidebar/quick-actions/${actionId}/toggle`, { enabled });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to toggle quick action');
    }
    return response.data.data;
  }

  // Update quick action order
  async updateQuickActionOrder(quickActions: QuickAction[]): Promise<QuickAction[]> {
    const response = await apiClient.put<QuickAction[]>('/sidebar/quick-actions/order', { quickActions });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update quick action order');
    }
    return response.data.data;
  }

  // Update expanded menus
  async updateExpandedMenus(expandedMenus: string[]): Promise<SidebarPreferences> {
    const response = await apiClient.put<SidebarPreferences>('/sidebar/preferences/expanded-menus', { expandedMenus });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update expanded menus');
    }
    return response.data.data;
  }

  // Hide menu item
  async hideMenuItem(menuItemId: string): Promise<void> {
    const response = await apiClient.post(`/sidebar/menu-items/${menuItemId}/hide`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to hide menu item');
    }
  }

  // Show menu item
  async showMenuItem(menuItemId: string): Promise<void> {
    const response = await apiClient.post(`/sidebar/menu-items/${menuItemId}/show`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to show menu item');
    }
  }

  // Get menu customization (admin only)
  async getMenuCustomization(): Promise<MenuCustomization> {
    const response = await apiClient.get<MenuCustomization>('/sidebar/menu-customization');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to fetch menu customization');
    }
    return response.data.data;
  }

  // Update menu customization (admin only)
  async updateMenuCustomization(customization: Partial<MenuCustomization>): Promise<MenuCustomization> {
    const response = await apiClient.put<MenuCustomization>('/sidebar/menu-customization', customization);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to update menu customization');
    }
    return response.data.data;
  }

  // Add custom menu item (admin only)
  async addCustomMenuItem(menuItem: Omit<MenuItem, 'id' | 'createdBy' | 'createdAt'>): Promise<MenuItem> {
    const response = await apiClient.post<MenuItem>('/sidebar/menu-customization/items', menuItem);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to add custom menu item');
    }
    return response.data.data;
  }

  // Remove custom menu item (admin only)
  async removeCustomMenuItem(menuItemId: string): Promise<void> {
    const response = await apiClient.delete(`/sidebar/menu-customization/items/${menuItemId}`);
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to remove custom menu item');
    }
  }

  // Update menu item visibility (admin only)
  async updateMenuItemVisibility(menuItemId: string, visible: boolean): Promise<void> {
    const response = await apiClient.patch(`/sidebar/menu-customization/items/${menuItemId}/visibility`, { visible });
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to update menu item visibility');
    }
  }

  // Reset preferences
  async resetPreferences(): Promise<SidebarPreferences> {
    const response = await apiClient.post<SidebarPreferences>('/sidebar/reset');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to reset preferences');
    }
    return response.data.data;
  }

  // Export preferences
  async exportPreferences(): Promise<SidebarPreferences> {
    const response = await apiClient.get<SidebarPreferences>('/sidebar/export');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to export preferences');
    }
    return response.data.data;
  }

  // Import preferences
  async importPreferences(preferencesData: Partial<SidebarPreferences>): Promise<SidebarPreferences> {
    const response = await apiClient.post<SidebarPreferences>('/sidebar/import', preferencesData);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Failed to import preferences');
    }
    return response.data.data;
  }
}

export const sidebarService = new SidebarService();
