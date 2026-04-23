# ---------------------
# Frontend build stage
# ---------------------
# Build on the host arch (BUILDPLATFORM) rather than under QEMU — the output is
# pure JS so it's arch-independent, and this avoids the esbuild host/native
# binary version mismatch under emulation.
FROM --platform=$BUILDPLATFORM node:20-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client ./

RUN npm run build

# ---------------------
# Backend stage
# ---------------------
FROM node:20-slim AS backend

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

COPY server/package.json ./

RUN npm install

COPY server ./

RUN chmod +x ./scripts/inject-vars.sh

RUN npm run build

COPY --from=frontend-build /app/client/dist ./public

EXPOSE 52345

CMD ["sh", "-c", "./scripts/inject-vars.sh && node ./dist/index.js"]
