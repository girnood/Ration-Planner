# Munkith Backend API Endpoints

Base URL: `http://localhost:3000/api`

---

## Authentication

### Send Verification Code
```http
POST /auth/send-code
Content-Type: application/json

{
  "phone": "+96899001122"  // or "99001122" (will auto-add +968)
}

Response:
{
  "success": true,
  "message": "Verification code sent to +96899001122 (Mock: 123456)"
}
```

### Verify Code & Login
```http
POST /auth/verify
Content-Type: application/json

{
  "phone": "+96899001122",
  "code": "123456",
  "name": "Ahmed",           // Optional (for new users)
  "role": "CUSTOMER"         // Optional: CUSTOMER (default), PROVIDER
}

Response:
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-uuid",
    "phone": "+96899001122",
    "name": "Ahmed",
    "role": "CUSTOMER"
  }
}
```

---

## Users

All endpoints require `Authorization: Bearer <token>` header.

### Get Current User Profile
```http
GET /users/me
Authorization: Bearer <token>

Response:
{
  "id": "user-uuid",
  "phone": "+96899001122",
  "name": "Ahmed",
  "role": "CUSTOMER",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00Z"
}
```

### Update Profile
```http
PATCH /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Ahmed Al-Balushi",
  "email": "ahmed@example.com"
}
```

---

## Providers (Drivers)

### Create Provider Profile
```http
POST /providers
Authorization: Bearer <provider-token>
Content-Type: application/json

{
  "vehicleType": "FLATBED",        // or "WHEEL_LIFT"
  "plateNumber": "MSC-12345",
  "licenseNumber": "OM123456",
  "vehicleModel": "Ford F-550",
  "vehicleYear": 2022
}

Response:
{
  "id": "provider-uuid",
  "userId": "user-uuid",
  "vehicleType": "FLATBED",
  "status": "PENDING",             // Requires admin approval
  "isOnline": false
}
```

### Get My Provider Profile
```http
GET /providers/me
Authorization: Bearer <provider-token>
```

### Update Location
```http
PATCH /providers/me/location
Authorization: Bearer <provider-token>
Content-Type: application/json

{
  "lat": 23.6100,
  "lng": 58.4059
}
```

### Set Online/Offline
```http
PATCH /providers/me/status
Authorization: Bearer <provider-token>
Content-Type: application/json

{
  "isOnline": true  // or false
}
```

### Get My Statistics
```http
GET /providers/me/stats
Authorization: Bearer <provider-token>

Response:
{
  "totalOrders": 45,
  "totalEarnings": 450.500,
  "rating": 4.8,
  "vehicleType": "FLATBED",
  "status": "APPROVED"
}
```

---

## Orders

### Create Order (Customer)
```http
POST /orders
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "pickupLat": 23.6100,
  "pickupLng": 58.4059,
  "dropoffLat": 23.5880,
  "dropoffLng": 58.3829,
  "notes": "Blue sedan, near Starbucks"
}

Response:
{
  "id": "order-uuid",
  "orderNumber": "ORD-20240115-0001",
  "customerId": "user-uuid",
  "pickupLat": 23.6100,
  "pickupLng": 58.4059,
  "dropoffLat": 23.5880,
  "dropoffLng": 58.3829,
  "distanceKm": 2.5,
  "priceEstimated": 5.875,          // 5.000 + (2.5 × 0.350)
  "status": "SEARCHING",
  "message": "Order created successfully. Searching for nearby drivers..."
}
```

### Get My Orders (Customer)
```http
GET /orders/my-orders
Authorization: Bearer <customer-token>
Query: ?status=SEARCHING  // Optional filter
```

### Get My Deliveries (Driver)
```http
GET /orders/my-deliveries
Authorization: Bearer <provider-token>
Query: ?status=COMPLETED  // Optional filter
```

### Get My Active Order (Driver)
```http
GET /orders/my-active-order
Authorization: Bearer <provider-token>

Response:
{
  "id": "order-uuid",
  "orderNumber": "ORD-20240115-0001",
  "status": "ACCEPTED",
  "customer": {
    "name": "Ahmed",
    "phone": "+96899001122"
  },
  "pickupLat": 23.6100,
  "pickupLng": 58.4059,
  ...
}
```

