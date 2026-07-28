# ---------------------
# Frontend build stage
# ---------------------
# Build on the host arch (BUILDPLATFORM) rather than under QEMU — the output is
# pure JS so it's arch-independent, and this avoids the esbuild host/native
# binary version mismatch under emulation.
FROM --platform=$BUILDPLATFORM node:22-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client ./

RUN npm run build

# ---------------------
# Backend stage
# ---------------------
FROM node:22-slim AS app

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

COPY server/package*.json ./

RUN npm ci

COPY server ./

RUN npm run build

COPY --from=frontend-build /app/client/dist ./public

USER node

EXPOSE 52345 52346

CMD ["node", "dist/index.js"]
