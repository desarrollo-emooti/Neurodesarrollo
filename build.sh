#!/bin/bash
set -e

echo "🔨 Building backend..."
cd backend
npm ci
npx prisma generate
npm run build
echo "✅ Build completed successfully"
