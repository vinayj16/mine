import apiService, { type ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';
import { apiClient } from '.';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused' | 'holiday' | 'halfday';
  remarks?: string;
}

export interface MarkAttendancePayload {
  date: string;
  class_id: string;
  section_id: string;
  records: {
    student_id: string;
    status: 'present' | 'absent' | 'late' | 'excused' | 'holiday' | 'halfday';
    remarks?: string;
  }[];
}

export const attendanceService = {
  /**
   * Get all attendance records
   * @param params - Query parameters
   * @returns List of attendance records
   */
  async getAll(params?: Record<string, any>): Promise<AttendanceRecord[]> {
    const response: ApiResponse<AttendanceRecord[]> = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.LIST,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch attendance records');
    }
    
    return response.data;
  },

  /**
   * Get attendance record by ID
   * @param id - Attendance record ID
   * @returns Attendance record
   */
  async getById(id: string): Promise<AttendanceRecord> {
    const response: ApiResponse<AttendanceRecord> = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.DETAIL(id)
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch attendance record');
    }
    
    return response.data;
  },

  /**
   * Create new attendance record
   * @param data - Attendance record data
   * @returns Created attendance record
   */
  async create(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const response: ApiResponse<AttendanceRecord> = await apiService.post(
      API_ENDPOINTS.ATTENDANCE.CREATE,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to create attendance record');
    }
    
    return response.data;
  },

  /**
   * Update attendance record
   * @param id - Attendance record ID
   * @param data - Updated attendance data
   * @returns Updated attendance record
   */
  async update(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    const response: ApiResponse<AttendanceRecord> = await apiService.put(
      API_ENDPOINTS.ATTENDANCE.UPDATE(id),
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to update attendance record');
    }
    
    return response.data;
  },

  /**
   * Get student attendance records
   * @param params - Query parameters
   * @returns Student attendance records
   */
  async getStudentAttendance(params?: Record<string, any>): Promise<AttendanceRecord[]> {
    const response: ApiResponse<AttendanceRecord[]> = await apiService.get(
      API_ENDPOINTS.ATTENDANCE.STUDENT,
      params
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Failed to fetch student attendance');
    }
    
    return response.data;
  },

  /**
   * Mark attendance for multiple students
   * @param payload - Attendance marking payload
   * @returns Success response
   */
  async markAttendance(payload: MarkAttendancePayload): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/student-attendance', payload);
      const data = response.data as { success: boolean; message?: string };
      if (data.success) {
        return { success: true, message: 'Attendance marked successfully' };
      }
      throw new Error(data.message || 'Failed to mark attendance');
    } catch (error: any) {
      console.error('Mark attendance error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to mark attendance');
    }
  },

  /**
   * Bulk mark attendance for multiple students
   * @param payload - Bulk attendance marking payload
   * @returns Success response
   */
  async bulkMarkAttendance(payload: { date: string; classId?: string; section?: string; records: Array<{ studentId: string; status: string; notes?: string }> }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/student-attendance/bulk', payload);
      const data = response.data as { success: boolean; message?: string };
      if (data.success) {
        return { success: true, message: data.message || `Marked attendance for ${payload.records.length} students` };
      }
      throw new Error(data.message || 'Failed to mark attendance');
    } catch (error: any) {
      console.error('Bulk mark attendance error:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to mark attendance');
    }
  },
};

export default attendanceService;
