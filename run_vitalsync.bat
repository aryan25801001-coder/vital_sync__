@echo off
cd /d "%~dp0"
echo Starting VitalSync Server...
start cmd /k "npm run dev"
echo Waiting for server to start...
timeout /t 5 /nobreak > nul
start http://localhost:3000
exit
