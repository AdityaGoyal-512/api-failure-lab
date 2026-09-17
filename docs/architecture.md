# Architecture

## Currently implemented

```text
React (Vite)
  |
  v
Node.js + Express
  |
  v
MongoDB
```

The React frontend is a minimal proof-of-life page. Express provides `GET /health`, and Mongoose establishes the MongoDB connection when the backend starts. Docker Compose runs the frontend, backend, and MongoDB services.

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

This is a high-level future design, not the current implementation. Nginx, multiple Node servers, Redis, queues, Pub/Sub, and workers will be introduced only in later phases.

