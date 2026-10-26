@echo off
setlocal
cd /d "%~dp0"

REM Prefer portable Node shipped in this folder, then fall back to system Node.
if exist "%~dp0.tools\node\node.exe" (
  set "PATH=%~dp0.tools\node;%PATH%"
)

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js was not found.
  echo.
  echo Install Node LTS from https://nodejs.org
  echo OR unzip a Node win-x64 build into:
  echo   %~dp0.tools\node\
  echo so that folder contains node.exe and npm.cmd
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo npm was not found on PATH even though node exists.
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing dependencies...
  call npm install
  if errorlevel 1 exit /b 1
)

echo.
echo Starting StudyForge at http://localhost:5173
echo Press Ctrl+C to stop.
echo.
call npm run dev
