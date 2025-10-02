#!/bin/bash

# EMOOTI Database Setup Script
# ============================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗄️  EMOOTI Database Setup${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f "env.local" ]; then
        cp env.local .env
        echo -e "${YELLOW}📝 Please edit .env file with your database credentials before continuing.${NC}"
        exit 1
    else
        echo -e "${RED}❌ No environment file found.${NC}"
        exit 1
    fi
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env file.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment variables loaded.${NC}"

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    echo -e "${RED}❌ npx not found. Please install Node.js and npm.${NC}"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install
fi

# Generate Prisma client
echo -e "${BLUE}🔧 Generating Prisma client...${NC}"
npx prisma generate

# Test database connection
echo -e "${BLUE}🔍 Testing database connection...${NC}"
if npx prisma db pull --schema=./prisma/schema.prisma > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection successful.${NC}"
else
    echo -e "${RED}❌ Database connection failed. Please check your DATABASE_URL.${NC}"
    exit 1
fi

# Run database migrations
echo -e "${BLUE}🚀 Running database migrations...${NC}"
npx prisma migrate deploy

# Seed database (optional)
echo -e "${BLUE}🌱 Seeding database...${NC}"
if [ -f "prisma/seed.ts" ]; then
    npx ts-node prisma/seed.ts
    echo -e "${GREEN}✅ Database seeded successfully.${NC}"
else
    echo -e "${YELLOW}⚠️  No seed file found. Skipping seeding.${NC}"
fi

# Open Prisma Studio (optional)
echo ""
read -p "Do you want to open Prisma Studio to view the database? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔍 Opening Prisma Studio...${NC}"
    npx prisma studio &
fi

echo -e "${GREEN}🎉 Database setup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Database Information:${NC}"
echo "================================"
echo "Database URL: $DATABASE_URL"
echo "Schema: ./prisma/schema.prisma"
echo "Migrations: ./prisma/migrations/"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Start the development server: npm run dev"
echo "2. Test the API endpoints"
echo "3. Create your first user"
