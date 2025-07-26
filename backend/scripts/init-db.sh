#!/bin/sh
# MyRoom Backend Database Initialization Script
# This script initializes the database and creates tables when the container starts

set -e

echo "🚀 Starting MyRoom Backend Database Initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 15

# Check if PostgreSQL is actually ready
echo "🔍 Checking PostgreSQL connection..."
until PGPASSWORD=db123456 psql -h postgres -U anh -d myroom_db -c "SELECT 1;" > /dev/null 2>&1; do
  echo "⏳ PostgreSQL is not ready yet, waiting..."
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Deploy database schema using Prisma
echo "🗄️ Deploying database schema..."
# Clean existing avatar_categories to avoid duplicate path errors
echo "🧹 Cleaning existing avatar_categories table..."
PGPASSWORD=db123456 psql -h postgres -U anh -d myroom_db -c 'DELETE FROM "avatar_categories";' || true
npx prisma db push --accept-data-loss

# Run complete database initialization script
echo "🌱 Initializing complete database with sample data..."
PGPASSWORD=db123456 psql -h postgres -U anh -d myroom_db -f /app/scripts/init-complete-db.sql

echo "🎉 Database initialization completed successfully!"