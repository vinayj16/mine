/**
 * Institution Filter Middleware
 * Automatically adds institutionId filter to all database queries
 * to ensure data isolation between institutions
 */

const institutionFilterMiddleware = (req, res, next) => {
  // Skip institution filtering for superadmin and agent roles
  if (req.user && (req.user.role === 'superadmin' || req.user.role === 'agent')) {
    return next();
  }

  // Skip if no authenticated user
  if (!req.user || !req.user.institutionId) {
    return next();
  }

  const institutionId = req.user.institutionId;

  // Models that should have institution filtering
  const institutionFilteredModels = [
    'User',
    'Student',
    'Teacher',
    'Staff',
    'Class',
    'Subject',
    'Attendance',
    'Email',
    'Chat',
    'Notice',
    'Event',
    'Exam',
    'Fee',
    'Library',
    'Transport',
    'Hostel',
    'School',
    'Department',
    'Designation',
    'Grade',
    'Holiday',
    'Leave',
    'LeaveType',
    'MenuCustomization',
    'Module',
    'Notice',
    'Notification',
    'Permission',
    'Role',
    'Schedule',
    'Settings',
    'StudentAttendance',
    'StudentHostel',
    'StudentLeave',
    'StudentLibrary',
    'StudentResult',
    'StudentTimetable',
    'StudentTransport',
    'TeacherLeave',
    'TeacherLibrary',
    'TeacherRoutine',
    'TeacherSalary',
    'Todo',
    'Transaction',
    'Payment',
    'Invoice',
    'Commission',
    'Complaint',
    'ContactMessage',
    'Conversation',
    'Message',
    'FileSharing',
    'FileManager',
    'HomeWork',
    'OnlineExam',
    'PerformanceReview',
    'Performer',
    'Player',
    'Recruitment',
    'RegistrationRequest',
    'SupportTicket',
    'Syllabus',
    'Testimonial',
    'AcademicConfiguration',
    'AcademicReason',
    'AdminAlert',
    'AdminActivity',
    'AuditLog',
    'BannedIP',
    'Blog',
    'BlogComment',
    'BlogTag',
    'Branch',
    'CallLog',
    'ClassRoom',
    'ClassSchedule',
    'ClassTimetable',
    'ConnectedApp',
    'CustomField',
    'DataErasureRequest',
    'DataExportRequest',
    'Driver',
    'EmailSettings',
    'Enrollment',
    'Event',
    'ExamSchedule',
    'ExpenseCategory',
    'Finance',
    'Geofence',
    'Guardian',
    'Hostel',
    'InventoryItem',
    'InventoryTransaction',
    'MembershipAddon',
    'MembershipPlan',
    'MenuCustomizationRole',
    'ModuleCategory',
    'Note',
    'Organization',
    'PendingInstitutionRegistration',
    'Permission',
    'PlatformHealth',
    'PlatformSetting',
    'PTMSlot',
    'PaymentGatewaySettings',
    'Payroll',
    'PickupPoint',
    'Principal',
    'Recreation',
    'RegistrationRequest',
    'Religion',
    'ReportTemplate',
    'RfidCard',
    'ScheduledReport',
    'SidebarPreference',
    'Sport',
    'StaffDocument',
    'Statistic',
    'StorageSettings',
    'Subscription',
    'SubscriptionRequest',
    'SuperAdminMenuItem',
    'TaxRate',
    'TransportAssignment',
    'TransportFee',
    'TransportReport',
    'TransportRoute',
    'UserCredential',
    'canteenMenuItem',
    'canteenOrder',
    'canteenPayment',
    'hostelAttendance',
    'hostelFee'
  ];

  // Add institution filter helper to request object
  req.addInstitutionFilter = (filter = {}) => {
    return {
      ...filter,
      institutionId: institutionId
    };
  };

  // Check if model should be filtered
  req.shouldFilterModel = (modelName) => {
    return institutionFilteredModels.includes(modelName);
  };

  next();
};

export default institutionFilterMiddleware;
