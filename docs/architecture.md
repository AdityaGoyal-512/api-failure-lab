# Architecture

## Currently implemented

```text
React (Vite)
  |
  v
Node.js + Express
  |
  v
MongoDB Atlas
```

The React frontend is a minimal proof-of-life page and reads its backend base URL from `VITE_API_BASE_URL`. Express provides `GET /health` and versioned `GET /api/v1/health`; Mongoose establishes a MongoDB Atlas connection using `MONGO_URI` when the backend starts. Docker Compose runs only the frontend and backend application services.

Authentication is implemented at `/api/v1/auth`. Passwords are hashed before storage, JWTs use environment-provided configuration, and protected routes authenticate the bearer token before resolving the current user.

Simulation management is implemented at `/api/v1/simulations`. Each definition belongs to its authenticated creator, and all simulation queries include that owner identity.

Simulation execution is public at `/api/v1/sim/<simulationId><path>` and does not require JWT authentication. It loads the saved definition, exactly matches its method and path, waits asynchronously for `latencyMs`, then uses secure Node.js randomness to apply `failureRate`. A successful request returns `successResponse`; an intentional failure returns `failureStatusCode` with `failureResponse`. Authenticated simulation CRUD remains protected.

## Planned architecture

```text
                         React
                           |
                           v
                         Nginx
                           |
                  +--------+--------+
                  |                 |
                  v                 v
             Node Server 1    Node Server 2
                  |                 |
                  +--------+--------+
                           |
                         Redis
                  /        |        \
               Cache     Queue     Pub/Sub
                           |
                           v
                        Workers
                           |
                           v
                        MongoDB
```

This is a high-level future design, not the current implementation. Redis, Socket.IO, worker processes, Nginx, horizontal scaling, and load testing are planned only and will be introduced in later phases.
