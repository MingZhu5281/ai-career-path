@echo off
echo Setting up AI Career Path Project...
echo.

cd backend

echo Creating Python virtual environment...
python -m venv venv

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Setup complete! 
echo.
echo To start the backend server:
echo 1. Run start_backend.bat
echo 2. Or manually: cd backend, venv\Scripts\activate, python app.py
echo.
echo To view the frontend:
echo Open frontend/index.html in your web browser
echo.
echo Don't forget to:
echo 1. Copy backend/env_example.txt to backend/.env
echo 2. Add your OpenAI API key to the .env file
echo.

pause
