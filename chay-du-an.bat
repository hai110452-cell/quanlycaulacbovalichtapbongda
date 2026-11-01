@echo off
chcp 65001 > nul
title Sao Vàng FC - Khởi động Hệ Thống Quản Lý CLB Bóng Đá

echo ========================================================
echo   ⚽ CLB BÓNG ĐÁ SAO VÀNG FC - FULLSTACK SERVER
echo ========================================================
echo.
echo [*] Đang chuyển vào thư mục dự án...
cd /d "%~dp0"

echo [*] Đang khởi chạy song song Backend (Port 5000) và Frontend (Port 3000)...
echo.
npm run dev

pause
