import apiClient from './api';

export interface ClassSchedule {
  _id: string;
  scheduleId: string;
  classId: string;
  className: string;
  section: string;
  subject: string;
  subjectId?: string;
  teacher: string;
  teacherId: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  duration?: number;
  status: 'active' | 'inactive' | 'cancelled';
  academicYear: string;
  institutionId: string;
  recurrence?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateClassScheduleInput {
  classId: string;
  className: string;
  section: string;
  subject: string;
  subjectId?: string;
  teacher: string;
  teacherId: string;
  room: string;
  day: string;
  startTime: string;
  endTime: string;
  duration?: number;
  academicYear: string;
  institutionId: string;
  recurrence?: string;
  notes?: string;
}

export interface UpdateClassScheduleInput extends Partial<CreateClassScheduleInput> {
  status?: 'active' | 'inactive' | 'cancelled';
}

export interface ClassScheduleFilters {
  className?: string;
  section?: string;
  day?: string;
  status?: string;
  teacherId?: string;
  classId?: string;
  academicYear?: string;
  institutionId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const classScheduleService = {
  async getAll(filters?: ClassScheduleFilters): Promise<{ data: ClassSchedule[]; pagination?: any }> {
    const response = await apiClient.get('/class-schedules', { params: filters });
    return response.data as { data: ClassSchedule[]; pagination?: any };
  },

  async getById(id: string): Promise<ClassSchedule> {
    const response = await apiClient.get(`/class-schedules/${id}`);
    return (response.data as any).data;
  },

  async create(data: CreateClassScheduleInput): Promise<ClassSchedule> {
    const response = await apiClient.post('/class-schedules', data);
    return (response.data as any).data;
  },

  async update(id: string, data: UpdateClassScheduleInput): Promise<ClassSchedule> {
    const response = await apiClient.put(`/class-schedules/${id}`, data);
    return (response.data as any).data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/class-schedules/${id}`);
  },

  async getByClass(classId: string, day?: string): Promise<ClassSchedule[]> {
    const response = await apiClient.get(`/class-schedules/class/${classId}`, {
      params: { day }
    });
    return (response.data as any).data;
  },

  async getByTeacher(teacherId: string, day?: string): Promise<ClassSchedule[]> {
    const response = await apiClient.get(`/class-schedules/teacher/${teacherId}`, {
      params: { day }
    });
    return (response.data as any).data;
  },

  async getByDay(day: string, institutionId?: string): Promise<ClassSchedule[]> {
    const response = await apiClient.get(`/class-schedules/day/${day}`, {
      params: { institutionId }
    });
    return (response.data as any).data;
  },

  async getWeeklySchedule(classId: string): Promise<any> {
    const response = await apiClient.get(`/class-schedules/class/${classId}/weekly`);
    return (response.data as any).data;
  },

  async getTeacherWeeklySchedule(teacherId: string): Promise<any> {
    const response = await apiClient.get(`/class-schedules/teacher/${teacherId}/weekly`);
    return (response.data as any).data;
  },

  async cancel(id: string): Promise<ClassSchedule> {
    const response = await apiClient.patch(`/class-schedules/${id}/cancel`);
    return (response.data as any).data;
  },

  async search(query: string, institutionId?: string): Promise<ClassSchedule[]> {
    const response = await apiClient.get('/class-schedules/search', {
      params: { q: query, institutionId }
    });
    return (response.data as any).data;
  },

  async getStatistics(institutionId?: string, academicYear?: string): Promise<any> {
    const response = await apiClient.get('/class-schedules/statistics', {
      params: { institutionId, academicYear }
    });
    return (response.data as any).data;
  }
};

export default classScheduleService;
