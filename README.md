# Notification Service

Enterprise-grade notification microservice built with TypeScript, Express, BullMQ, MongoDB, and Redis.

## Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │ ──▶ │  API     │ ──▶ │  Queue   │
└──────────┘     └──────────┘     └──────────┘
                       │                │
                       ▼                ▼
                 ┌──────────┐     ┌──────────┐
                 │ MongoDB  │     │  Worker  │
                 └──────────┘     └──────────┘
                                       │
                                       ▼
                                 ┌──────────┐
                                 │Provider(s)│
                                 └──────────┘
```

- **API Layer**: Express routes, controllers, middleware, validation
- **Service Layer**: Business logic, orchestration
- **Repository Layer**: Database access via Mongoose
- **Queue Layer**: BullMQ for async job processing
- **Worker Layer**: Job consumers with retry and DLQ support
- **Provider Layer**: Pluggable notification channels (email, SMS, push)

## Folder Structure

```
src/
├── api/              # HTTP layer
│   ├── controllers/  # Request handlers
│   ├── middlewares/   # Express middleware
│   ├── routes/       # Route definitions
│   └── validators/   # Zod schemas
├── config/           # App configuration
├── constants/        # Shared constants
├── errors/           # Custom error classes
├── events/           # Event emitter
├── jobs/             # Job processors
├── loaders/          # Startup initialization
├── models/           # Mongoose models
├── providers/        # Notification channel providers
│   ├── email/
│   ├── sms/
│   └── push/
├── queues/           # BullMQ queue definitions
├── repositories/     # Data access layer
├── services/         # Business logic
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── workers/          # BullMQ workers
├── app.ts            # Express app setup
└── server.ts         # Entry point
```

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run in development
npm run dev
```

## Running with Docker

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f app
```

## Environment Variables

| Variable        | Description              | Default                    |
|-----------------|--------------------------|----------------------------|
| NODE_ENV        | Environment              | development                |
| PORT            | Server port              | 3000                       |
| MONGO_URI       | MongoDB connection string| mongodb://localhost:27017  |
| REDIS_HOST      | Redis host               | localhost                  |
| REDIS_PORT      | Redis port               | 6379                       |
| REDIS_PASSWORD  | Redis password           |                            |
| JWT_SECRET      | JWT signing secret       |                            |
| LOG_LEVEL       | Pino log level           | info                       |
| QUEUE_PREFIX    | BullMQ queue prefix      | notifications              |
| SERVICE_NAME    | Service identifier       | notification-service       |

## Health Endpoint

```
GET /api/v1/health
```

Response (200):
```json
{
  "status": "healthy",
  "uptime": 1234.56,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "mongodb": "connected",
  "redis": "connected",
  "memory": { ... },
  "pid": 1,
  "nodeVersion": "v20.x.x",
  "environment": "production",
  "serviceName": "notification-service"
}
```

## API Endpoints

| Method | Path                            | Description                |
|--------|----------------------------------|----------------------------|
| POST   | /api/v1/notifications            | Send a notification        |
| GET    | /api/v1/notifications            | List notifications         |
| GET    | /api/v1/notifications/:id        | Get notification by ID     |
| PATCH  | /api/v1/notifications/:id/cancel | Cancel pending notification|
| GET    | /api/v1/notifications/stats      | Get notification stats     |
| GET    | /api/v1/health                   | Health check               |

## Queue System

Built with BullMQ.

- **Retry Strategy**: Exponential backoff (2s, 4s, 8s, ... max 30s)
- **Dead Letter Queue**: Notifications moved to `dead-letter` status after max retries
- **Concurrency**: 10 jobs processed simultaneously per worker
- **Event Logging**: All queue events logged via Pino
- **Job Removal**: Completed jobs removed after 24h, failed after 7 days

## Scripts

```bash
npm run dev        # Development with hot-reload
npm run build      # TypeScript compilation
npm start          # Production start
npm test           # Run tests
npm run lint       # Lint source code
npm run lint:fix   # Auto-fix lint issues
npm run format     # Format with Prettier
```

## Provider System

Providers follow a common interface:

```typescript
interface NotificationProvider {
  readonly name: string;
  send(options: SendOptions): Promise<ProviderResponse>;
}
```

Built-in providers:
- EmailProvider (SendGrid, SES, Mailgun — plug in your client)
- SmsProvider (Twilio, Vonage, SNS — plug in your client)
- PushProvider (FCM, APNs, Web Push — plug in your client)

Add new providers by implementing `NotificationProvider` and registering via `providerFactory.registerProvider()`.

## Future Improvements

- [ ] Authentication & authorization middleware
- [ ] Template engine for notifications
- [ ] Webhook delivery support
- [ ] Rate limiting per recipient/channel
- [ ] Monitoring with Prometheus metrics
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Notification preferences per user
- [ ] Batch notification processing
- [ ] Admin dashboard API
- [ ] Database migrations tooling
