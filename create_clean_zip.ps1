# PowerShell script to create a clean zip package for SOCyberX
# This script excludes node_modules, .git, .firebase, .env files, and other build artifacts

$ErrorActionPreference = "Stop"

$zipName = "SOCyberX_clean.zip"
$tempDir = "SOCyberX_temp_for_zip"

Write-Host "Creating clean zip package: $zipName" -ForegroundColor Green

# Remove existing zip and temp directory if they exist
if (Test-Path $zipName) {
    Remove-Item $zipName -Force
    Write-Host "Removed existing $zipName" -ForegroundColor Yellow
}

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
    Write-Host "Removed existing temp directory" -ForegroundColor Yellow
}

# Create temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

Write-Host "Copying files to temp directory..." -ForegroundColor Cyan

# Copy public directory
Copy-Item -Path "public" -Destination "$tempDir\public" -Recurse -Force
Write-Host "  - public/" -ForegroundColor Gray

# Copy functions directory (excluding node_modules and .env)
New-Item -ItemType Directory -Path "$tempDir\functions" | Out-Null
Get-ChildItem -Path "functions" -Exclude "node_modules", ".env", ".env.*" | Copy-Item -Destination "$tempDir\functions" -Recurse -Force
Write-Host "  - functions/ (excluding node_modules and .env)" -ForegroundColor Gray

# Copy root files
Copy-Item -Path "firebase.json" -Destination "$tempDir\" -Force
Copy-Item -Path "firestore.rules" -Destination "$tempDir\" -Force
Copy-Item -Path "package.json" -Destination "$tempDir\" -Force
Write-Host "  - firebase.json, firestore.rules, package.json" -ForegroundColor Gray

# Copy firestore.indexes.json if it exists
if (Test-Path "firestore.indexes.json") {
    Copy-Item -Path "firestore.indexes.json" -Destination "$tempDir\" -Force
    Write-Host "  - firestore.indexes.json" -ForegroundColor Gray
}

# Copy package-lock.json if it exists
if (Test-Path "package-lock.json") {
    Copy-Item -Path "package-lock.json" -Destination "$tempDir\" -Force
    Write-Host "  - package-lock.json" -ForegroundColor Gray
}

# Copy functions/package-lock.json if it exists
if (Test-Path "functions\package-lock.json") {
    Copy-Item -Path "functions\package-lock.json" -Destination "$tempDir\functions\" -Force
    Write-Host "  - functions/package-lock.json" -ForegroundColor Gray
}

# Copy .gitignore files
Copy-Item -Path ".gitignore" -Destination "$tempDir\" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "functions\.gitignore" -Destination "$tempDir\functions\" -Force -ErrorAction SilentlyContinue
Write-Host "  - .gitignore files" -ForegroundColor Gray

# Copy env.template if it exists
if (Test-Path "functions\env.template") {
    Copy-Item -Path "functions\env.template" -Destination "$tempDir\functions\" -Force
    Write-Host "  - functions/env.template" -ForegroundColor Gray
}

# Create the zip file
Write-Host "`nCreating zip file..." -ForegroundColor Cyan
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName -Force

# Clean up temp directory
Remove-Item $tempDir -Recurse -Force

Write-Host "`n✓ Clean zip package created: $zipName" -ForegroundColor Green
Write-Host "`nThe zip includes:" -ForegroundColor Yellow
Write-Host "  - public/ directory" -ForegroundColor White
Write-Host "  - functions/ directory (without node_modules and .env)" -ForegroundColor White
Write-Host "  - firebase.json, firestore.rules" -ForegroundColor White
Write-Host "  - package.json files" -ForegroundColor White
Write-Host "  - .gitignore files" -ForegroundColor White
Write-Host "`nThe zip EXCLUDES:" -ForegroundColor Yellow
Write-Host "  - node_modules/ directories" -ForegroundColor White
Write-Host "  - .git/ directory" -ForegroundColor White
Write-Host "  - .firebase/ directory" -ForegroundColor White
Write-Host "  - .env files" -ForegroundColor White
Write-Host "  - Log files" -ForegroundColor White

