# MyRoom Backend API

A comprehensive 3D room visualization platform backend built with Node.js, TypeScript, Express, and Prisma.

## 🚀 Features

- **RESTful API** with comprehensive endpoints for 3D resource management
- **Multi-tenant Architecture** with developer isolation and API key authentication
- **Advanced Security** with JWT authentication, rate limiting, and input validation
- **File Management** with AWS S3 integration and automatic thumbnail generation
- **Real-time Caching** with Redis for optimal performance
- **Database Management** with Prisma ORM and PostgreSQL
- **Comprehensive Logging** with Winston and request tracking
- **Health Monitoring** with detailed system health checks
- **Type Safety** with TypeScript and Zod validation
- **Production Ready** with Docker support and graceful shutdown

## 🏗️ Architecture

```
├── src/
│   ├── app.ts              # Express application setup
│   ├── index.ts            # Application entry point
│   ├── config/             # Configuration management
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts         # Authentication middleware
│   │   ├── errorHandler.ts # Error handling
│   │   └── requestLogger.ts# Request logging
│   ├── routes/             # API route definitions
│   │   ├── admin.ts        # Admin management
│   │   ├── developer.ts    # Developer operations
│   │   ├── resource.ts     # 3D resource management
│   │   ├── manifest.ts     # Scene manifest handling
│   │   └── health.ts       # Health checks
│   ├── services/           # Business logic services
│   │   ├── DatabaseService.ts # Database operations
│   │   ├── RedisService.ts    # Caching service
│   │   └── S3Service.ts       # File storage
│   ├── schemas/            # Zod validation schemas
│   └── utils/              # Utility functions
│       ├── ApiError.ts     # Custom error handling
│       └── logger.ts       # Logging configuration
```

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3+
- **Framework**: Express.js 4.18+
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis 6+
- **Storage**: AWS S3
- **Validation**: Zod
- **Authentication**: JWT + API Keys
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- PostgreSQL 13+ database
- Redis 6+ server
- AWS S3 bucket (for file storage)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd myroom-backend
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/myroom_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_CLOUDFRONT_DOMAIN="your-cloudfront-domain"

# Security
CORS_ORIGIN="http://localhost:3000,http://localhost:5173"
CORS_CREDENTIALS=true
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
UPLOAD_MAX_FILE_SIZE="50mb"
UPLOAD_ALLOWED_TYPES="image/jpeg,image/png,image/webp,model/gltf-binary,application/octet-stream"

# Features
FEATURE_RATE_LIMITING=true
FEATURE_REQUEST_LOGGING=true
FEATURE_SWAGGER=true
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Authentication

The API supports two authentication methods:

#### 1. JWT Authentication (Admin)
```bash
# Login to get JWT token
POST /api/admin/auth/login
{
  "email": "admin@example.com",
  "password": "password"
}

# Use token in subsequent requests
Authorization: Bearer <jwt-token>
```

#### 2. API Key Authentication (Developer)
```bash
# Include API key in headers
X-API-Key: <developer-api-key>
```

### Public API Endpoints

Some endpoints are public and do not require authentication. For a complete list, see [PUBLIC_API.md](./PUBLIC_API.md).

Public endpoints include:
- Health check endpoints (`/api/health/*`)
- Documentation endpoints (`/api/docs`, `/api/postman`)
- Admin login (`/api/admin/auth/login`)
- Developer registration (`/api/developer/register`)


### Core Endpoints

