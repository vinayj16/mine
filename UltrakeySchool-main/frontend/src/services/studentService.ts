import apiService from './api';
import type { ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

// Types
export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  class: string;
  section?: string;
  rollNumber: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  admissionDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  class: string;
  section?: string;
  rollNumber: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  admissionDate: string;
}

export interface UpdateStudentInput extends Partial<CreateStudentInput> {
  status?: 'active' | 'inactive' | 'graduated' | 'transferred';
}

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  class?: string;
  section?: string;
  status?: string;
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

// API Functions
export const studentService = {
  // Get all students with pagination and filters
  async getAll(filters: StudentFilters = {}): Promise<PaginatedResponse<Student>> {
    try {
      const params = {
        page: filters.page || 1,
        limit: filters.limit || 10,
        ...(filters.search && { search: filters.search }),
        ...(filters.class && { class: filters.class }),
        ...(filters.section && { section: filters.section }),
        ...(filters.status && { status: filters.status }),
        ...(filters.sortBy && { sortBy: filters.sortBy }),
        ...(filters.sortOrder && { sortOrder: filters.sortOrder }),
      };

      const response = await apiService.get<PaginatedResponse<Student>>(
        API_ENDPOINTS.STUDENTS.LIST,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch students');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch students:', error);
      throw error;
    }
  },

  // Get single student by ID
  async getById(id: string): Promise<Student> {
    try {
      const response = await apiService.get<Student>(
        API_ENDPOINTS.STUDENTS.DETAIL(id)
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student:', error);
      throw error;
    }
  },

  // Create new student
  async create(data: CreateStudentInput): Promise<Student> {
    try {
      const response = await apiService.post<Student>(
        API_ENDPOINTS.STUDENTS.CREATE,
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create student');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to create student:', error);
      throw error;
    }
  },

  // Update existing student
  async update(id: string, data: UpdateStudentInput): Promise<Student> {
    try {
      const response = await apiService.put<Student>(
        API_ENDPOINTS.STUDENTS.UPDATE(id),
        data
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update student');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to update student:', error);
      throw error;
    }
  },

  // Delete student
  async delete(id: string): Promise<void> {
    try {
      const response = await apiService.delete<{ success: boolean; message: string }>(
        API_ENDPOINTS.STUDENTS.DELETE(id)
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete student');
      }
    } catch (error) {
      console.error('[Student Service] Failed to delete student:', error);
      throw error;
    }
  },

  // Bulk delete students
  async bulkDelete(ids: string[]): Promise<void> {
    try {
      const response = await apiService.post<{ success: boolean; message: string }>(
        `${API_ENDPOINTS.STUDENTS.LIST}/bulk-delete`,
        { ids }
      );
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to bulk delete students');
      }
    } catch (error) {
      console.error('[Student Service] Failed to bulk delete students:', error);
      throw error;
    }
  },

  // Search students
  async search(query: string): Promise<Student[]> {
    try {
      const response = await apiService.get<Student[]>(
        API_ENDPOINTS.STUDENTS.LIST,
        { search: query }
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to search students');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to search students:', error);
      throw error;
    }
  },

  // Get students by class
  async getByClass(classId: string): Promise<Student[]> {
    try {
      const response = await apiService.get<Student[]>(
        `${API_ENDPOINTS.STUDENTS.LIST}/class/${classId}`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch students by class');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch students by class:', error);
      throw error;
    }
  },

  // Get student attendance
  async getAttendance(id: string, startDate?: string, endDate?: string): Promise<Record<string, unknown>[]> {
    try {
      const params: Record<string, string> = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(id)}/attendance`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student attendance');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student attendance:', error);
      throw error;
    }
  },

  // Get student fees
  async getFees(id: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(id)}/fees`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student fees');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student fees:', error);
      throw error;
    }
  },

  // Get student grades
  async getGrades(id: string): Promise<Record<string, unknown>[]> {
    try {
      const response = await apiService.get<Record<string, unknown>[]>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(id)}/grades`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student grades');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student grades:', error);
      throw error;
    }
  },

  // Export students to CSV
  async exportCSV(filters: StudentFilters = {}): Promise<Blob> {
    try {
      const params = { ...filters, format: 'csv' };
      const response = await apiService.get<Blob>(
        `${API_ENDPOINTS.STUDENTS.LIST}/export`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to export students as CSV');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to export students as CSV:', error);
      throw error;
    }
  },

  // Export students to PDF
  async exportPDF(filters: StudentFilters = {}): Promise<Blob> {
    try {
      const params = { ...filters, format: 'pdf' };
      const response = await apiService.get<Blob>(
        `${API_ENDPOINTS.STUDENTS.LIST}/export`,
        params
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to export students as PDF');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to export students as PDF:', error);
      throw error;
    }
  },

  // Import students from CSV
  async importCSV(file: File): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiService.post<{ success: number; failed: number; errors: string[] }>(
        `${API_ENDPOINTS.STUDENTS.LIST}/import`,
        formData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to import students');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to import students:', error);
      throw error;
    }
  },

  // Get student statistics
  async getStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byClass: { class: string; count: number }[];
  }> {
    try {
      const response = await apiService.get<{
        total: number;
        active: number;
        inactive: number;
        byClass: { class: string; count: number }[];
      }>(`${API_ENDPOINTS.STUDENTS.LIST}/statistics`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student statistics');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student statistics:', error);
      throw error;
    }
  },

  // Student Leave Management
  async getLeaves(studentId: string, filters?: {
    status?: 'pending' | 'approved' | 'rejected';
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: {
      _id: string;
      leaveType: string;
      startDate: string;
      endDate: string;
      totalDays: number;
      reason: string;
      status: 'pending' | 'approved' | 'rejected';
      appliedDate: string;
      reviewedDate?: string;
      reviewComments?: string;
    }[];
    summary: {
      sick: { total: number; used: number; available: number };
      casual: { total: number; used: number; available: number };
      emergency: { total: number; used: number; available: number };
    };
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.leaveType && { leaveType: filters.leaveType }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
        ...(filters?.page && { page: filters.page }),
        ...(filters?.limit && { limit: filters.limit }),
      };

      const response = await apiService.get<{
        data: any[];
        summary: any;
        meta: any;
      }>(`${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/leaves`, params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student leaves');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student leaves:', error);
      throw error;
    }
  },

  async applyLeave(studentId: string, leaveData: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachments?: File[];
  }): Promise<{
    _id: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
    status: 'pending';
    appliedDate: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('leaveType', leaveData.leaveType);
      formData.append('startDate', leaveData.startDate);
      formData.append('endDate', leaveData.endDate);
      formData.append('reason', leaveData.reason);
      
      if (leaveData.attachments) {
        leaveData.attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });
      }

      const response = await apiService.post<any>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/leaves`,
        formData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to apply for leave');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to apply for leave:', error);
      throw error;
    }
  },

  // Student Results Management
  async getResults(studentId: string, filters?: {
    academicYear?: string;
    examId?: string;
    term?: string;
    subject?: string;
  }): Promise<{
    data: {
      _id: string;
      examName: string;
      examDate: string;
      academicYear: string;
      term: string;
      subjects: {
        subjectId: string;
        subjectName: string;
        marksObtained: number;
        totalMarks: number;
        grade: string;
        remarks: string;
      }[];
      totalMarksObtained: number;
      totalMaxMarks: number;
      percentage: number;
      overallGrade: string;
      rank?: number;
      result: 'pass' | 'fail';
      teacherRemarks: string;
      principalRemarks: string;
    }[];
    summary: {
      totalExams: number;
      averagePercentage: number;
      bestResult: any;
      currentRank?: number;
    };
  }> {
    try {
      const params = {
        ...(filters?.academicYear && { academicYear: filters.academicYear }),
        ...(filters?.examId && { examId: filters.examId }),
        ...(filters?.term && { term: filters.term }),
        ...(filters?.subject && { subject: filters.subject }),
      };

      const response = await apiService.get<{
        data: any[];
        summary: any;
      }>(`${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/results`, params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student results');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student results:', error);
      throw error;
    }
  },

  // Student Timetable Management
  async getTimetable(studentId: string, filters?: {
    academicYear?: string;
    classId?: string;
    sectionId?: string;
    effectiveFrom?: string;
  }): Promise<{
    data: {
      _id: string;
      dayOfWeek: string;
      periods: {
        periodNumber: number;
        startTime: string;
        endTime: string;
        subjectId: string;
        subjectName: string;
        teacherId: string;
        teacherName: string;
        roomNumber: string;
        periodType: 'lecture' | 'lab' | 'break' | 'lunch' | 'assembly' | 'sports' | 'library' | 'other';
        isBreak: boolean;
      }[];
    }[];
    summary: {
      totalPeriods: number;
      totalSubjects: number;
      breaksCount: number;
      effectiveFrom: string;
      effectiveTo?: string;
    };
  }> {
    try {
      const params = {
        ...(filters?.academicYear && { academicYear: filters.academicYear }),
        ...(filters?.classId && { classId: filters.classId }),
        ...(filters?.sectionId && { sectionId: filters.sectionId }),
        ...(filters?.effectiveFrom && { effectiveFrom: filters.effectiveFrom }),
      };

      const response = await apiService.get<{
        data: any[];
        summary: any;
      }>(`${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/timetable`, params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student timetable');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student timetable:', error);
      throw error;
    }
  },

  // Student Library Management
  async getLibraryRecords(studentId: string, filters?: {
    status?: 'issued' | 'returned' | 'overdue' | 'lost';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: {
      _id: string;
      bookId: {
        _id: string;
        title: string;
        author: string;
        isbn: string;
        coverImage: string;
      };
      bookTitle: string;
      bookISBN: string;
      issueDate: string;
      dueDate: string;
      returnDate?: string;
      status: 'issued' | 'returned' | 'overdue' | 'lost';
      fineAmount: number;
      finePaid: boolean;
      renewalCount: number;
      condition: {
        atIssue: string;
        atReturn?: string;
      };
      remarks: string;
    }[];
    summary: {
      totalBooks: number;
      issuedBooks: number;
      returnedBooks: number;
      overdueBooks: number;
      totalFine: number;
      paidFine: number;
      pendingFine: number;
    };
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
        ...(filters?.page && { page: filters.page }),
        ...(filters?.limit && { limit: filters.limit }),
      };

      const response = await apiService.get<{
        data: any[];
        summary: any;
        meta: any;
      }>(`${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/library`, params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student library records');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student library records:', error);
      throw error;
    }
  },

  async returnBook(studentId: string, recordId: string, returnData?: {
    condition: string;
    remarks: string;
  }): Promise<{
    _id: string;
    returnDate: string;
    fineAmount: number;
    status: 'returned';
  }> {
    try {
      const response = await apiService.post<any>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/library/${recordId}/return`,
        returnData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to return book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to return book:', error);
      throw error;
    }
  },

  async renewBook(studentId: string, recordId: string): Promise<{
    _id: string;
    newDueDate: string;
    renewalCount: number;
    status: 'issued';
  }> {
    try {
      const response = await apiService.post<any>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/library/${recordId}/renew`
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to renew book');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to renew book:', error);
      throw error;
    }
  },

  // Student Transport Management
  async getTransport(studentId: string): Promise<{
    data: {
      _id: string;
      transportId: {
        _id: string;
        routeName: string;
        vehicleNumber: string;
        driverName: string;
        driverPhone: string;
        capacity: number;
        fare: number;
      };
      routeName: string;
      vehicleNumber: string;
      pickupPoint: string;
      pickupTime: string;
      dropPoint: string;
      dropTime: string;
      startDate: string;
      endDate?: string;
      status: 'active' | 'inactive' | 'suspended';
      feesPaid: boolean;
      emergencyContact: {
        name: string;
        relationship: string;
        phone: string;
      };
      remarks: string;
    } | null;
  }> {
    try {
      const response = await apiService.get<{
        data: any;
      }>(`${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/transport`);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student transport details');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student transport details:', error);
      throw error;
    }
  },

  async updateTransport(studentId: string, transportData: {
    transportId?: string;
    routeName?: string;
    vehicleNumber?: string;
    pickupPoint?: string;
    pickupTime?: string;
    dropPoint?: string;
    dropTime?: string;
    emergencyContact?: {
      name: string;
      relationship: string;
      phone: string;
    };
    remarks?: string;
  }): Promise<{
    _id: string;
    transportId: string;
    routeName: string;
    vehicleNumber: string;
    pickupPoint: string;
    pickupTime: string;
    dropPoint: string;
    dropTime: string;
    status: 'active';
    emergencyContact: any;
    remarks: string;
  }> {
    try {
      const response = await apiService.put<any>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/transport`,
        transportData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to update student transport');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to update student transport:', error);
      throw error;
    }
  },

  // Student Attendance Management
  async getStudentAttendance(studentId: string, filters?: {
    startDate?: string;
    endDate?: string;
    month?: string;
    year?: string;
    status?: 'present' | 'absent' | 'late' | 'excused' | 'half_day' | 'sick' | 'leave';
    page?: number;
    limit?: number;
  }): Promise<{
    data: {
      _id: string;
      date: string;
      status: 'present' | 'absent' | 'late' | 'excused' | 'half_day' | 'sick' | 'leave';
      checkInTime?: string;
      checkOutTime?: string;
      remarks?: string;
      markedBy: string;
    }[];
    summary: {
      totalDays: number;
      present: number;
      absent: number;
      late: number;
      excused: number;
      halfDay: number;
      sick: number;
      leave: number;
      percentage: number;
      month: string;
      year: string;
    };
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      const params = {
        ...(filters?.startDate && { startDate: filters.startDate }),
        ...(filters?.endDate && { endDate: filters.endDate }),
        ...(filters?.month && { month: filters.month }),
        ...(filters?.year && { year: filters.year }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.page && { page: filters.page }),
        ...(filters?.limit && { limit: filters.limit }),
      };

      const response = await apiService.get<{
        data: any[];
        summary: any;
        meta: any;
      }>(`${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/attendance`, params);
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to fetch student attendance');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to fetch student attendance:', error);
      throw error;
    }
  },

  async markAttendance(studentId: string, attendanceData: {
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused' | 'half_day' | 'sick' | 'leave';
    checkInTime?: string;
    checkOutTime?: string;
    remarks?: string;
  }): Promise<{
    _id: string;
    date: string;
    status: string;
    markedBy: string;
    markedAt: string;
  }> {
    try {
      const response = await apiService.post<any>(
        `${API_ENDPOINTS.STUDENTS.DETAIL(studentId)}/attendance`,
        attendanceData
      );
      
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to mark attendance');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Student Service] Failed to mark attendance:', error);
      throw error;
    }
  },
};

export default studentService;
