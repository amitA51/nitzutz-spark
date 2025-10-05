# Script to start Nitzutz-Spark project
# Run this with: .\start-project.ps1

Write-Host "🚀 Starting Nitzutz-Spark Project..." -ForegroundColor Cyan
Write-Host ""

# Get project root
$projectRoot = $PSScriptRoot

# Start Backend
Write-Host "📦 Starting Backend Server..." -ForegroundColor Yellow
$backendPath = Join-Path $projectRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '🔧 Backend Server' -ForegroundColor Green; npm run dev"

# Wait a bit for backend to start
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Start Frontend
Write-Host "🎨 Starting Frontend App..." -ForegroundColor Yellow
$frontendPath = Join-Path $projectRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '🎨 Frontend App' -ForegroundColor Green; npm run dev"

# Wait a bit
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Two PowerShell windows should have opened:" -ForegroundColor Cyan
Write-Host "   1️⃣  Backend (port 5000)" -ForegroundColor White
Write-Host "   2️⃣  Frontend (port 5173)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Once ready, open your browser to:" -ForegroundColor Cyan
Write-Host "   http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "🛑 To stop: Close both PowerShell windows or press Ctrl+C in each" -ForegroundColor Red
Write-Host ""

# Optional: Open browser automatically after delay
Start-Sleep -Seconds 8
Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "✨ Enjoy your project!" -ForegroundColor Green
