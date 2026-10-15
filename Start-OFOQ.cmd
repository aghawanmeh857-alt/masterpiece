@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Alternatively use Live Server on hero/userHero.html.
  pause
  exit /b 1
)
node scripts\ofoq-server.cjs
pause
