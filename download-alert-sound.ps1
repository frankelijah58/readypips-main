# Quick Sound Download Script

# This script downloads a free notification sound from Pixabay
# Run this in PowerShell from your project root

Write-Host "Downloading notification sound..." -ForegroundColor Cyan

# Create sounds directory if it doesn't exist
$soundsDir = "public\sounds"
if (!(Test-Path $soundsDir)) {
    New-Item -ItemType Directory -Path $soundsDir -Force | Out-Null
    Write-Host "Created $soundsDir directory" -ForegroundColor Green
}

# Download a free notification sound (from Pixabay - royalty free)
$soundUrl = "https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3"
$outputPath = "$soundsDir\alert.mp3"

try {
    Invoke-WebRequest -Uri $soundUrl -OutFile $outputPath -UseBasicParsing
    Write-Host "✅ Successfully downloaded alert.mp3" -ForegroundColor Green
    Write-Host "Location: $outputPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "You can test it by opening:" -ForegroundColor Yellow
    Write-Host "  $outputPath" -ForegroundColor White
} catch {
    Write-Host "❌ Error downloading sound file" -ForegroundColor Red
    Write-Host "Please download manually from:" -ForegroundColor Yellow
    Write-Host "  https://pixabay.com/sound-effects/search/notification/" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Then save as: $outputPath" -ForegroundColor White
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Update .env with your Hostinger email password" -ForegroundColor White
Write-Host "2. Run: npm run dev" -ForegroundColor White
Write-Host "3. Visit: http://localhost:3000/chart" -ForegroundColor White
