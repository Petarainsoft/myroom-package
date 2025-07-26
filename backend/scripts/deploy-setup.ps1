# MyRoom Backend Deployment Setup Script for Windows
# This script sets up the database and creates a super admin account

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting MyRoom Backend Deployment Setup..." -ForegroundColor Green

# Function to check if a command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Check if Docker is available
if (Test-Command "docker") {
    Write-Host "✅ Docker is available" -ForegroundColor Green
} else {
    Write-Host "❌ Docker is not installed. Please install Docker first." -ForegroundColor Red
    exit 1
}

# Check if Node.js is available
if (Test-Command "node") {
    Write-Host "✅ Node.js is available" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
if (Test-Command "npm") {
    Write-Host "✅ npm is available" -ForegroundColor Green
} else {
    Write-Host "❌ npm is not installed. Please install npm first." -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    if (Test-Path "scripts/environment.template") {
        Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
        Copy-Item "scripts/environment.template" ".env"
        Write-Host "⚠️  Please review and update .env file with your actual credentials!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Environment template not found. Please create .env file manually." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "✅ Dependencies already installed" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate

# Deploy database migrations
Write-Host "🗄️ Deploying database migrations..." -ForegroundColor Yellow
npm run db:deploy

# Run database seeding (creates admin + sample data)
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
npm run db:seed

Write-Host ""
Write-Host "🎉 Deployment setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Default Super Admin Credentials:" -ForegroundColor Cyan
Write-Host "   Email: admin@myroom.com" -ForegroundColor White
Write-Host "   Password: Admin123!" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Please change the default password after first login!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 You can now start the application with:" -ForegroundColor Cyan
Write-Host "   docker-compose up -d" -ForegroundColor White
Write-Host ""
Write-Host "📊 Health check endpoint: http://localhost:3000/health" -ForegroundColor Cyan
Write-Host "📖 API documentation: http://localhost:3000/docs" -ForegroundColor Cyan