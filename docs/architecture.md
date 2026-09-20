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
