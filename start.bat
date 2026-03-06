@echo off
title SYNAPSE Launcher

:: Go to the folder where this bat file is
cd /d "%~dp0"

echo ===============================
echo SYNAPSE Launcher
echo ===============================

:: Check Node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js is not installed.
    echo Install from https://nodejs.org
    goto END
)

echo Node detected:
node -v

echo.
echo Installing dependencies...
call npm install --no-audit --no-fund

echo.
echo Starting server...
call npm start server

:END
echo.
echo ===============================
echo Process finished
echo ===============================
pause