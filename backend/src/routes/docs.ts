import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/config/swagger';
import { config } from '@/config/config';
import { asyncHandler } from '@/middleware/errorHandler';
import { apiLogger } from '@/utils/logger';
// Documentation endpoints should be public

const router = Router();

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: API Documentation
 *     description: Returns the interactive API documentation
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Swagger UI page
 */
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * /api/postman:
 *   get:
 *     summary: Get Postman Collection
 *     description: Returns a Postman Collection v2.1 format of the API for import into Postman
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: Postman Collection JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/postman', asyncHandler(async (req, res) => {
  // Convert Swagger to Postman Collection format
  const postmanCollection: {
    info: {
      name: string;
      description: string;
      schema: string;
      version: string;
    };
    item: any[];
    variable?: any[];
    auth?: any;
    event?: any[];
  } = {
    info: {
      name: 'MYR Backend API',
      description: `
        Comprehensive API collection for MYR Backend system.
        
        ## Setup Instructions:
        1. Import this collection into Postman
        2. Set up environment variables (baseUrl, authToken, apiKey)
        3. Run the authentication requests first to get tokens
        4. Use the tokens in subsequent requests
        
        ## Environment Variables:
        - baseUrl: API base URL (e.g., http://localhost:3000)
        - authToken: JWT token from login
        - apiKey: API key for certain endpoints
      `,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      version: '2.0.0'
    },
    item: [],
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{authToken}}',
          type: 'string'
        }
      ]
    }
  };

    // Convert paths to Postman format
    const swaggerSpecTyped = swaggerSpec as { paths?: Record<string, any> };
    if (swaggerSpecTyped.paths) {
      // Group by tag
      const tagGroups: Record<string, any[]> = {};

      // Process each path
      Object.keys(swaggerSpecTyped.paths).forEach(path => {
        const pathData = swaggerSpecTyped.paths![path];
        
        // Process each method (GET, POST, etc)
        Object.keys(pathData).forEach(method => {
          const operation = pathData[method];
          const tags = operation.tags || ['default'];
          
          // Create request item
          const requestItem: {
            name: string;
            request: {
              method: string;
              header: { key: string; value: string }[];
              url: {
                raw: string;
                host: string[];
                path: string[];
                variable?: any[];
                query?: any[];
              };
              description: string;
              body?: any;
            };
            response: any[];
          } = {
            name: operation.summary || path,
            request: {
              method: method.toUpperCase(),
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              url: {
                raw: `{{baseUrl}}${path}`,
                host: ['{{baseUrl}}'],
                path: path.split('/').filter(p => p)
              },
              description: operation.description || ''
            },
            response: []
          };
          
          // Add parameters if any
          if (operation.parameters) {
            requestItem.request.url.variable = operation.parameters
              .filter((param: any) => param.in === 'path')
              .map((param: any) => ({
                key: param.name,
                value: '',
                description: param.description
              }));
              
            // Add query parameters
            const queryParams = operation.parameters.filter((param: any) => param.in === 'query');
            if (queryParams.length > 0) {
              requestItem.request.url.query = queryParams.map((param: any) => ({
                key: param.name,
                value: '',
                description: param.description,
                disabled: !param.required
              }));
            }
          }
          
          // Add request body if present
          if (operation.requestBody) {
            const contentType = operation.requestBody.content['application/json'];
            if (contentType && contentType.schema) {
              requestItem.request.body = {
                mode: 'raw',
                raw: JSON.stringify(generateSampleFromSchema(contentType.schema), null, 2),
                options: {
                  raw: {
                    language: 'json'
                  }
                }
              };
            }
          }
          
          // Add to tag groups
          tags.forEach((tag: string) => {
            if (!tagGroups[tag]) {
              tagGroups[tag] = [];
            }
            tagGroups[tag].push(requestItem);
          });
        });
      });
      
      // Convert tag groups to Postman folders
      postmanCollection.item = Object.keys(tagGroups).map((tag: string) => ({
        name: tag,
        item: tagGroups[tag]
      }));
    }
    
    // Add environment variables
    postmanCollection.variable = [
      {
        key: 'baseUrl',
        value: config.NODE_ENV === 'production' 
          ? 'https://api.myr.com' 
          : `http://localhost:${config.PORT}`,
        type: 'string',
        description: 'API base URL'
      },
      {
        key: 'authToken',
        value: '',
        type: 'string',
        description: 'JWT authentication token (get from login endpoint)'
      },
      {
        key: 'apiKey',
        value: '',
        type: 'string',
        description: 'API key for certain endpoints'
      },
      {
        key: 'developerId',
        value: '',
        type: 'string',
        description: 'Developer ID for testing'
      },
      {
        key: 'projectId',
        value: '',
        type: 'string',
        description: 'Project ID for testing'
      }
    ];
    
    // Add collection-level events for automatic token management
    postmanCollection.event = [
      {
        listen: 'prerequest',
        script: {
          type: 'text/javascript',
          exec: [
            '// Auto-refresh token if needed',
            'const authToken = pm.environment.get("authToken");',
            'if (!authToken) {',
            '    console.log("No auth token found. Please login first.");',
            '}'
          ]
        }
      },
      {
        listen: 'test',
        script: {
          type: 'text/javascript',
          exec: [
            '// Auto-save tokens from login responses',
            'if (pm.response.code === 200 && pm.request.url.path.includes("login")) {',
            '    const response = pm.response.json();',
            '    if (response.data && response.data.token) {',
            '        pm.environment.set("authToken", response.data.token);',
            '        console.log("Auth token saved automatically");',
            '    }',
            '}'
          ]
        }
      }
    ];
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="MYR-Backend-API.postman_collection.json"');
    res.json(postmanCollection);
    
    apiLogger.info('Postman collection generated and sent', {
      endpoint: '/api/postman',
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
}));

/**
 * Helper function to generate sample data from schema
 */
function generateSampleFromSchema(schema: any): any {
  if (!schema) return {};
  
  // Handle references
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/components/schemas/', '');
    const swaggerSpecWithComponents = swaggerSpec as { components?: { schemas?: Record<string, any> } };
    if (swaggerSpecWithComponents.components && swaggerSpecWithComponents.components.schemas && swaggerSpecWithComponents.components.schemas[refPath]) {
      return generateSampleFromSchema(swaggerSpecWithComponents.components.schemas[refPath]);
    }
    return {};
  }
  
  // Handle different types
  switch (schema.type) {
    case 'object':
      const result: Record<string, any> = {};
      if (schema.properties) {
        Object.keys(schema.properties).forEach(prop => {
          result[prop] = generateSampleFromSchema(schema.properties[prop]);
        });
      }
      return result;
      
    case 'array':
      return schema.items ? [generateSampleFromSchema(schema.items)] : [];
      
    case 'string':
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'date-time') return new Date().toISOString();
      if (schema.format === 'date') return new Date().toISOString().split('T')[0];
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
      return 'string';
      
    case 'number':
    case 'integer':
      return 0;
      
    case 'boolean':
      return false;
      
    default:
      return {};
  }
}

export default router;