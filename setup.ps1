# Locall Project - Quick Setup Script for Windows
# Run this script in PowerShell to set up the development environment

Write-Host "🚀 Locall Project - Quick Setup" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if Node.js is installed
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if npm is available
Write-Host "`n📦 Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm is installed: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm is not available. Please ensure Node.js is properly installed." -ForegroundColor Red
    exit 1
}

# Install dependencies
Write-Host "`n📥 Installing project dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray

try {
    npm install
    Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies. Check your internet connection and try again." -ForegroundColor Red
    Write-Host "You can run 'npm install' manually." -ForegroundColor Gray
}

# Check for environment file
Write-Host "`n🔐 Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ Environment file (.env.local) exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  Environment file (.env.local) not found" -ForegroundColor Yellow
    if (Test-Path ".env.example.detailed") {
        Write-Host "📋 Creating .env.local from template..." -ForegroundColor Gray
        Copy-Item ".env.example.detailed" ".env.local"
        Write-Host "✅ Created .env.local - Please configure your environment variables" -ForegroundColor Green
        Write-Host "📝 Edit .env.local and add your API keys and configuration" -ForegroundColor Yellow
    }
}

# Check TypeScript configuration
Write-Host "`n🔧 Checking TypeScript configuration..." -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    Write-Host "✅ TypeScript configuration exists" -ForegroundColor Green
} else {
    Write-Host "❌ TypeScript configuration missing" -ForegroundColor Red
}

# Test project status
Write-Host "`n🧪 Running project health check..." -ForegroundColor Yellow
if (Test-Path "test-project-status.js") {
    try {
        node test-project-status.js
        Write-Host "✅ Project health check completed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Health check had issues - check the output above" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Health check script not found" -ForegroundColor Yellow
}

# Development server instructions
Write-Host "`n🎯 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "===============" -ForegroundColor Cyan
Write-Host "1. Configure .env.local with your API keys" -ForegroundColor White
Write-Host "2. Set up your Supabase database" -ForegroundColor White
Write-Host "3. Configure Vonage, Stripe, and other services" -ForegroundColor White
Write-Host "4. Run: npm run dev" -ForegroundColor White
Write-Host "5. Open: http://localhost:3000" -ForegroundColor White

Write-Host "`n📚 DOCUMENTATION:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host "• DEVELOPMENT_ROADMAP.md - Complete development plan" -ForegroundColor White
Write-Host "• IMPLEMENTATION_SUMMARY.md - Features overview" -ForegroundColor White
Write-Host "• .env.example.detailed - Environment configuration guide" -ForegroundColor White

Write-Host "`n🔧 USEFUL COMMANDS:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "npm run dev          # Start development server" -ForegroundColor White
Write-Host "npm run build        # Build for production" -ForegroundColor White
Write-Host "npm run lint         # Run linting" -ForegroundColor White
Write-Host "node test-project-status.js # Run health check" -ForegroundColor White

Write-Host "`n🎉 Setup completed! Happy coding!" -ForegroundColor Green

# Optional: Open project in VS Code
$openInVscode = Read-Host "`nWould you like to open the project in VS Code? (y/n)"
if ($openInVscode -eq "y" -or $openInVscode -eq "Y") {
    try {
        code .
        Write-Host "✅ Opened project in VS Code" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  VS Code not found in PATH. Please open the project manually." -ForegroundColor Yellow
    }
}
