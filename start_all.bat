@echo off
color 0A
echo ====================================================
echo      VitalSync Auto-Starter (Next.js + Python ML)
echo ====================================================

echo.
echo [1/2] Starting Next.js Frontend Server in a new window...
start "VitalSync Next.js" cmd /k "cd vitalsync && npm install && npm run dev"

echo.
echo [2/2] Setting up and starting Python ML Server in a new window...
start "VitalSync ML Microservice" cmd /k "cd ml-service && echo Setting up Python Environment... && python -m venv venv && call venv\Scripts\activate && pip install -r requirements.txt && echo Starting Uvicorn Server... && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo.
echo ====================================================
echo All set! Wait 1-2 minutes for the servers to load.
echo Frontend: http://localhost:3000
echo ML API:   http://localhost:8000/docs
echo ====================================================
pause
