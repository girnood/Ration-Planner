# Munkith Backend Setup Guide

Complete guide to set up and run the Munkith backend locally.

---

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker & Docker Compose** ([Download](https://www.docker.com/))
- **Git**
- **Google Maps API Key** (Free tier sufficient for development)

---

## Step 1: Database Setup

### Start PostgreSQL with PostGIS

```bash
cd backend

# Start database containers
docker-compose up -d

# Verify containers are running
docker ps

# You should see:
# - munkith-postgres (PostgreSQL with PostGIS)
# - munkith-redis (Redis)
```

### Database Connection

The database will be available at:
- **Host:** localhost
- **Port:** 5432
- **Database:** munkith
- **User:** munkith
- **Password:** munkith123

---

## Step 2: Install Dependencies

```bash
cd backend

# Install Node.js dependencies
npm install

# This will install:
# - NestJS framework
# - Prisma ORM
# - Socket.io for WebSockets
# - Google Maps API client
# - JWT & Passport for auth
# - and more...
```

---

## Step 3: Environment Configuration

The `.env` file is already configured for local development:

```bash
# View current configuration
cat .env

# Key settings:
DATABASE_URL="postgresql://munkith:munkith123@localhost:5432/munkith?schema=public"
GOOGLE_MAPS_API_KEY="your-key-here"  # ← Update this!
JWT_SECRET="munkith-super-secret..."
PORT=3000
```

### Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable these APIs:
   - Distance Matrix API
   - Geocoding API
   - Directions API
4. Create credentials (API Key)
5. Copy the API key and update `.env`:

```bash
GOOGLE_MAPS_API_KEY="AIzaSyC..."
```

---

## Step 4: Database Migration & Seeding

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations (create tables)
npm run prisma:migrate

# Seed database with test data
npm run prisma:seed
```

### Test Data Created

After seeding, you'll have:

**Admin User:**
- Phone: `+96812345678`
- Password: `admin123`
- Role: ADMIN

**Test Customer:**
- Phone: `+96887654321`
- Role: CUSTOMER

**Test Providers (Drivers):**
1. Ahmed Al-Balushi: `+96899001122` (APPROVED, ONLINE)
2. Mohammed Al-Harthy: `+96899112233` (APPROVED, ONLINE)
3. Khalid Al-Rawahi: `+96899223344` (PENDING, OFFLINE)

All users use **verification code: 123456** (mock SMS)

---

## Step 5: Start Backend

```bash
# Development mode (with hot reload)
npm run start:dev

# You should see:
# ✅ Database connected
# 🚀 Munkith Backend API running on: http://localhost:3000/api
```

---

## Step 6: Test API

### 1. Send Verification Code

```bash
curl -X POST http://localhost:3000/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+96887654321"}'

# Response:
# {
#   "success": true,
#   "message": "Verification code sent to +96887654321 (Mock: 123456)"
# }
```

### 2. Login (Verify Code)

```bash
curl -X POST http://localhost:3000/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+96887654321",
    "code": "123456"
  }'

# Response:
# {
#   "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "id": "...",
#     "phone": "+96887654321",
#     "role": "CUSTOMER"
#   }
# }
```

**Save the access token!** You'll need it for authenticated requests.

### 3. Create Test Order

```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."  # From step 2

curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLat": 23.6100,
    "pickupLng": 58.4059,
    "dropoffLat": 23.5880,
    "dropoffLng": 58.3829,
    "notes": "Blue sedan near Starbucks"
  }'

# Response:
# {
#   "id": "...",
#   "orderNumber": "ORD-20240115-0001",
#   "distanceKm": 2.5,
#   "priceEstimated": 5.875,
#   "status": "SEARCHING",
#   "message": "Order created successfully. Searching for nearby drivers..."
# }
```

### 4. Check Backend Logs

You should see the Round Robin dispatcher in action:

```
🚀 Starting dispatch for order abc-123
Found 2 available drivers for order abc-123
📢 Offering order abc-123 to driver xyz-1 (2.5km away) - Attempt 1/2
```

---

## Step 7: Explore Database (Optional)

```bash
# Open Prisma Studio (visual database browser)
npm run prisma:studio

# Opens at: http://localhost:5555
```

You can:
- View all tables (Users, Providers, Orders, etc.)
- Manually edit data
- Test queries

---

## Common Commands

```bash
# Development
npm run start:dev       # Start with hot reload
npm run start:debug     # Start with debugger

# Build & Production
npm run build           # Build for production
npm run start:prod      # Run production build

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open database browser
npm run prisma:seed     # Seed test data

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:cov        # Generate coverage report

# Linting
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
```

---

## Troubleshooting

### Database Connection Error

```
Error: Can't reach database server at localhost:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
docker-compose up -d postgres

# Check logs
docker logs munkith-postgres
```

### Prisma Client Not Generated

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npm run prisma:generate
```

### Port 3000 Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in .env
PORT=3001
```

### Google Maps API Errors

```
Error: Distance calculation failed
```

**Solution:**
- Verify your Google Maps API key is correct
- Ensure Distance Matrix API is enabled
- Check API quotas in Google Cloud Console
- For development, the fallback Haversine formula will be used

---

## Next Steps

1. **Test WebSocket connections** - Use a WebSocket client or the Flutter app
2. **Explore API documentation** - See `docs/API_ENDPOINTS.md`
3. **Understand Round Robin logic** - See `docs/ROUND_ROBIN_DISPATCHING.md`
4. **Customize pricing** - Modify values in `.env`
5. **Add more test data** - Edit `prisma/seed.ts`

---

## Production Deployment

For production deployment, you'll need to:

1. Use a proper PostgreSQL hosting service (AWS RDS, DigitalOcean, etc.)
2. Use Redis for session management
3. Set up proper environment variables (secrets)
4. Enable HTTPS
5. Configure CORS properly
6. Set up logging and monitoring
7. Use a proper SMS gateway (Twilio, AWS SNS, etc.)
8. Implement rate limiting
9. Set up CI/CD pipeline

---

## Support

For issues or questions:
- Check the logs: Backend console output
- Database issues: `docker logs munkith-postgres`
- Review documentation in `docs/` folder
- Check NestJS documentation: https://docs.nestjs.com
- Check Prisma documentation: https://www.prisma.io/docs

---

**Happy Coding! 🚀**
