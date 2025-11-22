# Munkith Backend - Quick Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version
   ```

2. **PostgreSQL** (v14 or higher) with PostGIS extension
   ```bash
   # Install PostgreSQL
   # Ubuntu/Debian:
   sudo apt-get install postgresql postgresql-contrib postgis

   # macOS (Homebrew):
   brew install postgresql postgis
   ```

3. **Google Maps API Key** (optional for development, required for production)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/munkith_db?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Google Maps API (optional for dev)
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Server
PORT=3000
NODE_ENV=development
```

### 3. Set Up PostgreSQL Database

```bash
# Create database
createdb munkith_db

# Connect to database
psql munkith_db

# Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

# Exit psql
\q
```

### 4. Run Prisma Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create and apply migrations
npm run prisma:migrate

# (Optional) Seed database with sample data
npm run prisma:seed
```

### 5. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

## Testing the API

### 1. Health Check

```bash
curl http://localhost:3000/api/health
```

### 2. Request OTP (Mock)

```bash
curl -X POST http://localhost:3000/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96812345678"}'
```

### 3. Verify OTP and Login

```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96812345678", "otp": "123456"}'
```

Save the `accessToken` from the response.

### 4. Get Pricing Constants

```bash
curl http://localhost:3000/api/pricing/constants
```

### 5. Create an Order (requires auth token)

```bash
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

## WebSocket Connection

For real-time updates, connect to the WebSocket endpoint:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/dispatcher', {
  auth: {
    userId: 'user-id',
    role: 'PROVIDER', // or 'CUSTOMER'
  },
});

socket.on('connect', () => {
  console.log('Connected to dispatcher');
});

socket.on('order:offer', (data) => {
  console.log('New order offer:', data);
});
```

## Project Structure

```
backend/
├── src/
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User management
│   ├── providers/      # Provider (driver) management
│   ├── orders/         # Order management
│   ├── pricing/        # Pricing calculations
│   ├── maps/           # Google Maps integration
│   ├── dispatcher/     # Round Robin dispatching & WebSocket
│   ├── prisma/         # Prisma service
│   └── main.ts         # Application entry point
├── prisma/
│   └── schema.prisma   # Database schema
└── package.json
```

## Common Issues

### PostgreSQL Connection Error

- Ensure PostgreSQL is running: `sudo service postgresql start`
- Check connection string in `.env`
- Verify database exists: `psql -l`

### PostGIS Extension Error

- Install PostGIS: `sudo apt-get install postgis` (Linux) or `brew install postgis` (macOS)
- Enable extension: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Port Already in Use

- Change `PORT` in `.env` file
- Or kill the process using port 3000: `lsof -ti:3000 | xargs kill`

## Next Steps

1. Set up proper SMS service for OTP (replace mock implementation)
2. Configure Google Maps API key for accurate distance calculations
3. Set up proper JWT secret for production
4. Configure CORS for your Flutter app domain
5. Set up admin guards for admin-only endpoints
