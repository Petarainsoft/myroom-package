import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './config';

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MyRoom Backend API',
      version: '1.0.0',
      description: 'API documentation for MyRoom Backend - 3D Resource Management Platform',
      contact: {
        name: 'MyRoom Team',
        email: 'support@myroom.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.PORT}`,
        description: 'Development server'
      },
      {
        url: 'https://api.myroom.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authenticated requests'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for public endpoints'
        }
      },
      schemas: {
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
                  description: 'Error code'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                },
                details: {
                  type: 'object',
                  description: 'Additional error details'
                }
              },
              required: ['code', 'message']
            }
          },
          required: ['success', 'error']
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            message: {
              type: 'string',
              description: 'Success message'
            }
          },
          required: ['success']
        },
        Developer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Developer ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Developer email'
            },
            name: {
              type: 'string',
              description: 'Developer name'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the developer account is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'email', 'name', 'isActive']
        },
        Project: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              description: 'Project name'
            },
            description: {
              type: 'string',
              description: 'Project description'
            },
            developerId: {
              type: 'string',
              format: 'uuid'
            },
            status: {
              type: 'string',
              enum: ['ACTIVE', 'INACTIVE', 'ARCHIVED']
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'name', 'developerId', 'status']
        },
        Resource: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            resourceId: {
              type: 'string',
              description: 'Public resource identifier'
            },
            name: {
              type: 'string',
              description: 'Resource name'
            },
            description: {
              type: 'string',
              description: 'Resource description'
            },
            type: {
              type: 'string',
              enum: ['MODEL', 'TEXTURE', 'ANIMATION', 'AUDIO', 'SCRIPT']
            },
            fileUrl: {
              type: 'string',
              format: 'uri',
              description: 'Resource file URL'
            },
            thumbnailUrl: {
              type: 'string',
              format: 'uri',
              description: 'Resource thumbnail URL'
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'resourceId', 'name', 'type']
        },
        Room: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            roomId: {
              type: 'string',
              description: 'Public room identifier'
            },
            name: {
              type: 'string',
              description: 'Room name'
            },
            description: {
              type: 'string',
              description: 'Room description'
            },
            fileUrl: {
              type: 'string',
              format: 'uri',
              description: 'Room file URL'
            },
            thumbnailUrl: {
              type: 'string',
              format: 'uri',
              description: 'Room thumbnail URL'
            },
            isActive: {
              type: 'boolean'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          },
          required: ['id', 'roomId', 'name']
        },
        ValidationError: {
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
                  example: 'Validation failed'
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: {
                        type: 'string',
                        description: 'Field that failed validation'
                      },
                      message: {
                        type: 'string',
                        description: 'Validation error message'
                      },
                      value: {
                        description: 'The value that failed validation'
                      }
                    },
                    required: ['field', 'message']
                  }
                }
              },
              required: ['code', 'message']
            }
          },
          required: ['success', 'error']
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Authentication',
        description: 'Authentication and authorization'
      },
      {
        name: 'Developer',
        description: 'Developer management'
      },
      {
        name: 'Projects',
        description: 'Project management'
      },
      {
        name: 'Resources',
        description: 'Resource management'
      },
      {
        name: 'Rooms',
        description: 'Room management'
      },
      {
        name: 'Admin',
        description: 'Administrative endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './dist/routes/*.js',
    './dist/controllers/*.js'
  ]
};

// Generate swagger specification
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;