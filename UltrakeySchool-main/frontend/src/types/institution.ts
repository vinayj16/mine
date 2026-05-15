export type InstitutionType = 'SCHOOL' | 'INTER_COLLEGE' | 'DEGREE_COLLEGE' | 'ENGINEERING_COLLEGE';

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  code: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  logo?: string;
  status: 'active' | 'inactive' | 'suspended';
  subscription: {
    plan: 'basic' | 'medium' | 'premium';
    expiresAt: Date;
    features: string[];
  };
  academicConfig: AcademicConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicConfig {
  institutionType: InstitutionType;
  // School specific
  classes?: ClassConfig[];
  // Inter College specific  
  interYears?: InterYearConfig[];
  streams?: StreamConfig[];
  // Degree College specific
  departments?: DepartmentConfig[];
  courses?: CourseConfig[];
  semesters?: SemesterConfig[];
  // Common
  academicYear: AcademicYearConfig;
  attendancePolicy: AttendancePolicyConfig;
  examPolicy: ExamPolicyConfig;
}

// School Structure
export interface ClassConfig {
  id: string;
  name: string;
  sections: SectionConfig[];
  order: number;
}

export interface SectionConfig {
  id: string;
  name: string;
  classId: string;
  capacity: number;
}

// Inter College Structure
export interface InterYearConfig {
  id: string;
  name: string;
  order: number;
}

export interface StreamConfig {
  id: string;
  name: string;
  code: string;
  subjects: SubjectConfig[];
  order: number;
}

// Degree College Structure
export interface DepartmentConfig {
  id: string;
  name: string;
  code: string;
  hodId?: string;
  courses: CourseConfig[];
}

export interface CourseConfig {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  duration: number; // years
  totalCredits: number;
  semesters: SemesterConfig[];
}

export interface SemesterConfig {
  id: string;
  name: string;
  number: number;
  courseId: string;
  subjects: SubjectConfig[];
  startDate: Date;
  endDate: Date;
}

export interface SubjectConfig {
  id: string;
  name: string;
  code: string;
  type: 'theory' | 'practical' | 'elective';
  credits: number;
  maxMarks: number;
  passMarks: number;
  facultyId?: string;
}

// Common Configurations
export interface AcademicYearConfig {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  current: boolean;
}

export interface AttendancePolicyConfig {
  minimumRequired: number;
  shortageAllowed: number;
  medicalLeaveAllowed: number;
}

export interface ExamPolicyConfig {
  internalWeightage: number;
  externalWeightage: number;
  attendanceWeightage: number;
  assignmentWeightage: number;
}
