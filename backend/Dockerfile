# Multi-stage build for production optimization

# Stage 1: Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies
RUN npm ci --ignore-scripts

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY src ./src/

# Build the application
RUN npm run build

# Stage 2: Production stage
FROM node:18-alpine AS production

ENV NODE_ENV=production

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S myroom -u 1001

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client \
    openssl \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Copy prisma schema and generated client from builder
COPY --from=builder /app/prisma ./prisma/
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma/

# Install production dependencies without running postinstall scripts
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist/

# Copy environment file
COPY .env* ./

# Copy scripts BEFORE changing ownership
COPY scripts/ ./scripts/

# Create logs directory and make scripts executable
RUN mkdir -p ./logs && \
    sed -i 's/\r$//' ./scripts/*.sh && \
    chmod +x ./scripts/*.sh

# Change ownership to app user
RUN chown -R myroom:nodejs /app

USER myroom

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--", "/app/scripts/docker-entrypoint.sh"]
CMD ["node", "-r", "module-alias/register", "dist/index.js"]

# Labels for metadata
LABEL maintainer="MyRoom Team" \
      version="1.0.0" \
      description="MyRoom Backend API - 3D Resource Management Platform" \
      org.opencontainers.image.source="https://github.com/myroom/backend" \
      org.opencontainers.image.documentation="https://github.com/myroom/backend/blob/main/README.md" \
      org.opencontainers.image.licenses="MIT"
