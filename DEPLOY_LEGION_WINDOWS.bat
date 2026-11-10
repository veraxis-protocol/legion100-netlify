@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-legion.ps1"
echo.
echo Press any key to close.
pause >nul
