@echo off
echo Starting AI Career Path Backend...
echo.

cd backend

echo Activating Python virtual environment...
call venv\Scripts\activate

echo Installing dependencies...
pip install -r requirements.txt

echo Starting Flask server...
python app.py

pause
