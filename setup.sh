#!/bin/bash

# RepoCleanr Setup Script
# This script helps set up the RepoCleanr project for development

set -e

echo "🧹 RepoCleanr Setup Script"
echo "=========================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 18.0.0"
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

# Simple version comparison using node itself
if ! node -e "
const current = process.versions.node.split('.').map(Number);
const required = '${REQUIRED_VERSION}'.split('.').map(Number);
const isValid = current[0] > required[0] || 
  (current[0] === required[0] && current[1] > required[1]) || 
  (current[0] === required[0] && current[1] === required[1] && current[2] >= required[2]);
process.exit(isValid ? 0 : 1);
"; then
    echo "❌ Node.js version ${NODE_VERSION} is too old. Please upgrade to >= ${REQUIRED_VERSION}"
    exit 1
fi

echo "✅ Node.js version: ${NODE_VERSION}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm"
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

echo "📦 Installing dependencies..."
echo ""

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ All dependencies installed successfully!"
echo ""

# Create centralized environment file
echo "🔧 Setting up centralized environment file..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created .env from template"
    echo "⚠️  Please edit .env with your GitHub OAuth credentials"
    echo "📝 All environment variables are now centralized in the root .env file"
else
    echo "ℹ️  .env already exists"
fi

echo ""
echo "🎉 Setup completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Set up GitHub OAuth App:"
echo "   - Go to https://github.com/settings/developers"
echo "   - Create new OAuth App with these settings:"
echo "     * Application name: RepoCleanr"
echo "     * Homepage URL: http://localhost:3000"
echo "     * Callback URL: http://localhost:5000/api/auth/github/callback"
echo ""
echo "2. Update the centralized environment file:"
echo "   - Edit .env with your GitHub OAuth credentials"
echo "   - All configuration is now in one place!"
echo ""
echo "3. Start development servers:"
echo "   npm run dev"
echo ""
echo "4. Open your browser:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:5000"
echo ""
echo "📖 For detailed setup instructions, see README.md"
echo ""
echo "Happy coding! 🚀" 