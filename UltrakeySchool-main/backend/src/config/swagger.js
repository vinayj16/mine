/**
 * Swagger/OpenAPI Configuration
 * Provides comprehensive API documentation for all endpoints
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'EduSearch API',
      version: '1.0.0',
      description: `
## EduSearch Education Management System API

A comprehensive RESTful API for managing educational institutions with multi-tenant support.

### Features
- 🔐 **Authentication & Authorization** - JWT-based secure authentication
- 👥 **User Management** - Students, Teachers, Staff, and Admin management
- 📚 **Academic Management** - Classes, Subjects, Exams, and Results
- 📊 **Attendance Tracking** - Real-time attendance management
- 💰 **Fee Management** - Invoice generation and payment tracking
- 🚌 **Transport Management** - Vehicle and route management
- 📖 **Library System** - Book management and borrowing
- 🏠 **Hostel Management** - Room allocation and visitor logs
- 📧 **Communication** - Notifications, Emails, and Messaging
- 📈 **Analytics & Reports** - Comprehensive reporting system

### Authentication
Most endpoints require authentication using JWT Bearer token.

**How to authenticate:**
1. Login via \`POST /auth/login\` to get access token
2. Include token in Authorization header: \`Authorization: Bearer <token>\`
3. Token expires in 24 hours (configurable)

### Multi-Tenant Architecture
The API supports multiple institutions with data isolation:
- Each request is scoped to the authenticated user's institution
- Institution ID is automatically extracted from the JWT token
- Cross-institution data access is prevented

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 10 requests per 15 minutes per IP
- **Login**: 5 attempts per hour per IP
- **File Upload**: 20 requests per hour per user

### Response Format
All responses follow a consistent format:

**Success Response:**
\`\`\`json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "pagination": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

### Pagination
List endpoints support pagination with query parameters:
- \`page\` - Page number (default: 1)
- \`limit\` - Items per page (default: 10, max: 100)
- \`sortBy\` - Field to sort by
- \`sortOrder\` - Sort direction (asc/desc)

### Filtering & Search
Most list endpoints support:
- \`search\` - Full-text search across relevant fields
- \`status\` - Filter by status
- \`startDate\` / \`endDate\` - Date range filtering

### File Uploads
File upload endpoints accept \`multipart/form-data\`:
- Maximum file size varies by type (see Upload section)
- Supported formats: Images, Documents, Videos, Audio, Archives
- Files are validated for type, size, and security

### Error Codes
| Code | Description |
|------|-------------|
| \`VALIDATION_ERROR\` | Invalid input data |
| \`UNAUTHORIZED\` | Missing or invalid authentication |
| \`FORBIDDEN\` | Insufficient permissions |
| \`NOT_FOUND\` | Resource not found |
| \`CONFLICT\` | Resource already exists |
| \`RATE_LIMIT_EXCEEDED\` | Too many requests |
| \`INTERNAL_ERROR\` | Server error |

### Webhooks
Configure webhooks to receive real-time notifications:
- Student enrollment
- Fee payment
- Attendance marked
- Exam results published

### API Versioning
Current version: v1
- Version is included in URL: \`/api/v1/...\`
- Breaking changes will increment version number
- Old versions supported for 6 months after deprecation

### Support
- **Documentation**: https://docs.edusearch.com
- **Email**: support@edusearch.com
- **Status Page**: https://status.edusearch.com
      `,
      contact: {
        name: 'EduSearch Support',
        email: 'support@edusearch.com',
        url: 'https://edusearch.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      },
      termsOfService: 'https://edusearch.com/terms'
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development Server'
      },
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Local Development'
      },
      {
        url: 'https://staging-api.edusearch.com/api/v1',
        description: 'Staging Server'
      },
      {
        url: 'https://api.edusearch.com/api/v1',
        description: 'Production Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login endpoint. Format: Bearer <token>'
        },
        apiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API key for third-party integrations and webhooks'
        },
        refreshToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-refresh-token',
          description: 'Refresh token for obtaining new access tokens'
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query string',
          schema: {
            type: 'string'
          }
        },
        SortByParam: {
          name: 'sortBy',
          in: 'query',
          description: 'Field to sort by',
          schema: {
            type: 'string'
          }
        },
        SortOrderParam: {
          name: 'sortOrder',
          in: 'query',
          description: 'Sort order',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc'
          }
        },
        StatusParam: {
          name: 'status',
          in: 'query',
          description: 'Filter by status',
          schema: {
            type: 'string',
            enum: ['active', 'inactive', 'pending', 'completed', 'cancelled']
          }
        },
        IdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Resource ID',
          schema: {
            type: 'string'
          }
        }
      },
      schemas: {
        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data'
                },
                details: {
                  type: 'object',
                  additionalProperties: true
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation successful'
            },
            data: {
              type: 'object',
              additionalProperties: true
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              example: 1,
              description: 'Current page number'
            },
            limit: {
              type: 'integer',
              example: 10,
              description: 'Items per page'
            },
            total: {
              type: 'integer',
              example: 100,
              description: 'Total number of items'
            },
            totalPages: {
              type: 'integer',
              example: 10,
              description: 'Total number of pages'
            },
            hasNextPage: {
              type: 'boolean',
              example: true
            },
            hasPrevPage: {
              type: 'boolean',
              example: false
            }
          }
        },
        
        // User & Authentication Schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: '507f1f77bcf86cd799439011'
            },
            name: {
              type: 'string',
              example: 'John Doe'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com'
            },
            role: {
              type: 'string',
              enum: ['superadmin', 'institution_admin', 'admin', 'teacher', 'student', 'parent', 'staff'],
              example: 'teacher'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'suspended'],
              example: 'active'
            },
            avatar: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/avatar.jpg'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'admin@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              example: 'password123'
            }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User'
                },
                accessToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                refreshToken: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                expiresIn: {
                  type: 'integer',
                  example: 86400,
                  description: 'Token expiration time in seconds'
                }
              }
            }
          }
        },
        
        // File Upload Schemas
        UploadedFile: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              example: 'uploads/institution_123/document-1234567890.pdf'
            },
            url: {
              type: 'string',
              format: 'uri',
              example: 'https://example.com/uploads/document.pdf'
            },
            filename: {
              type: 'string',
              example: 'document-1234567890.pdf'
            },
            originalName: {
              type: 'string',
              example: 'my-document.pdf'
            },
            size: {
              type: 'integer',
              example: 1048576,
              description: 'File size in bytes'
            },
            mimetype: {
              type: 'string',
              example: 'application/pdf'
            },
            folder: {
              type: 'string',
              example: 'documents'
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        
        // Student Schema
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            admissionNumber: {
              type: 'string',
              example: 'STU2024001'
            },
            firstName: {
              type: 'string',
              example: 'John'
            },
            lastName: {
              type: 'string',
              example: 'Doe'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string',
              example: '+1234567890'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other']
            },
            class: {
              type: 'string'
            },
            section: {
              type: 'string'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'graduated', 'transferred']
            }
          }
        },
        
        // Teacher Schema
        Teacher: {
          type: 'object',
          properties: {
            id: {
              type: 'string'
            },
            employeeId: {
              type: 'string',
              example: 'EMP2024001'
            },
            firstName: {
              type: 'string'
            },
            lastName: {
              type: 'string'
            },
            email: {
              type: 'string',
              format: 'email'
            },
            phone: {
              type: 'string'
            },
            subjects: {
              type: 'array',
              items: {
                type: 'string'
              }
            },
            qualification: {
              type: 'string'
            },
            experience: {
              type: 'integer',
              description: 'Years of experience'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'on_leave']
            }
          }
        }
      },
      responses: {
        Success: {
          description: 'Successful operation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Success'
              }
            }
          }
        },
        Created: {
          description: 'Resource created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Success'
              }
            }
          }
        },
        NoContent: {
          description: 'Successful operation with no content'
        },
        BadRequest: {
          description: 'Bad Request - Invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid input data',
                  details: {
                    email: 'Invalid email format'
                  }
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing authentication token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Access token is required'
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions to access resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'You do not have permission to perform this action'
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found'
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        Conflict: {
          description: 'Conflict - Resource already exists',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'CONFLICT',
                  message: 'Resource already exists'
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation Error - Input data failed validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: {
                    email: 'Email is required',
                    password: 'Password must be at least 8 characters'
                  }
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        RateLimitExceeded: {
          description: 'Rate Limit Exceeded - Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.',
                  details: {
                    retryAfter: 900
                  }
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'An unexpected error occurred'
                },
                timestamp: '2024-01-15T10:30:00Z'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication, registration, and token management',
        externalDocs: {
          description: 'Authentication Guide',
          url: 'https://docs.edusearch.com/auth'
        }
      },
      {
        name: 'Users',
        description: 'User account management and profile operations'
      },
      {
        name: 'Students',
        description: 'Student enrollment, management, and academic records'
      },
      {
        name: 'Teachers',
        description: 'Teacher management, assignments, and schedules'
      },
      {
        name: 'Classes',
        description: 'Class and section management, timetables'
      },
      {
        name: 'Subjects',
        description: 'Subject and curriculum management'
      },
      {
        name: 'Attendance',
        description: 'Attendance tracking, marking, and reporting'
      },
      {
        name: 'Exams',
        description: 'Exam scheduling, result management, and grade cards'
      },
      {
        name: 'Fees',
        description: 'Fee structure, invoice generation, and payment tracking'
      },
      {
        name: 'Homework',
        description: 'Homework assignment and submission management'
      },
      {
        name: 'Transport',
        description: 'Vehicle, route, and driver management'
      },
      {
        name: 'Library',
        description: 'Book management, borrowing, and fine tracking'
      },
      {
        name: 'Hostel',
        description: 'Hostel room allocation and visitor management'
      },
      {
        name: 'HRM',
        description: 'Human Resource Management - Staff, payroll, leaves'
      },
      {
        name: 'Notifications',
        description: 'Push notifications, emails, and SMS'
      },
      {
        name: 'Events',
        description: 'School events and calendar management'
      },
      {
        name: 'Notices',
        description: 'Notice board and announcements'
      },
      {
        name: 'Upload',
        description: 'File upload and management operations'
      },
      {
        name: 'Reports',
        description: 'Analytics, reports, and data exports'
      },
      {
        name: 'Settings',
        description: 'System settings, configurations, and preferences'
      },
      {
        name: 'Institutions',
        description: 'Institution and school management (Super Admin)'
      },
      {
        name: 'Subscriptions',
        description: 'Subscription plans and billing'
      },
      {
        name: 'Support',
        description: 'Support tickets and help desk'
      },
      {
        name: 'Health',
        description: 'API health check and system status'
      }
    ]
  },
  apis: [
    './src/routes/*.js', 
    './src/controllers/*.js',
    './src/models/*.js'
  ]
};

export const specs = swaggerJsdoc(options);

export const swaggerOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { 
      display: none; 
    }
    .swagger-ui .info .title { 
      font-size: 2.5em; 
      color: #2c3e50;
      margin-bottom: 0.5em;
    }
    .swagger-ui .info .description { 
      font-size: 1.1em; 
      line-height: 1.6;
      color: #34495e;
    }
    .swagger-ui .info .description h2 {
      color: #2c3e50;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    .swagger-ui .info .description h3 {
      color: #34495e;
      margin-top: 1.2em;
      margin-bottom: 0.4em;
    }
    .swagger-ui .info .description code {
      background-color: #f8f9fa;
      padding: 2px 6px;
       : 3px;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.9em;
    }
    .swagger-ui .info .description pre {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
       : 4px;
      padding: 1em;
      overflow-x: auto;
    }
    .swagger-ui .info .description table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    .swagger-ui .info .description table th,
    .swagger-ui .info .description table td {
      border: 1px solid #dee2e6;
      padding: 0.75em;
      text-align: left;
    }
    .swagger-ui .info .description table th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .swagger-ui .opblock-tag {
      font-size: 1.3em;
      font-weight: 600;
      padding: 10px 20px;
      margin: 10px 0;
      border-left: 4px solid #3498db;
    }
    .swagger-ui .opblock {
      margin: 10px 0;
       : 4px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    .swagger-ui .opblock.opblock-get {
      border-color: #61affe;
      background: rgba(97,175,254,.1);
    }
    .swagger-ui .opblock.opblock-post {
      border-color: #49cc90;
      background: rgba(73,204,144,.1);
    }
    .swagger-ui .opblock.opblock-put {
      border-color: #fca130;
      background: rgba(252,161,48,.1);
    }
    .swagger-ui .opblock.opblock-delete {
      border-color: #f93e3e;
      background: rgba(249,62,62,.1);
    }
    .swagger-ui .btn.authorize {
      background-color: #3498db;
      border-color: #3498db;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #2980b9;
      border-color: #2980b9;
    }
    .swagger-ui .scheme-container {
      background-color: #f8f9fa;
      padding: 20px;
       : 4px;
      margin-bottom: 20px;
    }
  `,
  customSiteTitle: 'EduSearch API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
    requestSnippetsEnabled: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai'
    },
    defaultModelsExpandDepth: 1,
    defaultModelExpandDepth: 1,
    displayOperationId: false,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
};

// Custom middleware to add additional headers
export const setupSwagger = (app) => {
  // Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve);
  app.get('/api-docs', swaggerUi.setup(specs, swaggerOptions));
  
  // Serve OpenAPI JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
  
  // Serve OpenAPI YAML spec
  app.get('/api-docs.yaml', (req, res) => {
    res.setHeader('Content-Type', 'text/yaml');
    const yaml = require('js-yaml');
    res.send(yaml.dump(specs));
  });
  
  // API documentation redirect
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });
  
  console.log('📚 Swagger documentation available at:');
  console.log('   - UI: http://localhost:5000/api-docs');
  console.log('   - JSON: http://localhost:5000/api-docs.json');
  console.log('   - YAML: http://localhost:5000/api-docs.yaml');
};

export default swaggerUi;
