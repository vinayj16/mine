// User interface - adjust path based on your project structure
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  institutionId?: string;
}

export interface DashboardApplication {
  id: string;
  name: string;
  type: 'calendar' | 'chat' | 'email' | 'filemanager' | 'notes' | 'todo' | 'custom';
  icon: string;
  url: string;
  isActive: boolean;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  lastAccessed: string;
  institutionId?: string;
  config?: Record<string, any>;
}

export interface UserApplicationState {
  userId: string;
  applications: DashboardApplication[];
  layout: {
    gridSize: number;
    spacing: number;
  };
  preferences: {
    theme: string;
    autoSave: boolean;
  };
}

class ApplicationPersistenceService {
  private readonly STORAGE_KEY = 'dashboard_applications';

  // Save application state to localStorage
  saveApplicationState(user: User, applications: DashboardApplication[]): void {
    try {
      const userState: UserApplicationState = {
        userId: user.id,
        applications,
        layout: {
          gridSize: 80,
          spacing: 10
        },
        preferences: {
          theme: 'light',
          autoSave: true
        }
      };

      // Get existing states
      const existingStates = this.getAllUserStates();
      existingStates[user.id] = userState;

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingStates));
          } catch (error) {
      console.error('[ApplicationPersistence] Error saving application state:', error);
    }
  }

  // Load application state from localStorage
  loadApplicationState(user: User): DashboardApplication[] {
    try {
      const existingStates = this.getAllUserStates();
      const userState = existingStates[user.id];

      if (!userState) {
        return this.getDefaultApplications(user);
      }

            return userState.applications;
    } catch (error) {
      console.error('[ApplicationPersistence] Error loading application state:', error);
      return this.getDefaultApplications(user);
    }
  }

  // Get all user states
  private getAllUserStates(): Record<string, UserApplicationState> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('[ApplicationPersistence] Error parsing stored states:', error);
      return {};
    }
  }

  // Get default applications for new users
  private getDefaultApplications(user: User): DashboardApplication[] {
    const defaultApps: DashboardApplication[] = [
      {
        id: 'calendar',
        name: 'Calendar',
        type: 'calendar',
        icon: 'calendar',
        url: '/dashboard/calendar',
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 0, y: 0 },
        size: { width: 2, height: 2 }
      },
      {
        id: 'chat',
        name: 'Chat',
        type: 'chat',
        icon: 'message-circle',
        url: '/dashboard/chat',
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 2, y: 0 },
        size: { width: 2, height: 2 }
      },
      {
        id: 'email',
        name: 'Email',
        type: 'email',
        icon: 'mail',
        url: '/dashboard/email',
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 4, y: 0 },
        size: { width: 2, height: 2 }
      },
      {
        id: 'filemanager',
        name: 'File Manager',
        type: 'filemanager',
        icon: 'folder',
        url: '/dashboard/files',
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 0, y: 2 },
        size: { width: 2, height: 2 }
      },
      {
        id: 'notes',
        name: 'Notes',
        type: 'notes',
        icon: 'edit-3',
        url: '/dashboard/notes',
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 2, y: 2 },
        size: { width: 2, height: 2 }
      },
      {
        id: 'todo',
        name: 'Todo',
        type: 'todo',
        icon: 'check-square',
        url: '/dashboard/todo',
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 4, y: 2 },
        size: { width: 2, height: 2 }
      }
    ];

    // Add institution-specific apps if user has institution
    if (user.institutionId) {
      defaultApps.push({
        id: 'institution-chat',
        name: 'Institution Chat',
        type: 'chat',
        icon: 'users',
        url: `/dashboard/institution-chat/${user.institutionId}`,
        isActive: true,
        lastAccessed: new Date().toISOString(),
        position: { x: 0, y: 4 },
        size: { width: 2, height: 2 },
        institutionId: user.institutionId
      });
    }

    return defaultApps;
  }

  // Update application configuration
  updateApplication(user: User, appId: string, updates: Partial<DashboardApplication>): void {
    const applications = this.loadApplicationState(user);
    const appIndex = applications.findIndex(app => app.id === appId);

    if (appIndex !== -1) {
      applications[appIndex] = {
        ...applications[appIndex],
        ...updates,
        lastAccessed: new Date().toISOString()
      };
      this.saveApplicationState(user, applications);
    }
  }

  // Add new application
  addApplication(user: User, application: DashboardApplication): void {
    const applications = this.loadApplicationState(user);
    
    // Check if app already exists
    const existingIndex = applications.findIndex(app => app.id === application.id);
    
    if (existingIndex !== -1) {
      applications[existingIndex] = application;
    } else {
      applications.push(application);
    }
    
    this.saveApplicationState(user, applications);
  }

  // Remove application
  removeApplication(user: User, appId: string): void {
    const applications = this.loadApplicationState(user);
    const filteredApps = applications.filter(app => app.id !== appId);
    this.saveApplicationState(user, filteredApps);
  }

  // Clear all application data for user
  clearApplicationState(user: User): void {
    try {
      const existingStates = this.getAllUserStates();
      delete existingStates[user.id];
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingStates));
          } catch (error) {
      console.error('[ApplicationPersistence] Error clearing application state:', error);
    }
  }

  // Get application by ID
  getApplication(user: User, appId: string): DashboardApplication | null {
    const applications = this.loadApplicationState(user);
    return applications.find(app => app.id === appId) || null;
  }

  // Update last accessed time
  updateLastAccessed(user: User, appId: string): void {
    this.updateApplication(user, appId, { lastAccessed: new Date().toISOString() });
  }
}

export default new ApplicationPersistenceService();
