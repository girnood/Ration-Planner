# Munkith Backend API

Backend API for the Munkith roadside assistance app operating in Oman.

## Tech Stack

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL with PostGIS extension
- **ORM:** Prisma
- **Maps:** Google Maps Platform
- **Real-time:** Socket.io
- **Auth:** JWT + Phone Number Verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
# Run PostgreSQL with PostGIS
# Then run migrations
npm run prisma:migrate
npm run prisma:generate
```

4. Start the development server:
```bash
npm run start:dev
```

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts           # Root module
├── common/                 # Shared utilities, guards, decorators
├── config/                 # Configuration modules
├── auth/                   # Authentication & authorization
├── users/                  # User management
├── providers/              # Provider (driver) management
├── orders/                 # Order management & dispatching
├── pricing/                # Pricing calculation service
├── maps/                   # Google Maps integration
└── websocket/              # WebSocket gateway for real-time updates
```

## Features

- JWT-based authentication with phone verification
- Round-robin driver dispatching
- Real-time location tracking via WebSockets
- Automatic pricing calculation (Base + Distance)
- PostGIS geospatial queries for driver matching

## API Documentation

Once running, visit `http://localhost:3000/api/docs` for Swagger documentation.

## Pricing Formula

```
Price (OMR) = Base Fare + (Distance in KM × Rate per KM)
- Base Fare: 5.000 OMR
- Rate per KM: 0.350 OMR
- Minimum Fare: 5.000 OMR
```

## License

UNLICENSED
