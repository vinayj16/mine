import { type InstitutionType } from '../types/institution';

export class AcademicEngine {
  /**
   * Get academic structure for institution type
   * @param institutionType - Type of institution (SCHOOL, INTER_COLLEGE, DEGREE_COLLEGE)
   * @returns Academic structure configuration
   */
  static getAcademicStructure(institutionType: InstitutionType) {
    switch (institutionType) {
      case 'SCHOOL':
        return this.getSchoolStructure();
      case 'INTER_COLLEGE':
        return this.getInterCollegeStructure();
      case 'DEGREE_COLLEGE':
        return this.getDegreeCollegeStructure();
      case 'ENGINEERING_COLLEGE':
        return this.getEngineeringCollegeStructure();
      default:
        throw new Error(`Unsupported institution type: ${institutionType}`);
    }
  }

  /**
   * Get school structure configuration
   */
  static getSchoolStructure() {
    return {
      hierarchy: ['academic_year', 'class', 'section'],
      studentGrouping: 'class_section',
      terminology: {
        student: 'Student',
        teacher: 'Teacher',
        class: 'Class',
        section: 'Section',
        exam: 'Exam',
        result: 'Result'
      },
      modules: [
        'classes',
        'sections', 
        'subjects',
        'students',
        'teachers',
        'attendance',
        'exams',
        'fees',
        'reports'
      ],
      features: {
        promotion: true,
        streams: false,
        departments: false,
        courses: false,
        semesters: false,
        credits: false
      }
    };
  }

  /**
   * Get inter college structure configuration
   */
  static getInterCollegeStructure() {
    return {
      hierarchy: ['academic_year', 'year', 'stream', 'section'],
      studentGrouping: 'year_stream_section',
      terminology: {
        student: 'Student',
        teacher: 'Lecturer',
        class: 'Year',
        section: 'Section',
        exam: 'Exam',
        result: 'Result'
      },
      modules: [
        'inter_years',
        'streams',
        'sections',
        'students',
        'lecturers',
        'attendance',
        'exams',
        'practicals',
        'fees',
        'reports'
      ],
      features: {
        promotion: true,
        streams: true,
        departments: false,
        courses: false,
        semesters: false,
        credits: false,
        practicals: true,
        boardExams: true
      }
    };
  }

  /**
   * Get degree college structure configuration
   */
  static getDegreeCollegeStructure() {
    return {
      hierarchy: ['department', 'course', 'year', 'semester', 'subject'],
      studentGrouping: 'course_semester',
      terminology: {
        student: 'Student',
        teacher: 'Professor',
        class: 'Course',
        section: 'Semester',
        exam: 'Semester Exam',
        result: 'Result'
      },
      modules: [
        'departments',
        'courses',
        'semesters',
        'subjects',
        'students',
        'faculty',
        'attendance',
        'internal_assessments',
        'examinations',
        'results',
        'fees',
        'placement',
        'reports'
      ],
      features: {
        promotion: false,
        streams: false,
        departments: true,
        courses: true,
        semesters: true,
        credits: true,
        practicals: true,
        boardExams: false,
        gpa: true,
        cgpa: true,
        workload: true
      }
    };
  }
  
  static getEngineeringCollegeStructure() {
    return {
      hierarchy: ['department', 'course', 'year', 'semester', 'subject'],
      studentGrouping: 'course_semester',
      terminology: {
        student: 'Student',
        teacher: 'Professor',
        class: 'Course',
        section: 'Semester',
        exam: 'Semester Exam',
        result: 'Result'
      },
      modules: [
        'departments',
        'courses',
        'semesters',
        'subjects',
        'students',
        'faculty',
        'attendance',
        'internal_assessments',
        'examinations',
        'results',
        'fees',
        'placement',
        'reports'
      ],
      features: {
        promotion: false,
        streams: false,
        departments: true,
        courses: true,
        semesters: true,
        credits: true,
        practicals: true,
        boardExams: false,
        gpa: true,
        cgpa: true,
        workload: true
      }
    };
  }
  
  /**
   * Get available modules for institution type
   * @param institutionType - Type of institution
   * @returns Array of available module names
   */
  static getAvailableModules(institutionType: InstitutionType): string[] {
    const baseModules = [
      'dashboard',
      'users', 
      'roles',
      'communication',
      'library',
      'transport',
      'hostel',
      'settings'
    ];

    const specificModules: Record<InstitutionType, string[]> = {
      SCHOOL: [
        'students',
        'teachers', 
        'academics',
        'attendance',
        'exams',
        'fees',
        'reports'
      ],
      INTER_COLLEGE: [
        'students',
        'lecturers',
        'inter_academics',
        'attendance',
        'exams',
        'practicals',
        'fees',
        'reports'
      ],
      DEGREE_COLLEGE: [
        'students',
        'faculty',
        'departments',
        'courses',
        'semesters',
        'subjects',
        'students',
        'faculty',
        'attendance',
        'internal_assessments',
        'examinations',
        'results',
        'fees',
        'placement',
        'reports'
      ],
      ENGINEERING_COLLEGE: [
        'students',
        'faculty',
        'departments',
        'courses',
        'semesters',
        'subjects',
        'students',
        'faculty',
        'attendance',
        'internal_assessments',
        'examinations',
        'results',
        'fees',
        'placement',
        'reports'
      ]
    };

    return [...baseModules, ...specificModules[institutionType]];
  }

