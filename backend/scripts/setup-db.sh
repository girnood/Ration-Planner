#!/bin/bash

# Munkith Backend - Database Setup Script

set -e

echo "🚀 Setting up Munkith database..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "✅ Docker found"
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo "✅ Docker Compose found"
        echo "📦 Starting PostgreSQL with PostGIS..."
        
        # Start database
        if docker compose version &> /dev/null; then
            docker compose up -d postgres
        else
            docker-compose up -d postgres
        fi
        
        echo "⏳ Waiting for database to be ready..."
        sleep 5
        
        # Wait for database to be ready
        until docker exec munkith_postgres pg_isready -U postgres > /dev/null 2>&1; do
            echo "Waiting for PostgreSQL..."
            sleep 2
        done
        
        echo "✅ Database is ready!"
        echo ""
        echo "📝 Running Prisma migrations..."
        npm run prisma:migrate
        
        echo ""
        echo "🌱 Seeding database..."
        npm run prisma:seed
        
        echo ""
        echo "✅ Database setup complete!"
        echo ""
        echo "Database connection:"
        echo "  Host: localhost"
        echo "  Port: 5432"
        echo "  Database: munkith_db"
        echo "  User: postgres"
        echo "  Password: postgres"
        
    else
        echo "❌ Docker Compose not found"
        echo "Please install Docker Compose or set up PostgreSQL manually"
        exit 1
    fi
else
    echo "❌ Docker not found"
    echo ""
    echo "Please install Docker or set up PostgreSQL manually:"
    echo ""
    echo "1. Install PostgreSQL with PostGIS:"
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib postgis"
    echo "   macOS: brew install postgresql postgis"
    echo ""
    echo "2. Create database:"
    echo "   createdb munkith_db"
    echo ""
    echo "3. Enable PostGIS extension:"
    echo "   psql munkith_db -c 'CREATE EXTENSION IF NOT EXISTS postgis;'"
    echo ""
    echo "4. Update .env file with your database credentials"
    echo ""
    echo "5. Run migrations:"
    echo "   npm run prisma:migrate"
    echo ""
    echo "6. Seed database:"
    echo "   npm run prisma:seed"
    exit 1
fi
