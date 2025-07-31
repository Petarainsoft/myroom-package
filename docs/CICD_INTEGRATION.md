# MyRoom CI/CD Integration Guide

## Tổng quan

Tài liệu này hướng dẫn tích hợp MyRoom vào quy trình CI/CD của dự án, bao gồm automated testing, deployment, và monitoring.

## 1. CI/CD Pipeline Architecture

```mermaid
flowchart LR
    subgraph Development
        A[Code Commit] --> B[Unit Tests]
        B --> C[Integration Tests]
        C --> D[Build]
    end
    
    subgraph Staging
        D --> E[Deploy to Staging]
        E --> F[E2E Tests]
        F --> G[Performance Tests]
    end
    
    subgraph Production
        G --> H[Deploy to Production]
        H --> I[Health Checks]
        I --> J[Monitoring]
    end
    
    subgraph MyRoom Integration
        K[Resource Validation]
        L[Manifest Testing]
        M[API Key Management]
        N[S3 Sync]
    end
    
    C --> K
    F --> L
    H --> M
    H --> N
```

## 2. GitHub Actions Workflow

### 2.1. Backend Services CI/CD

```yaml
# .github/workflows/backend-cicd.yml
name: MyRoom Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: myroom_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd backend
          npm ci
      
      - name: Run linting
        run: |
          cd backend
          npm run lint
      
      - name: Run unit tests
        run: |
          cd backend
          npm run test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/myroom_test
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: |
          cd backend
          npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/myroom_test
          REDIS_URL: redis://localhost:6379
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID_TEST }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY_TEST }}
          S3_BUCKET_TEST: ${{ secrets.S3_BUCKET_TEST }}
      
      - name: Build application
        run: |
          cd backend
          npm run build
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: backend/coverage/lcov.info

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Deploy to ECS Staging
        run: |
          # Update ECS service
          aws ecs update-service \
            --cluster myroom-staging \
            --service myroom-backend-staging \
            --force-new-deployment
      
      - name: Run E2E tests
        run: |
          cd e2e-tests
          npm ci
          npm run test:staging
        env:
          STAGING_API_URL: ${{ secrets.STAGING_API_URL }}
          TEST_API_KEY: ${{ secrets.TEST_API_KEY }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: us-east-1
      
      - name: Deploy to ECS Production
        run: |
          aws ecs update-service \
            --cluster myroom-production \
            --service myroom-backend-production \
            --force-new-deployment
      
      - name: Health check
        run: |
          curl -f ${{ secrets.PRODUCTION_API_URL }}/health || exit 1
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 2.2. Customer UI CI/CD

```yaml
# .github/workflows/frontend-cicd.yml
name: MyRoom Frontend CI/CD

on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      
      - name: Run linting
        run: |
          cd frontend
          npm run lint
      
      - name: Run type checking
        run: |
          cd frontend
          npm run type-check
      
      - name: Run unit tests
        run: |
          cd frontend
          npm run test:unit
      
      - name: Build application
        run: |
          cd frontend
          npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
      
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './frontend/lighthouserc.json'
          uploadArtifacts: true

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.STAGING_API_URL }}
      
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
          scope: ${{ secrets.VERCEL_ORG_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install and build
        run: |
          cd frontend
          npm ci
          npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.PRODUCTION_API_URL }}
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: frontend
          scope: ${{ secrets.VERCEL_ORG_ID }}
```

## 3. Docker Configuration

### 3.1. Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 myroom

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER myroom

EXPOSE 3579

ENV PORT 3579

CMD ["node", "dist/index.js"]
```

### 3.2. Docker Compose for Development

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: myroom_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
  
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3579:3579"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/myroom_dev
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3579"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3579
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend

volumes:
  postgres_data:
  redis_data:
```

## 4. Testing Strategy

### 4.1. Unit Tests

```javascript
// backend/tests/unit/api-key.test.js
const { APIKeyService } = require('../../src/services/api-key');
const { ProjectService } = require('../../src/services/project');

