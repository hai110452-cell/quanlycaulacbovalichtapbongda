# Script build va dong goi Frontend chuan Static Export Next.js giong dodinhminhtrong.zip
param(
    [string]$Root = "d:\Lập trình mã nguồn mở 2\QUẢN LÝ CÂU LẠC BỘ VÀ LỊCH TẬP BÓNG ĐÁ",
    [string]$BasePath = "/nguyenminhhai/doan"
)
$ProgressPreference = 'SilentlyContinue'

$frontendDir = Join-Path $Root "frontend"
$outDir = Join-Path $frontendDir "out"
$zipOutput = Join-Path $Root "frontend.zip"
$apiDir = Join-Path $frontendDir "app\api"
$tempApiDir = Join-Path $frontendDir "_api_routes"

Write-Host "=========================================="
Write-Host "1. Chuan bi build Static Export Next.js cho $BasePath"
Write-Host "=========================================="
# Dat bien moi truong cho build export
$env:NEXT_EXPORT = 'true'
$env:NEXT_PUBLIC_BASE_PATH = $BasePath
$env:NEXT_PRIVATE_MAX_WORKERS = '1'
$env:NEXT_PRIVATE_WORKER_THREADS = '0'

if (Test-Path -LiteralPath $apiDir) {
    Move-Item -LiteralPath $apiDir -Destination $tempApiDir -Force
}
if (Test-Path -LiteralPath (Join-Path $frontendDir ".next")) {
    Remove-Item -LiteralPath (Join-Path $frontendDir ".next") -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path -LiteralPath $outDir) {
    Remove-Item -LiteralPath $outDir -Recurse -Force -ErrorAction SilentlyContinue
}

try {
    Write-Host "Dang thuc hien Next.js build export..."
    Push-Location $frontendDir
    npx next build --webpack
    Pop-Location
}
finally {
    if (Test-Path -LiteralPath $tempApiDir) {
        Move-Item -LiteralPath $tempApiDir -Destination $apiDir -Force
    }
    # Reset bien moi truong de chay dev binh thuong
    Remove-Item Env:\NEXT_EXPORT -ErrorAction SilentlyContinue
    Remove-Item Env:\NEXT_PUBLIC_BASE_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:\NEXT_PRIVATE_MAX_WORKERS -ErrorAction SilentlyContinue
    Remove-Item Env:\NEXT_PRIVATE_WORKER_THREADS -ErrorAction SilentlyContinue
}

Write-Host "`n=========================================="
Write-Host "2. Dong goi file zip tu thu muc out/"
Write-Host "=========================================="
if (Test-Path $zipOutput) {
    Remove-Item $zipOutput -Force
}

if (Test-Path $outDir) {
    # Xoa .htaccess de khong bi loi 500 Internal Server Error tren Apache DirectAdmin (giong het dodinhminhtrong.zip)
    if (Test-Path (Join-Path $outDir ".htaccess")) {
        Remove-Item (Join-Path $outDir ".htaccess") -Force -ErrorAction SilentlyContinue
    }

    Push-Location $outDir
    try {
        tar -a -cf $zipOutput *
    }
    finally {
        Pop-Location
    }

    $item = Get-Item $zipOutput
    $sizeKB = [math]::Round($item.Length / 1KB, 2)
    $sizeMB = [math]::Round($item.Length / 1MB, 2)
    Write-Host "`n[THANH CONG] Da tao frontend.zip theo chuan dodinhminhtrong.zip:" -ForegroundColor Green
    Write-Host "Duong dan: $zipOutput" -ForegroundColor Cyan
    Write-Host "Dung luong: $sizeKB KB ($sizeMB MB)" -ForegroundColor Yellow
} else {
    Write-Host "[THAT BAI] Khong tim thay thu muc out/" -ForegroundColor Red
}
