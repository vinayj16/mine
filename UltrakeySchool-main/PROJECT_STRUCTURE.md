# UltrakeySchool - Project Structure Documentation

📊 Collection Statistics:
========================
✅ transportroutes: 8 documents
✅ pendinginstitutionregistrations: 3 documents
❌ admissioncriterias: EMPTY
✅ departments: 97 documents
❌ logincredentials: EMPTY
✅ agents: 34 documents
✅ salaries: 221
❌ videoconferences: EMPTY
✅ budgets: 22 documents
✅ subscriptions: 1 documents
✅ librarybooks: 15 documents
❌ onlineexams: EMPTY
✅ permissions: 28
✅ holidays: 23 documents
❌ sharedfiles: EMPTY
❌ emailsettings: EMPTY
❌ transportfees: EMPTY
❌ statistics: EMPTY
✅ inventoryitems: 110 documents
✅ bookissues: 10 documents
✅ attendances: 105 documents
✅ sessions: 11 documents
✅ schedules: 22
❌ vehiclemaintenances: EMPTY
✅ rooms: 11 documents
❌ results: EMPTY
❌ emails: EMPTY
✅ schools: 2 documents
✅ supporttickets: 1490 5
❌ transportreports: EMPTY
❌ uservisibilities: EMPTY
✅ examschedules: 4 documents
❌ roominventories: EMPTY
❌ oauthaccounts: EMPTY
❌ questionbanks: EMPTY
❌ adminactivities: EMPTY
❌ studentattendances: EMPTY
✅ installmentplans: 40
✅ feereminders: 785
✅ designations: 100 documents
✅ notifications: 2122 documents
✅ filemanagers: 2 documents
✅ leaves: 36 documents
✅ homeworks: 36 documents
✅ studentresults: 2700
❌ adminalerts: EMPTY
❌ otps: EMPTY
✅ classes: 232 documents
✅ grades: 55 documents
❌ customfields: EMPTY
❌ menucustomizations: EMPTY
✅ feestructures: 33 documents
✅ exams: 22 documents
✅ drivers: 11 documents
✅ leavetypes: 22 documents
❌ inventorytransactions: EMPTY
❌ teacherleaves: EMPTY
❌ scholarships: EMPTY
❌ sidebarpreferences: EMPTY
❌ communicationchannels: EMPTY
✅ fees: 20 documents
❌ academicreasons: EMPTY
❌ paymentgatewaysettings: EMPTY
❌ proctoringsessions: EMPTY
✅ calllogs: 2092 documents
❌ hostelmaintenances: EMPTY
✅ users: 732 documents
❌ widgettemplates: EMPTY
❌ performers: EMPTY
❌ classrooms: EMPTY
✅ todos: 1294 documents
❌ classschedules: EMPTY
✅ religions: 25 documents
❌ dataexportrequests: EMPTY
❌ studenthostels: EMPTY
✅ notices: 23 documents
✅ commissions: 1 documents
❌ superadminmenuitems: EMPTY
❌ staffdocuments: EMPTY
❌ userblocks: EMPTY
✅ teacherroutines: 90
❌ ptmslots: EMPTY
✅ conversations: 116 documents
❌ platformhealths: EMPTY
❌ settings: 22
❌ studentleaves: EMPTY
❌ visitorlogs: EMPTY
❌ scholarshipapplications: EMPTY
❌ admissionapplications: EMPTY
✅ vehicles: 12 documents
✅ roomtypes: 11 documents
✅ guardians: 71 documents
❌ audit_logs: EMPTY
❌ academicconfigurations: EMPTY
❌ payments: EMPTY
❌ reporttemplates: EMPTY
❌ pickuppoints: EMPTY
❌ storagesettings: EMPTY
✅ institutions: 12 documents
❌ bannedips: EMPTY
❌ players: EMPTY
❌ bookreservations: EMPTY
❌ geofences: EMPTY
✅ events: 22 documents
❌ payrolls: EMPTY
✅ messages: 1015 documents
✅ expensecategories: 55 documents
✅ sports: 56 documents
❌ studenttimetables: EMPTY
✅ auditlogs: 1395 documents
❌ organizations: EMPTY
❌ financetransactions: EMPTY
❌ dataerasurerequests: EMPTY
❌ allocations: EMPTY
✅ roles: 36 documents
❌ connectedapps: EMPTY
❌ studenttransports: EMPTY
❌ syllabuses: EMPTY
✅ membershipplans: 3
❌ trips: EMPTY
✅ notes: 1131 documents
❌ dashboardwidgets: EMPTY
❌ taxrates: EMPTY
❌ filesharings: EMPTY
❌ attendance: EMPTY
✅ hostels: 6 documents
✅ transportassignments: 10 documents
✅ usercredentials: 1 documents
❌ performancereviews: EMPTY
❌ communicationmessages: EMPTY
❌ announcements: EMPTY
❌ teachers: EMPTY
✅ invoices: 16 documents
✅ subjects: 66 documents
❌ contactmessages: EMPTY
❌ examsubmissions: EMPTY
❌ teachersalaries: EMPTY
❌ schoolsettings: EMPTY
✅ branches: 3 documents
❌ recruitments: EMPTY
❌ fee_structures: EMPTY
❌ hostelcomplaints: EMPTY
❌ complaints: EMPTY
❌ scheduledreports: EMPTY
❌ gdprsettings: EMPTY
❌ books: EMPTY
❌ blogs: EMPTY
❌ trainings: EMPTY
✅ transactions: 12 documents
❌ studentlibraries: EMPTY
❌ teacherlibraries: EMPTY
✅ testimonials: 15
✅ classtimetables: 232
✅ examschedules: 4

👤 Unique Roles in Users Collection:
====================================
[
  'accountant',
  'admin',
  'guardian',
  'hostel_warden',
  'hr_manager',
  'institution_admin',
  'librarian',
  'principal',
  'staff',
  'student',
  'superadmin',
  'teacher',
  'transport_manager'
]

User	            Email	                    Password
Super Admin	      superadmin@edusearch.com	Test@123

=== edusearch database: 12 institutions, 837 users, 33 agents ===

PLATFORM AGENT (agents collection): sfghs dfghj | asdf@gmail.com | 7418515612 | Hyderabad | Telangana | Active | 10% commission

## Project Overview

UltrakeySchool is a comprehensive educational management system designed to streamline school administration, academic management, and communication. The system supports multi-tenant architecture, allowing multiple educational institutions to operate independently within a single platform. It features role-based access control for Super Admins, Institution Admins, Teachers, Students, Parents, and Staff members.

## Technology Stack

### Backend Technologies
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) with refresh token rotation
- **Validation**: Joi, express-validator
- **File Upload**: Multer with Sharp for image processing
- **PDF Generation**: PDFKit
- **Excel Operations**: ExcelJS
- **Email**: Nodemailer
- **Job Queues**: Bull, BullMQ
- **Caching**: Node-Cache, Redis (ioredis)
- **Scheduling**: Node-Cron
- **Logging**: Winston with daily rotation
- **Security**: Helmet, HPP, Express Rate Limiting, Express Mongo Sanitize, XSS Clean
- **Payment Gateways**: Razorpay, Stripe
- **OAuth**: Google Auth Library
- **2FA**: Speakeasy, OTPLib
- **Real-time**: Socket.io
- **API Documentation**: Swagger JSDoc, Swagger UI Express
- **Monitoring**: Sentry

### Frontend Technologies
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.4
- **Routing**: React Router DOM 7.9.6
- **State Management**: Zustand 5.0.11
- **Form Handling**: React Hook Form 7.71.2 with Zod 4.3.6 validation
- **UI Components**: React Bootstrap 2.10.10, Bootstrap 5.3.3
- **Data Visualization**: Chart.js 4.5.1, React Chart.js-2 5.3.1, Recharts 3.8.0
- **Calendar**: FullCalendar 6.1.20 (daygrid, interaction, timegrid, react)
- **Icons**: Lucide React 0.563.0, React Icons 5.6.0
- **Notifications**: React Hot Toast 2.6.0, React Toastify 11.0.5
- **Carousel**: Owl Carousel 2.3.4, React Owl Carousel 2.3.3
- **HTTP Client**: Axios 1.7.2
- **Date Utilities**: date-fns 3.6.0
- **TypeScript**: 5.9.3

## Project Structure

### Backend Structure

**Root Directory**: `backend/`

**Source Directory**: `backend/src/`

#### Backend File Counts
- **Routes**: 114 route files
- **Models**: 131 model files
- **Controllers**: 118 controller files
- **Services**: 106 service files
- **Middleware**: 15 middleware files
- **Validators**: 40 validator files
- **Templates**: 13 template files
- **Utils**: 6 utility files
- **Config**: 5 configuration files

#### Backend Directory Organization

