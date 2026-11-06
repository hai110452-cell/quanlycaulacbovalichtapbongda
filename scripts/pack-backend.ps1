# Script đóng gói Backend NestJS thành backend.zip phục vụ nộp bài / deploy
$ProgressPreference = 'SilentlyContinue'
$Root = "d:\Lập trình mã nguồn mở 2\QUẢN LÝ CÂU LẠC BỘ VÀ LỊCH TẬP BÓNG ĐÁ"
$backendDir = Join-Path $Root "backend"
$zipOutput = Join-Path $Root "backend.zip"

Write-Host "=========================================="
Write-Host "1. Build Backend NestJS sang thu muc dist/"
Write-Host "=========================================="
Push-Location $backendDir
npm run build
Pop-Location

Write-Host "`n=========================================="
Write-Host "2. Dong goi file backend.zip"
Write-Host "=========================================="

if (Test-Path -LiteralPath $zipOutput) {
    Remove-Item -LiteralPath $zipOutput -Force
}

$tempFolder = Join-Path $env:TEMP ("backend_pack_" + (Get-Random))
New-Item -ItemType Directory -Path $tempFolder | Out-Null

try {
    # Sao chep cac thu muc can thiet
    Copy-Item -LiteralPath (Join-Path $backendDir "dist") -Destination $tempFolder -Recurse
    Copy-Item -LiteralPath (Join-Path $backendDir "src") -Destination $tempFolder -Recurse
    Copy-Item -LiteralPath (Join-Path $backendDir "package.json") -Destination $tempFolder
    Copy-Item -LiteralPath (Join-Path $backendDir "package-lock.json") -Destination $tempFolder
    Copy-Item -LiteralPath (Join-Path $backendDir "tsconfig.json") -Destination $tempFolder
    Copy-Item -LiteralPath (Join-Path $backendDir "tsconfig.build.json") -Destination $tempFolder
    Copy-Item -LiteralPath (Join-Path $backendDir "nest-cli.json") -Destination $tempFolder
    Copy-Item -LiteralPath (Join-Path $backendDir "schema.sql") -Destination $tempFolder
    Copy-Item -LiteralPath (Join-Path $backendDir "seed.sql") -Destination $tempFolder
    
    if (Test-Path -LiteralPath (Join-Path $backendDir ".env")) {
        Copy-Item -LiteralPath (Join-Path $backendDir ".env") -Destination $tempFolder
    }
    if (Test-Path -LiteralPath (Join-Path $backendDir ".env.example")) {
        Copy-Item -LiteralPath (Join-Path $backendDir ".env.example") -Destination $tempFolder
    }
    if (Test-Path -LiteralPath (Join-Path $backendDir "README.md")) {
        Copy-Item -LiteralPath (Join-Path $backendDir "README.md") -Destination $tempFolder
    }

    # Nen tap tin zip
    Compress-Archive -Path (Join-Path $tempFolder "*") -DestinationPath $zipOutput -CompressionLevel Optimal

    $zipItem = Get-Item -LiteralPath $zipOutput
    $sizeMB = [math]::Round($zipItem.Length / 1MB, 2)
    Write-Host "[THANH CONG] Da tao backend.zip:"
    Write-Host "Duong dan: $zipOutput"
    Write-Host "Dung luong: $sizeMB MB ($($zipItem.Length) bytes)"
}
finally {
    Remove-Item -LiteralPath $tempFolder -Recurse -Force -ErrorAction SilentlyContinue
}