  /**
   * Get student grouping logic for institution type
   * @param institutionType - Type of institution
   * @returns Grouping configuration
   */
  static getStudentGroupingLogic(institutionType: InstitutionType) {
    const logic: Record<InstitutionType, {
      groupBy: string;
      fields: string[];
      promotionLogic: string;
    }> = {
      SCHOOL: {
        groupBy: 'class_section',
        fields: ['classId', 'sectionId'],
        promotionLogic: 'class_to_class'
      },
      INTER_COLLEGE: {
        groupBy: 'year_stream_section',
        fields: ['yearId', 'streamId', 'sectionId'],
        promotionLogic: 'year_to_year'
      },
      DEGREE_COLLEGE: {
        groupBy: 'course_semester',
        fields: ['courseId', 'semesterId'],
        promotionLogic: 'semester_to_semester'
      },
      ENGINEERING_COLLEGE: {
        groupBy: 'course_semester',
        fields: ['courseId', 'semesterId'],
        promotionLogic: 'semester_to_semester'
      }
    };

    return logic[institutionType];
  }

  /**
   * Get attendance rules for institution type
   * @param institutionType - Type of institution
   * @returns Attendance policy configuration
   */
  static getAttendanceRules(institutionType: InstitutionType) {
    const baseRules = {
      minimumRequired: 75,
      shortageAllowed: 25,
      medicalLeaveAllowed: 10
    };

    const specificRules: Record<InstitutionType, any> = {
      SCHOOL: {
        ...baseRules,
        dailyAttendance: true,
        subjectWise: false
      },
      INTER_COLLEGE: {
        ...baseRules,
        dailyAttendance: true,
        subjectWise: true,
        practicalAttendance: true,
        boardCompliance: true
      },
        DEGREE_COLLEGE: {
          ...baseRules,
          dailyAttendance: false,
          subjectWise: true,
          creditBased: true,
          internalEligibility: true
        },
        ENGINEERING_COLLEGE: {
          ...baseRules,
          dailyAttendance: false,
          subjectWise: true,
          creditBased: true,
          internalEligibility: true
        }

    };

    return specificRules[institutionType];
  }

  /**
   * Get exam system configuration for institution type
   * @param institutionType - Type of institution
   * @returns Exam system configuration
   */
  static getExamSystem(institutionType: InstitutionType) {
    const systems: Record<InstitutionType, any> = {
      SCHOOL: {
        type: 'annual',
        internalWeightage: 0,
        externalWeightage: 100,
        subjects: ['theory'],
        grading: 'percentage'
      },
      INTER_COLLEGE: {
        type: 'board_preparation',
        internalWeightage: 20,
        externalWeightage: 80,
        subjects: ['theory', 'practical'],
        grading: 'percentage',
        boardIntegration: true
      },
      DEGREE_COLLEGE: {
        type: 'semester',
        internalWeightage: 40,
        externalWeightage: 60,
        subjects: ['theory', 'practical', 'assignment'],
        grading: 'gpa',
        creditSystem: true,
        backlog: true
      },
      ENGINEERING_COLLEGE: {
        type: 'semester',
        internalWeightage: 40,
        externalWeightage: 60,
        subjects: ['theory', 'practical', 'assignment'],
        grading: 'gpa',
        creditSystem: true,
        backlog: true
      }
    };

    return systems[institutionType];
  }

  /**
   * Get required roles for institution type
   * @param institutionType - Type of institution
   * @returns Array of role names
   */
  static getRequiredRoles(institutionType: InstitutionType): string[] {
    const baseRoles = [
      'SUPER_ADMIN',
      'INSTITUTION_ADMIN',
      'ADMIN',
      'ACCOUNTANT',
      'LIBRARIAN',
      'TRANSPORT_MANAGER',
      'HOSTEL_WARDEN'
    ];

    const specificRoles: Record<InstitutionType, string[]> = {
      SCHOOL: [
        'TEACHER',
        'STUDENT',
        'PARENT'
      ],
      INTER_COLLEGE: [
        'LECTURER',
        'STUDENT',
        'PARENT',
        'PRINCIPAL',
        'VICE_PRINCIPAL'
      ],
      DEGREE_COLLEGE: [
        'PROFESSOR',
        'ASSISTANT_PROFESSOR',
        'HOD',
        'EXAM_CONTROLLER',
        'STUDENT',
        'PARENT',
        'PRINCIPAL'
      ],
      ENGINEERING_COLLEGE:[
        'PROFESSOR',
        'ASSISTANT_PROFESSOR',
        'HOD',
        'EXAM_CONTROLLER',
        'STUDENT',
        'PARENT',
        'PRINCIPAL'
      ]
    };

    return [...baseRoles, ...specificRoles[institutionType]];
  }

  /**
   * Validate institution type
   * @param type - Institution type to validate
   * @returns True if valid
   */
  static isValidInstitutionType(type: string): type is InstitutionType {
    return ['SCHOOL', 'INTER_COLLEGE', 'DEGREE_COLLEGE'].includes(type);
  }

  /**
   * Get all supported institution types
   * @returns Array of institution types
   */
  static getSupportedTypes(): InstitutionType[] {
    return ['SCHOOL', 'INTER_COLLEGE', 'DEGREE_COLLEGE'];
  }
}
