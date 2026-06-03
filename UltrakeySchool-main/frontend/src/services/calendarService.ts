import { apiClient } from '../api/client';

const API_URL = '/calendar';

export interface CalendarEvent {
  _id: string;
  institutionId: string;
  title: string;
  description?: string;
  eventType: 'academic' | 'cultural' | 'sports' | 'celebration' | 'meeting' | 'workshop' | 'other';
  startDate: string;
  endDate: string;
  allDay?: boolean;
  location?: string;
  color?: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarAnalytics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByStatus: Record<string, number>;
  upcomingEvents: number;
}

export interface CalendarConflict {
  date: string;
  conflictingEvents: CalendarEvent[];
  message: string;
}

const calendarService = {
  // Get all calendar events for a school
  getEvents: async (institutionId: string, params?: {
    startDate?: string;
    endDate?: string;
    entityTypes?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await apiClient.get(`${API_URL}/schools/${institutionId}`, { params });
    return response.data;
  },

  // Get calendar event by ID
  getEventById: async (institutionId: string, eventId: string) => {
    const response = await apiClient.get(`${API_URL}/schools/${institutionId}/events/${eventId}`);
    return response.data;
  },

  // Create a new calendar event
  createEvent: async (institutionId: string, data: Partial<CalendarEvent>) => {
    const response = await apiClient.post(`${API_URL}/schools/${institutionId}/events`, data);
    return response.data;
  },

  // Update a calendar event
  updateEvent: async (institutionId: string, eventId: string, data: Partial<CalendarEvent>) => {
    const response = await apiClient.put(`${API_URL}/schools/${institutionId}/events/${eventId}`, data);
    return response.data;
  },

  // Delete a calendar event
  deleteEvent: async (institutionId: string, eventId: string) => {
    const response = await apiClient.delete(`${API_URL}/schools/${institutionId}/events/${eventId}`);
    return response.data;
  },

  // Get upcoming events for a school
  getUpcomingEvents: async (institutionId: string, limit?: number) => {
    const response = await apiClient.get(`${API_URL}/schools/${institutionId}/upcoming`, { params: { limit } });
    return response.data;
  },

  // Get calendar analytics for a school
  getAnalytics: async (institutionId: string) => {
    const response = await apiClient.get(`${API_URL}/schools/${institutionId}/analytics`);
    return response.data;
  },

  // Export calendar events
  exportEvents: async (institutionId: string, params?: {
    startDate?: string;
    endDate?: string;
    format?: string;
  }) => {
    const response = await apiClient.get(`${API_URL}/schools/${institutionId}/export`, { params });
    return response.data;
  },

  // Get calendar conflicts
  getConflicts: async (institutionId: string, params?: {
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get(`${API_URL}/schools/${institutionId}/conflicts`, { params });
    return response.data;
  }
};

export default calendarService;