### Accept Order (Driver)
```http
POST /orders/:id/accept
Authorization: Bearer <provider-token>

Response:
{
  "message": "Order accepted successfully",
  "order": { ... }
}
```

### Reject Order (Driver)
```http
POST /orders/:id/reject
Authorization: Bearer <provider-token>
Content-Type: application/json

{
  "reason": "Too far away"  // Optional
}
```

### Update Order Status (Driver)
```http
PATCH /orders/:id/status
Authorization: Bearer <provider-token>
Content-Type: application/json

{
  "status": "ARRIVED"  // ARRIVED, IN_PROGRESS, COMPLETED
}
```

### Cancel Order (Customer)
```http
POST /orders/:id/cancel
Authorization: Bearer <customer-token>
Content-Type: application/json

{
  "reason": "Found alternative solution"  // Optional
}

Note: Can only cancel if status is SEARCHING or OFFERED
```

### Get Order Details
```http
GET /orders/:id
Authorization: Bearer <token>

Response:
{
  "id": "order-uuid",
  "orderNumber": "ORD-20240115-0001",
  "status": "COMPLETED",
  "customer": { ... },
  "driver": { ... },
  "dispatchHistory": [
    {
      "driverId": "driver-1",
      "offeredAt": "2024-01-15T10:00:00Z",
      "accepted": false
    },
    {
      "driverId": "driver-2",
      "offeredAt": "2024-01-15T10:00:21Z",
      "accepted": true
    }
  ],
  ...
}
```

---

## Admin Endpoints

### Get All Users
```http
GET /users
Authorization: Bearer <admin-token>
```

### Get All Providers
```http
GET /providers
Authorization: Bearer <admin-token>
Query: ?status=PENDING&isOnline=true
```

### Approve Provider
```http
PATCH /providers/:id/approve
Authorization: Bearer <admin-token>
```

### Reject Provider
```http
PATCH /providers/:id/reject
Authorization: Bearer <admin-token>
```

### Get All Orders
```http
GET /orders
Authorization: Bearer <admin-token>
Query: ?status=COMPLETED&limit=50
```

### Get Dispatcher Stats
```http
GET /orders/admin/dispatcher-stats
Authorization: Bearer <admin-token>

Response:
{
  "pendingOffers": 3,
  "activeDriverOffers": 5,
  "timeout": 20000,
  "maxAttempts": 5
}
```

---

## WebSocket Connection

### Connect to Dispatcher
```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/dispatcher', {
  query: {
    userId: 'user-uuid'  // From JWT token
  }
});

// Customer events
socket.on('order:offered', (data) => {
  console.log('Order offered to driver:', data);
});

socket.on('order:accepted', (data) => {
  console.log('Driver accepted:', data);
});

socket.on('order:updated', (data) => {
  console.log('Order updated:', data);
});

// Driver events
socket.on('order:offered', (order) => {
  console.log('New order offer:', order);
  
  // Accept or reject
  socket.emit('order:accept', { orderId: order.id });
  // OR
  socket.emit('order:reject', { orderId: order.id, reason: 'Too far' });
});
```

### Location Tracking
```javascript
const locationSocket = io('http://localhost:3000/location', {
  query: {
    userId: 'driver-user-uuid'
  }
});

// Driver sends location updates
setInterval(() => {
  locationSocket.emit('location:update', {
    lat: 23.6100,
    lng: 58.4059,
    heading: 45,    // Optional
    speed: 60       // Optional (km/h)
  });
}, 5000);  // Every 5 seconds

// Customer tracks driver
locationSocket.emit('track:driver', { driverId: 'driver-uuid' });

locationSocket.on('driver:driver-uuid:location', (location) => {
  console.log('Driver location:', location);
  // Update map marker
});
```

---

## Error Responses

All errors follow this format:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

(To be implemented in production)

- Auth endpoints: 5 requests per minute
- Order creation: 10 requests per minute
- Location updates: Unlimited (within reason)

---

## Localization Support

The API is ready for Arabic (RTL) support:

- All text fields (notes, addresses) support Arabic characters
- Phone numbers support Oman format (+968)
- Dates/times use ISO 8601 format
- Currency always in OMR (Omani Rial)

Frontend should handle RTL layout based on user preference.
