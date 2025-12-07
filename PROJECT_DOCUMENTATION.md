# Dukaan - E-Commerce Platform Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Technology Stack](#technology-stack)
5. [Shared Packages](#shared-packages)
6. [Services](#services)
7. [Setup & Development](#setup--development)
8. [API Documentation](#api-documentation)
9. [Database Schema](#database-schema)
10. [Environment Variables](#environment-variables)
11. [Development Workflow](#development-workflow)
12. [Future Considerations](#future-considerations)

---

## Project Overview

**Dukaan** is a microservices-based e-commerce platform built with **Bun** runtime, **TypeScript**, and **MongoDB**. The platform follows a modular architecture with shared packages and independent services that can be developed, deployed, and scaled independently.

### Key Features

- **Microservices Architecture**: Independent, scalable services
- **Monorepo Structure**: Shared code and dependencies managed via Bun workspaces
- **TypeScript**: Full type safety across the platform
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Role-Based Access Control**: Support for customer, seller, and admin roles
- **Event-Driven Architecture**: Foundation for event publishing (ready for integration)

---

## Architecture

### Architecture Pattern

The platform follows a **microservices architecture** with the following characteristics:

```
┌─────────────────┐
│   API Gateway   │  (Entry point, routing)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌──▼────┐
│ Auth  │ │ Other │  (Independent services)
│Service│ │Services│
└───┬───┘ └───────┘
    │
┌───▼──────┐
│ MongoDB  │  (Database)
└──────────┘
```

### Design Principles

1. **Service Independence**: Each service can be developed, tested, and deployed independently
2. **Shared Libraries**: Common functionality extracted into shared packages
3. **Type Safety**: TypeScript ensures type safety across services
4. **Configuration Management**: Centralized configuration via `@ecom/config`
5. **Unified Logging**: Consistent logging format via `@ecom/logger`

---

## Project Structure

```
Dukaan/
├── packages/                    # Shared packages (workspace)
│   ├── shared-config/          # Configuration utilities
│   │   ├── src/
│   │   │   └── index.ts        # BaseConfig interface & loadBaseConfig()
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── shared-logger/          # Logging utilities
│       ├── src/
│       │   └── index.ts        # createLogger() function
│       ├── package.json
│       └── tsconfig.json
│
├── services/                    # Microservices (workspace)
│   ├── api-gateway/            # API Gateway service
│   │   ├── src/
│   │   │   └── index.ts        # Main server entry
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── auth-service/           # Authentication service
│       ├── src/
│       │   ├── index.ts        # Main server entry
│       │   ├── models/         # Database models
│       │   │   ├── database.ts
│       │   │   ├── user.ts
│       │   │   └── refreshToken.ts
│       │   ├── routes/         # API route handlers
│       │   │   └── auth.ts
│       │   ├── types/          # TypeScript types
│       │   │   └── index.ts
│       │   └── utils/          # Utility functions
│       │       ├── events.ts
│       │       ├── jwt.ts
│       │       ├── password.ts
│       │       └── validation.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── package.json                 # Root workspace configuration
├── tsconfig.json               # Root TypeScript configuration
├── bunfig.toml                 # Bun configuration
└── README.md
```

---

## Technology Stack

### Runtime & Package Manager

- **Bun v1.3.3**: Fast JavaScript runtime, bundler, and package manager
- **Bun Workspaces**: Monorepo dependency management

### Core Technologies

- **TypeScript 5.6.0**: Type-safe JavaScript
- **Node.js Types**: Type definitions for Node.js APIs

### Services Dependencies

#### Auth Service

- **MongoDB 6.3.0**: Database driver
- **jsonwebtoken 9.0.2**: JWT token generation and verification
- **bcryptjs 2.4.3**: Password hashing
- **zod 3.22.4**: Schema validation

### Development Tools

- **TypeScript**: Compiler and type checker
- **@types/node**: Node.js type definitions
- **bun-types**: Bun-specific type definitions

---

## Shared Packages

### 1. @ecom/config

**Purpose**: Centralized configuration management for all services.

**Location**: `packages/shared-config/`

**Exports**:

```typescript
export type AppEnv = 'development' | 'staging' | 'production';

export interface BaseConfig {
  env: AppEnv;
  port: number;
  serviceName: string;
}

export function loadBaseConfig(serviceName: string): BaseConfig;
```

**Usage**:

```typescript
import { loadBaseConfig } from '@ecom/config';
const config = loadBaseConfig('auth-service');
```

**Configuration Sources**:

- `NODE_ENV`: Environment (default: 'development')
- `PORT`: Service port (default: 3000)

### 2. @ecom/logger

**Purpose**: Unified logging across all services with consistent formatting.

**Location**: `packages/shared-logger/`

**Exports**:

```typescript
export function createLogger(config: BaseConfig): Logger;
```

**Logger Methods**:

- `info(...args)`: Info level logging
- `error(...args)`: Error level logging
- `warn(...args)`: Warning level logging
- `debug(...args)`: Debug level logging (only in development)

**Log Format**: `[SERVICE_NAME][ENV] [LEVEL] message`

**Usage**:

```typescript
import { createLogger } from '@ecom/logger';
const logger = createLogger(config);
logger.info('Service started');
```

---

## Services

### 1. API Gateway Service

**Location**: `services/api-gateway/`

**Purpose**: Entry point for all client requests. Routes requests to appropriate microservices.

**Port**: 4000 (default)

**Current Status**: Basic implementation with health check endpoint.

**Endpoints**:

- `GET /health` - Health check endpoint

**Dependencies**:

- `@ecom/config`
- `@ecom/logger`

**Future Enhancements**:

- Request routing to microservices
- Load balancing
- Rate limiting
- Request/response transformation
- API versioning

### 2. Auth Service

**Location**: `services/auth-service/`

**Purpose**: Handles user authentication, authorization, and JWT token management.

**Port**: 3001 (default)

**Features**:

- User registration and login
- JWT access and refresh tokens
- Password hashing with bcrypt
- Role-based access control (customer, seller, admin)
- Refresh token management
- Event publishing (UserRegistered, UserLoggedIn)

**API Endpoints**:

#### POST /auth/signup

Register a new user.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe",
  "role": "customer"
}
```

**Response** (201):

```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "customer"
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

#### POST /auth/login

Authenticate a user.

**Request**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200): Same as signup

#### POST /auth/refresh

Refresh access token.

**Request**:

```json
{
  "refreshToken": "refresh-token"
}
```

**Response** (200): New tokens

#### POST /auth/logout

Logout and invalidate refresh token.

**Request**:

```json
{
  "refreshToken": "refresh-token"
}
```

**Response** (200):

```json
{
  "message": "Logged out successfully"
}
```

#### GET /auth/me

Get current user information.

**Headers**:

```
Authorization: Bearer <access-token>
```

**Response** (200):

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

**Dependencies**:

- `@ecom/config`
- `@ecom/logger`
- `mongodb`
- `jsonwebtoken`
- `bcryptjs`
- `zod`

**Internal Structure**:

```
src/
├── index.ts              # Server setup, route registration
├── models/              # Database models
│   ├── database.ts      # MongoDB connection management
│   ├── user.ts          # User CRUD operations
│   └── refreshToken.ts  # Refresh token management
├── routes/              # API route handlers
│   └── auth.ts          # All auth endpoints
├── types/               # TypeScript type definitions
│   └── index.ts         # User, Token, Request/Response types
└── utils/               # Utility functions
    ├── events.ts        # Event publishing (placeholder)
    ├── jwt.ts           # JWT token operations
    ├── password.ts      # Password hashing
    └── validation.ts    # Zod validation schemas
```

**Background Tasks**:

- Expired token cleanup (runs every hour)

---

## Setup & Development

### Prerequisites

- **Bun v1.3.3+**: Install from [bun.sh](https://bun.sh)
- **MongoDB**: Running instance (local or remote)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd Dukaan

# Install all dependencies (workspace packages and services)
bun install
```

### Environment Variables

#### Root Level

No root-level environment variables required.

#### Auth Service

Create `.env` file in `services/auth-service/`:

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

#### API Gateway

Create `.env` file in `services/api-gateway/`:

```env
PORT=4000
NODE_ENV=development
```

### Running Services

#### Run Individual Services

```bash
# API Gateway
cd services/api-gateway
bun run dev

# Auth Service
cd services/auth-service
bun run dev
```

#### Run All Services (Future)

Currently, services must be run individually. Consider using a process manager like `concurrently` or `pm2` for development.

### Development Workflow

1. **Start MongoDB**: Ensure MongoDB is running
2. **Install Dependencies**: `bun install` (from root)
3. **Set Environment Variables**: Create `.env` files for each service
4. **Run Services**: Start each service in separate terminals
5. **Test APIs**: Use tools like `curl`, Postman, or `bun` to test endpoints

---

## API Documentation

### Authentication Flow

1. **Signup/Login**: User provides credentials → Receive access + refresh tokens
2. **API Requests**: Include `Authorization: Bearer <access-token>` header
3. **Token Refresh**: When access token expires, use refresh token to get new tokens
4. **Logout**: Invalidate refresh token

### Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Additional details (if validation error)"
}
```

**Status Codes**:

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid credentials/tokens)
- `404`: Not Found
- `409`: Conflict (e.g., user already exists)
- `500`: Internal Server Error

---

## Database Schema

### MongoDB Collections

#### users

```typescript
{
  _id: ObjectId,
  email: string,              // Unique, indexed
  password: string,            // Hashed with bcrypt
  displayName?: string,
  role: 'customer' | 'seller' | 'admin',
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes** (recommended):

- `email`: Unique index

#### refreshTokens

```typescript
{
  _id: ObjectId,
  userId: string,             // Reference to user._id
  token: string,              // JWT refresh token
  expiresAt: Date,            // Token expiration date
  createdAt: Date
}
```

**Indexes** (recommended):

- `token`: Unique index
- `userId`: Index for user lookups
- `expiresAt`: TTL index (optional, for automatic cleanup)

**Cleanup**: Expired tokens are cleaned up hourly via background task.

---

## Environment Variables

### Service Configuration

| Variable   | Service | Default       | Description                                  |
| ---------- | ------- | ------------- | -------------------------------------------- |
| `PORT`     | All     | `3000`        | Service port number                          |
| `NODE_ENV` | All     | `development` | Environment (development/staging/production) |

### Auth Service Specific

| Variable                 | Default                     | Description               |
| ------------------------ | --------------------------- | ------------------------- |
| `MONGODB_URI`            | `mongodb://localhost:27017` | MongoDB connection string |
| `MONGODB_DB_NAME`        | `ecom`                      | Database name             |
| `JWT_SECRET`             | `your-secret-key...`        | Secret for access tokens  |
| `JWT_REFRESH_SECRET`     | `your-refresh-secret...`    | Secret for refresh tokens |
| `JWT_EXPIRES_IN`         | `15m`                       | Access token expiration   |
| `JWT_REFRESH_EXPIRES_IN` | `7d`                        | Refresh token expiration  |

---

## Development Workflow

### Adding a New Service

1. Create service directory: `services/new-service/`
2. Create `package.json` with workspace dependencies:
   ```json
   {
     "name": "@ecom/new-service",
     "dependencies": {
       "@ecom/config": "workspace:*",
       "@ecom/logger": "workspace:*"
     }
   }
   ```
3. Create `tsconfig.json` extending root config
4. Implement service following existing patterns
5. Run `bun install` from root to link workspace packages

### Adding a New Shared Package

1. Create package directory: `packages/new-package/`
2. Create `package.json` with appropriate name
3. Export functionality from `src/index.ts`
4. Add path mapping to root `tsconfig.json`:
   ```json
   "paths": {
     "@ecom/new-package": ["packages/new-package/src"]
   }
   ```
5. Services can now import: `import { ... } from '@ecom/new-package'`

### TypeScript Configuration

- **Root `tsconfig.json`**: Base configuration with path mappings
- **Service `tsconfig.json`**: Extends root, adds service-specific settings
- **Package `tsconfig.json`**: Extends root, may add package-specific paths

---

## Future Considerations

### Planned Services

Based on typical e-commerce requirements:

1. **Product Service**: Product catalog, inventory management
2. **Order Service**: Order processing, payment integration
3. **Cart Service**: Shopping cart management
4. **User Service**: User profiles, preferences
5. **Notification Service**: Email, SMS, push notifications
6. **Search Service**: Product search and filtering
7. **Payment Service**: Payment gateway integration
8. **Shipping Service**: Shipping calculations, tracking

### Infrastructure Improvements

1. **Service Discovery**: Implement service registry (Consul, etcd)
2. **API Gateway Enhancements**:
   - Request routing to services
   - Load balancing
   - Rate limiting
   - Request/response transformation
3. **Event System**: Integrate event bus (Redis Pub/Sub, RabbitMQ, Kafka)
4. **Caching**: Redis for session management, caching
5. **Monitoring**: Logging aggregation, metrics, tracing
6. **Testing**: Unit tests, integration tests, E2E tests
7. **CI/CD**: Automated testing and deployment pipelines
8. **Documentation**: API documentation (OpenAPI/Swagger)

### Security Enhancements

1. **HTTPS**: TLS/SSL certificates
2. **Rate Limiting**: Prevent abuse
3. **Input Validation**: Enhanced validation across all endpoints
4. **CORS**: Configure CORS policies
5. **Security Headers**: Add security headers
6. **Audit Logging**: Track all authentication events

### Database Improvements

1. **Indexes**: Add proper indexes for performance
2. **Connection Pooling**: Optimize MongoDB connections
3. **Migrations**: Database migration system
4. **Backup Strategy**: Regular backups
5. **Replication**: MongoDB replica sets for high availability

---

## Contributing

### Code Style

- Use TypeScript for all code
- Follow existing patterns and structure
- Use shared packages for common functionality
- Maintain consistent error handling

### Testing

- Write tests for new features
- Ensure all tests pass before committing
- Test API endpoints with various scenarios

### Documentation

- Update this documentation when adding features
- Add README.md for new services
- Document API changes

---

## License

[Add license information]

---

## Contact & Support

[Add contact information]

---

**Last Updated**: 2024
**Version**: 1.0.0
