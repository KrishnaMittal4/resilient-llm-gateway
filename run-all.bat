@echo off
echo Starting Lyftr Resilient AI...
start "Lyftr Backend (FastAPI)" cmd /k "cd backend && uvicorn app.main:app --port 8000 --reload"
start "Lyftr Frontend (React Vite)" cmd /k "cd frontend && npm run dev"
echo Backend running on http://localhost:8000
echo Frontend running on http://localhost:3000