describe('APIKeyService', () => {
  let apiKeyService;
  let projectService;
  
  beforeEach(() => {
    projectService = new ProjectService();
    apiKeyService = new APIKeyService(projectService);
  });
  
  describe('generateAPIKey', () => {
    it('should generate unique API key for project', async () => {
      const projectId = 'test-project-id';
      const label = 'test-key';
      
      const apiKey = await apiKeyService.generateAPIKey(projectId, label);
      
      expect(apiKey).toHaveProperty('key');
      expect(apiKey).toHaveProperty('projectId', projectId);
      expect(apiKey).toHaveProperty('label', label);
      expect(apiKey.key).toMatch(/^pk_[a-zA-Z0-9]{32}$/);
    });
    
    it('should validate API key format', () => {
      const validKey = 'pk_1234567890abcdef1234567890abcdef';
      const invalidKey = 'invalid-key';
      
      expect(apiKeyService.validateKeyFormat(validKey)).toBe(true);
      expect(apiKeyService.validateKeyFormat(invalidKey)).toBe(false);
    });
  });
});
```

### 4.2. Integration Tests

```javascript
// backend/tests/integration/resource-upload.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDB, cleanupTestDB } = require('../helpers/database');

describe('Resource Upload Integration', () => {
  let authToken;
  let projectId;
  
  beforeAll(async () => {
    await setupTestDB();
    
    // Create test user and project
    const userResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
    
    authToken = userResponse.body.token;
    
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Test project for integration tests'
      });
    
    projectId = projectResponse.body.id;
  });
  
  afterAll(async () => {
    await cleanupTestDB();
  });
  
  it('should upload resource file to S3', async () => {
    const response = await request(app)
      .post(`/api/projects/${projectId}/resources`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', 'tests/fixtures/test-model.glb')
      .field('name', 'Test Model')
      .field('category', 'furniture');
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('s3Url');
    expect(response.body.name).toBe('Test Model');
  });
});
```

### 4.3. E2E Tests

```javascript
// e2e-tests/specs/customer-workflow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Customer Workflow', () => {
  test('complete customer onboarding flow', async ({ page }) => {
    // Register new customer
    await page.goto('/register');
    await page.fill('[data-testid="email"]', 'customer@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="name"]', 'Test Customer');
    await page.click('[data-testid="register-button"]');
    
    // Verify dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome back, Test Customer');
    
    // Create new project
    await page.click('[data-testid="new-project-button"]');
    await page.fill('[data-testid="project-name"]', 'My First Project');
    await page.fill('[data-testid="project-description"]', 'Test project description');
    await page.click('[data-testid="create-project-button"]');
    
    // Generate API key
    await page.click('[data-testid="generate-api-key"]');
    await page.fill('[data-testid="api-key-label"]', 'Production Key');
    await page.click('[data-testid="generate-button"]');
    
    // Verify API key is displayed
    await expect(page.locator('[data-testid="api-key-value"]')).toBeVisible();
    
    // Upload resource
    await page.click('[data-testid="upload-resource"]');
    await page.setInputFiles('[data-testid="file-input"]', 'fixtures/test-model.glb');
    await page.fill('[data-testid="resource-name"]', 'Test Chair');
    await page.selectOption('[data-testid="resource-category"]', 'furniture');
    await page.click('[data-testid="upload-button"]');
    
    // Verify resource is uploaded
    await expect(page.locator('[data-testid="resource-list"]')).toContainText('Test Chair');
  });
});
```

## 5. Monitoring và Alerting

### 5.1. Health Checks

```javascript
// backend/src/routes/health.js
const express = require('express');
const router = express.Router();
const { checkDatabaseConnection } = require('../utils/database');
const { checkRedisConnection } = require('../utils/redis');
const { checkS3Connection } = require('../utils/s3');

