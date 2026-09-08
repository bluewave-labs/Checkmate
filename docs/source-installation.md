# Source Installation Guide

This guide explains how to run Checkmate without Docker. It is useful when you
want the monitoring server and web client to run directly on a host or VM.

Checkmate is split into two applications:

- `server/`: Node.js API and background monitor workers
- `client/`: React static web application

MongoDB is still required. Redis and the Capture agent are optional.

## Prerequisites

- Node.js 20 or newer
- npm
- MongoDB 6 or newer
- A reverse proxy or static file server for the built client, such as Nginx or
  Caddy

## 1. Prepare MongoDB

Create or choose a MongoDB database for Checkmate. For a local MongoDB service,
the connection string can look like this:

```bash
mongodb://127.0.0.1:27017/uptime_db
```

Use a proper MongoDB user, password, and network policy for production
deployments.

## 2. Build and Start the Server

Install dependencies and build the backend:

```bash
cd server
npm install
npm run build
```

Start the server with the required environment variables:

```bash
NODE_ENV=production \
PORT=52345 \
DB_CONNECTION_STRING="mongodb://127.0.0.1:27017/uptime_db" \
JWT_SECRET="replace-with-a-long-random-secret" \
CLIENT_HOST="https://checkmate.example.com" \
node dist/index.js
```

The API will listen on `PORT`, which defaults to `52345`.

For production, run this command under a process manager such as `systemd`,
PM2, or your platform supervisor.

## 3. Build and Serve the Client

The client is a static Vite build. Configure the public API URL before building:

```bash
cd client
cat > .env.production <<'EOF'
VITE_APP_API_BASE_URL=https://checkmate.example.com/api/v1
VITE_APP_CLIENT_HOST=https://checkmate.example.com
VITE_APP_LOG_LEVEL=error
EOF

npm install
npm run build
```

Serve `client/dist` with a static web server. A minimal Nginx server block:

```nginx
server {
    listen 80;
    server_name checkmate.example.com;

    root /opt/checkmate/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/v1/ {
        proxy_pass http://127.0.0.1:52345/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If you serve the API on a different hostname, set `VITE_APP_API_BASE_URL` to
that public API URL and update `CLIENT_HOST` on the server to the public client
URL.

## 4. Optional Capture Agent

Checkmate can monitor HTTP, ping, port, SSL, DNS, game, gRPC, and page speed
targets without Docker. Server infrastructure metrics require the optional
[Capture agent](https://github.com/bluewave-labs/capture).

Install and run Capture on each host you want to inspect, then add that host in
Checkmate as an infrastructure monitor.

## Notes

- Docker container monitoring requires access to a Docker daemon. If you do not
  run Docker, use the other monitor types.
- Keep `JWT_SECRET` stable after first startup. Changing it invalidates existing
  sessions.
- Build the client again whenever the public API URL changes, because Vite
  embeds these values into the static bundle.
