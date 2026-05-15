import { apiClient } from '../api/client';

export interface CommunicationUser {
  id: string;
  name: string;
  role: string;
  email: string;
  institutionId?: string;
  institutionCode?: string;
  avatar?: string;
}

const normalizeUser = (u: any): CommunicationUser => ({
  id: u._id || u.id || '',
  name: u.name || u.fullName || u.email || 'Unknown',
  role: u.role || 'user',
  email: u.email || '',
  institutionId: u.institutionId || u.institution || '',
  institutionCode: u.institutionCode || u.instituteCode || '',
  avatar: u.avatar || u.profilePicture || '',
});

const userCommunicationService = {
  /**
   * Fetch all users available for communication.
   * Uses different endpoints based on user role to ensure proper communication controls.
   */
  getAllUsers: async (): Promise<CommunicationUser[]> => {
    // Get current user info to determine appropriate endpoints
    let currentUser: any = null;
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        currentUser = JSON.parse(stored);
      }
    } catch { /* ignore */ }

    const userRole = currentUser?.role || 'user';
    const userInstitutionId = currentUser?.institutionId || '';
    let endpoints: string[] = [];

    console.log(`👤 Current user: ${currentUser?.name} (${userRole}) - ID: ${currentUser?.id}`);
    console.log(`🏫 Institution ID: ${userInstitutionId}`);

    // Determine endpoints based on user role - only use endpoints that are accessible
    if (userRole === 'superadmin') {
      // Super admin can see all platform users
      endpoints = [
        '/super-admin/users',             // Use super-admin endpoint for all users
        '/profile/users',                // Fallback to profile/users
        '/users',                        // Last fallback
      ];
    } else if (userRole === 'agent') {
      // Agents can access profile/users to see all users including Super Admin
      endpoints = [
        '/profile/users',                // Primary endpoint for agents
        '/users',                        // Fallback endpoint
      ];
    } else {
      // Regular users can only see institution members
      endpoints = [
        '/profile/users',                 // Primary endpoint for regular users
        '/users',                        // Fallback endpoint
      ];
    }

    const allUsers: CommunicationUser[] = [];
    const seenIds = new Set<string>();

    // Try each endpoint and collect unique users
    for (const endpoint of endpoints) {
      try {
        const res = await apiClient.get(endpoint, { params: { limit: 10000, includeAgents: true } });
        const data = res.data;
        
        if (data?.success) {
          const raw: any[] = Array.isArray(data.data)
            ? data.data
            : data.data?.users || data.data?.data || [];
          
          // Normalize and add only unique users
          raw.forEach((user: any) => {
            const normalized = normalizeUser(user);
            
            const isGlobalUser = userRole === 'superadmin' || userRole === 'agent';
            const userInstitutionCode = currentUser?.institutionCode || currentUser?.instituteCode || '';
            const sameInstitution =
              (!!userInstitutionId && normalized.institutionId === userInstitutionId) ||
              (!!userInstitutionCode && normalized.institutionCode === userInstitutionCode);

            // For regular institution users, only show members from the same institution/code.
            if (!isGlobalUser && !sameInstitution) {
              return; // Skip users from other institutions
            }
            
            // Skip self
            if (normalized.id === currentUser?.id) {
              return; // Skip current user
            }
            
            if (!seenIds.has(normalized.id) && normalized.id) {
              seenIds.add(normalized.id);
              allUsers.push(normalized);
            }
          });
        }
      } catch (error: any) {
        // Continue with next endpoint - don't break the loop
      }
    }

    // Apply user blocking filters
    const isSuperAdminOrAgent = currentUser && (currentUser.role === 'superadmin' || currentUser.role === 'agent');
    
    // For Super Admin and Agent: NO FILTERING - Return ALL users
    if (isSuperAdminOrAgent) {
      return allUsers;
    }
    
    // For regular users: Apply normal filtering
    const filteredUsers = await userCommunicationService.applyUserBlocking(allUsers, currentUser?.id);
    
    if (filteredUsers.length === 0) {
      // Fallback: Return current user to prevent empty list
      return [{
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        institutionId: '',
        avatar: ''
      }];
    }
    
    return filteredUsers;
  },

  /**
   * Apply user blocking filters to user list
   */
  applyUserBlocking: async (users: CommunicationUser[], currentUserId?: string): Promise<CommunicationUser[]> => {
    if (!currentUserId) {
      return users;
    }

    try {
      // Get blocked users for current user
      const blockedRes = await apiClient.get('/chat/blocked-users');
      if (blockedRes.data?.success) {
        const blockedUsers = blockedRes.data.data || [];
        const blockedIds = new Set(blockedUsers.map((b: any) => b.blockedUserId));
        
        // Filter out blocked users
        const filteredUsers = users.filter(user => {
          const isBlocked = blockedIds.has(user.id);
          return !isBlocked;
        });
        
        return filteredUsers;
      }
    } catch (error) {
      // Failed to fetch blocked users, return all users
    }
    
    return users;
  },

  /**
   * Search users by name or email.
   */
  searchUsers: async (query: string): Promise<CommunicationUser[]> => {
    try {
      const res = await apiClient.get('/users/search', { params: { q: query, limit: 50 } });
      if (res.data?.success) {
        const raw: any[] = Array.isArray(res.data.data) ? res.data.data : [];
        return raw.map(normalizeUser);
      }
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 403) {
        console.warn('Access forbidden to search endpoint, falling back to local search');
      } else if (status === 404) {
        console.warn('Search endpoint not found, falling back to local search');
      } else {
        console.warn('Search endpoint failed, falling back to local search:', error.message || error);
      }
    }
    // Fall back to filtering getAllUsers
    const all = await userCommunicationService.getAllUsers();
    const q = query.toLowerCase();
    return all.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  },
};

export default userCommunicationService;
