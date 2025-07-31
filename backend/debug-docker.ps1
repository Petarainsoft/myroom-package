Write-Host "🔍 Debugging Docker Compose..." -ForegroundColor Green

# Check Docker and Docker Compose
Write-Host "📋 Checking Docker installation..." -ForegroundColor Yellow
docker --version
docker-compose --version

# Create logs directory if not exists
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
    Write-Host "✅ Created logs directory" -ForegroundColor Green
}

# Validate docker-compose.yml
Write-Host "📋 Validating docker-compose.yml..." -ForegroundColor Yellow
docker-compose config

# Check for port conflicts
Write-Host "📋 Checking port usage..." -ForegroundColor Yellow
netstat -an | findstr ":3579"
netstat -an | findstr ":5432"
netstat -an | findstr ":6379"

# Clean up previous containers
Write-Host "🧹 Cleaning up previous containers..." -ForegroundColor Yellow
docker-compose down -v
docker system prune -f

# Build with verbose output
Write-Host "🔨 Building with verbose output..." -ForegroundColor Yellow
docker-compose build --no-cache

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Yellow
docker-compose up -d

# Wait a bit for containers to start
Start-Sleep -Seconds 5

# Check container status
Write-Host "📊 Container status:" -ForegroundColor Yellow
docker-compose ps

# Check logs
Write-Host "📝 Recent logs:" -ForegroundColor Yellow
docker-compose logs --tail=50

# Check API health
Write-Host "🏥 Checking API health..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3579/health" -TimeoutSec 5
    Write-Host "✅ API is healthy: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ API health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📝 API container logs:" -ForegroundColor Yellow
    docker-compose logs api
}
