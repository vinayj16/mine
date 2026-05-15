import apiService, { type ApiResponse } from './api';
import type { InstitutionType } from '../types/institution';

interface AcademicStructure {
  hierarchy: string[];
  studentGrouping: string;
  terminology: Record<string, string>;
  modules: string[];
  features: Record<string, boolean>;
}

interface StudentGrouping {
  groupBy: string;
  fields: string[];
  promotionLogic: string;
}

interface AttendanceRules {
  minimumRequired: number;
  shortageAllowed: number;
  medicalLeaveAllowed: number;
  dailyAttendance?: boolean;
  subjectWise?: boolean;
  practicalAttendance?: boolean;
  boardCompliance?: boolean;
  creditBased?: boolean;
  internalEligibility?: boolean;
}

interface ExamSystem {
  type: string;
  internalWeightage: number;
  externalWeightage: number;
  subjects: string[];
  grading: string;
  boardIntegration?: boolean;
  creditSystem?: boolean;
  backlog?: boolean;
}

const academicEngineService = {
  /**
   * Get academic structure from backend
   * @param institutionType - Type of institution
   * @returns Academic structure configuration
   */
  async getAcademicStructure(institutionType: InstitutionType): Promise<AcademicStructure> {
    try {
      const response: ApiResponse<AcademicStructure> = await apiService.get(
        `/academic-engine/structure/${institutionType}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch academic structure');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch structure:', error);
      throw error;
    }
  },

  /**
   * Get available modules from backend
   * @param institutionType - Type of institution
   * @returns Array of module names
   */
  async getAvailableModules(institutionType: InstitutionType): Promise<string[]> {
    try {
      const response: ApiResponse<string[]> = await apiService.get(
        `/academic-engine/modules/${institutionType}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch modules');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch modules:', error);
      throw error;
    }
  },

  /**
   * Get student grouping logic from backend
   * @param institutionType - Type of institution
   * @returns Grouping configuration
   */
  async getStudentGroupingLogic(institutionType: InstitutionType): Promise<StudentGrouping> {
    try {
      const response: ApiResponse<StudentGrouping> = await apiService.get(
        `/academic-engine/grouping/${institutionType}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch grouping logic');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch grouping logic:', error);
      throw error;
    }
  },

  /**
   * Get attendance rules from backend
   * @param institutionType - Type of institution
   * @returns Attendance rules configuration
   */
  async getAttendanceRules(institutionType: InstitutionType): Promise<AttendanceRules> {
    try {
      const response: ApiResponse<AttendanceRules> = await apiService.get(
        `/academic-engine/attendance-rules/${institutionType}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch attendance rules');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch attendance rules:', error);
      throw error;
    }
  },

  /**
   * Get exam system from backend
   * @param institutionType - Type of institution
   * @returns Exam system configuration
   */
  async getExamSystem(institutionType: InstitutionType): Promise<ExamSystem> {
    try {
      const response: ApiResponse<ExamSystem> = await apiService.get(
        `/academic-engine/exam-system/${institutionType}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch exam system');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch exam system:', error);
      throw error;
    }
  },

  /**
   * Get required roles from backend
   * @param institutionType - Type of institution
   * @returns Array of role names
   */
  async getRequiredRoles(institutionType: InstitutionType): Promise<string[]> {
    try {
      const response: ApiResponse<string[]> = await apiService.get(
        `/academic-engine/roles/${institutionType}`
      );
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch roles');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch roles:', error);
      throw error;
    }
  },

  /**
   * Get complete academic configuration from backend
   * @param institutionType - Type of institution
   * @returns Complete configuration object
   */
  async getCompleteConfiguration(institutionType: InstitutionType): Promise<{
    structure: AcademicStructure;
    modules: string[];
    grouping: StudentGrouping;
    attendanceRules: AttendanceRules;
    examSystem: ExamSystem;
    roles: string[];
  }> {
    try {
      const response: ApiResponse<{
        structure: AcademicStructure;
        modules: string[];
        grouping: StudentGrouping;
        attendanceRules: AttendanceRules;
        examSystem: ExamSystem;
        roles: string[];
      }> = await apiService.get(`/academic-engine/complete/${institutionType}`);
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch complete configuration');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Academic Engine] Failed to fetch complete configuration:', error);
      throw error;
    }
  }
};

export default academicEngineService;