#### Admin Management
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/logout` - Admin logout
- `GET /api/admin/profile` - Get admin profile
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - List all admins
- `POST /api/admin/users` - Create new admin

#### Developer Management
- `POST /api/developer/register` - Register new developer
- `POST /api/developer/verify-email` - Verify email address
- `GET /api/developer/profile` - Get developer profile
- `PUT /api/developer/profile` - Update developer profile
- `POST /api/developer/change-password` - Change password

#### Project Management
- `GET /api/developer/projects` - List developer projects
- `POST /api/developer/projects` - Create new project
- `GET /api/developer/projects/:id` - Get project details
- `PUT /api/developer/projects/:id` - Update project
- `DELETE /api/developer/projects/:id` - Delete project

#### Resource Management
- `GET /api/resource/categories` - List resource categories
- `GET /api/resource/categories/:id/resources` - Get resources in category
- `GET /api/resource/:id` - Get resource details
- `GET /api/resource/:id/download` - Download resource file
- `POST /api/resource/upload` - Upload new resource
- `PUT /api/resource/:id` - Update resource metadata
- `DELETE /api/resource/:id` - Delete resource
- `GET /api/resource/search` - Search resources

#### Manifest Management
- `GET /api/manifest/project/:projectId` - List project manifests
- `GET /api/manifest/:id` - Get manifest details
- `GET /api/manifest/:id/download` - Download manifest file
- `POST /api/manifest/upload` - Upload new manifest
- `PUT /api/manifest/:id` - Update manifest
- `DELETE /api/manifest/:id` - Delete manifest
- `GET /api/manifest/:id/content` - Get manifest JSON content
- `GET /api/manifest/project/:projectId/latest` - Get latest manifest

#### Health & Monitoring
- `GET /health` - Basic health check
- `GET /api/health/detailed` - Detailed health status
- `GET /api/health/database` - Database health
- `GET /api/health/redis` - Redis health
- `GET /api/health/s3` - S3 health
- `GET /api/health/stats` - System statistics

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run start:prod   # Start with production environment

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run database migrations
npm run db:deploy    # Deploy migrations to production
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier

# Testing
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage

# Utilities
npm run clean        # Clean build directory
```

### Code Style

This project uses ESLint and Prettier for code formatting and quality:

- **ESLint**: Enforces code quality rules and TypeScript best practices
- **Prettier**: Handles code formatting automatically
- **Husky**: Git hooks for pre-commit linting (if configured)

### Database Schema

The database schema is managed with Prisma. Key entities include:

- **Admin**: System administrators
- **Developer**: API consumers with projects
- **Project**: Developer's 3D visualization projects
- **ApiKey**: Authentication keys for developers
- **ResourceCategory**: Categories for 3D resources
- **Resource**: 3D models, textures, and assets
- **DeveloperResourcePermission**: Access control for resources
- **Manifest**: 3D scene configurations
- **Webhook**: Event notification endpoints

## 🚀 Production Deployment

### Environment Variables

Ensure all production environment variables are properly set:

```bash
NODE_ENV=production
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
JWT_SECRET="strong-production-secret"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
```

### Build and Deploy

```bash
# Build the application
npm run build

# Deploy database migrations
npm run db:deploy

# Start production server
npm run start:prod
```

### Docker Deployment

```dockerfile
# Example Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### Health Checks

The application provides comprehensive health checks:

- **Basic**: `GET /health` - Simple alive check
- **Detailed**: `GET /api/health/detailed` - Full system status
- **Individual Services**: Database, Redis, S3 health endpoints

### Monitoring

- **Logging**: Structured JSON logs with Winston
- **Metrics**: Request timing, error rates, system stats
- **Health Endpoints**: For load balancer health checks
- **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT

## 🔒 Security

### Authentication & Authorization

- **JWT Tokens**: For admin authentication with refresh token support
- **API Keys**: For developer authentication with scope-based permissions
- **Role-based Access**: Different permission levels for admins
- **Scope-based Access**: Fine-grained resource permissions for developers

### Security Measures

- **Rate Limiting**: Configurable request rate limits
- **Input Validation**: Comprehensive Zod schema validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **XSS Protection**: Helmet.js security headers
- **CORS Configuration**: Configurable cross-origin policies
- **File Upload Security**: Type validation and size limits

### Best Practices

- Environment variables for sensitive configuration
- Secure password hashing with bcrypt
- JWT token blacklisting on logout
- Request logging for audit trails
- Error handling without information leakage

## 🧪 Testing

### Test Structure

```bash
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.ts
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run linting and tests: `npm run lint && npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Use meaningful commit messages
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the [API Documentation](docs/)
- Review the [Backend Design](../docs/BACKEND_DESIGN.md)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed list of changes and version history.

---

**MyRoom Backend API** - Building the future of 3D room visualization 🏠✨