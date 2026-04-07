#!/bin/bash
# MeetMind Quick Start Script

echo "🎙️  MeetMind — AI Meeting Notes Generator"
echo "==========================================="

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install from https://nodejs.org"
  exit 1
fi

echo "✅ Node.js $(node --version) found"

# Setup backend .env if missing
if [ ! -f backend/.env ]; then
  echo "📝 Creating backend/.env from template..."
  cp backend/.env.example backend/.env
  echo "⚠️  Please edit backend/.env to add your MongoDB URI and OpenAI API key"
fi

# Install dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install --silent

echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install --silent

cd ..
echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the app, open two terminals:"
echo ""
echo "  Terminal 1 (Backend):   cd backend && npm run dev"
echo "  Terminal 2 (Frontend):  cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📖 See README.md for full documentation"
