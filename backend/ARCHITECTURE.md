# Munkith Backend Architecture

## Overview

The Munkith backend is a NestJS-based REST API with WebSocket support for real-time order dispatching and tracking. It implements a Round Robin algorithm for matching customers with available tow truck drivers.

## Core Modules

### 1. Authentication Module (`auth/`)

**Purpose**: Handles user authentication and authorization

**Features**:
- Phone number-based authentication
- OTP verification (mock SMS for development)
- JWT token generation and validation
- Role-based access control (CUSTOMER, PROVIDER, ADMIN)

**Endpoints**:
- `POST /api/auth/request-otp` - Request OTP for phone verification
- `POST /api/auth/verify-otp` - Verify OTP and login/register
- `GET /api/auth/me` - Get current user profile

**Key Files**:
- `auth.service.ts` - Business logic for authentication
- `auth.controller.ts` - HTTP endpoints
- `strategies/jwt.strategy.ts` - JWT validation strategy
- `guards/jwt-auth.guard.ts` - Route protection guard

### 2. Users Module (`users/`)

**Purpose**: User management

**Features**:
- CRUD operations for users
- Role management
- User activation/deactivation

**Endpoints**:
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Deactivate user

### 3. Providers Module (`providers/`)

**Purpose**: Manage tow truck driver profiles

**Features**:
- Provider profile creation
- Location tracking (lat/lng)
- Online/offline status management
- Approval workflow (PENDING, APPROVED, REJECTED)
- Vehicle type management (FLATBED, WHEEL_LIFT)
- Find available providers near a location

**Endpoints**:
- `POST /api/providers/profile` - Create provider profile
- `GET /api/providers/profile` - Get own profile
- `PATCH /api/providers/location` - Update location
- `PATCH /api/providers/online-status` - Toggle online status
- `PATCH /api/providers/:userId/status` - Update approval status (Admin)

**Key Methods**:
- `findAvailableProviders()` - Finds online, approved providers within radius
- `updateLocation()` - Updates driver's current location

### 4. Orders Module (`orders/`)

**Purpose**: Order management and lifecycle

**Features**:
- Order creation with automatic price calculation
- Order status tracking (SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED)
- Order history for customers and providers
- Automatic dispatcher triggering on order creation

**Endpoints**:
- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get customer's orders
- `GET /api/orders/my-assignments` - Get provider's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/accept` - Accept order (Provider)
- `PATCH /api/orders/:id/status` - Update order status

**Order Status Flow**:
```
SEARCHING → ACCEPTED → ARRIVED → IN_PROGRESS → COMPLETED
     ↓           ↓         ↓
  CANCELLED  CANCELLED  CANCELLED
```

### 5. Pricing Module (`pricing/`)

**Purpose**: Calculate service prices

**Formula**:
```
Price = Base Fare + (Distance in KM × Rate per KM)
Minimum Price = Base Fare (if calculated < base)

Current Rates (OMR):
- Base Fare: 5.000 OMR
- Rate per KM: 0.350 OMR
- Minimum Fare: 5.000 OMR
```

**Features**:
- Automatic price calculation based on pickup/dropoff locations
- Distance calculation using Google Maps Distance Matrix API
- Fallback to Haversine formula if API unavailable
- Pricing constants endpoint for frontend

**Endpoints**:
- `GET /api/pricing/constants` - Get pricing configuration

**Key Methods**:
- `calculatePrice()` - Calculates price and distance for an order

### 6. Maps Module (`maps/`)

**Purpose**: Google Maps Platform integration

**Features**:
- Distance calculation using Distance Matrix API
- Haversine formula fallback for development
- Geocoding support (ready for future use)

**Key Methods**:
- `getDistanceInKm()` - Get road distance between two points

### 7. Dispatcher Module (`dispatcher/`)

**Purpose**: Round Robin order dispatching and real-time tracking

**Round Robin Algorithm**:
1. Find nearest available drivers (online, approved, within 50km radius)
2. Sort by distance (nearest first)
3. Send order offer to first driver via WebSocket
4. Wait 20 seconds for response
5. If no response or rejected, move to next driver
6. Repeat until driver accepts or no drivers available

**WebSocket Events**:

**Client → Server**:
- `order:accept` - Driver accepts order offer
- `order:reject` - Driver rejects order offer
- `location:update` - Driver updates location

**Server → Client**:
- `order:offer` - Order offer sent to driver
- `order:accepted` - Order accepted confirmation
- `driver:location` - Real-time driver location (for customers)

**Key Components**:
- `DispatcherService` - Implements Round Robin logic
- `DispatcherGateway` - WebSocket gateway for real-time communication

**Connection**:
- Namespace: `/dispatcher`
- Auth: Requires `userId` and `role` in handshake auth

## Database Schema

### Users Table
```prisma
model User {
  id        String   @id @default(uuid())
  phone     String   @unique
  role      UserRole @default(CUSTOMER)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Provider Profiles Table
```prisma
model ProviderProfile {
  id             String         @id @default(uuid())
  userId         String         @unique
  vehicleType    VehicleType
  plateNumber    String
  status         ProviderStatus @default(PENDING)
  currentLat     Float?
  currentLng     Float?
  isOnline       Boolean        @default(false)
}
```

### Orders Table
```prisma
model Order {
  id           String      @id @default(uuid())
  customerId   String
  driverId     String?
  pickupLat    Float
  pickupLng    Float
  dropoffLat   Float
  dropoffLng   Float
  distanceKm   Float?
  priceEstimated Float
  status       OrderStatus @default(SEARCHING)
  createdAt    DateTime    @default(now())
  completedAt  DateTime?
}
```

## Security Considerations

1. **JWT Authentication**: All protected routes require valid JWT token
2. **Role-Based Access**: Different endpoints accessible by role
3. **Input Validation**: DTOs with class-validator for request validation
4. **CORS**: Configured for mobile app origins
5. **Environment Variables**: Sensitive data stored in `.env`

## Future Enhancements

1. **SMS Integration**: Replace mock OTP with real SMS service (Twilio, AWS SNS)
2. **PostGIS Queries**: Use PostGIS ST_DWithin for efficient geospatial queries
3. **Admin Guards**: Add role-based guards for admin-only endpoints
4. **Rate Limiting**: Add rate limiting for API endpoints
5. **Caching**: Add Redis for caching frequently accessed data
6. **Push Notifications**: Add FCM/APNS for mobile push notifications
7. **Payment Integration**: Integrate payment gateway for order payments
8. **Analytics**: Add order analytics and reporting
9. **Multi-language**: Add i18n support for error messages
10. **WebSocket Auth**: Implement proper JWT verification for WebSocket connections

## Testing Strategy

1. **Unit Tests**: Test individual services and methods
2. **Integration Tests**: Test API endpoints with test database
3. **E2E Tests**: Test complete order flow
4. **WebSocket Tests**: Test real-time events

## Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up PostgreSQL with PostGIS in production
5. Configure Google Maps API key with restrictions
6. Set up proper SMS service
7. Enable HTTPS
8. Set up monitoring and logging