router.get('/health', async (req, res) => {
  const checks = {
    database: false,
    redis: false,
    s3: false,
    timestamp: new Date().toISOString()
  };
  
  try {
    checks.database = await checkDatabaseConnection();
    checks.redis = await checkRedisConnection();
    checks.s3 = await checkS3Connection();
    
    const allHealthy = Object.values(checks).every(check => 
      typeof check === 'boolean' ? check : true
    );
    
    res.status(allHealthy ? 200 : 503).json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      checks
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      checks,
      error: error.message
    });
  }
});

module.exports = router;
```

### 5.2. CloudWatch Alarms

```yaml
# infrastructure/cloudwatch-alarms.yml
Resources:
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: MyRoom-HighErrorRate
      AlarmDescription: High error rate detected
      MetricName: 4XXError
      Namespace: AWS/ApplicationELB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopicArn
  
  HighLatencyAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: MyRoom-HighLatency
      AlarmDescription: High response latency detected
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 2.0
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopicArn
```

## 6. Security và Compliance

### 6.1. Security Scanning

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  push:
    branches: [main]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Run npm audit
        run: |
          cd backend
          npm audit --audit-level high
          cd ../frontend
          npm audit --audit-level high
```

### 6.2. Environment Variables Management

```bash
# scripts/setup-secrets.sh
#!/bin/bash

# Setup GitHub Secrets for CI/CD
gh secret set AWS_ACCESS_KEY_ID --body "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY --body "$AWS_SECRET_ACCESS_KEY"
gh secret set DATABASE_URL --body "$DATABASE_URL"
gh secret set REDIS_URL --body "$REDIS_URL"
gh secret set JWT_SECRET --body "$JWT_SECRET"
gh secret set S3_BUCKET --body "$S3_BUCKET"
gh secret set VERCEL_TOKEN --body "$VERCEL_TOKEN"
gh secret set VERCEL_ORG_ID --body "$VERCEL_ORG_ID"
gh secret set VERCEL_PROJECT_ID --body "$VERCEL_PROJECT_ID"
gh secret set SLACK_WEBHOOK_URL --body "$SLACK_WEBHOOK_URL"

echo "All secrets have been set successfully!"
```

## 7. Performance Testing

### 7.1. Load Testing với Artillery

```yaml
# performance-tests/load-test.yml
config:
  target: 'https://api.myroom.dev'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100
  defaults:
    headers:
      x-api-key: '{{ $processEnvironment.TEST_API_KEY }}'

scenarios:
  - name: "Get manifests"
    weight: 40
    flow:
      - get:
          url: "/api/customer/projects/{{ projectId }}/manifests"
  
  - name: "Get resources"
    weight: 30
    flow:
      - get:
          url: "/api/customer/projects/{{ projectId }}/resources"
  
  - name: "Download manifest"
    weight: 20
    flow:
      - get:
          url: "/api/customer/manifests/{{ manifestId }}"
  
  - name: "Health check"
    weight: 10
    flow:
      - get:
          url: "/health"
```

## 8. Rollback Strategy

### 8.1. Automated Rollback

```bash
# scripts/rollback.sh
#!/bin/bash

ENVIRONMENT=$1
PREVIOUS_VERSION=$2

if [ -z "$ENVIRONMENT" ] || [ -z "$PREVIOUS_VERSION" ]; then
  echo "Usage: $0 <environment> <previous_version>"
  exit 1
fi

echo "Rolling back $ENVIRONMENT to version $PREVIOUS_VERSION..."

# Rollback ECS service
aws ecs update-service \
  --cluster myroom-$ENVIRONMENT \
  --service myroom-backend-$ENVIRONMENT \
  --task-definition myroom-backend:$PREVIOUS_VERSION

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster myroom-$ENVIRONMENT \
  --services myroom-backend-$ENVIRONMENT

# Verify health
HEALTH_URL="https://api-$ENVIRONMENT.myroom.com/health"
curl -f $HEALTH_URL || {
  echo "Health check failed after rollback!"
  exit 1
}

echo "Rollback completed successfully!"
```

Tài liệu này cung cấp framework hoàn chỉnh để tích hợp MyRoom vào quy trình CI/CD, đảm bảo chất lượng code, tự động hóa deployment, và monitoring hiệu quả.