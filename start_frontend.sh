#!/bin/bash

# AUVRA Frontend Startup Script
# ==============================

echo "🚀 Starting AUVRA Mobile Frontend..."
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
fi

# Clear Metro cache
echo "🧹 Clearing Metro bundler cache..."
npx expo start -c

# Alternative: Start without clearing cache
# npx expo start
