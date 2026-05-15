import AcademicConfiguration from '../models/AcademicConfiguration.js';

class AcademicEngineService {
  async getAcademicStructure(institutionType, institutionId) {
    try {
      const config = await AcademicConfiguration.findOne({
        institutionType,
        institutionId,
        isActive: true
      });
      
      if (!config) {
        throw new Error(`No academic configuration found for ${institutionType}`);
      }
      
      return {
        hierarchy: config.hierarchy,
        studentGrouping: config.studentGrouping,
        terminology: config.terminology,
        modules: config.modules,
        features: config.features
      };
    } catch (error) {
      throw new Error(`Error fetching academic structure: ${error.message}`);
    }
  }

  async getAvailableModules(institutionType, institutionId) {
    try {
      const config = await AcademicConfiguration.findOne({
        institutionType,
        institutionId,
        isActive: true
      });
      
      if (!config) {
        throw new Error(`No academic configuration found for ${institutionType}`);
      }
      
      const baseModules = [
        'dashboard', 'users', 'roles', 'communication', 'library', 
        'transport', 'hostel', 'settings'
      ];
      
      return [...baseModules, ...config.modules];
    } catch (error) {
      throw new Error(`Error fetching available modules: ${error.message}`);
    }
  }

  async getStudentGroupingLogic(institutionType, institutionId) {
    try {
      const config = await AcademicConfiguration.findOne({
        institutionType,
        institutionId,
        isActive: true
      });
      
      if (!config || !config.groupingLogic) {
        throw new Error(`No grouping logic found for ${institutionType}`);
      }
      
      return config.groupingLogic;
    } catch (error) {
      throw new Error(`Error fetching student grouping logic: ${error.message}`);
    }
  }

  async getAttendanceRules(institutionType, institutionId) {
    try {
      const config = await AcademicConfiguration.findOne({
        institutionType,
        institutionId,
        isActive: true
      });
      
      if (!config || !config.attendanceRules) {
        throw new Error(`No attendance rules found for ${institutionType}`);
      }
      
      return config.attendanceRules;
    } catch (error) {
      throw new Error(`Error fetching attendance rules: ${error.message}`);
    }
  }

  async getExamSystem(institutionType, institutionId) {
    try {
      const config = await AcademicConfiguration.findOne({
        institutionType,
        institutionId,
        isActive: true
      });
      
      if (!config || !config.examSystem) {
        throw new Error(`No exam system found for ${institutionType}`);
      }
      
      return config.examSystem;
    } catch (error) {
      throw new Error(`Error fetching exam system: ${error.message}`);
    }
  }

  async getRequiredRoles(institutionType, institutionId) {
    try {
      const config = await AcademicConfiguration.findOne({
        institutionType,
        institutionId,
        isActive: true
      });
      
      if (!config || !config.roles) {
        throw new Error(`No roles found for ${institutionType}`);
      }
      
      const baseRoles = ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'admin', 'ACCOUNTANT', 'LIBRARIAN', 'TRANSPORT_MANAGER', 'HOSTEL_WARDEN'];
      return [...baseRoles, ...config.roles];
    } catch (error) {
      throw new Error(`Error fetching required roles: ${error.message}`);
    }
  }
}

export default new AcademicEngineService();
