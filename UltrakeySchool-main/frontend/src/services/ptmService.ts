import apiClient from '../api/client';

export interface PTMSlot {
  _id: string;
  institutionId: string;
  teacherId: { _id: string; firstName: string; lastName: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'available' | 'booked' | 'completed' | 'cancelled';
  bookedBy?: { _id: string; firstName: string; lastName: string; email: string };
  studentId?: { _id: string; firstName: string; lastName: string; rollNumber: string };
  bookingNotes?: string;
  bookedAt?: string;
  cancellationReason?: string;
  meetingMode?: string;
  meetingLink?: string;
  location?: string;
  meetingNotes?: string;
  attendanceStatus?: string;
  completedAt?: string;
}

export interface PTMStats {
  total: number;
  available: number;
  booked: number;
  completed: number;
  cancelled: number;
}

class PTMService {
  async getSlots(params?: {
    date?: string;
    teacherId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ slots: PTMSlot[]; pagination: any }> {
    const response = await apiClient.get('/ptm', { params });
    return response.data;
  }

  async getSlotById(id: string): Promise<PTMSlot> {
    const response = await apiClient.get(`/ptm/${id}`);
    return response.data.data;
  }

  async createSlots(slots: any[]): Promise<PTMSlot[]> {
    const response = await apiClient.post('/ptm', { slots });
    return response.data.data;
  }

  async updateSlot(id: string, data: any): Promise<PTMSlot> {
    const response = await apiClient.put(`/ptm/${id}`, data);
    return response.data.data;
  }

  async deleteSlot(id: string): Promise<void> {
    await apiClient.delete(`/ptm/${id}`);
  }

  async bulkDeleteSlots(slotIds: string[]): Promise<void> {
    await apiClient.delete('/ptm/bulk', { data: { slotIds } });
  }

  async bookSlot(id: string, studentId: string, notes?: string): Promise<PTMSlot> {
    const response = await apiClient.post(`/ptm/${id}/book`, { studentId, notes }); return response.data.data;
  }
  async assignSlot(id: string, studentId: string): Promise<PTMSlot> {
    const response = await apiClient.post(`/ptm/${id}/assign`, { studentId }); return response.data.data;
  }

  async cancelBooking(id: string, reason?: string, adminOverride?: boolean): Promise<PTMSlot> {
    const response = await apiClient.post(`/ptm/${id}/cancel`, { reason, adminOverride });
    return response.data.data;
  }

  async rescheduleSlot(id: string, data: { date: string; startTime: string; endTime: string }): Promise<PTMSlot> {
    const response = await apiClient.post(`/ptm/${id}/reschedule`, data);
    return response.data.data;
  }

  async completeSlot(id: string, data: { notes?: string; attendanceStatus?: string }): Promise<PTMSlot> {
    const response = await apiClient.post(`/ptm/${id}/complete`, data);
    return response.data.data;
  }

  async sendReminder(id: string): Promise<any> {
    const response = await apiClient.post(`/ptm/${id}/reminder`);
    return response.data;
  }

  async getStats(startDate?: string, endDate?: string): Promise<PTMStats> {
    const response = await apiClient.get('/ptm/stats', { params: { startDate, endDate } });
    return response.data.data;
  }

  async getSlotsByTeacher(teacherId: string, params?: { status?: string; date?: string }): Promise<PTMSlot[]> {
    const response = await apiClient.get(`/ptm/teacher/${teacherId}`, { params });
    return response.data.data;
  }

  async getBookingsByParent(parentId: string, params?: { status?: string }): Promise<PTMSlot[]> {
    const response = await apiClient.get(`/ptm/parent/${parentId}`, { params });
    return response.data.data;
  }

  async getAvailableSlots(params?: { date?: string; teacherId?: string }): Promise<PTMSlot[]> {
    const response = await apiClient.get('/ptm/available', { params });
    return response.data.data;
  }

  async scheduleVideoMeeting(id: string, data: {
    meetingLink?: string;
    platform?: string;
    meetingId?: string;
    password?: string;
  }): Promise<PTMSlot> {
    const response = await apiClient.post(`/ptm/${id}/meeting`, data);
    return response.data.data;
  }

  async exportData(format?: string, params?: { date?: string; status?: string }): Promise<any> {
    const response = await apiClient.get('/ptm/export', { params: { format, ...params } });
    return response.data;
  }

  async getAttendanceReport(startDate?: string, endDate?: string): Promise<any> {
    const response = await apiClient.get('/ptm/report/attendance', { params: { startDate, endDate } });
    return response.data.data;
  }
}

export default new PTMService();
