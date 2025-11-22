# 🎯 Complete Setup Guide - Munkith Backend

## ✅ What's Already Done

1. ✅ **Dependencies Installed** - All npm packages are installed
2. ✅ **Prisma Client Generated** - Database client is ready
3. ✅ **Environment Configured** - `.env` file created
4. ✅ **Migration SQL Created** - Database schema is ready
5. ✅ **Code Compiled** - TypeScript compilation successful
6. ✅ **Docker Compose Ready** - PostgreSQL with PostGIS container config

## 🚀 Quick Start (Choose One Method)

### Method 1: Docker (Recommended - Easiest)

```bash
cd backend

# Start database
npm run db:start
# OR: docker compose up -d postgres

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start server
npm run start:dev
```

### Method 2: Using Makefile

```bash
cd backend

# Full automated setup (requires Docker)
make full-setup

# Start server
make start
```

### Method 3: Manual PostgreSQL Setup

If you don't have Docker:

1. **Install PostgreSQL with PostGIS:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib postgis
   
   # macOS
   brew install postgresql postgis
   ```

2. **Create Database:**
   ```bash
   createdb munkith_db
   psql munkith_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
   ```

3. **Update .env** with your PostgreSQL credentials

4. **Run Setup:**
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   npm run start:dev
   ```

## 📋 Verification Steps

### 1. Check Database Connection

```bash
# Using Docker
docker exec munkith_postgres pg_isready -U postgres

# Using psql
psql munkith_db -c "SELECT version();"
```

### 2. Verify API Health

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "Munkith Backend API"
}
```

### 3. Test Authentication Flow

```bash
# Request OTP
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96812345678"}'

# Verify OTP (use "123456" in development)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96812345678", "otp": "123456"}'
```

Save the `accessToken` from the response.

### 4. Test Order Creation

```bash
# Replace YOUR_ACCESS_TOKEN with token from step 3
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "pickupLat": 23.614328,
    "pickupLng": 58.545284,
    "dropoffLat": 23.584328,
    "dropoffLng": 58.515284
  }'
```

## 🔧 Available Scripts

```bash
# Setup
npm run setup              # Install deps + generate Prisma client
npm run setup:db           # Run database setup script

# Database (Docker)
npm run db:start           # Start PostgreSQL container
npm run db:stop            # Stop PostgreSQL container
npm run db:reset           # Reset database (drop + recreate + seed)

# Prisma
npm run prisma:generate    # Generate Prisma Client
npm run prisma:migrate     # Run migrations
npm run prisma:seed        # Seed database
npm run prisma:studio      # Open Prisma Studio (GUI)

# Development
npm run start:dev          # Start dev server with watch
npm run build              # Build for production
npm run start              # Start production server
```

## 📊 Database Schema

After running migrations, you'll have:

- **users** - User accounts (CUSTOMER, PROVIDER, ADMIN)
- **provider_profiles** - Driver profiles with location tracking
- **orders** - Service orders with status tracking

## 🌱 Seed Data

The seed script creates:

- **Admin User**: `+96899999999` (role: ADMIN)
- **Customer**: `+96812345678` (role: CUSTOMER)
- **Provider**: `+96887654321` (role: PROVIDER, approved, vehicle: FLATBED)

All users can login with OTP: `123456` (development only)

## 🔌 WebSocket Connection

For real-time features, connect to:

```
ws://localhost:3000/dispatcher
```

**Connection Auth:**
```javascript
const socket = io('http://localhost:3000/dispatcher', {
  auth: {
    userId: 'user-id-from-jwt',
    role: 'PROVIDER' // or 'CUSTOMER'
  }
});
```

## 🐛 Troubleshooting

### Database Won't Start

```bash
# Check if port 5432 is in use
lsof -i :5432

# Check Docker logs
docker logs munkith_postgres

# Restart container
docker compose restart postgres
```

### Migration Fails

```bash
# Reset migrations (WARNING: deletes data)
npm run db:reset

# Or manually reset
docker compose down -v
docker compose up -d postgres
npm run prisma:migrate
```

### Port 3000 Already in Use

```bash
# Change PORT in .env file
# Or kill process
lsof -ti:3000 | xargs kill
```

### Prisma Client Not Found

```bash
npm run prisma:generate
```

## 📚 Next Steps

1. **Configure Google Maps API** (optional):
   - Get API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add to `.env`: `GOOGLE_MAPS_API_KEY="your-key"`

2. **Set Production JWT Secret**:
   ```bash
   openssl rand -base64 32
   # Add to .env: JWT_SECRET="generated-secret"
   ```

3. **Integrate Real SMS Service**:
   - Update `src/auth/auth.service.ts`
   - Replace mock OTP with Twilio/AWS SNS/etc.

4. **Build Flutter Frontend**:
   - Connect to `http://localhost:3000/api`
   - Use WebSocket: `ws://localhost:3000/dispatcher`

## ✅ Success Checklist

- [ ] Database running and accessible
- [ ] Migrations applied successfully
- [ ] Seed data created
- [ ] API health check returns 200
- [ ] Authentication flow works
- [ ] Can create orders
- [ ] WebSocket connection works

## 🎉 You're Ready!

The backend is fully set up and ready for development. Start building your Flutter app and connect it to this API!

For API documentation, see `README.md` and `ARCHITECTURE.md`.
