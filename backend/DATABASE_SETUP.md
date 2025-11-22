# Database Setup Guide

## ⚠️ Database Required

To run migrations, you need PostgreSQL with PostGIS extension running.

## Quick Setup Options

### Option 1: Docker (Easiest)

If you have Docker installed:

```bash
cd backend

# Start PostgreSQL with PostGIS
docker compose up -d postgres

# Wait for database to be ready (5-10 seconds)
sleep 5

# Now run migrations
npx prisma migrate dev --name init
```

### Option 2: Install PostgreSQL Locally

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis

# Start PostgreSQL service
sudo service postgresql start

# Create database
sudo -u postgres createdb munkith_db

# Enable PostGIS extension
sudo -u postgres psql munkith_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Update .env with your credentials if needed
# Then run migrations
cd backend
npx prisma migrate dev --name init
```

**macOS (Homebrew):**
```bash
brew install postgresql postgis

# Start PostgreSQL
brew services start postgresql

# Create database
createdb munkith_db

# Enable PostGIS
psql munkith_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations
cd backend
npx prisma migrate dev --name init
```

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install PostgreSQL (includes PostGIS option)
3. Open pgAdmin or psql
4. Create database: `CREATE DATABASE munkith_db;`
5. Connect to munkith_db and run: `CREATE EXTENSION postgis;`
6. Update `.env` with your credentials
7. Run: `npx prisma migrate dev --name init`

### Option 3: Cloud Database

You can use a cloud PostgreSQL service:

1. **Supabase** (Free tier available):
   - Create project at https://supabase.com
   - Get connection string
   - Update `DATABASE_URL` in `.env`

2. **Neon** (Free tier available):
   - Create project at https://neon.tech
   - Get connection string
   - Update `DATABASE_URL` in `.env`

3. **Railway** (Free tier available):
   - Create PostgreSQL service
   - Get connection string
   - Update `DATABASE_URL` in `.env`

Then run:
```bash
cd backend
npx prisma migrate dev --name init
```

## Verify Database Connection

Before running migrations, verify your database is accessible:

```bash
# Test connection (update credentials as needed)
psql -h localhost -p 5432 -U postgres -d munkith_db -c "SELECT version();"
```

Or check if PostGIS is enabled:
```bash
psql -h localhost -p 5432 -U postgres -d munkith_db -c "SELECT PostGIS_version();"
```

## Current .env Configuration

Your `.env` file is configured for:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/munkith_db?schema=public"
```

**Update this if:**
- Your PostgreSQL username is different
- Your PostgreSQL password is different
- Your database is on a different host/port
- You're using a cloud database

## Migration Files Ready

The migration SQL file is already created at:
```
prisma/migrations/20240101000000_init/migration.sql
```

Once your database is running, the migration will:
1. Create all enum types (UserRole, ProviderStatus, VehicleType, OrderStatus)
2. Create users table
3. Create provider_profiles table
4. Create orders table
5. Create all indexes and foreign keys

## After Migration

Once migrations succeed:

1. **Seed the database** (optional):
   ```bash
   npm run prisma:seed
   ```

2. **Start the server**:
   ```bash
   npm run start:dev
   ```

3. **Verify it's working**:
   ```bash
   curl http://localhost:3000/api/health
   ```

## Troubleshooting

### Error: "Can't reach database server"
- Make sure PostgreSQL is running
- Check if port 5432 is correct
- Verify connection string in `.env`

### Error: "extension postgis does not exist"
- Install PostGIS: `sudo apt-get install postgis` (Linux) or `brew install postgis` (macOS)
- Enable extension: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Error: "database munkith_db does not exist"
- Create database: `createdb munkith_db`
- Or update `.env` to use existing database

### Error: "password authentication failed"
- Update `.env` with correct PostgreSQL credentials
- Or reset PostgreSQL password: `sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'newpassword';"`

## Need Help?

1. Check `COMPLETE_SETUP.md` for detailed setup instructions
2. Check `QUICKSTART.md` for quick start guide
3. Verify database connection before running migrations
