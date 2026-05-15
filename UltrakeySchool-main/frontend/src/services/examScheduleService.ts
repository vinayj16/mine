import apiService, { type ApiResponse } from './api';

export interface ExamSchedule {
  id: string;
  scheduleId?: string;
  institutionId: string;
  classId: string;
  subject: string;
  examName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  roomNo: string;
  maxMarks: number;
  minMarks: number;
  invigilators?: string[];
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  academicYear?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExamScheduleInput {
  institutionId: string;
  classId: string;
  subject: string;
  examName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: string;
  roomNo: string;
  maxMarks: number;
  minMarks: number;
  invigilators?: string[];
  academicYear?: string;
}

export interface UpdateExamScheduleInput extends Partial<CreateExamScheduleInput> {
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

export interface ExamScheduleFilters {
  page?: number;
  limit?: number;
  search?: string;
  institutionId?: string;
  classId?: string;
  subject?: string;
  examName?: string;
  examDate?: string;
  roomNo?: string;
  status?: string;
  academicYear?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const examScheduleService = {
  async getAll(filters: ExamScheduleFilters = {}): Promise<PaginatedResponse<ExamSchedule>> {
    const params: Record<string, string> = {
      page: String(filters.page || 1),
      limit: String(filters.limit || 10),
    };
    
    if (filters.search) params.search = filters.search;
    if (filters.institutionId) params.institutionId = filters.institutionId;
    if (filters.classId) params.classId = filters.classId;
    if (filters.subject) params.subject = filters.subject;
    if (filters.examName) params.examName = filters.examName;
    if (filters.examDate) params.examDate = filters.examDate;
    if (filters.roomNo) params.roomNo = filters.roomNo;
    if (filters.status) params.status = filters.status;
    if (filters.academicYear) params.academicYear = filters.academicYear;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    const response: ApiResponse<PaginatedResponse<ExamSchedule>> = await apiService.get(
      '/exam-schedules',
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam schedules');
    }
    
    return response.data;
  },

  async getById(id: string): Promise<ExamSchedule> {
    const response: ApiResponse<ExamSchedule> = await apiService.get(
      `/exam-schedules/${id}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam schedule');
    }
    
    return response.data;
  },

  async create(data: CreateExamScheduleInput): Promise<ExamSchedule> {
    const response: ApiResponse<ExamSchedule> = await apiService.post(
      'exam-schedules',
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create exam schedule');
    }
    
    return response.data;
  },

  async update(id: string, data: UpdateExamScheduleInput): Promise<ExamSchedule> {
    const response: ApiResponse<ExamSchedule> = await apiService.put(
      `exam-schedules/${id}`,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update exam schedule');
    }
    
    return response.data;
  },

  async delete(id: string): Promise<void> {
    const response: ApiResponse<void> = await apiService.delete(
      `exam-schedules/${id}`
    );
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete exam schedule');
    }
  },

  async getByClass(classId: string, academicYear?: string): Promise<ExamSchedule[]> {
    const params: Record<string, string> = {};
    if (academicYear) params.academicYear = academicYear;

    const response: ApiResponse<ExamSchedule[]> = await apiService.get(
      `/exam-schedules/class/${classId}`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam schedules by class');
    }
    
    return response.data;
  },

  async getByDate(date: string, institutionId?: string): Promise<ExamSchedule[]> {
    const params: Record<string, string> = {};
    if (institutionId) params.institutionId = institutionId;

    const response: ApiResponse<ExamSchedule[]> = await apiService.get(
      `/exam-schedules/date/${date}`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam schedules by date');
    }
    
    return response.data;
  },

  async getByRoom(roomNo: string, institutionId?: string): Promise<ExamSchedule[]> {
    const params: Record<string, string> = {};
    if (institutionId) params.institutionId = institutionId;

    const response: ApiResponse<ExamSchedule[]> = await apiService.get(
      `/exam-schedules/room/${roomNo}`,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch exam schedules by room');
    }
    
    return response.data;
  },

  async checkRoomAvailability(
    roomNo: string,
    examDate: string,
    startTime: string,
    endTime: string,
    institutionId?: string
  ): Promise<boolean> {
    const params: Record<string, string> = {
      roomNo,
      examDate,
      startTime,
      endTime,
    };
    if (institutionId) params.institutionId = institutionId;

    const response: ApiResponse<{ isAvailable: boolean }> = await apiService.get(
      '/exam-schedules/check-room-availability',
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to check room availability');
    }
    
    return response.data.isAvailable;
  },
};

export default examScheduleService;
