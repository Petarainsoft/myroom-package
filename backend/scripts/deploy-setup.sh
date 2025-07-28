#!/bin/bash
# MyRoom Backend Deployment Setup Script
# This script sets up the database and creates a super admin account

set -e

echo "🚀 Starting MyRoom Backend Deployment Setup..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if Docker is available
if command_exists docker; then
    echo "✅ Docker is available"
else
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Node.js is available
if command_exists node; then
    echo "✅ Node.js is available"
else
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if command_exists npm; then
    echo "✅ npm is available"
else
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f "scripts/environment.template" ]; then
        echo "📝 Creating .env file from template..."
        cp scripts/environment.template .env
        echo "⚠️  Please review and update .env file with your actual credentials!"
    else
        echo "❌ Environment template not found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npm run db:generate

# Deploy database migrations
echo "🗄️ Deploying database migrations..."
npm run db:deploy

# Run database seeding (creates admin + sample data)
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "🎉 Deployment setup completed successfully!"
echo ""
echo "📋 Default Super Admin Credentials:"
echo "   Email: admin@petarainsoft.com"
echo "   Password: Admin123!"
echo ""
echo "⚠️  IMPORTANT: Please change the default password after first login!"
echo ""
echo "🚀 You can now start the application with:"
echo "   docker-compose up -d"
echo ""
echo "📊 Health check endpoint: http://localhost:3000/health"
echo "📖 API documentation: http://localhost:3000/docs" 