**config/** - Configuration files for database, environment settings, and application constants

**controllers/** - Request handlers containing business logic for each route
- Handles HTTP requests and responses
- Implements validation and error handling
- Coordinates between routes and services

**middleware/** - Custom middleware functions
- Authentication and authorization
- Request validation
- Error handling
- Logging and monitoring
- Rate limiting
- File upload handling

**models/** - Mongoose schema definitions for MongoDB collections
- Data models with validation
- Relationships and references
- Indexes and virtual fields
- Instance and static methods

**routes/** - API endpoint definitions
- RESTful route configurations
- Middleware attachment
- Controller mapping
- Route grouping and versioning

**services/** - Business logic layer
- Database operations
- External API integrations
- Data processing and transformation
- Complex business rules

**templates/** - Email and notification templates
- HTML email templates
- SMS templates
- Notification templates

**utils/** - Utility functions and helpers
- Common helper functions
- Data formatting utilities
- Encryption and hashing
- File operations

**validators/** - Request validation schemas
- Joi validation schemas
- Input sanitization
- Custom validation rules

**server.js** - Main application entry point
- Express server initialization
- Middleware setup
- Route mounting
- Database connection
- Socket.io setup
- Error handling

### Frontend Structure

**Root Directory**: `frontend/`

**Source Directory**: `frontend/src/`

#### Frontend File Counts
- **TypeScript React Components (.tsx)**: 343 files
- **TypeScript Files (.ts)**: 108 files
- **Pages**: 299 page files
- **Components**: 36 component files
- **Services**: 67 service files
- **Hooks**: 7 custom hooks
- **Data Files**: 12 data files
- **Config Files**: 5 config files
- **Layouts**: 6 layout files
- **Styles**: 7 style files
- **Utils**: 11 utility files

#### Frontend Directory Organization

**api/** - API client configurations and services
- HTTP client setup with Axios
- API endpoint definitions
- Request/response interceptors
- Authentication token management

**assets/** - Static assets (images, fonts, icons)

**components/** - Reusable React components
- Common UI components (DataTable, LoadingSpinner, FileUpload)
- Dashboard components (charts, cards, analytics)
- Layout components (Header, Sidebar, PageHeader)
- Role-specific components (Student, Teacher sidebars)
- Example components for demonstrations

**config/** - Application configuration
- API configuration
- Module configurations
- Plan definitions
- Role definitions
- Sidebar menu configurations

**data/** - Mock data and sample data
- Agent data
- Dashboard access data
- Guardian data
- HRM data
- Institution data
- Parent data
- School data
- Settings data
- Student data
- Support ticket data
- Teacher data
- India-specific data

**hooks/** - Custom React hooks
- useAgents
- useDashboard
- useDataFetching
- useGuardians
- useHRM
- useSocket
- Index file

**layouts/** - Page layout components
- Main layout wrappers
- Authentication layouts
- Dashboard layouts

**pages/** - Page components organized by feature
- Admin pages
- Student pages
- Teacher pages
- Parent pages
- Guardian pages
- Academic pages
- Finance pages
- HRM pages
- Settings pages
- And many more functional pages

**router/** - Routing configuration
- Route definitions
- Protected routes
- Route guards
- Navigation setup

**services/** - API service functions
- Academic engine service
- Academic reason service
- Account request service
- Admin analytics service
- Agent service
- Analytics service
- Attendance service
- Branch service
- Call log service
- Chat service
- And many more domain-specific services

**store/** - State management
- Zustand store configuration
- Global state management

**styles/** - Global styles and theme configurations
- CSS files
- Theme definitions
- Custom styles

**types/** - TypeScript type definitions
- Interface definitions
- Type aliases
- Enum definitions

**utils/** - Utility functions
- Helper functions
- Formatters
- Validators
- Common utilities

**App.tsx** - Main application component
- Route setup
- Provider configurations
- Global error boundary

**main.tsx** - Application entry point
- React DOM rendering
- Provider setup

## User Roles and Permissions

### Supported User Roles
1. **Super Admin** - Platform-wide administration
2. **Institution Admin** - Institution-specific administration(ceo)
3. **Principal** - School leadership
admin(sadministration)
4. **Teacher** - Academic staff
5. **Student** - Learners
6. **Parent** - Guardians
7. **Staff** - Non-academic staff
8. **Agent** - Sales agents
9. **Guardian** - Student guardians
staff
hostel wardern
transportwarden
hr

### Role-Based Access Control (RBAC)
- Permission-based authorization
- Module access control
- Menu customization per role
- Dashboard customization per role
- API endpoint protection

## Key Features

### Academic Management
- Class and section management
- Student enrollment and tracking
- Attendance marking and reporting
- Exam creation and scheduling
- Online exams with proctoring
- Grade management and report cards
- Homework assignment and submission
- Study notes and materials sharing
- Timetable management
- Academic calendar

### Student Management
- Student profiles and records
- Guardian information
- Student attendance tracking
- Academic performance monitoring
- Fee payment tracking
- Leave management
- Hostel and transport management
- Library management

### Staff Management
- Teacher profiles and records
- Staff document management
- Leave management
- Salary management
- Performance tracking
- Designation and department management
- Payroll processing

### Financial Management
- Fee structure management
- Payment processing (Razorpay, Stripe)
- Invoice generation
- Transaction tracking
- Subscription management
- Commission tracking
- Financial reporting
- Canteen management

### Communication
- In-app messaging and chat
- Email notifications
- SMS notifications
- Push notifications
- Announcements
- Parent-teacher meeting scheduling
- Video meeting integration

### Reporting & Analytics
- Dashboard analytics
- Student performance reports
- Attendance reports
- Financial reports
- Custom report generation
- Scheduled reports
- Data export functionality

### Library Management
- Book cataloging
- Issue and return tracking
- Fine management
- Library records for students and teachers

### Transport Management
- Vehicle management
- Driver management
- Route management
- Student transport assignment
- Transport fee tracking

### Hostel Management
- Room management
- Student hostel assignment
- Hostel fee tracking
- Hostel attendance

### HR Management
- Employee records
- Leave management
- Payroll processing
- Performance tracking
- Department management

### Multi-Tenancy
- Multiple institution support
- Tenant isolation
- Custom branding per tenant
- Subscription-based access
- Resource allocation per tenant

### Security & Compliance
- JWT authentication
- Role-based access control
- 2FA support
- OAuth integration
- GDPR compliance
- Data erasure requests
- Audit logging
- IP banning
- Rate limiting
- Input validation and sanitization

### Integration Capabilities
- Payment gateway integration (Razorpay, Stripe)
- Email service integration
- SMS service integration
- Video conferencing integration
- Calendar integration
- File storage integration

## API Architecture

### API Versioning
- Base URL: `/api/v1`
- RESTful design principles
- Consistent response format
- Comprehensive error handling

### API Endpoints Summary
- **Authentication Endpoints**: Login, register, logout, password management
- **User Management**: CRUD operations for users
- **Academic Endpoints**: Classes, attendance, exams, homework, notes
- **Student Endpoints**: Student profiles, records, performance
- **Staff Endpoints**: Teacher and staff management
- **Financial Endpoints**: Fees, payments, invoices, transactions
- **Communication Endpoints**: Chat, notifications, announcements
- **Reporting Endpoints**: Reports, analytics, exports
- **Admin Endpoints**: Dashboard, settings, configurations
- **PTM Endpoints**: Parent-teacher meeting management
- **Admission Endpoints**: Application management, entrance tests
- **Transport Endpoints**: Vehicle, driver, route management
- **Library Endpoints**: Book management, issue/return
- **HRM Endpoints**: Payroll, leave, employee management
- **Canteen Endpoints**: Menu, orders, payments
- **Event Endpoints**: Event management, scheduling
- **File Management**: Upload, sharing, management

### WebSocket Events
- Real-time attendance updates
- Homework notifications
- PTM updates
- Chat messages
- System notifications

## Development Workflow

### Backend Development
- **Start Command**: `npm start` or `npm run dev`
- **Port**: 5000
- **Environment**: `.env` file for configuration
- **Database**: MongoDB connection via MONGO_URI
- **Hot Reload**: Nodemon for development

### Frontend Development
- **Start Command**: `npm run dev`
- **Port**: Auto-assigned by Vite (typically 5173)
- **Environment**: `.env` file for configuration
- **API URL**: VITE_API_URL pointing to backend
- **Hot Reload**: Vite dev server

### Environment Configuration

**Backend Environment Variables**
- PORT - Server port (default: 5000)
- MONGO_URI - MongoDB connection string
- JWT_SECRET - JWT signing secret
- JWT_REFRESH_SECRET - Refresh token secret
- NODE_ENV - Environment (development/production)

**Frontend Environment Variables**
- VITE_API_URL - Backend API URL

## Deployment

### Backend Deployment
- Node.js application
- Requires MongoDB instance
- Process manager recommended (PM2)
- Environment variables configuration
- Static file serving for uploads

### Frontend Deployment
- Static build generated via `npm run build`
- Can be deployed to any web server
- Requires API URL configuration
- Supports SPA routing

## Support & Maintenance

### Logging
- Winston logging with daily rotation
- Request/response logging
- Error logging
- Activity logging

### Monitoring
- Sentry integration for error tracking
- Platform health monitoring
- Performance monitoring

### Backup
- Database backup procedures
- File storage backup
- Configuration backup

## Future Enhancements

- Mobile application development
- Enhanced analytics and AI features
- Integration with more third-party services
- Advanced reporting capabilities
- Improved user experience
- Performance optimizations

UltrakeySchool-main/
├─ backend/
│  ├─ config/
│  │  └─ mailer.js
│  ├─ logs/
│  ├─ src/
│  │  ├─ config/
│  │  │  ├─ database.js
│  │  │  ├─ email.js
│  │  │  ├─ jwt.js
│  │  │  ├─ redis.js
│  │  │  ├─ rolePermissions.js
│  │  │  ├─ swagger.js
│  │  │  └─ upload.js
│  │  ├─ controllers/
│  │  │  ├─ academicEngineController.js
│  │  │  ├─ academicReasonController.js
│  │  │  ├─ addonController.js
│  │  │  ├─ adminAlertController.js
│  │  │  ├─ adminAnalyticsController.js
│  │  │  ├─ adminController.js
│  │  │  ├─ admissionController.js
│  │  │  ├─ advancedAttendanceController.js
│  │  │  ├─ advancedProctoringController.js
│  │  │  ├─ agentController.js
│  │  │  ├─ analyticsController.js
│  │  │  ├─ apiKeyController.js
│  │  │  ├─ attendanceController.js
│  │  │  ├─ authController.js
│  │  │  ├─ bannedIPController.js
│  │  │  ├─ biometricAuthController.js
│  │  │  ├─ blogController.js
│  │  │  ├─ branchController.js
│  │  │  ├─ calendarController.js
│  │  │  ├─ callLogController.js
│  │  │  ├─ canteenController.js
│  │  │  ├─ chatController.js
│  │  │  ├─ classController.js
│  │  │  ├─ classRoomController.js
│  │  │  ├─ classScheduleController.js
│  │  │  ├─ classTimetableController.js
│  │  │  ├─ commissionController.js
│  │  │  ├─ communicationController.js
│  │  │  ├─ contactMessageController.js
│  │  │  ├─ customFieldController.js
│  │  │  ├─ dashboardController.js
│  │  │  ├─ dashboardWidgetController.js
│  │  │  ├─ driverController.js
│  │  │  ├─ dsrController.js
│  │  │  ├─ emailSettingsController.js
│  │  │  ├─ eventController.js
│  │  │  ├─ examController.js
│  │  │  ├─ examScheduleController.js
│  │  │  ├─ feeController.js
│  │  │  ├─ feeReminderController.js
│  │  │  ├─ fileManagerController.js
│  │  │  ├─ fileSharingController.js
│  │  │  ├─ financeController.js
│  │  │  ├─ gdprSettingsController.js
│  │  │  ├─ geofenceController.js
│  │  │  ├─ gradeController.js
│  │  │  ├─ groupChatController.js
│  │  │  ├─ guardianController.js
│  │  │  ├─ holidayController.js
│  │  │  ├─ homeWorkController.js
│  │  │  ├─ hostelAttendanceController.js
│  │  │  ├─ hostelController.js
│  │  │  ├─ hostelFeeController.js
│  │  │  ├─ hrController.js
│  │  │  ├─ hrmController.js
│  │  │  ├─ idCardController.js
│  │  │  ├─ installmentController.js
│  │  │  ├─ institutionController.js
│  │  │  ├─ inventoryController.js
│  │  │  ├─ leaveReportController.js
│  │  │  ├─ leaveTypeController.js
│  │  │  ├─ libraryController.js
│  │  │  ├─ membershipPlanController.js
│  │  │  ├─ menuController.js
│  │  │  ├─ messageController.js
│  │  │  ├─ mockControllers.js
│  │  │  ├─ modulesController.js
│  │  │  ├─ noteController.js
│  │  │  ├─ noticeController.js
│  │  │  ├─ notificationController.js
│  │  │  ├─ oauthController.js
│  │  │  ├─ onlineExamController.js
│  │  │  ├─ organizationController.js
│  │  │  ├─ paymentGatewayController.js
│  │  │  ├─ paymentGatewaySettingsController.js
│  │  │  ├─ payrollController.js
│  │  │  ├─ pendingInstitutionRegistrationController.js
│  │  │  ├─ performerController.js
│  │  │  ├─ permissionController.js
│  │  │  ├─ pickupPointController.js
│  │  │  ├─ platformSettingsController.js
│  │  │  ├─ playerController.js
│  │  │  ├─ principalController.js
│  │  │  ├─ ptmController.js
│  │  │  ├─ questionBankController.js
│  │  │  ├─ realDataController.js
│  │  │  ├─ realtimeDashboardController.js
│  │  │  ├─ religionController.js
│  │  │  ├─ reportController.js
│  │  │  ├─ resultController.js
│  │  │  ├─ rfidController.js
│  │  │  ├─ roleController.js
│  │  │  ├─ scheduleController.js
│  │  │  ├─ scholarshipController.js
│  │  │  ├─ schoolController.js
│  │  │  ├─ schoolSettingsController.js
│  │  │  ├─ settingsController.js
│  │  │  ├─ sidebarController.js
│  │  │  ├─ sportController.js
│  │  │  ├─ staffDocumentController.js
│  │  │  ├─ statisticController.js
│  │  │  ├─ storageSettingsController.js
│  │  │  ├─ studentAttendanceController.js
│  │  │  ├─ studentController.js
│  │  │  ├─ subjectController.js
│  │  │  ├─ subscriptionController.js
│  │  │  ├─ superAdminController.js
│  │  │  ├─ superAdminControllerReal.js
│  │  │  ├─ supportTicketController.js
│  │  │  ├─ syllabusController.js
│  │  │  ├─ teacherController.js
│  │  │  ├─ tenantController.js
│  │  │  ├─ testimonialController.js
│  │  │  ├─ themeController.js
│  │  │  ├─ todoController.js
│  │  │  ├─ transactionController.js
│  │  │  ├─ transportAssignmentController.js
│  │  │  ├─ transportController.js
│  │  │  ├─ transportFeeController.js
│  │  │  ├─ transportReportController.js
│  │  │  ├─ transportRouteController.js
│  │  │  ├─ uploadController.js
│  │  │  └─ userProfileController.js
│  │  ├─ middleware/
│  │  │  ├─ apiKeyGuard.js
│  │  │  ├─ authGuard.js
│  │  │  ├─ authMiddleware.js
│  │  │  ├─ authRateLimiter.js
│  │  │  ├─ authValidation.js
│  │  │  ├─ cacheMiddleware.js
│  │  │  ├─ errorHandler.js
│  │  │  ├─ geofenceValidation.js
│  │  │  ├─ institutionFilter.js
│  │  │  ├─ institutionFilterMiddleware.js
│  │  │  ├─ institutionIsolation.js
│  │  │  ├─ institutionValidation.js
│  │  │  ├─ multiTenant.js
│  │  │  ├─ rateLimiter.js
│  │  │  ├─ requestLogger.js
│  │  │  ├─ rfidValidation.js
│  │  │  ├─ sanitizer.js
│  │  │  ├─ tenantMiddleware.js
│  │  │  └─ validation.js
│  │  ├─ models/
│  │  │  ├─ AcademicConfiguration.js
│  │  │  ├─ AcademicReason.js
│  │  │  ├─ AdminActivity.js
│  │  │  ├─ AdminAlert.js
│  │  │  ├─ Agent.js
│  │  │  ├─ Attendance.js
│  │  │  ├─ AuditLog.js
│  │  │  ├─ BannedIP.js
│  │  │  ├─ Blog.js
│  │  │  ├─ BlogComment.js
│  │  │  ├─ BlogTag.js
│  │  │  ├─ Branch.js
│  │  │  ├─ CallLog.js
│  │  │  ├─ canteenMenuItem.js
│  │  │  ├─ canteenOrder.js
│  │  │  ├─ canteenPayment.js
│  │  │  ├─ Class.js
│  │  │  ├─ ClassRoom.js
│  │  │  ├─ ClassSchedule.js
│  │  │  ├─ ClassTimetable.js
│  │  │  ├─ Commission.js
│  │  │  ├─ Communication.js
│  │  │  ├─ Complaint.js
│  │  │  ├─ ConnectedApp.js
│  │  │  ├─ ContactMessage.js
│  │  │  ├─ Conversation.js
│  │  │  ├─ CustomField.js
│  │  │  ├─ DataErasureRequest.js
│  │  │  ├─ DataExportRequest.js
│  │  │  ├─ Department.js
│  │  │  ├─ Designation.js
│  │  │  ├─ Driver.js
│  │  │  ├─ Email.js
│  │  │  ├─ EmailSettings.js
│  │  │  ├─ Enrollment.js
│  │  │  ├─ Event.js
│  │  │  ├─ Exam.js
│  │  │  ├─ ExamSchedule.js
│  │  │  ├─ expenseCategory.js
│  │  │  ├─ Fee.js
│  │  │  ├─ FeeReminder.js
│  │  │  ├─ FileManager.js
│  │  │  ├─ FileSharing.js
│  │  │  ├─ finance.js
│  │  │  ├─ GdprSettings.js
│  │  │  ├─ geofence.js
│  │  │  ├─ Grade.js
│  │  │  ├─ Guardian.js
│  │  │  ├─ Holiday.js
│  │  │  ├─ HomeWork.js
│  │  │  ├─ Hostel.js
│  │  │  ├─ hostelAttendance.js
│  │  │  ├─ hostelFee.js
│  │  │  ├─ hr.js
│  │  │  ├─ Institution.js
│  │  │  ├─ inventoryItem.js
│  │  │  ├─ inventoryTransaction.js
│  │  │  ├─ Invoice.js
│  │  │  ├─ Leave.js
│  │  │  ├─ LeaveType.js
│  │  │  ├─ library.js
│  │  │  ├─ MembershipAddon.js
│  │  │  ├─ MembershipPlan.js
│  │  │  ├─ MenuCustomization.js
│  │  │  ├─ MenuCustomizationRole.js
│  │  │  ├─ Message.js
│  │  │  ├─ Module.js
│  │  │  ├─ ModuleCategory.js
│  │  │  ├─ Note.js
│  │  │  ├─ Notice.js
│  │  │  ├─ Notification.js
│  │  │  ├─ OnlineExam.js
│  │  │  ├─ Organization.js
│  │  │  ├─ Payment.js
│  │  │  ├─ PaymentGatewaySettings.js
│  │  │  ├─ Payroll.js
│  │  │  ├─ PendingInstitutionRegistration.js
│  │  │  ├─ PerformanceReview.js
│  │  │  ├─ Performer.js
│  │  │  ├─ Permission.js
│  │  │  ├─ PickupPoint.js
│  │  │  ├─ PlatformHealth.js
│  │  │  ├─ PlatformSetting.js
│  │  │  ├─ Player.js
│  │  │  ├─ principal.js
│  │  │  ├─ PTMSlot.js
│  │  │  ├─ Recruitment.js
│  │  │  ├─ RegistrationRequest.js
│  │  │  ├─ Religion.js
│  │  │  ├─ reportTemplate.js
│  │  │  ├─ rfidCard.js
│  │  │  ├─ Role.js
│  │  │  ├─ Schedule.js
│  │  │  ├─ scheduledReport.js
│  │  │  ├─ School.js
│  │  │  ├─ SchoolSettings.js
│  │  │  ├─ Section.js
│  │  │  ├─ Settings.js
│  │  │  ├─ SidebarPreference.js
│  │  │  ├─ Sport.js
│  │  │  ├─ Staff.js
│  │  │  ├─ StaffDocument.js
│  │  │  ├─ Statistic.js
│  │  │  ├─ StorageSettings.js
│  │  │  ├─ Student.js
│  │  │  ├─ StudentAttendance.js
│  │  │  ├─ StudentHostel.js
│  │  │  ├─ StudentLeave.js
│  │  │  ├─ StudentLibrary.js
│  │  │  ├─ StudentResult.js
│  │  │  ├─ StudentTimetable.js
│  │  │  ├─ StudentTransport.js
│  │  │  ├─ Subject.js
│  │  │  ├─ Subscription.js
│  │  │  ├─ SubscriptionRequest.js
│  │  │  ├─ SuperAdminMenuItem.js
│  │  │  ├─ SupportTicket.js
│  │  │  ├─ Syllabus.js
│  │  │  ├─ taxRate.js
│  │  │  ├─ Teacher.js
│  │  │  ├─ TeacherLeave.js
│  │  │  ├─ TeacherLibrary.js
│  │  │  ├─ TeacherRoutine.js
│  │  │  ├─ TeacherSalary.js
│  │  │  ├─ Testimonial.js
│  │  │  ├─ Todo.js
│  │  │  ├─ Transaction.js
│  │  │  ├─ Transport.js
│  │  │  ├─ TransportAssignment.js
│  │  │  ├─ TransportFee.js
│  │  │  ├─ TransportReport.js
│  │  │  ├─ TransportRoute.js
│  │  │  ├─ User.js
│  │  │  ├─ UserBlock.js
│  │  │  └─ UserCredential.js
│  │  ├─ routes/
│  │  │  ├─ academicEngineRoutes.js
│  │  │  ├─ academicReason_temp.js
│  │  │  ├─ academicReasonRoutes.js
│  │  │  ├─ addonRoutes.js
│  │  │  ├─ adminAlertRoutes.js
│  │  │  ├─ adminRoutes.js
│  │  │  ├─ admissionRoutes.js
│  │  │  ├─ advancedAttendanceRoutes.js
│  │  │  ├─ advancedProctoringRoutes.js
│  │  │  ├─ agentRoutes.js
│  │  │  ├─ analyticsRoutes.js
│  │  │  ├─ apiKeyRoutes.js
│  │  │  ├─ attendanceRoutes.js
│  │  │  ├─ auditRoutes.js
│  │  │  ├─ authRoutes.js
│  │  │  ├─ bannedIPRoutes.js
│  │  │  ├─ blogRoutes.js
│  │  │  ├─ branchRoutes.js
│  │  │  ├─ calendar_new.js
│  │  │  ├─ calendarRoutes.js
│  │  │  ├─ callLog_new.js
│  │  │  ├─ callLogRoutes.js
│  │  │  ├─ chat_new.js
│  │  │  ├─ chatRoutes.js
│  │  │  ├─ classRoomRoutes.js
│  │  │  ├─ classRoutes.js
│  │  │  ├─ classScheduleRoutes.js
│  │  │  ├─ classTimetableRoutes.js
│  │  │  ├─ commissionRoutes.js
│  │  │  ├─ communicationRoutes.js
│  │  │  ├─ communicationRoutesNew.js
│  │  │  ├─ contactMessageRoutes.js
│  │  │  ├─ customField_new.js
│  │  │  ├─ customFieldRoutes.js
│  │  │  ├─ dashboardRoutes.js
│  │  │  ├─ dashboardWidgetRoutes.js
│  │  │  ├─ driver_new.js
│  │  │  ├─ driverRoutes.js
│  │  │  ├─ dsrRoutes.js
│  │  │  ├─ emailSettingsRoutes.js
│  │  │  ├─ emailsRoutes.js
│  │  │  ├─ eventRoutes.js
│  │  │  ├─ examRoutes.js
│  │  │  ├─ examScheduleRoutes.js
│  │  │  ├─ examSchedulesRoutes.js
│  │  │  ├─ examsRoutes.js
│  │  │  ├─ feeReminderRoutes.js
│  │  │  ├─ feeRoutes.js
│  │  │  ├─ fileManagerRoutes.js
│  │  │  ├─ fileSharingRoutes.js
│  │  │  ├─ filesRoutes.js
│  │  │  ├─ financeRoutes.js
│  │  │  ├─ gdprSettingsRoutes.js
│  │  │  ├─ geofenceRoutes.js
│  │  │  ├─ gradeRoutes.js
│  │  │  ├─ gradesRoutes.js
│  │  │  ├─ groupChatRoutes.js
│  │  │  ├─ guardianRoutes.js
│  │  │  ├─ healthRoutes.js
│  │  │  ├─ homeworkRoutes.js
│  │  │  ├─ hostelRoutes.js
│  │  │  ├─ hrmRoutes.js
│  │  │  ├─ hrRoutes.js
│  │  │  ├─ idCardRoutes.js
│  │  │  ├─ installmentRoutes.js
│  │  │  ├─ instituteAnalyticsRoutes.js
│  │  │  ├─ institutionManagementRoutes.js
│  │  │  ├─ institutionRoutes.js
│  │  │  ├─ institutionSetupRoutes.js
│  │  │  ├─ inventoryRoutes.js
│  │  │  ├─ leaveReportRoutes.js
│  │  │  ├─ leaveReportsRoutes.js
│  │  │  ├─ libraryRoutes.js
│  │  │  ├─ libraryRoutesFallback.js
│  │  │  ├─ membershipPlanRoutes.js
│  │  │  ├─ menuRoutes.js
│  │  │  ├─ messageRoutes.js
│  │  │  ├─ modulesRoutes.js
│  │  │  ├─ noteRoutes.js
│  │  │  ├─ notesRoutes.js
│  │  │  ├─ noticeRoutes.js
│  │  │  ├─ notificationRoutes.js
│  │  │  ├─ notificationsRoutes.js
│  │  │  ├─ oauthRoutes.js
│  │  │  ├─ onlineExamRoutes.js
│  │  │  ├─ organizationRoutes.js
│  │  │  ├─ paymentGatewayRoutes.js
│  │  │  ├─ pendingInstitutionRegistrationRoutes.js
│  │  │  ├─ performerRoutes.js
│  │  │  ├─ permissionRoutes.js
│  │  │  ├─ pickupPointRoutes.js
│  │  │  ├─ platformSettingsRoutes.js
│  │  │  ├─ playerRoutes.js
│  │  │  ├─ principalRoutes.js
│  │  │  ├─ ptmRoutes.js
│  │  │  ├─ questionBankRoutes.js
│  │  │  ├─ realDataRoutes.js
│  │  │  ├─ realtimeDashboardRoutes.js
│  │  │  ├─ religionRoutes.js
│  │  │  ├─ reportRoutes.js
│  │  │  ├─ resultRoutes.js
│  │  │  ├─ resultsRoutes.js
│  │  │  ├─ rfidRoutes.js
│  │  │  ├─ roleRoutes.js
│  │  │  ├─ rolesRoutes.js
│  │  │  ├─ scheduleRoutes.js
│  │  │  ├─ scholarshipRoutes.js
│  │  │  ├─ schoolRoutes.js
│  │  │  ├─ schoolSettings_temp.js
│  │  │  ├─ schoolSettingsRoutes.js
│  │  │  ├─ settingsRoutes.js
│  │  │  ├─ sidebarRoutes.js
│  │  │  ├─ sportRoutes.js
│  │  │  ├─ sportsRoutes.js
│  │  │  ├─ staffDocumentRoutes.js
│  │  │  ├─ statisticRoutes.js
│  │  │  ├─ storageSettings_temp.js
│  │  │  ├─ storageSettingsRoutes.js
│  │  │  ├─ studentAttendanceRoutes.js
│  │  │  ├─ studentRoutes.js
│  │  │  ├─ subjectRoutes.js
│  │  │  ├─ subscriptionRoutes.js
│  │  │  ├─ superAdminAnalytics.js
│  │  │  ├─ superAdminRoutes.js
│  │  │  ├─ supportTicketRoutes.js
│  │  │  ├─ supportTicketsRoutes.js
│  │  │  ├─ syllabusRoutes.js
│  │  │  ├─ teacherRoutes.js
│  │  │  ├─ tenantRoutes.js
│  │  │  ├─ testimonialRoutes.js
│  │  │  ├─ themeRoutes.js
│  │  │  ├─ timetableRoutes.js
│  │  │  ├─ todoRoutes.js
│  │  │  ├─ transactionRoutes.js
│  │  │  ├─ transportAssignmentRoutes.js
│  │  │  ├─ transportFeeRoutes.js
│  │  │  ├─ transportReportRoutes.js
│  │  │  ├─ transportRouteRoutes.js
│  │  │  ├─ transportRoutes.js
│  │  │  ├─ uploadRoutes.js
│  │  │  ├─ userManagementRoutes.js
│  │  │  ├─ userProfileRoutes.js
│  │  │  └─ visitorLogRoutes.js
│  │  ├─ scripts/
│  │  │  ├─ addDegreeCollege.js
│  │  │  ├─ addInstitutions.js
│  │  │  ├─ addLoginUsers.js
│  │  │  ├─ addPendingRequests.js
│  │  │  ├─ addTransactions.js
│  │  │  ├─ addUserCredentials.js
│  │  │  ├─ checkAll.js
│  │  │  ├─ checkData.js
│  │  │  ├─ checkDB.js
│  │  │  ├─ checkDupes.js
│  │  │  ├─ checkPending.js
│  │  │  ├─ checkUsers.js
│  │  │  ├─ createSuperAdmin.js
│  │  │  ├─ createUsers.js
│  │  │  ├─ debug.js
│  │  │  ├─ fixBoth.js
│  │  │  ├─ fixInstitutionTypes.js
│  │  │  ├─ fixSuperAdmin.js
│  │  │  ├─ fixTypes.js
│  │  │  ├─ fixUserPasswords.js
│  │  │  ├─ insertSampleCredentials.js
│  │  │  ├─ resetPassword.js
│  │  │  ├─ seedAllData.js
│  │  │  ├─ seedData.js
│  │  │  ├─ seedFull.js
│  │  │  ├─ seedInstitutions.js
│  │  │  ├─ seedTransactions.js
│  │  │  ├─ setupAll.js
│  │  │  ├─ setupDatabase.js
│  │  │  ├─ setupSuperAdminData.js
│  │  │  ├─ syncTypes.js
│  │  │  ├─ updateUsers.js
│  │  │  └─ verify.js
│  │  ├─ services/
│  │  │  ├─ academicEngineService.js
│  │  │  ├─ academicReasonService.js
│  │  │  ├─ adminAlertService.js
│  │  │  ├─ adminAnalyticsService.js
│  │  │  ├─ admissionService.js
│  │  │  ├─ advancedProctoringService.js
│  │  │  ├─ analyticsService.js
│  │  │  ├─ apiKeyService.js
│  │  │  ├─ attendanceService.js
│  │  │  ├─ authService.js
│  │  │  ├─ branchService.js
│  │  │  ├─ cacheService.js
│  │  │  ├─ calendarService.js
│  │  │  ├─ callLogService.js
│  │  │  ├─ canteenService.js
│  │  │  ├─ chatService.js
│  │  │  ├─ classRoomService.js
│  │  │  ├─ classScheduleService.js
│  │  │  ├─ classService.js
│  │  │  ├─ classTimetableService.js
│  │  │  ├─ commissionService.js
│  │  │  ├─ customFieldService.js
│  │  │  ├─ dashboardService.js
│  │  │  ├─ dashboardWidgetService.js
│  │  │  ├─ driverService.js
│  │  │  ├─ dsrService.js
│  │  │  ├─ emailService.js
│  │  │  ├─ emailSettingsService.js
│  │  │  ├─ eventService.js
│  │  │  ├─ examScheduleService.js
│  │  │  ├─ examService.js
│  │  │  ├─ exportService.js
│  │  │  ├─ feeReminderService.js
│  │  │  ├─ feeService.js
│  │  │  ├─ fileManagerService.js
│  │  │  ├─ fileSharingService.js
│  │  │  ├─ fileUploadService.js
│  │  │  ├─ gdprSettingsService.js
│  │  │  ├─ geofenceService.js
│  │  │  ├─ gradeService.js
│  │  │  ├─ groupChatService.js
│  │  │  ├─ guardianService.js
│  │  │  ├─ healthChecker.js
│  │  │  ├─ homeWorkService.js
│  │  │  ├─ hostelAttendanceService.js
│  │  │  ├─ hostelFeeService.js
│  │  │  ├─ hrmService.js
│  │  │  ├─ idCardService.js
│  │  │  ├─ installmentService.js
│  │  │  ├─ institutionService.js
│  │  │  ├─ inventoryService.js
│  │  │  ├─ jobQueueService.js
│  │  │  ├─ jobService.js
│  │  │  ├─ libraryService.js
│  │  │  ├─ menuService.js
│  │  │  ├─ monitoringService.js
│  │  │  ├─ noteService.js
│  │  │  ├─ noticeService.js
│  │  │  ├─ notificationService.js
│  │  │  ├─ oauthService.js
│  │  │  ├─ onlineExamService.js
│  │  │  ├─ organizationService.js
│  │  │  ├─ paymentGatewayService.js
│  │  │  ├─ performerService.js
│  │  │  ├─ permissionService.js
│  │  │  ├─ pickupPointService.js
│  │  │  ├─ plagiarismService.js
│  │  │  ├─ ptmService.js
│  │  │  ├─ pushNotificationService.js
│  │  │  ├─ qrCodeAttendanceService.js
│  │  │  ├─ questionBankService.js
│  │  │  ├─ realtimeDashboardService.js
│  │  │  ├─ religionService.js
│  │  │  ├─ rfidService.js
│  │  │  ├─ roleService.js
│  │  │  ├─ scheduledReportService.js
│  │  │  ├─ scheduleService.js
│  │  │  ├─ scholarshipService.js
│  │  │  ├─ schoolService.js
│  │  │  ├─ schoolSettingsService.js
│  │  │  ├─ sentryService.js
│  │  │  ├─ settingsService.js
│  │  │  ├─ sidebarService.js
│  │  │  ├─ socketService.js
│  │  │  ├─ statisticService.js
│  │  │  ├─ storageService.js
│  │  │  ├─ stripeService.js
│  │  │  ├─ studentAttendanceService.js
│  │  │  ├─ studentService.js
│  │  │  ├─ subjectService.js
│  │  │  ├─ subscriptionService.js
│  │  │  ├─ superAdminService.js
│  │  │  ├─ supportTicketService.js
│  │  │  ├─ syllabusService.js
│  │  │  ├─ teacherService.js
│  │  │  ├─ tenantService.js
│  │  │  ├─ testimonialService.js
│  │  │  ├─ themeService.js
│  │  │  ├─ todoService.js
│  │  │  ├─ tokenService.js
│  │  │  ├─ transactionService.js
│  │  │  ├─ transportAssignmentService.js
│  │  │  ├─ transportReportService.js
│  │  │  ├─ transportRouteService.js
│  │  │  ├─ transportService.js
│  │  │  └─ userProfileService.js
│  │  ├─ sockets/
│  │  │  ├─ callSocket.js
│  │  │  └─ chatSocket.js
│  │  ├─ templates/
│  │  │  ├─ emails/
│  │  │  │  ├─ attendance-alert.html
│  │  │  │  ├─ credentials.html
│  │  │  │  ├─ email-verification.html
│  │  │  │  ├─ exam-results.html
│  │  │  │  ├─ fee-reminder.html
│  │  │  │  ├─ hostel.html
│  │  │  │  ├─ notification.html
│  │  │  │  ├─ password-reset.html
│  │  │  │  ├─ reminder.html
│  │  │  │  ├─ transport.html
│  │  │  │  └─ welcome.html
│  │  │  └─ emailTemplates.js
│  │  ├─ tests/
│  │  │  └─ institutionIsolation.test.js
│  │  ├─ utils/
│  │  │  ├─ apiResponse.js
│  │  │  ├─ databaseOptimization.js
│  │  │  ├─ dateHelpers.js
│  │  │  ├─ logger.js
│  │  │  ├─ pagination.js
│  │  │  └─ templateLoader.js
│  │  ├─ validators/
│  │  │  ├─ academicReasonValidators.js
│  │  │  ├─ agentValidator.js
│  │  │  ├─ attendanceValidators.js
│  │  │  ├─ authValidators.js
│  │  │  ├─ classRoomValidators.js
│  │  │  ├─ classScheduleValidators.js
│  │  │  ├─ classValidators.js
│  │  │  ├─ emailValidators.js
│  │  │  ├─ examScheduleValidators.js
│  │  │  ├─ feeValidators.js
│  │  │  ├─ fileManagerValidators.js
│  │  │  ├─ gradeValidators.js
│  │  │  ├─ guardianValidators.js
│  │  │  ├─ homeWorkValidators.js
│  │  │  ├─ hrmValidators.js
│  │  │  ├─ institutionValidators.js
│  │  │  ├─ menuValidators.js
│  │  │  ├─ noteValidators.js
│  │  │  ├─ noticeValidators.js
│  │  │  ├─ notificationValidators.js
│  │  │  ├─ performerValidators.js
│  │  │  ├─ permissionValidators.js
│  │  │  ├─ religionValidators.js
│  │  │  ├─ reportValidators.js
│  │  │  ├─ roleValidators.js
│  │  │  ├─ scheduleValidators.js
│  │  │  ├─ schoolSettingsValidators.js
│  │  │  ├─ schoolValidators.js
│  │  │  ├─ settingsValidators.js
│  │  │  ├─ sidebarValidators.js
│  │  │  ├─ statisticValidators.js
│  │  │  ├─ studentAttendanceValidators.js
│  │  │  ├─ studentValidators.js
│  │  │  ├─ subscriptionValidators.js
│  │  │  ├─ superAdminValidators.js
│  │  │  ├─ supportTicketValidators.js
│  │  │  ├─ teacherValidators.js
│  │  │  ├─ todoValidators.js
│  │  │  ├─ transactionValidators.js
│  │  │  └─ userProfileValidators.js
│  │  └─ server.js
│  ├─ uploads/
│  ├─ .backend-port
│  ├─ .env
│  ├─ .gitignore
│  ├─ eslint.config.js
│  ├─ package-lock.json
│  ├─ package.json
│  └─ README.md
├─ frontend/
│  ├─ dist/
│  │  ├─ assets/
│  │  │  ├─ css/
│  │  │  │  ├─ animate.css
│  │  │  │  ├─ bootstrap-datetimepicker.min.css
│  │  │  │  ├─ bootstrap.min.css
│  │  │  │  ├─ meanmenu.css
│  │  │  │  ├─ owl.carousel.min.css
│  │  │  │  ├─ style.css
│  │  │  │  └─ style1.css
│  │  │  ├─ img/
│  │  │  │  ├─ bg/
│  │  │  │  │  ├─ banner-bg.png
│  │  │  │  │  ├─ bg-02.png
│  │  │  │  │  ├─ bg-03.png
│  │  │  │  │  ├─ bg-04.png
│  │  │  │  │  ├─ bg-05.png
│  │  │  │  │  ├─ bg-06.png
│  │  │  │  │  ├─ bg-07.png
│  │  │  │  │  ├─ bg-08.png
│  │  │  │  │  ├─ shape-01.webp
│  │  │  │  │  ├─ shape-02.webp
│  │  │  │  │  ├─ shape-03.webp
│  │  │  │  │  └─ shape-04.webp
│  │  │  │  ├─ icons/
│  │  │  │  │  ├─ feature-01.svg
│  │  │  │  │  ├─ feature-02.svg
│  │  │  │  │  ├─ feature-03.svg
│  │  │  │  │  ├─ feature-04.svg
│  │  │  │  │  ├─ feature-05.svg
│  │  │  │  │  ├─ feature-06.svg
│  │  │  │  │  ├─ feature-07.svg
│  │  │  │  │  ├─ feature-08.svg
│  │  │  │  │  ├─ feature-09.svg
│  │  │  │  │  ├─ feature-10.svg
│  │  │  │  │  ├─ feature-11.svg
│  │  │  │  │  ├─ feature-12.svg
│  │  │  │  │  ├─ feature-13.svg
│  │  │  │  │  ├─ feature-14.svg
│  │  │  │  │  ├─ feature-15.svg
│  │  │  │  │  ├─ feature-16.svg
│  │  │  │  │  ├─ feature-17.svg
│  │  │  │  │  ├─ feature-18.svg
│  │  │  │  │  ├─ global-img.svg
│  │  │  │  │  ├─ review.svg
│  │  │  │  │  ├─ staff.svg
│  │  │  │  │  ├─ student.svg
│  │  │  │  │  ├─ subject.svg
│  │  │  │  │  ├─ teacher.svg
│  │  │  │  │  ├─ technology-01.svg
│  │  │  │  │  ├─ technology-02.svg
│  │  │  │  │  ├─ technology-03.svg
│  │  │  │  │  ├─ technology-04.svg
│  │  │  │  │  ├─ technology-05.svg
│  │  │  │  │  ├─ technology-06.svg
│  │  │  │  │  ├─ technology-07.svg
│  │  │  │  │  ├─ technology-08.svg
│  │  │  │  │  ├─ technology-09.svg
│  │  │  │  │  └─ technology-10.svg
│  │  │  │  ├─ parents/
│  │  │  │  │  ├─ parent-01.webp
│  │  │  │  │  ├─ parent-02.webp
│  │  │  │  │  ├─ parent-05.webp
│  │  │  │  │  ├─ parent-06.webp
│  │  │  │  │  ├─ parent-07 (1).webp
│  │  │  │  │  ├─ parent-07.webp
│  │  │  │  │  ├─ parent-11.webp
│  │  │  │  │  └─ parent-13.webp
│  │  │  │  ├─ performer/
│  │  │  │  │  ├─ performer-01.webp
│  │  │  │  │  ├─ performer-02.webp
│  │  │  │  │  ├─ student-performer-01.webp
│  │  │  │  │  └─ student-performer-02.webp
│  │  │  │  ├─ product/
│  │  │  │  │  ├─ product-02.webp
│  │  │  │  │  ├─ product-03.png
│  │  │  │  │  ├─ product-03.webp
│  │  │  │  │  ├─ product-04.webp
│  │  │  │  │  ├─ product-05.webp
│  │  │  │  │  ├─ product-06.webp
│  │  │  │  │  ├─ product-07.webp
│  │  │  │  │  ├─ product-08.webp
│  │  │  │  │  ├─ product-09.webp
│  │  │  │  │  ├─ product-10.webp
│  │  │  │  │  ├─ product-11.webp
│  │  │  │  │  ├─ product-12.webp
│  │  │  │  │  ├─ product-13.webp
│  │  │  │  │  ├─ product-14.webp
│  │  │  │  │  ├─ product-15.webp
│  │  │  │  │  └─ product-16.webp
│  │  │  │  ├─ profiles/
│  │  │  │  │  ├─ avatar-01.webp
│  │  │  │  │  ├─ avatar-14.webp
│  │  │  │  │  ├─ avatar-19.webp
│  │  │  │  │  ├─ avatar-23.webp
│  │  │  │  │  ├─ avatar-25.webp
│  │  │  │  │  └─ avatar-27.webp
│  │  │  │  ├─ screens/
│  │  │  │  │  ├─ dashboard-01.svg
│  │  │  │  │  ├─ dashboard-02.svg
│  │  │  │  │  ├─ dashboard-03.svg
│  │  │  │  │  ├─ dashboard-04.svg
│  │  │  │  │  ├─ screen-01.svg
│  │  │  │  │  ├─ screen-02.svg
│  │  │  │  │  ├─ screen-03.svg
│  │  │  │  │  ├─ screen-04.svg
│  │  │  │  │  ├─ screen-05.svg
│  │  │  │  │  ├─ screen-06.svg
│  │  │  │  │  ├─ screen-07.svg
│  │  │  │  │  ├─ screen-08.svg
│  │  │  │  │  ├─ screen-09.svg
│  │  │  │  │  ├─ screen-10.svg
│  │  │  │  │  ├─ screen-11.svg
│  │  │  │  │  ├─ screen-12.svg
│  │  │  │  │  ├─ screen-13.svg
│  │  │  │  │  ├─ screen-14.svg
│  │  │  │  │  ├─ screen-15.svg
│  │  │  │  │  ├─ screen-16.svg
│  │  │  │  │  ├─ screen-17.svg
│  │  │  │  │  ├─ screen-18.svg
│  │  │  │  │  ├─ screen-19.svg
│  │  │  │  │  ├─ screen-20.svg
│  │  │  │  │  ├─ screen-21.svg
│  │  │  │  │  ├─ screen-22.svg
│  │  │  │  │  ├─ screen-23.svg
│  │  │  │  │  ├─ screen-24.svg
│  │  │  │  │  ├─ screen-25.svg
│  │  │  │  │  ├─ screen-26.svg
│  │  │  │  │  ├─ screen-27.svg
│  │  │  │  │  ├─ screen-28.svg
│  │  │  │  │  ├─ screen-29.svg
│  │  │  │  │  ├─ screen-30.svg
│  │  │  │  │  ├─ screen-31.svg
│  │  │  │  │  ├─ screen-32.svg
│  │  │  │  │  ├─ screen-33.svg
│  │  │  │  │  ├─ screen-34.svg
│  │  │  │  │  ├─ screen-35.svg
│  │  │  │  │  ├─ screen-36.svg
│  │  │  │  │  ├─ screen-37.svg
│  │  │  │  │  ├─ screen-38.svg
│  │  │  │  │  ├─ screen-39.svg
│  │  │  │  │  ├─ screen-40.svg
│  │  │  │  │  ├─ screen-41.svg
│  │  │  │  │  ├─ screen-42.svg
│  │  │  │  │  ├─ screen-43.svg
│  │  │  │  │  ├─ screen-44.svg
│  │  │  │  │  ├─ screen-45.svg
│  │  │  │  │  ├─ screen-46.svg
│  │  │  │  │  ├─ screen-47.svg
│  │  │  │  │  ├─ screen-48.svg
│  │  │  │  │  ├─ screen-49.svg
│  │  │  │  │  ├─ screen-50.svg
│  │  │  │  │  ├─ screen-51.svg
│  │  │  │  │  ├─ screen-52.svg
│  │  │  │  │  ├─ screen-53.svg
│  │  │  │  │  └─ screen-54.svg
│  │  │  │  ├─ students/
│  │  │  │  │  ├─ student-09.webp
│  │  │  │  │  ├─ student-10.webp
│  │  │  │  │  ├─ student-11.webp
│  │  │  │  │  └─ student-12.webp
│  │  │  │  ├─ teachers/
│  │  │  │  │  ├─ teacher-01.webp
│  │  │  │  │  ├─ teacher-02.webp
│  │  │  │  │  └─ teacher-03.webp
│  │  │  │  ├─ apple-logo.svg
│  │  │  │  ├─ banner-img.svg
│  │  │  │  ├─ facebook-logo.svg
│  │  │  │  ├─ favicon.png
│  │  │  │  ├─ google-logo.svg
│  │  │  │  ├─ Languages_English.png
│  │  │  │  ├─ Languages_Hindi.png
│  │  │  │  ├─ Languages_Telugu.png
│  │  │  │  ├─ logo_white.jpg
│  │  │  │  ├─ logo_white.png
│  │  │  │  ├─ logo-white.svg
│  │  │  │  ├─ logo.jpg
│  │  │  │  ├─ logo.png
│  │  │  │  ├─ logo.svg
│  │  │  │  ├─ logo2.jpg
│  │  │  │  ├─ Ultrakey_fav.png
│  │  │  │  ├─ Ultrakey_IT_Solutions_Private_Limited_Logo_Black.png
│  │  │  │  └─ Ultrakey_white_fav.png
│  │  │  ├─ js/
│  │  │  │  ├─ bootstrap-datetimepicker.min.js
│  │  │  │  ├─ bootstrap.bundle.min.js
│  │  │  │  ├─ feather.min.js
│  │  │  │  ├─ jquery-3.7.1.min.js
│  │  │  │  ├─ jquery-safety-wrapper.js
│  │  │  │  ├─ jquery.meanmenu.min.js
│  │  │  │  ├─ jquery.slimscroll.min.js
│  │  │  │  ├─ main-script.js
│  │  │  │  ├─ mainscript.js
│  │  │  │  ├─ moment.js
│  │  │  │  ├─ owl.carousel.min.js
│  │  │  │  ├─ react-safe-init.js
│  │  │  │  ├─ script.js
│  │  │  │  ├─ theme-script.js
│  │  │  │  └─ wow.min.js
│  │  │  ├─ plugins/
│  │  │  │  ├─ apexchart/
│  │  │  │  │  └─ apexcharts.min.js
│  │  │  │  ├─ boxicons/
│  │  │  │  │  ├─ css/
│  │  │  │  │  │  └─ boxicons.min.css
│  │  │  │  │  └─ fonts/
│  │  │  │  │     ├─ boxicons.eot
│  │  │  │  │     ├─ boxicons.svg@
│  │  │  │  │     ├─ boxicons.ttf
│  │  │  │  │     ├─ boxicons.woff
│  │  │  │  │     └─ boxicons.woff2
│  │  │  │  ├─ countup/
│  │  │  │  │  ├─ jquery.counterup.min.js
│  │  │  │  │  └─ jquery.waypoints.min.js
│  │  │  │  ├─ daterangepicker/
│  │  │  │  │  ├─ daterangepicker.css
│  │  │  │  │  └─ daterangepicker.js
│  │  │  │  ├─ fontawesome/
│  │  │  │  │  ├─ css/
│  │  │  │  │  │  ├─ all.min.css
│  │  │  │  │  │  └─ fontawesome.min.css
│  │  │  │  │  └─ webfonts/
│  │  │  │  │     ├─ fa-brands-400.ttf
│  │  │  │  │     ├─ fa-brands-400.woff2
│  │  │  │  │     ├─ fa-regular-400.ttf
│  │  │  │  │     ├─ fa-regular-400.woff2
│  │  │  │  │     ├─ fa-solid-900.ttf
│  │  │  │  │     ├─ fa-solid-900.woff2
│  │  │  │  │     ├─ fa-v4compatibility.ttf
│  │  │  │  │     └─ fa-v4compatibility.woff2
│  │  │  │  ├─ icons/
│  │  │  │  │  └─ feather/
│  │  │  │  │     └─ feather.css
│  │  │  │  ├─ owlcarousel/
│  │  │  │  │  ├─ owl.carousel.min.css
│  │  │  │  │  ├─ owl.carousel.min.js
│  │  │  │  │  └─ owl.theme.default.min.css
│  │  │  │  ├─ select2/
│  │  │  │  │  ├─ css/
│  │  │  │  │  │  └─ select2.min.css
│  │  │  │  │  └─ js/
│  │  │  │  │     └─ select2.min.js
│  │  │  │  └─ tabler-icons/
│  │  │  │     ├─ fonts/
│  │  │  │     │  ├─ tabler-icons.eot@
│  │  │  │     │  ├─ tabler-icons.eot@v2.45.0
│  │  │  │     │  ├─ tabler-icons.ttf@v2.45.0
│  │  │  │     │  ├─ tabler-icons.woff@
│  │  │  │     │  └─ tabler-icons.woff2@v2.45.0
│  │  │  │     └─ tabler-icons.css
│  │  │  ├─ index-CCSa9aDU.css
│  │  │  └─ index-sH-KioLC.js
│  │  ├─ index.html
│  │  └─ vite.svg
│  ├─ public/
│  │  ├─ assets/
│  │  │  ├─ css/
│  │  │  │  ├─ animate.css
│  │  │  │  ├─ bootstrap-datetimepicker.min.css
│  │  │  │  ├─ bootstrap.min.css
│  │  │  │  ├─ meanmenu.css
│  │  │  │  ├─ owl.carousel.min.css
│  │  │  │  ├─ style.css
│  │  │  │  └─ style1.css
│  │  │  ├─ img/
│  │  │  │  ├─ bg/
│  │  │  │  │  ├─ banner-bg.png
│  │  │  │  │  ├─ bg-02.png
│  │  │  │  │  ├─ bg-03.png
│  │  │  │  │  ├─ bg-04.png
│  │  │  │  │  ├─ bg-05.png
│  │  │  │  │  ├─ bg-06.png
│  │  │  │  │  ├─ bg-07.png
│  │  │  │  │  ├─ bg-08.png
│  │  │  │  │  ├─ shape-01.webp
│  │  │  │  │  ├─ shape-02.webp
│  │  │  │  │  ├─ shape-03.webp
│  │  │  │  │  └─ shape-04.webp
│  │  │  │  ├─ icons/
│  │  │  │  │  ├─ feature-01.svg
│  │  │  │  │  ├─ feature-02.svg
│  │  │  │  │  ├─ feature-03.svg
│  │  │  │  │  ├─ feature-04.svg
│  │  │  │  │  ├─ feature-05.svg
│  │  │  │  │  ├─ feature-06.svg
│  │  │  │  │  ├─ feature-07.svg
│  │  │  │  │  ├─ feature-08.svg
│  │  │  │  │  ├─ feature-09.svg
│  │  │  │  │  ├─ feature-10.svg
│  │  │  │  │  ├─ feature-11.svg
│  │  │  │  │  ├─ feature-12.svg
│  │  │  │  │  ├─ feature-13.svg
│  │  │  │  │  ├─ feature-14.svg
│  │  │  │  │  ├─ feature-15.svg
│  │  │  │  │  ├─ feature-16.svg
│  │  │  │  │  ├─ feature-17.svg
│  │  │  │  │  ├─ feature-18.svg
│  │  │  │  │  ├─ global-img.svg
│  │  │  │  │  ├─ review.svg
│  │  │  │  │  ├─ staff.svg
│  │  │  │  │  ├─ student.svg
│  │  │  │  │  ├─ subject.svg
│  │  │  │  │  ├─ teacher.svg
│  │  │  │  │  ├─ technology-01.svg
│  │  │  │  │  ├─ technology-02.svg
│  │  │  │  │  ├─ technology-03.svg
│  │  │  │  │  ├─ technology-04.svg
│  │  │  │  │  ├─ technology-05.svg
│  │  │  │  │  ├─ technology-06.svg
│  │  │  │  │  ├─ technology-07.svg
│  │  │  │  │  ├─ technology-08.svg
│  │  │  │  │  ├─ technology-09.svg
│  │  │  │  │  └─ technology-10.svg
│  │  │  │  ├─ parents/
│  │  │  │  │  ├─ parent-01.webp
│  │  │  │  │  ├─ parent-02.webp
│  │  │  │  │  ├─ parent-05.webp
│  │  │  │  │  ├─ parent-06.webp
│  │  │  │  │  ├─ parent-07 (1).webp
│  │  │  │  │  ├─ parent-07.webp
│  │  │  │  │  ├─ parent-11.webp
│  │  │  │  │  └─ parent-13.webp
│  │  │  │  ├─ performer/
│  │  │  │  │  ├─ performer-01.webp
│  │  │  │  │  ├─ performer-02.webp
│  │  │  │  │  ├─ student-performer-01.webp
│  │  │  │  │  └─ student-performer-02.webp
│  │  │  │  ├─ product/
│  │  │  │  │  ├─ product-02.webp
│  │  │  │  │  ├─ product-03.png
│  │  │  │  │  ├─ product-03.webp
│  │  │  │  │  ├─ product-04.webp
│  │  │  │  │  ├─ product-05.webp
│  │  │  │  │  ├─ product-06.webp
│  │  │  │  │  ├─ product-07.webp
│  │  │  │  │  ├─ product-08.webp
│  │  │  │  │  ├─ product-09.webp
│  │  │  │  │  ├─ product-10.webp
│  │  │  │  │  ├─ product-11.webp
│  │  │  │  │  ├─ product-12.webp
│  │  │  │  │  ├─ product-13.webp
│  │  │  │  │  ├─ product-14.webp
│  │  │  │  │  ├─ product-15.webp
│  │  │  │  │  └─ product-16.webp
│  │  │  │  ├─ profiles/
│  │  │  │  │  ├─ avatar-01.webp
│  │  │  │  │  ├─ avatar-14.webp
│  │  │  │  │  ├─ avatar-19.webp
│  │  │  │  │  ├─ avatar-23.webp
│  │  │  │  │  ├─ avatar-25.webp
│  │  │  │  │  └─ avatar-27.webp
│  │  │  │  ├─ screens/
│  │  │  │  │  ├─ dashboard-01.svg
│  │  │  │  │  ├─ dashboard-02.svg
│  │  │  │  │  ├─ dashboard-03.svg
│  │  │  │  │  ├─ dashboard-04.svg
│  │  │  │  │  ├─ screen-01.svg
│  │  │  │  │  ├─ screen-02.svg
│  │  │  │  │  ├─ screen-03.svg
│  │  │  │  │  ├─ screen-04.svg
│  │  │  │  │  ├─ screen-05.svg
│  │  │  │  │  ├─ screen-06.svg
│  │  │  │  │  ├─ screen-07.svg
│  │  │  │  │  ├─ screen-08.svg
│  │  │  │  │  ├─ screen-09.svg
│  │  │  │  │  ├─ screen-10.svg
│  │  │  │  │  ├─ screen-11.svg
│  │  │  │  │  ├─ screen-12.svg
│  │  │  │  │  ├─ screen-13.svg
│  │  │  │  │  ├─ screen-14.svg
│  │  │  │  │  ├─ screen-15.svg
│  │  │  │  │  ├─ screen-16.svg
│  │  │  │  │  ├─ screen-17.svg
│  │  │  │  │  ├─ screen-18.svg
│  │  │  │  │  ├─ screen-19.svg
│  │  │  │  │  ├─ screen-20.svg
│  │  │  │  │  ├─ screen-21.svg
│  │  │  │  │  ├─ screen-22.svg
│  │  │  │  │  ├─ screen-23.svg
│  │  │  │  │  ├─ screen-24.svg
│  │  │  │  │  ├─ screen-25.svg
│  │  │  │  │  ├─ screen-26.svg
│  │  │  │  │  ├─ screen-27.svg
│  │  │  │  │  ├─ screen-28.svg
│  │  │  │  │  ├─ screen-29.svg
│  │  │  │  │  ├─ screen-30.svg
│  │  │  │  │  ├─ screen-31.svg
│  │  │  │  │  ├─ screen-32.svg
│  │  │  │  │  ├─ screen-33.svg
│  │  │  │  │  ├─ screen-34.svg
│  │  │  │  │  ├─ screen-35.svg
│  │  │  │  │  ├─ screen-36.svg
│  │  │  │  │  ├─ screen-37.svg
│  │  │  │  │  ├─ screen-38.svg
│  │  │  │  │  ├─ screen-39.svg
│  │  │  │  │  ├─ screen-40.svg
│  │  │  │  │  ├─ screen-41.svg
│  │  │  │  │  ├─ screen-42.svg
│  │  │  │  │  ├─ screen-43.svg
│  │  │  │  │  ├─ screen-44.svg
│  │  │  │  │  ├─ screen-45.svg
│  │  │  │  │  ├─ screen-46.svg
│  │  │  │  │  ├─ screen-47.svg
│  │  │  │  │  ├─ screen-48.svg
│  │  │  │  │  ├─ screen-49.svg
│  │  │  │  │  ├─ screen-50.svg
│  │  │  │  │  ├─ screen-51.svg
│  │  │  │  │  ├─ screen-52.svg
│  │  │  │  │  ├─ screen-53.svg
│  │  │  │  │  └─ screen-54.svg
│  │  │  │  ├─ students/
│  │  │  │  │  ├─ student-09.webp
│  │  │  │  │  ├─ student-10.webp
│  │  │  │  │  ├─ student-11.webp
│  │  │  │  │  └─ student-12.webp
│  │  │  │  ├─ teachers/
│  │  │  │  │  ├─ teacher-01.webp
│  │  │  │  │  ├─ teacher-02.webp
│  │  │  │  │  └─ teacher-03.webp
│  │  │  │  ├─ apple-logo.svg
│  │  │  │  ├─ banner-img.svg
│  │  │  │  ├─ facebook-logo.svg
│  │  │  │  ├─ favicon.png
│  │  │  │  ├─ google-logo.svg
│  │  │  │  ├─ Languages_English.png
│  │  │  │  ├─ Languages_Hindi.png
│  │  │  │  ├─ Languages_Telugu.png
│  │  │  │  ├─ logo_white.jpg
│  │  │  │  ├─ logo_white.png
│  │  │  │  ├─ logo-white.svg
│  │  │  │  ├─ logo.jpg
│  │  │  │  ├─ logo.png
│  │  │  │  ├─ logo.svg
│  │  │  │  ├─ logo2.jpg
│  │  │  │  ├─ Ultrakey_fav.png
│  │  │  │  ├─ Ultrakey_IT_Solutions_Private_Limited_Logo_Black.png
│  │  │  │  └─ Ultrakey_white_fav.png
│  │  │  ├─ js/
│  │  │  │  ├─ bootstrap-datetimepicker.min.js
│  │  │  │  ├─ bootstrap.bundle.min.js
│  │  │  │  ├─ feather.min.js
│  │  │  │  ├─ jquery-3.7.1.min.js
│  │  │  │  ├─ jquery-safety-wrapper.js
│  │  │  │  ├─ jquery.meanmenu.min.js
│  │  │  │  ├─ jquery.slimscroll.min.js
│  │  │  │  ├─ main-script.js
│  │  │  │  ├─ mainscript.js
│  │  │  │  ├─ moment.js
│  │  │  │  ├─ owl.carousel.min.js
│  │  │  │  ├─ react-safe-init.js
│  │  │  │  ├─ script.js
│  │  │  │  ├─ theme-script.js
│  │  │  │  └─ wow.min.js
│  │  │  └─ plugins/
│  │  │     ├─ apexchart/
│  │  │     │  └─ apexcharts.min.js
│  │  │     ├─ boxicons/
│  │  │     │  ├─ css/
│  │  │     │  │  └─ boxicons.min.css
│  │  │     │  └─ fonts/
│  │  │     │     ├─ boxicons.eot
│  │  │     │     ├─ boxicons.svg@
│  │  │     │     ├─ boxicons.ttf
│  │  │     │     ├─ boxicons.woff
│  │  │     │     └─ boxicons.woff2
│  │  │     ├─ countup/
│  │  │     │  ├─ jquery.counterup.min.js
│  │  │     │  └─ jquery.waypoints.min.js
│  │  │     ├─ daterangepicker/
│  │  │     │  ├─ daterangepicker.css
│  │  │     │  └─ daterangepicker.js
│  │  │     ├─ fontawesome/
│  │  │     │  ├─ css/
│  │  │     │  │  ├─ all.min.css
│  │  │     │  │  └─ fontawesome.min.css
│  │  │     │  └─ webfonts/
│  │  │     │     ├─ fa-brands-400.ttf
│  │  │     │     ├─ fa-brands-400.woff2
│  │  │     │     ├─ fa-regular-400.ttf
│  │  │     │     ├─ fa-regular-400.woff2
│  │  │     │     ├─ fa-solid-900.ttf
│  │  │     │     ├─ fa-solid-900.woff2
│  │  │     │     ├─ fa-v4compatibility.ttf
│  │  │     │     └─ fa-v4compatibility.woff2
│  │  │     ├─ icons/
│  │  │     │  └─ feather/
│  │  │     │     └─ feather.css
│  │  │     ├─ owlcarousel/
│  │  │     │  ├─ owl.carousel.min.css
│  │  │     │  ├─ owl.carousel.min.js
│  │  │     │  └─ owl.theme.default.min.css
│  │  │     ├─ select2/
│  │  │     │  ├─ css/
│  │  │     │  │  └─ select2.min.css
│  │  │     │  └─ js/
│  │  │     │     └─ select2.min.js
│  │  │     └─ tabler-icons/
│  │  │        ├─ fonts/
│  │  │        │  ├─ tabler-icons.eot@
│  │  │        │  ├─ tabler-icons.eot@v2.45.0
│  │  │        │  ├─ tabler-icons.ttf@v2.45.0
│  │  │        │  ├─ tabler-icons.woff@
│  │  │        │  └─ tabler-icons.woff2@v2.45.0
│  │  │        └─ tabler-icons.css
│  │  └─ vite.svg
│  ├─ src/
│  │  ├─ api/
│  │  │  ├─ adminService.ts
│  │  │  ├─ authService.ts
│  │  │  ├─ client.ts
│  │  │  └─ financeService.ts
│  │  ├─ assets/
│  │  │  └─ react.svg
│  │  ├─ components/
│  │  │  ├─ common/
│  │  │  │  ├─ DataTable.tsx
│  │  │  │  ├─ InstitutionHeader.tsx
│  │  │  │  ├─ LoadingSpinner.css
│  │  │  │  ├─ LoadingSpinner.tsx
│  │  │  │  └─ ToastContainer.tsx
│  │  │  ├─ dashboard/
│  │  │  │  ├─ AttendanceCard.tsx
│  │  │  │  ├─ BestPerforms.tsx
│  │  │  │  ├─ FeesOverviewCard.tsx
│  │  │  │  ├─ InstitutionDetailsCard.tsx
│  │  │  │  ├─ InstitutionHeader.tsx
│  │  │  │  ├─ ScheduleCard.tsx
│  │  │  │  └─ TopStatCard.tsx
│  │  │  ├─ examples/
│  │  │  │  ├─ AgentManagementDashboard.tsx
│  │  │  │  ├─ GuardianManagementExample.tsx
│  │  │  │  ├─ HRManagementExample.tsx
│  │  │  │  └─ RealTimeDashboardExample.tsx
│  │  │  ├─ forms/
│  │  │  │  └─ IndianFormFields.tsx
│  │  │  ├─ layout/
│  │  │  │  ├─ Header.tsx
│  │  │  │  ├─ InstitutionAdminSidebar.tsx
│  │  │  │  ├─ PageHeader.tsx
│  │  │  │  ├─ Sidebar.tsx
│  │  │  │  └─ SuperAdminSidebar.tsx
│  │  │  ├─ students/
│  │  │  │  ├─ StudentDetailTabs.tsx
│  │  │  │  ├─ StudentSelector.tsx
│  │  │  │  └─ StudentSidebar.tsx
│  │  │  ├─ teachers/
│  │  │  │  ├─ TeacherDetailTabs.tsx
│  │  │  │  ├─ TeacherSelector.tsx
│  │  │  │  └─ TeacherSidebar.tsx
│  │  │  ├─ AdminAnalytics.tsx
│  │  │  ├─ Dashboard.tsx
│  │  │  ├─ DashboardCharts.tsx
│  │  │  ├─ DashboardManager.tsx
│  │  │  ├─ ErrorBoundary.tsx
│  │  │  ├─ FileUpload.tsx
│  │  │  ├─ Header.tsx
│  │  │  ├─ ProtectedRoute.tsx
│  │  │  ├─ RoleBasedDashboard.tsx
│  │  │  ├─ RoleBasedDashboardRedirect.tsx
│  │  │  ├─ RoleBasedDashboardRouter.tsx
│  │  │  ├─ RoleSidebar.tsx
│  │  │  ├─ StudentAnalytics.tsx
│  │  │  ├─ TeacherAnalytics.tsx
│  │  │  ├─ UnifiedSidebar.tsx
│  │  │  └─ UpgradePrompt.tsx
│  │  ├─ config/
│  │  │  ├─ api.ts
│  │  │  ├─ indianLocalization.ts
│  │  │  ├─ modules.ts
│  │  │  ├─ plans.ts
│  │  │  ├─ roleDashboardConfig.tsx
│  │  │  ├─ roles.ts
│  │  │  └─ sidebar-menus.ts
│  │  ├─ data/
│  │  │  ├─ agents.ts
│  │  │  ├─ dashboardAccessData.ts
│  │  │  ├─ guardians.ts
│  │  │  ├─ hrmData.ts
│  │  │  ├─ indiaData.ts
│  │  │  ├─ institutionData.ts
│  │  │  ├─ parents.ts
│  │  │  ├─ principals.ts
│  │  │  ├─ schools.ts
│  │  │  ├─ settingsData.ts
│  │  │  ├─ students.ts
│  │  │  ├─ supportTickets.ts
│  │  │  └─ teachers.ts
│  │  ├─ hooks/
│  │  │  ├─ index.ts
│  │  │  ├─ useAgents.ts
│  │  │  ├─ useDashboard.ts
│  │  │  ├─ useDataFetching.ts
│  │  │  ├─ useGuardians.ts
│  │  │  ├─ useHRM.ts
│  │  │  ├─ useInstitutionData.ts
│  │  │  └─ useSocket.ts
│  │  ├─ layouts/
│  │  │  ├─ AdminLayout.tsx
│  │  │  ├─ AgentLayout.tsx
│  │  │  ├─ InstitutionLayout.tsx
│  │  │  ├─ MainLayout.tsx
│  │  │  ├─ SuperAdminLayout.tsx
│  │  │  └─ TransportLayout.tsx
│  │  ├─ pages/
│  │  │  ├─ academic/
│  │  │  │  ├─ AcademicReasonsPage.tsx
│  │  │  │  ├─ ClassesPage.tsx
│  │  │  │  ├─ ClassHomeWorkPage.tsx
│  │  │  │  ├─ ClassRoomPage.tsx
│  │  │  │  ├─ ClassRoutinePage.tsx
│  │  │  │  ├─ ClassSectionPage.tsx
│  │  │  │  ├─ ClassSubjectPage.tsx
│  │  │  │  ├─ ClassSyllabusPage.tsx
│  │  │  │  ├─ ClassTimeTablePage.tsx
│  │  │  │  ├─ ExamAttendancePage.tsx
│  │  │  │  ├─ ExamPage.tsx
│  │  │  │  ├─ ExamResultsPage.tsx
│  │  │  │  ├─ ExamSchedulePage.tsx
│  │  │  │  ├─ GradePage.tsx
│  │  │  │  └─ ScheduleClassesPage.tsx
│  │  │  ├─ Academic Settings/
│  │  │  │  ├─ Religion.tsx
│  │  │  │  └─ SchoolSettings.tsx
│  │  │  ├─ agent/
│  │  │  │  ├─ AgentAddInstitutionPage.tsx
│  │  │  │  ├─ AgentCommissionsPage.tsx
│  │  │  │  ├─ AgentDashboard.tsx
│  │  │  │  ├─ AgentInstitutionDetailsPage.tsx
│  │  │  │  ├─ AgentInstitutionEditPage.tsx
│  │  │  │  ├─ AgentInstitutionsPage.tsx
│  │  │  │  ├─ AgentPages.css
│  │  │  │  ├─ AgentPerformancePage.tsx
│  │  │  │  ├─ AgentProfilePage.tsx
│  │  │  │  └─ AgentSettingsPage.tsx
│  │  │  ├─ announcements/
│  │  │  │  ├─ EventsPage.tsx
│  │  │  │  └─ NoticeBoardPage.tsx
│  │  │  ├─ App Settings/
│  │  │  │  ├─ CustomFields.tsx
│  │  │  │  └─ InvoiceSettings.tsx
│  │  │  ├─ Applications/
│  │  │  │  ├─ Calendar.tsx
│  │  │  │  ├─ Call.tsx
│  │  │  │  ├─ Chat.tsx
│  │  │  │  ├─ Email.tsx
│  │  │  │  ├─ FileManager.tsx
│  │  │  │  ├─ Notes.tsx
│  │  │  │  └─ Todo.tsx
│  │  │  ├─ attendance/
│  │  │  │  ├─ StaffAttendancePage.tsx
│  │  │  │  ├─ StudentAttendancePage.tsx
│  │  │  │  └─ TeacherAttendancePage.tsx
│  │  │  ├─ auth/
│  │  │  │  ├─ LoginPage.tsx
│  │  │  │  └─ RegisterPage.tsx
│  │  │  ├─ Authentication/
│  │  │  │  └─ Login/
│  │  │  │     ├─ authfooter/
│  │  │  │     │  └─ AuthFooter.tsx
│  │  │  │     ├─ authleft/
│  │  │  │     │  └─ AuthLeft.tsx
│  │  │  │     ├─ ForgotPassword/
│  │  │  │     │  └─ ForgotPassword.tsx
│  │  │  │     ├─ Register/
│  │  │  │     │  └─ Register.tsx
│  │  │  │     └─ Login.tsx
│  │  │  ├─ communication/
│  │  │  │  └─ MessagesPage.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ FormBasicInputsPage.tsx
│  │  │  │  ├─ TablesBasicPage.tsx
│  │  │  │  ├─ UIAlertsPage.tsx
│  │  │  │  ├─ UIButtonsPage.tsx
│  │  │  │  └─ UICardsPage.tsx
│  │  │  ├─ content/
│  │  │  │  ├─ BlogCategoriesPage.tsx
│  │  │  │  ├─ BlogCommentsPage.tsx
│  │  │  │  ├─ BlogPage.tsx
│  │  │  │  ├─ BlogTagsPage.tsx
│  │  │  │  ├─ CitiesPage.tsx
│  │  │  │  ├─ CountriesPage.tsx
│  │  │  │  ├─ FaqPage.tsx
│  │  │  │  ├─ PagesPage.tsx
│  │  │  │  ├─ StatesPage.tsx
│  │  │  │  └─ TestimonialsPage.tsx
│  │  │  ├─ dashboard/
│  │  │  │  ├─ Accountant/
│  │  │  │  │  ├─ AccountantDashboardPage.tsx
│  │  │  │  │  ├─ ApplicationsPage.tsx
│  │  │  │  │  ├─ FeeCollectionPage.tsx
│  │  │  │  │  └─ SubscriptionPage.tsx
│  │  │  │  ├─ Admin/
│  │  │  │  │  ├─ AdminAcademicPage.tsx
│  │  │  │  │  ├─ AdminAddStudentPage.tsx
│  │  │  │  │  ├─ AdminAnalyticsDashboard.tsx
│  │  │  │  │  ├─ AdminAttendancePage.tsx
│  │  │  │  │  ├─ AdminAttendanceReportPage.tsx
│  │  │  │  │  ├─ AdminCreateCredentialsPage.tsx
│  │  │  │  │  ├─ AdminDashboard.tsx
│  │  │  │  │  ├─ AdminEventsPage.tsx
│  │  │  │  │  ├─ AdminExaminationsPage.tsx
│  │  │  │  │  ├─ AdminExamPage.tsx
│  │  │  │  │  ├─ AdminExamSchedulePage.tsx
│  │  │  │  │  ├─ AdminFeesPage.tsx
│  │  │  │  │  ├─ AdminFeesReportPage.tsx
│  │  │  │  │  ├─ AdminFinanceDashboard.tsx
│  │  │  │  │  ├─ AdminGradeReportPage.tsx
│  │  │  │  │  ├─ AdminGradesPage.tsx
│  │  │  │  │  ├─ AdminLibraryBooksPage.tsx
│  │  │  │  │  ├─ AdminLibraryMembersPage.tsx
│  │  │  │  │  ├─ AdminLibraryPage.tsx
│  │  │  │  │  ├─ AdminNoticeBoardPage.tsx
│  │  │  │  │  ├─ AdminNotificationsPage.tsx
│  │  │  │  │  ├─ AdminPendingRequestsPage.tsx
│  │  │  │  │  ├─ AdminProfileSettingsPage.tsx
│  │  │  │  │  ├─ AdminPromotionPage.tsx
│  │  │  │  │  ├─ AdminReportsPage.tsx
│  │  │  │  │  ├─ AdminResultsPage.tsx
│  │  │  │  │  ├─ AdminSchoolSettingsPage.tsx
│  │  │  │  │  ├─ AdminSportsPage.tsx
│  │  │  │  │  ├─ AdminStudentAttendancePage.tsx
│  │  │  │  │  ├─ AdminStudentListPage.tsx
│  │  │  │  │  ├─ AdminStudentManagementPage.tsx
│  │  │  │  │  ├─ AdminStudentReportPage.tsx
│  │  │  │  │  ├─ AdminTeacherAttendancePage.tsx
│  │  │  │  │  ├─ AdminTeacherManagementPage.tsx
│  │  │  │  │  ├─ AdminUserDirectoryPage.tsx
│  │  │  │  │  └─ AdminUserManagementPage.tsx
│  │  │  │  ├─ Faculty/
│  │  │  │  │  └─ FacultyDashboard.tsx
│  │  │  │  ├─ Hr/
│  │  │  │  │  └─ HRDashboardPage.tsx
│  │  │  │  ├─ InstituteAdmin/
│  │  │  │  │  ├─ overview/
│  │  │  │  │  │  ├─ ParentOverviewPage.tsx
│  │  │  │  │  │  ├─ StudentOverviewPage.tsx
│  │  │  │  │  │  └─ TeachingOverviewPage.tsx
│  │  │  │  │  ├─ InstituteAdminDashboardPage.tsx
│  │  │  │  │  ├─ InstituteAnalyticsDashboardPage.tsx
│  │  │  │  │  ├─ InstituteFinanceDashboardPage.tsx
│  │  │  │  │  ├─ InstitutionSettingsPage.tsx
│  │  │  │  │  ├─ StudentListPage.tsx
│  │  │  │  │  ├─ SubscriptionPage.tsx
│  │  │  │  │  └─ UserDirectoryPage.tsx
│  │  │  │  ├─ Parent/
│  │  │  │  │  └─ ParentDashboardPage.tsx
│  │  │  │  ├─ Principal/
│  │  │  │  │  ├─ PrincipalAnalyticsPage.tsx
│  │  │  │  │  └─ PrincipalDashboard.tsx
│  │  │  │  ├─ Staff/
│  │  │  │  │  └─ StaffDashboard.tsx
│  │  │  │  ├─ Student/
│  │  │  │  │  └─ StudentDashboard.tsx
│  │  │  │  ├─ AnalyticsPage.tsx
│  │  │  │  ├─ FinancePage.tsx
│  │  │  │  ├─ HostelDashboardPage.tsx
│  │  │  │  ├─ LibraryDashboardPage.tsx
│  │  │  │  ├─ TeacherDashboardPage.tsx
│  │  │  │  └─ TransportDashboardPage.tsx
│  │  │  ├─ examples/
│  │  │  │  └─ FileUploadExample.tsx
│  │  │  ├─ fees/
│  │  │  │  ├─ CollectFeesPage.tsx
│  │  │  │  ├─ FeesAssignPage.tsx
│  │  │  │  ├─ FeesGroupPage.tsx
│  │  │  │  ├─ FeesMasterPage.tsx
│  │  │  │  └─ FeesTypePage.tsx
│  │  │  ├─ finance/
│  │  │  │  ├─ ExpensesCategoryPage.tsx
│  │  │  │  ├─ ExpensesPage.tsx
│  │  │  │  ├─ IncomePage.tsx
│  │  │  │  ├─ InvoicesPage.tsx
│  │  │  │  ├─ InvoiceViewPage.tsx
│  │  │  │  └─ TransactionsPage.tsx
│  │  │  ├─ Financial Settings/
│  │  │  │  ├─ PaymentGateways.tsx
│  │  │  │  └─ TaxRates.tsx
│  │  │  ├─ Generasettings/
│  │  │  │  ├─ ConnectedApps.tsx
│  │  │  │  ├─ NotificationsSettings.tsx
│  │  │  │  ├─ ProfileSettings.tsx
│  │  │  │  └─ SecuritySettings.tsx
│  │  │  ├─ guardians/
│  │  │  │  ├─ GuardianGridPage.tsx
│  │  │  │  ├─ guardianHelpers.ts
│  │  │  │  └─ GuardianListPage.tsx
│  │  │  ├─ hostel/
│  │  │  │  ├─ FeesPage.tsx
│  │  │  │  ├─ HostelFeesPage.tsx
│  │  │  │  ├─ HostelListPage.tsx
│  │  │  │  ├─ HostelProfilePage.tsx
│  │  │  │  ├─ HostelReportPage.tsx
│  │  │  │  ├─ HostelRoomsPage.tsx
│  │  │  │  ├─ HostelRoomTypesPage.tsx
│  │  │  │  ├─ HostelSettingsPage.tsx
│  │  │  │  ├─ HostelsPage.tsx
│  │  │  │  ├─ PaymentHistoryPage.tsx
│  │  │  │  ├─ PaymentsPage.tsx
│  │  │  │  └─ RoomsPage.tsx
│  │  │  ├─ hrm/
│  │  │  │  ├─ ApprovalsPage.tsx
│  │  │  │  ├─ ApproveRequestPage.tsx
│  │  │  │  ├─ DepartmentsPage.tsx
│  │  │  │  ├─ DesignationsPage.tsx
│  │  │  │  ├─ HolidaysPage.tsx
│  │  │  │  ├─ LeavesPage.tsx
│  │  │  │  ├─ LeaveTypesPage.tsx
│  │  │  │  ├─ PayrollPage.tsx
│  │  │  │  ├─ StaffDocumentsPage.tsx
│  │  │  │  └─ StaffsPage.tsx
│  │  │  ├─ library/
│  │  │  │  ├─ LibraryBooksPage.tsx
│  │  │  │  ├─ LibraryIssueBookPage.tsx
│  │  │  │  ├─ LibraryMembersPage.tsx
│  │  │  │  ├─ LibraryReportPage.tsx
│  │  │  │  └─ LibraryReturnPage.tsx
│  │  │  ├─ management/
│  │  │  │  └─ SportsPage.tsx
│  │  │  ├─ MembershipPlans/
│  │  │  │  ├─ MembershipAddons.tsx
│  │  │  │  ├─ MembershipPlans.tsx
│  │  │  │  └─ MembershipTransactions.tsx
│  │  │  ├─ Other Settings/
│  │  │  │  ├─ BanIpAddress.tsx
│  │  │  │  └─ Storage.tsx
│  │  │  ├─ overview/
│  │  │  │  ├─ LibraryOverviewPage.tsx
│  │  │  │  ├─ ParentOverviewPage.tsx
│  │  │  │  ├─ ParentsOverviewPage_Old.tsx
│  │  │  │  ├─ ParentsOverviewPage.tsx
│  │  │  │  ├─ StaffOverviewPage.tsx
│  │  │  │  ├─ StudentOverviewPage.tsx
│  │  │  │  ├─ StudentsOverviewPage_Old.tsx
│  │  │  │  ├─ StudentsOverviewPage.tsx
│  │  │  │  ├─ TeacherOverviewPage.tsx
│  │  │  │  ├─ TeachersOverviewPage_Old.tsx
│  │  │  │  └─ TeachersOverviewPage.tsx
│  │  │  ├─ pages/
│  │  │  │  ├─ authentication/
│  │  │  │  │  └─ login/
│  │  │  │  │     └─ Login.tsx
│  │  │  │  └─ ProfilePage.tsx
│  │  │  ├─ parents/
│  │  │  │  ├─ ParentDetailsPage.tsx
│  │  │  │  ├─ ParentGridPage.tsx
│  │  │  │  └─ ParentListPage.tsx
│  │  │  ├─ people/
│  │  │  │  └─ TeacherSalaryPage.tsx
│  │  │  ├─ players/
│  │  │  │  └─ PlayersPage.tsx
│  │  │  ├─ reports/
│  │  │  │  ├─ AttendanceReportPage.tsx
│  │  │  │  ├─ ClassReportPage.tsx
│  │  │  │  ├─ FeesReportPage.tsx
│  │  │  │  ├─ GradeReportPage.tsx
│  │  │  │  ├─ LeaveReportPage.tsx
│  │  │  │  └─ StudentReportPage.tsx
│  │  │  ├─ settings/
│  │  │  │  ├─ CompanyInfo.tsx
│  │  │  │  ├─ EmailConfig.tsx
│  │  │  │  ├─ Localization.tsx
│  │  │  │  ├─ PaymentGateway.tsx
│  │  │  │  ├─ SchoolSettings.tsx
│  │  │  │  ├─ SmsConfig.tsx
│  │  │  │  ├─ StorageSettings.tsx
│  │  │  │  ├─ TaxSettings.tsx
│  │  │  │  └─ UserSettingsPage.tsx
│  │  │  ├─ sports/
│  │  │  │  └─ SportsPage.tsx
│  │  │  ├─ staff/
│  │  │  │  ├─ LeavePage.tsx
│  │  │  │  ├─ ProfilePage.tsx
│  │  │  │  └─ TasksPage.tsx
│  │  │  ├─ students/
│  │  │  │  ├─ StudentAdd.tsx
│  │  │  │  ├─ StudentDetailsPage.tsx
│  │  │  │  ├─ StudentFeesPage.tsx
│  │  │  │  ├─ StudentGridPage.tsx
│  │  │  │  ├─ StudentLeavesPage.tsx
│  │  │  │  ├─ StudentLibraryPage.tsx
│  │  │  │  ├─ StudentListPage.tsx
│  │  │  │  ├─ StudentPromotionPage.tsx
│  │  │  │  ├─ StudentResultPage.tsx
│  │  │  │  ├─ StudentsPage.tsx
│  │  │  │  └─ StudentTimeTablePage.tsx
│  │  │  ├─ superadmin/
│  │  │  │  ├─ AddAgentPage.tsx
│  │  │  │  ├─ AddInstitutionPage.tsx
│  │  │  │  ├─ AgentDetailsPage.tsx
│  │  │  │  ├─ AgentsManagementPage.tsx
│  │  │  │  ├─ AlertsPage.tsx
│  │  │  │  ├─ AllDataPage.tsx
│  │  │  │  ├─ AnalyticsPage.tsx
│  │  │  │  ├─ AnalyticsReportsPage.tsx
│  │  │  │  ├─ AuditLogsPage.tsx
│  │  │  │  ├─ BranchDetailsPage.tsx
│  │  │  │  ├─ BranchEditPage.tsx
│  │  │  │  ├─ BranchesMonitoringPage.tsx
│  │  │  │  ├─ BranchStudentsPage.tsx
│  │  │  │  ├─ CreateCredentialsPage.tsx
│  │  │  │  ├─ CreateInstitutionWizard.tsx
│  │  │  │  ├─ CreateInstitutionWizardPage.tsx
│  │  │  │  ├─ EditAgentPage.tsx
│  │  │  │  ├─ ImpersonatePage.tsx
│  │  │  │  ├─ InstitutionCreationWizard.tsx
│  │  │  │  ├─ InstitutionManagementPage.tsx
│  │  │  │  ├─ InstitutionsAdminManagementPage.tsx
│  │  │  │  ├─ InstitutionsByTypePage.tsx
│  │  │  │  ├─ InstitutionsDegreeCollegesPage.tsx
│  │  │  │  ├─ InstitutionsDetailsPage.tsx
│  │  │  │  ├─ InstitutionsEditPage.tsx
│  │  │  │  ├─ InstitutionsEngineeringCollegesPage.tsx
│  │  │  │  ├─ InstitutionSetupPage.tsx
│  │  │  │  ├─ InstitutionsInterCollegesPage.tsx
│  │  │  │  ├─ InstitutionsManagementPage.tsx
│  │  │  │  ├─ InstitutionsPage.tsx
│  │  │  │  ├─ InstitutionsSchoolsPage.tsx
│  │  │  │  ├─ InstitutionsUpgradePage.tsx
│  │  │  │  ├─ InvoiceDetailsPage.tsx
│  │  │  │  ├─ MaintenancePage.tsx
│  │  │  │  ├─ MembershipsManagementPage.tsx
│  │  │  │  ├─ ModulesControlPage.tsx
│  │  │  │  ├─ PendingInstitutionRegistrationsPage.tsx
│  │  │  │  ├─ PendingRequests.tsx
│  │  │  │  ├─ PendingRequestsPage.tsx
│  │  │  │  ├─ PlatformSettingsPage_fixed.tsx
│  │  │  │  ├─ PlatformSettingsPage.tsx
│  │  │  │  ├─ PlatformUsersPage.tsx
│  │  │  │  ├─ RevenueAnalyticsPage.tsx
│  │  │  │  ├─ SubscriptionApprovalPage.tsx
│  │  │  │  ├─ SuperAdminDashboard.tsx
│  │  │  │  ├─ SuperAdminSidebar.tsx
│  │  │  │  ├─ SupportTicketsPage.tsx
│  │  │  │  ├─ TransactionDetailsPage.tsx
│  │  │  │  └─ TransactionsManagementPage.tsx
│  │  │  ├─ support/
│  │  │  │  ├─ ContactMessagesPage.tsx
│  │  │  │  ├─ SupportTickets.tsx
│  │  │  │  ├─ TicketGrid.tsx
│  │  │  │  └─ TicketsPage.tsx
│  │  │  ├─ System Settings/
│  │  │  │  ├─ EmailSettings.tsx
│  │  │  │  ├─ EmailTemplates.tsx
│  │  │  │  ├─ GdprCookies.tsx
│  │  │  │  └─ SmsSettings.tsx
│  │  │  ├─ teachers/
│  │  │  │  ├─ TeacherAddPage.tsx
│  │  │  │  ├─ TeacherDetailsPage.tsx
│  │  │  │  ├─ TeacherGridPage.tsx
│  │  │  │  ├─ TeacherLeavesPage.tsx
│  │  │  │  ├─ TeacherLibraryPage.tsx
│  │  │  │  ├─ TeacherListPage.tsx
│  │  │  │  ├─ TeacherRoutinePage.tsx
│  │  │  │  └─ TeacherSalaryPage.tsx
│  │  │  ├─ transport/
│  │  │  │  ├─ TransportAssignVehiclePage.tsx
│  │  │  │  ├─ TransportPickupPointsPage.tsx
│  │  │  │  ├─ TransportReportPage.tsx
│  │  │  │  ├─ TransportRoutesPage.tsx
│  │  │  │  ├─ TransportVehicleDriversPage.tsx
│  │  │  │  └─ TransportVehiclePage.tsx
│  │  │  ├─ Under Maintenance/
│  │  │  │  └─ UnderMaintenance.tsx
│  │  │  ├─ user-management/
│  │  │  │  ├─ InstitutionCreateCredentialsPage.tsx
│  │  │  │  ├─ PendingRequestsPage.tsx
│  │  │  │  └─ UserDirectoryPage.tsx
│  │  │  ├─ users/
│  │  │  │  ├─ DeleteAccountPage.tsx
│  │  │  │  ├─ PermissionsPage.tsx
│  │  │  │  ├─ RolesPage.tsx
│  │  │  │  ├─ RolesPermissionsPage.tsx
│  │  │  │  └─ UsersPage.tsx
│  │  │  ├─ Website Settings/
│  │  │  │  ├─ CompanySettings.tsx
│  │  │  │  ├─ Language.tsx
│  │  │  │  ├─ Localization.tsx
│  │  │  │  ├─ Preferences.tsx
│  │  │  │  ├─ Prefixes.tsx
│  │  │  │  └─ SocialAuthentication.tsx
│  │  │  ├─ AnalyticsPage.tsx
│  │  │  ├─ DataRightsPage.tsx
│  │  │  └─ PlaceholderPage.tsx
│  │  ├─ router/
│  │  │  ├─ finalized-router.tsx
│  │  │  ├─ index.tsx
│  │  │  └─ working-router.tsx
│  │  ├─ services/
│  │  │  ├─ academicEngineService.ts
│  │  │  ├─ academicReasonService.ts
│  │  │  ├─ accountRequestService.ts
│  │  │  ├─ adminAnalyticsService.ts
│  │  │  ├─ agentService.ts
│  │  │  ├─ analyticsService.ts
│  │  │  ├─ api.js
│  │  │  ├─ api.ts
│  │  │  ├─ applicationPersistenceService.ts
│  │  │  ├─ attendanceService.ts
│  │  │  ├─ branchService.ts
│  │  │  ├─ callLogService.ts
│  │  │  ├─ callSocketService.ts
│  │  │  ├─ chatBlockService.ts
│  │  │  ├─ chatService.ts
│  │  │  ├─ chatSocketService.ts
│  │  │  ├─ classRoomService.ts
│  │  │  ├─ classScheduleService.ts
│  │  │  ├─ classService.ts
│  │  │  ├─ commissionService.ts
│  │  │  ├─ communicationService.ts
│  │  │  ├─ crossApplicationCommunicationService.ts
│  │  │  ├─ customFieldService.ts
│  │  │  ├─ dashboardService.ts
│  │  │  ├─ driverService.ts
│  │  │  ├─ dsrService.ts
│  │  │  ├─ emailService.ts
│  │  │  ├─ emailSettingsService.ts
│  │  │  ├─ eventService.ts
│  │  │  ├─ examScheduleService.ts
│  │  │  ├─ examService.ts
│  │  │  ├─ feeService.ts
│  │  │  ├─ fileManagerService.ts
│  │  │  ├─ gdprSettingsService.ts
│  │  │  ├─ gradeService.ts
│  │  │  ├─ guardianService.ts
│  │  │  ├─ homeworkService.ts
│  │  │  ├─ hostelService.ts
│  │  │  ├─ hrmService.ts
│  │  │  ├─ index.ts
│  │  │  ├─ institutionRegistrationService.ts
│  │  │  ├─ institutionService.ts
│  │  │  ├─ institutionSetupService.ts
│  │  │  ├─ institutionUtilsService.ts
│  │  │  ├─ libraryService.ts
│  │  │  ├─ noteService.ts
│  │  │  ├─ notesService.ts
│  │  │  ├─ noticeService.ts
│  │  │  ├─ notificationService.ts
│  │  │  ├─ permissionService.ts
│  │  │  ├─ permissionsService.ts
│  │  │  ├─ pickupPointService.ts
│  │  │  ├─ realTimeService.ts
│  │  │  ├─ religionService.ts
│  │  │  ├─ reportsService.ts
│  │  │  ├─ roleService.ts
│  │  │  ├─ schoolSettingsService.ts
│  │  │  ├─ settingsService.ts
│  │  │  ├─ sidebarService.ts
│  │  │  ├─ socketService.ts
│  │  │  ├─ statisticsService.ts
│  │  │  ├─ studentService.ts
│  │  │  ├─ subjectService.ts
│  │  │  ├─ subscriptionService.ts
│  │  │  ├─ superAdminService.ts
│  │  │  ├─ supportService.ts
│  │  │  ├─ syllabusService.ts
│  │  │  ├─ teacherService.ts
│  │  │  ├─ timetableService.ts
│  │  │  ├─ toastService.ts
│  │  │  ├─ todoService.ts
│  │  │  ├─ transportAssignmentService.ts
│  │  │  ├─ transportReportService.ts
│  │  │  ├─ transportService.ts
│  │  │  ├─ uploadService.ts
│  │  │  ├─ userCommunicationService.ts
│  │  │  ├─ userManagementService.ts
│  │  │  ├─ userProfileService.ts
│  │  │  └─ userService.ts
│  │  ├─ store/
│  │  │  └─ authStore.ts
│  │  ├─ styles/
│  │  │  ├─ admin-sidebar.css
│  │  │  ├─ FileUpload.css
│  │  │  ├─ global.css
│  │  │  ├─ protected-route.css
│  │  │  ├─ role-based-dashboard-router.css
│  │  │  ├─ role-based-dashboard.css
│  │  │  └─ sidebar.css
│  │  ├─ types/
│  │  │  └─ institution.ts
│  │  ├─ utils/
│  │  │  ├─ academicEngine.ts
│  │  │  ├─ auth.ts
│  │  │  ├─ chart-loader.css
│  │  │  ├─ chart-loader.ts
│  │  │  ├─ chartLoader.ts
│  │  │  ├─ conversationUtils.ts
│  │  │  ├─ dashboardNavigationTest.tsx
│  │  │  ├─ demoMode.ts
│  │  │  ├─ errorHandler.ts
│  │  │  ├─ excelExport.ts
│  │  │  ├─ exportUtils.ts
│  │  │  ├─ institutionUtils.ts
│  │  │  ├─ permissions.ts
│  │  │  └─ safeDataHandler.ts
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  └─ vite-env.d.ts
│  ├─ .env
│  ├─ .env.development
│  ├─ .env.example
│  ├─ .gitignore
│  ├─ clear_storage.js
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ tsconfig.tsbuildinfo
│  ├─ vite.config.js
│  └─ vite.config.ts
├─ .gitignore
├─ package-lock.json
├─ package.json
└─ PROJECT_STRUCTURE.md
