# Munkith Backend - Quick Start Guide

## 🚀 Fastest Setup (Using Docker)

If you have Docker installed, this is the easiest way:

```bash
cd backend

# Start PostgreSQL with PostGIS
docker compose up -d postgres

# Wait a few seconds for database to start, then run migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed

# Start development server
npm run start:dev
```

That's it! The API will be running at `http://localhost:3000/api`

## 📋 Manual Setup

### 1. Install PostgreSQL with PostGIS

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis
```

**macOS (Homebrew):**
```bash
brew install postgresql postgis
```

**Windows:**
Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)
Then install PostGIS using Stack Builder or download from [PostGIS website](https://postgis.net/install/)

### 2. Create Database

```bash
# Create database
createdb munkith_db

# Connect and enable PostGIS
psql munkith_db
```

In psql:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### 3. Configure Environment

The `.env` file is already created. Update it if your PostgreSQL credentials are different:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/munkith_db?schema=public"
```

### 4. Run Migrations

```bash
cd backend
npm run prisma:migrate
```

### 5. Seed Database (Optional)

```bash
npm run prisma:seed
```

This creates:
- Admin user: `+96899999999`
- Sample customer: `+96812345678`
- Sample provider: `+96887654321`

### 6. Start Server

```bash
npm run start:dev
```

## ✅ Verify Installation

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Test Authentication
```bash
# Request OTP
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96812345678"}'

# Verify OTP (use "123456" as OTP in development)
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96812345678", "otp": "123456"}'
```

## 🔧 Troubleshooting

### Database Connection Error

**Error:** `Can't reach database server at localhost:5432`

**Solutions:**
1. Make sure PostgreSQL is running:
   ```bash
   # Linux
   sudo service postgresql start
   
   # macOS
   brew services start postgresql
   ```

2. Check if port 5432 is available:
   ```bash
   lsof -i :5432
   ```

3. Verify database exists:
   ```bash
   psql -l | grep munkith_db
   ```

### PostGIS Extension Error

**Error:** `extension "postgis" does not exist`

**Solution:**
```bash
psql munkith_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
Change `PORT` in `.env` file or kill the process:
```bash
lsof -ti:3000 | xargs kill
```

## 📚 Next Steps

1. **Set up Google Maps API** (optional for development):
   - Get API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Add to `.env`: `GOOGLE_MAPS_API_KEY="your-key"`
   - Without it, the system uses Haversine formula (less accurate)

2. **Configure SMS Service** (for production):
   - Replace mock OTP in `auth.service.ts` with real SMS provider
   - Options: Twilio, AWS SNS, Vonage, etc.

3. **Set Strong JWT Secret**:
   - Generate: `openssl rand -base64 32`
   - Update `.env`: `JWT_SECRET="your-generated-secret"`

4. **Start Building Frontend**:
   - Connect Flutter app to `http://localhost:3000/api`
   - Use WebSocket endpoint: `ws://localhost:3000/dispatcher`

## 🎯 API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/request-otp` - Request OTP
- `POST /api/auth/verify-otp` - Verify OTP and login
- `GET /api/auth/me` - Get current user (requires auth)
- `GET /api/pricing/constants` - Get pricing info
- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders/my-orders` - Get customer orders
- `GET /api/orders/my-assignments` - Get provider orders

See `README.md` for full API documentation.
