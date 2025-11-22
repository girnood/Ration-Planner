# Munkith Backend API

Backend API for Munkith Roadside Assistance App built with NestJS, PostgreSQL, and Prisma.

## Features

- **Authentication**: JWT-based auth with phone number verification (mock SMS for dev)
- **User Management**: Support for CUSTOMER, PROVIDER, and ADMIN roles
- **Provider Management**: Provider profiles with approval workflow
- **Order Management**: Order creation, tracking, and status updates
- **Pricing Service**: Automatic price calculation (Base Fare + Distance * Rate)
- **Dispatcher Service**: Round Robin algorithm for driver matching
- **Real-time Updates**: WebSocket support for order tracking and driver location

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with PostGIS extension
- **ORM**: Prisma
- **Maps**: Google Maps Platform (Distance Matrix API)
- **Real-time**: Socket.io
- **Auth**: JWT + Passport

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ with PostGIS extension
- Google Maps API key

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database:
```bash
# Create database
createdb munkith_db

# Enable PostGIS extension
psql -d munkith_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

4. Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Authentication
- `POST /api/auth/request-otp` - Request OTP for phone verification
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/auth/me` - Get current user profile

### Orders
- `POST /api/orders` - Create a new order
- `GET /api/orders/my-orders` - Get customer's orders
- `GET /api/orders/my-assignments` - Get provider's orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders/:id/accept` - Accept order (Provider)
- `PATCH /api/orders/:id/status` - Update order status

### Providers
- `POST /api/providers/profile` - Create provider profile
- `GET /api/providers/profile` - Get own provider profile
- `PATCH /api/providers/location` - Update provider location
- `PATCH /api/providers/online-status` - Update online status

### Pricing
- `GET /api/pricing/constants` - Get pricing constants

## WebSocket Events

Connect to `/dispatcher` namespace for real-time updates.

### Client → Server
- `order:accept` - Driver accepts order offer
- `order:reject` - Driver rejects order offer
- `location:update` - Driver updates location

### Server → Client
- `order:offer` - Order offer sent to driver
- `order:accepted` - Order accepted confirmation
- `driver:location` - Driver location update (for customers)

## Pricing Formula

```
Price = Base Fare + (Distance in KM × Rate per KM)
Minimum Fare = Base Fare

Current Rates (OMR):
- Base Fare: 5.000 OMR
- Rate per KM: 0.350 OMR
- Minimum Fare: 5.000 OMR
```

## Round Robin Dispatching

The dispatcher uses a Round Robin algorithm:

1. Find nearest available drivers (online, approved, within 50km radius)
2. Send order offer to nearest driver via WebSocket
3. Wait 20 seconds for response
4. If no response or rejected, move to next nearest driver
5. Repeat until driver accepts or no more drivers available

## Database Schema

See `prisma/schema.prisma` for full schema definition.

Key tables:
- `users` - User accounts
- `provider_profiles` - Provider (driver) profiles
- `orders` - Service orders

## Development

- Run migrations: `npm run prisma:migrate`
- Open Prisma Studio: `npm run prisma:studio`
- Run tests: `npm test`
- Lint code: `npm run lint`

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up proper SMS service (replace mock OTP)
5. Enable PostGIS extension in production database
6. Configure Google Maps API key with proper restrictions
