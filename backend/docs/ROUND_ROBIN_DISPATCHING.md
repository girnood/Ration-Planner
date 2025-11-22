# Round Robin Dispatching Algorithm

## Overview

The Munkith backend implements a **Round Robin dispatching system** to fairly distribute towing orders to available drivers based on their proximity to the customer.

---

## How It Works

### 1. Order Creation

When a customer creates an order:

```
Customer submits:
  - Pickup location (lat, lng)
  - Dropoff location (lat, lng)
  - Optional notes

Backend automatically:
  ✅ Calculates distance using Google Maps API
  ✅ Calculates price: Base (5.000 OMR) + (Distance × 0.350 OMR/km)
  ✅ Generates unique order number (e.g., ORD-20240115-0001)
  ✅ Creates order with status: SEARCHING
```

### 2. Finding Available Drivers

```typescript
// Criteria for available drivers:
- Status: APPROVED
- Online: true (isOnline = true)
- Has current location (currentLat, currentLng not null)
- Within 50km radius of pickup location

// Sorted by distance (nearest first)
```

### 3. Round Robin Dispatching Process

```
┌─────────────────────────────────────────────────────────┐
│  Step 1: Find all available drivers within 50km         │
│  Sort by distance (nearest first)                       │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  Step 2: Offer order to Driver #1 (nearest)             │
│  - Send WebSocket notification                           │
│  - Start 20-second timeout timer                         │
│  - Update order status: OFFERED                          │
└─────────────────────────────────────────────────────────┘
                          ↓
                    ┌──────────┐
                    │ Waiting  │
                    └──────────┘
                          ↓
        ┌─────────────────┴─────────────────┐
        ↓                                     ↓
┌──────────────┐                    ┌──────────────┐
│ DRIVER       │                    │ TIMEOUT      │
│ ACCEPTS      │                    │ (20 seconds) │
└──────────────┘                    └──────────────┘
        ↓                                     ↓
┌──────────────┐                    ┌──────────────┐
│ ✅ ASSIGN    │                    │ ❌ REJECT    │
│ DRIVER       │                    │ (implicit)   │
│ NOTIFY       │                    └──────────────┘
│ CUSTOMER     │                             ↓
└──────────────┘              ┌─────────────────────────┐
                              │ Step 3: Offer to        │
                              │ Driver #2 (next nearest)│
                              └─────────────────────────┘
                                          ↓
                                  (Repeat process)
```

### 4. Driver Response Scenarios

#### Scenario A: Driver Accepts
```
1. Clear timeout timer
2. Record dispatch history: accepted = true
3. Assign driver to order
4. Update order status: ACCEPTED
5. Send WebSocket notification to customer
6. Driver can now proceed to pickup location
```

#### Scenario B: Driver Rejects
```
1. Clear timeout timer
2. Record dispatch history: accepted = false
3. Find next driver in the list
4. Offer order to next driver
5. Repeat process
```

#### Scenario C: Driver Times Out (No Response)
```
1. Timeout triggers after 20 seconds
2. Record dispatch history: accepted = false
3. Automatically move to next driver
4. Offer order to next driver
5. Repeat process
```

#### Scenario D: All Drivers Exhausted
```
1. Log error: No drivers available
2. Notify customer: "No drivers available at this time"
3. Order remains in SEARCHING status
4. Customer can cancel or wait
```

---

## Configuration

The dispatcher behavior can be configured via environment variables:

```bash
# Driver response timeout (milliseconds)
DRIVER_RESPONSE_TIMEOUT=20000  # 20 seconds

# Maximum dispatch attempts before giving up
MAX_DISPATCH_ATTEMPTS=5

# Maximum search radius for drivers (km)
DRIVER_SEARCH_RADIUS=50
```

---

## Key Features

### 1. Fair Distribution
- Drivers are offered orders based on proximity
- Closest driver always gets first chance
- No preferential treatment

### 2. Automatic Fallback
- If a driver doesn't respond, system automatically moves to next
- No manual intervention required
- Seamless customer experience

### 3. History Tracking
```sql
-- Every offer is tracked in dispatch_history table
SELECT * FROM dispatch_history WHERE order_id = 'xxx';

| driver_id | offered_at          | responded_at        | accepted |
|-----------|---------------------|---------------------|----------|
| driver-1  | 2024-01-15 10:00:00 | 2024-01-15 10:00:15 | false    |
| driver-2  | 2024-01-15 10:00:16 | NULL                | NULL     |
| driver-3  | 2024-01-15 10:00:37 | 2024-01-15 10:00:40 | true     |
```

### 4. Real-time Updates
All parties receive instant WebSocket notifications:
- **Customer**: Order status changes
- **Driver**: New order offers
- **Admin**: System events

---

## WebSocket Events

### Customer Events
```typescript
// Customer receives these events:
'order:searching'        // Order created, searching for driver
'order:offered'          // Order offered to a driver (optional update)
'order:accepted'         // Driver accepted order
'order:no-drivers'       // No drivers available
'order:no-driver-accepted' // All drivers rejected/timed out
'order:updated'          // General status update
```

### Driver Events
```typescript
// Driver receives these events:
'order:offered'          // New order offer (has 20 seconds to respond)
'order:cancelled'        // Order was cancelled by customer
'order:updated'          // Order status update
```

### Driver Actions
```typescript
// Driver can send these events:
socket.emit('order:accept', { orderId: 'xxx' });
socket.emit('order:reject', { orderId: 'xxx', reason: 'Too far' });
socket.emit('driver:location', { orderId: 'xxx', lat, lng });
```

---

## Code Locations

| Component | File Path |
|-----------|-----------|
| Dispatcher Logic | `src/orders/dispatcher.service.ts` |
| Order Management | `src/orders/orders.service.ts` |
| WebSocket Gateway | `src/websocket/dispatcher.gateway.ts` |
| Provider Search | `src/providers/providers.service.ts` |
| Pricing Calculation | `src/pricing/pricing.service.ts` |

---

## Testing the Dispatcher

### 1. Create Test Data
```bash
npm run prisma:seed
```

### 2. Start Backend
```bash
npm run start:dev
```

### 3. Create Order (Customer)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer <customer-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pickupLat": 23.6100,
    "pickupLng": 58.4059,
    "dropoffLat": 23.5880,
    "dropoffLng": 58.3829,
    "notes": "Blue sedan"
  }'
```

### 4. Monitor Logs
```
🚀 Starting dispatch for order abc-123
Found 2 available drivers for order abc-123
📢 Offering order abc-123 to driver xyz-1 (2.5km away) - Attempt 1/2
⏱️ Driver xyz-1 timed out for order abc-123
📢 Offering order abc-123 to driver xyz-2 (5.1km away) - Attempt 2/2
✅ Driver xyz-2 accepted order abc-123
🎉 Order abc-123 successfully assigned to driver xyz-2
```

---

## Future Enhancements

- [ ] Priority dispatching (VIP customers)
- [ ] Driver ratings influence order
- [ ] Dynamic pricing based on demand
- [ ] Multi-order batching for drivers
- [ ] Predictive driver positioning

---

## Support

For questions about the Round Robin algorithm, contact the development team or refer to:
- `src/orders/dispatcher.service.ts` (heavily commented)
- This documentation
- Backend README.md
