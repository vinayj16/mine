# UltrakeySchool - Project Structure Documentation

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
