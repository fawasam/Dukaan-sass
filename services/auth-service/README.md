# Auth Service

Authentication and authorization service for the e-commerce platform.

## Features

- User signup and login
- JWT access tokens and refresh tokens
- Role-based access control (customer, seller, admin)
- Password hashing with bcrypt
- MongoDB storage for users and refresh tokens
- Event publishing (UserRegistered, UserLoggedIn)

## Environment Variables

```env
# Service Configuration
PORT=3001
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=ecom

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## API Endpoints

### POST /auth/signup

Register a new user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe",
  "role": "customer" // optional, defaults to "customer"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

### POST /auth/login

Authenticate a user.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token"
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

### POST /auth/logout

Logout and invalidate refresh token.

**Request Body:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me

Get current user information.

**Headers:**

```
Authorization: Bearer <access-token>
```

**Response:**

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  }
}
```

## Running the Service

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev
```

## Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string,
  password: string, // hashed
  displayName?: string,
  role: 'customer' | 'seller' | 'admin',
  createdAt: Date,
  updatedAt: Date
}
```

### RefreshTokens Collection

```typescript
{
  _id: ObjectId,
  userId: string,
  token: string,
  expiresAt: Date,
  createdAt: Date
}
```

## Events

The service publishes the following events:

- **UserRegistered**: When a new user signs up
- **UserLoggedIn**: When a user successfully logs in

Event publishing is currently implemented as console logs. Integrate with your event system (Redis, RabbitMQ, etc.) in `src/utils/events.ts`.
