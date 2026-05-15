import { apiClient } from '../api/client';

const API_URL = '/events';

export interface Event {
  _id: string;
  schoolId: string;
  title: string;
  description?: string;
  eventType: 'academic' | 'cultural' | 'sports' | 'celebration' | 'meeting' | 'workshop' | 'other';
  startDate: string;
  endDate: string;
  location?: string;
  organizer?: string;
  targetAudience?: string[];
  classIds?: string[];
  isPublic: boolean;
  color?: string;
  attachments?: {
    name: string;
    url: string;
  }[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const eventService = {
  // Get all events
  getAll: async (filters?: {
    schoolId?: string;
    eventType?: string;
    status?: string;
  }): Promise<Event[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.schoolId) params.append('schoolId', filters.schoolId);
      if (filters?.eventType) params.append('eventType', filters.eventType);
      if (filters?.status) params.append('status', filters.status);
      
      const response = await apiClient.get(`${API_URL}?${params.toString()}`);
      // Handle both wrapped formats: response.data.data.events or response.data.events
      return response.data?.data?.events || response.data?.events || response.data?.data || [];
    } catch (error) {
      console.warn('Event service getAll failed, returning empty array:', error);
      return [];
    }
  },

  // Get event by ID
  getById: async (id: string): Promise<Event | null> => {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return response.data.data;
    } catch (error) {
      console.warn('Event service getById failed:', error);
      return null;
    }
  },

  // Create event
  create: async (data: Partial<Event>): Promise<Event | null> => {
    try {
      const response = await apiClient.post(API_URL, data);
      return response.data.data;
    } catch (error) {
      console.warn('Event service create failed:', error);
      return null;
    }
  },

  // Update event
  update: async (id: string, data: Partial<Event>): Promise<Event | null> => {
    try {
      const response = await apiClient.put(`${API_URL}/${id}`, data);
      return response.data.data;
    } catch (error) {
      console.warn('Event service update failed:', error);
      return null;
    }
  },

  // Delete event
  delete: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`${API_URL}/${id}`);
      return true;
    } catch (error) {
      console.warn('Event service delete failed:', error);
      return false;
    }
  },

  // Get upcoming events
  getUpcoming: async (schoolId: string): Promise<Event[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/schools/${schoolId}/upcoming`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Event service getUpcoming failed, returning empty array:', error);
      return [];
    }
  },

  // Get events by type
  getByType: async (schoolId: string, eventType: string): Promise<Event[]> => {
    try {
      const response = await apiClient.get(`${API_URL}/schools/${schoolId}/type/${eventType}`);
      return response.data.data || [];
    } catch (error) {
      console.warn('Event service getByType failed, returning empty array:', error);
      return [];
    }
  }
};

export default eventService;
