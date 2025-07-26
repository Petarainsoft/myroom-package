# MyRoom Backend Cleanup Script
# Removes unnecessary test, check, and backup files

Write-Host "🧹 Starting backend cleanup..." -ForegroundColor Green

# Test and check files to remove
$testFiles = @(
    "check-permissions.js",
    "check-resources.js", 
    "check-api-key.js",
    "migrate-add-resource-permissions.js",
    "upload-test-resources.js",
    "run-test-flow.cjs",
    "test-imports.cjs", 
    "test-full-asset-flow.cjs"
)

# Non-essential .md files to remove
$mdFiles = @(
    "CSP_TROUBLESHOOTING.md",
    "QUICK_START_GUIDE.md"
)

# Pattern-based files to remove
$patterns = @(
    "*test*.js", "*test*.cjs", "*test*.mjs",
    "*check*.js", "*check*.cjs", "*check*.mjs", 
    "*migrate*.js", "*migrate*.cjs", "*migrate*.mjs",
    "*upload*.js", "*upload*.cjs", "*upload*.mjs"
)

# Backup files
$backupPatterns = @(
    "*.backup", "*.bak", "*.orig", "*.tmp", "*.temp",
    "* - Copy.*"
)

# Directories to clean
$dirsToClean = @(
    "temp", "tmp", "test-output", "test-results",
    "tests/__temp__", "tests/fixtures/temp",
    ".jest-cache", "coverage"
)

# Remove specific test files
foreach ($file in $testFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ Removed: $file" -ForegroundColor Yellow
    }
}

# Remove non-essential .md files
foreach ($file in $mdFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "✅ Removed documentation: $file" -ForegroundColor Yellow
    }
}

# Remove pattern-based files
foreach ($pattern in $patterns) {
    Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_ -Force
        Write-Host "✅ Removed: $_" -ForegroundColor Yellow
    }
}

# Remove backup files
foreach ($pattern in $backupPatterns) {
    Get-ChildItem -Path . -Name $pattern -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item $_ -Force
        Write-Host "✅ Removed backup: $_" -ForegroundColor Yellow
    }
}

# Remove directories
foreach ($dir in $dirsToClean) {
    if (Test-Path $dir) {
        Remove-Item $dir -Recurse -Force
        Write-Host "✅ Removed directory: $dir" -ForegroundColor Yellow
    }
}

# Clean node_modules and dist
if (Test-Path "node_modules") {
    Write-Host "🗑️ Cleaning node_modules..." -ForegroundColor Yellow
    Remove-Item "node_modules" -Recurse -Force
}

if (Test-Path "dist") {
    Write-Host "🗑️ Cleaning dist..." -ForegroundColor Yellow
    Remove-Item "dist" -Recurse -Force
}

# Clean log files
if (Test-Path "logs") {
    Get-ChildItem -Path "logs" -Name "*.log" -ErrorAction SilentlyContinue | ForEach-Object {
        Remove-Item "logs/$_" -Force
        Write-Host "✅ Removed log: logs/$_" -ForegroundColor Yellow
    }
}

Write-Host "✨ Backend cleanup completed!" -ForegroundColor Green

