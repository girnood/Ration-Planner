# Munkith Roadside Assistance - MVP Launch Guide

## Prerequisites
- Node.js (v18+)
- Flutter SDK (v3.0+)
- Docker (for PostgreSQL + PostGIS)

## 1. Database Setup
The app uses PostgreSQL with PostGIS extension.

1. **Start the Database:**
   Run the provided helper script or use Docker directly:
   ```bash
   sh start-db.sh
   # OR
   docker run --name munkith-db -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=munkith -p 5432:5432 -d postgis/postgis
   ```

2. **Run Migrations:**
   Apply the Prisma schema to the database:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

## 2. Backend Setup (NestJS)
Located in `backend/`.

1. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the Server:**
   ```bash
   npm run start:dev
   ```
   Server will run on `http://localhost:3000`.

## 3. Mobile App Setup (Flutter)
Located in `mobile/`.

1. **Install Dependencies:**
   ```bash
   cd mobile
   flutter pub get
   ```

2. **Run the App:**
   - **Android Emulator:** Ensure you use `10.0.2.2` for localhost (configured in `api_client.dart`).
   - **iOS Simulator:** Use `localhost`.
   
   ```bash
   flutter run
   ```

## 4. Testing the MVP Flow
1. **Login:** Enter any phone number (e.g., `91234567`) in the Auth Screen.
2. **Map:** You will land on the Map Screen (centered on Muscat).
3. **Request Tow:**
   - Click **"REQUEST TOW NOW"**.
   - The app will call `POST /orders` to create a job.
   - The Backend Dispatcher will simulate finding a driver after 3 seconds.
   - You should see "Request sent!" and potentially a log in the backend console indicating "Driver found".
   - (Real-time UI update for "Driver Found" listens to socket event `driverFound`).

## 5. Troubleshooting
- **Connection Refused:** Check `api_client.dart` and `socket_service.dart`. If running on physical device, use your machine's local IP (e.g., `192.168.1.x`) instead of localhost.
- **Database Errors:** Ensure the Docker container is running (`docker ps`).
