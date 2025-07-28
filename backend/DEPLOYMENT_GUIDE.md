# MyRoom Backend Deployment Guide

This guide provides instructions for deploying MyRoom Backend with automatic super admin creation.

## 🚀 Quick Start

### Option 1: Using Deployment Scripts (Recommended)

**For Linux/macOS:**
```bash
chmod +x scripts/deploy-setup.sh
./scripts/deploy-setup.sh
```

**For Windows (PowerShell):**
```powershell
.\scripts\deploy-setup.ps1
```

### Option 2: Manual Setup

1. **Setup environment variables:**
```bash
# Copy environment template
cp scripts/environment.template .env

# Edit .env file with your actual values
# At minimum, update DATABASE_URL, JWT secrets, and AWS credentials
```

2. **Install dependencies:**
```bash
npm install
```

3. **Generate Prisma client:**
```bash
npm run db:generate
```

4. **Deploy database migrations:**
```bash
npm run db:deploy
```

5. **Seed database (creates super admin):**
```bash
npm run db:seed
```

6. **Start the application:**
```bash
docker-compose up -d
```

## 🔑 Super Admin Creation Methods

### Method 1: Prisma Seed (Recommended)
```bash
npm run db:seed
```
This will create a super admin if none exists and sample categories.

### Method 2: Direct SQL Execution
Execute the SQL file directly against your PostgreSQL database:
```bash
psql -h localhost -U your_user -d your_database -f scripts/create-super-admin.sql
```

### Method 3: Node.js Script
```bash
node dist/scripts/create-admin.js
```

### Method 4: Environment Variables
Set custom admin credentials before running seed:
```bash
export DEFAULT_ADMIN_EMAIL="your-admin@company.com"
export DEFAULT_ADMIN_PASSWORD="YourSecurePassword123!"
export DEFAULT_ADMIN_NAME="Your Admin Name"
npm run db:seed
```

## 📋 Default Super Admin Credentials

- **Email:** `admin@petarainsoft.com`
- **Password:** `Admin123!`
- **Role:** `SUPER_ADMIN`
- **Status:** `ACTIVE`

⚠️ **IMPORTANT:** Change the default password after first login!

## 🗄️ Database Setup

### Prerequisites
- PostgreSQL database running
- Redis server running (optional, for caching)
- Environment variables configured

### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/myroom_db"

# Redis (optional)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# JWT
JWT_SECRET="your-super-secure-jwt-secret"
JWT_EXPIRES_IN="7d"

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket-name"

# Application
NODE_ENV="production"
PORT="3000"
CORS_ORIGIN="http://localhost:3000"

# Admin defaults (optional)
DEFAULT_ADMIN_EMAIL="admin@petarainsoft.com"
DEFAULT_ADMIN_PASSWORD="Admin123!"
DEFAULT_ADMIN_NAME="Super Administrator"
```

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
1. Ensure `docker-compose.yml` is configured
2. Run deployment script or manual setup
3. Start services:
```bash
docker-compose up -d
```

### Using Standalone Docker
```bash
# Build the image
docker build -t myroom-backend .

# Run the container
docker run -d \
  --name myroom-backend \
  -p 3000:3000 \
  --env-file .env \
  myroom-backend
```

## ☁️ Cloud Deployment

### AWS ECS/Fargate
1. Build and push Docker image to ECR
2. Create ECS task definition
3. Set environment variables in task definition
4. Run deployment script before starting tasks

### Railway/Render/Heroku
1. Connect repository
2. Set environment variables in platform
3. Add build command: `npm run build`
4. Add start command: `npm run start:prod`
5. Run seed command manually after first deploy

### DigitalOcean App Platform
1. Create app from repository
2. Configure environment variables
3. Set build command: `npm run build`
4. Set run command: `npm run start:prod`
5. Run database setup via console

## 🔍 Verification

After deployment, verify the setup:

1. **Health Check:**
```bash
curl http://your-domain:3000/health
```

2. **API Documentation:**
Open `http://your-domain:3000/docs` in your browser

3. **Admin Login:**
- URL: Admin app URL
- Email: `admin@petarainsoft.com`
- Password: `Admin123!`

## 🛠️ Troubleshooting

### Common Issues

**1. Database Connection Error**
- Verify `DATABASE_URL` is correct (use `localhost:5432` for local dev, `postgres:5432` for Docker)
- Ensure PostgreSQL is running (`docker-compose up -d` or standalone PostgreSQL)
- Check network connectivity
- Create `.env` file from template: `cp scripts/environment.template .env`

**2. Admin Not Created**
- Check database connection
- Run seed command manually: `npm run db:seed`
- Verify admin table exists: `\dt` in psql

**3. Authentication Issues**
- Verify `JWT_SECRET` is set
- Check admin credentials
- Ensure admin status is `ACTIVE`

### Manual Admin Creation
If automatic creation fails:

```sql
-- Connect to your database and run:
INSERT INTO "admins" (
  id,
  email,
  name,
  password_hash,
  role,
  status,
  created_at,
  updated_at
) VALUES (
  'admin_super_' || lower(replace(cast(gen_random_uuid() as text), '-', '')),
  'admin@petarainsoft.com',
  'Super Administrator',
  '$2a$12$NhZmqzbL6mt8fqY0phFr9eQ1ymUaixRCuom7K1zUpthIMk6W2rgCK',
  'SUPER_ADMIN',
  'ACTIVE',
  NOW(),
  NOW()
);
```

## 📦 Production Considerations

### Security
- Change default admin password immediately
- Use strong JWT secrets
- Enable HTTPS in production
- Configure proper CORS origins
- Set up rate limiting

### Performance
- Configure Redis for caching
- Set up database connection pooling
- Enable compression middleware
- Configure proper logging levels

### Monitoring
- Set up health checks
- Configure error tracking (Sentry)
- Monitor database performance
- Track API usage and errors

## 🔄 Updates and Maintenance

### Database Migrations
```bash
# For new deployments
npm run db:deploy

# For development
npm run db:migrate
```

### Backup and Recovery
- Regular database backups
- Test restore procedures
- Document recovery steps

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review application logs
3. Verify environment variables
4. Check database connectivity

For additional help, contact the development team. 