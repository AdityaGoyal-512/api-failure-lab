# API Failure Lab

API Failure Lab is a developer testing platform for creating controlled, unreliable API dependencies. It will let developers test how their applications behave when a dependency is slow, fails, returns selected HTTP statuses, or enforces rate limits.

> **Status:** Under development. The project foundation and authentication are currently implemented.

## Problem statement

External APIs are not always available, fast, or predictable. Teams need a safe, repeatable way to test their application's resilience without causing failures in production systems. API Failure Lab will provide that controlled environment.

## Current architecture

```text
React (Vite)
  |
  v
Node.js + Express
  |
  v
MongoDB Atlas
```

The frontend currently displays a small proof-of-life page and reads its API base URL from `VITE_API_BASE_URL`. The backend exposes `GET /health` and `GET /api/v1/health`, and connects to MongoDB Atlas at startup through `MONGO_URI`.

Authentication is available through `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, and protected `GET /api/v1/auth/me`. JWT configuration is supplied only through `JWT_SECRET` and `JWT_EXPIRES_IN` environment variables.

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

This diagram is a roadmap only; Nginx, Redis, workers, and scaling are not implemented yet.

## Technology stack

- React and Vite
- Node.js and Express
- MongoDB Atlas and Mongoose
- Docker and Docker Compose

## Local setup

1. Copy `.env.example` to `.env`. Replace the `MONGO_URI` placeholder with your MongoDB Atlas connection string. Do not commit this file.
2. Install dependencies:

   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Run the backend and frontend in separate terminals:

   ```bash
   cd backend && npm run dev
   cd frontend && npm run dev
   ```

4. Visit `http://localhost:5173` and check `http://localhost:5000/health` or `http://localhost:5000/api/v1/health`.

## Docker setup

From the repository root:

```bash
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend health check: `http://localhost:5000/health`
- MongoDB Atlas is external and configured through the untracked `MONGO_URI` environment variable.

Stop the stack with `docker compose down`.

Docker Compose starts only the frontend and backend. It does not provision a database service.

## Roadmap

1. Project foundation
2. Authentication
3. Simulation management
4. API simulation engine
5. Redis rate limiting
6. Redis caching
7. Real-time monitoring with Socket.IO
8. Load testing
9. Worker system
10. Nginx and horizontal scaling
11. Failure handling
12. Testing, optimization, and documentation
