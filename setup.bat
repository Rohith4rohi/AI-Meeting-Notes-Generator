@echo off
echo 🎙️  MeetMind — AI Meeting Notes Generator
echo ===========================================

node --version >nul 2>&1
IF ERRORLEVEL 1 (
  echo ❌ Node.js is not installed. Please install from https://nodejs.org
  pause
  exit /b 1
)

echo ✅ Node.js found

IF NOT EXIST backend\.env (
  echo 📝 Creating backend\.env from template...
  copy backend\.env.example backend\.env
  echo ⚠️  Please edit backend\.env with your MongoDB URI and OpenAI API key
)

echo.
echo 📦 Installing backend dependencies...
cd backend && npm install
cd ..

echo 📦 Installing frontend dependencies...
cd frontend && npm install
cd ..

echo.
echo ✅ Setup complete!
echo.
echo To start the app, open two Command Prompts:
echo.
echo   Terminal 1 (Backend):   cd backend ^& npm run dev
echo   Terminal 2 (Frontend):  cd frontend ^& npm start
echo.
echo Then open: http://localhost:3000
echo.
echo See README.md for full documentation
pause
