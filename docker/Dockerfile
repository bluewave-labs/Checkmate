# ---------------------
# Frontend build stage
# ---------------------
# Build on the host arch (BUILDPLATFORM) rather than under QEMU — the output is
# pure JS so it's arch-independent, and this avoids the esbuild host/native
# binary version mismatch under emulation.
FROM --platform=$BUILDPLATFORM node:24-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client ./

RUN npm run build

# ---------------------
# Backend stage
# ---------------------
FROM node:24-slim AS app

# Install ping, and mongodump/mongorestore for Checkmate Connect backups.
# MongoDB ships no debian12-arm64 tools build; the ubuntu2204 arm64 one is
# glibc-compatible with bookworm.
ARG TARGETARCH
ARG MONGO_TOOLS_VERSION=100.12.2
RUN apt-get update \
    && apt-get install -y --no-install-recommends iputils-ping curl ca-certificates libgssapi-krb5-2 \
    && PLAT=$([ "$TARGETARCH" = "arm64" ] && echo ubuntu2204-arm64 || echo debian12-x86_64) \
    && TOOLS="mongodb-database-tools-${PLAT}-${MONGO_TOOLS_VERSION}" \
    && curl -fsSL "https://fastdl.mongodb.org/tools/db/${TOOLS}.tgz" \
       | tar -xz --strip-components=2 -C /usr/local/bin "${TOOLS}/bin/mongodump" "${TOOLS}/bin/mongorestore" \
    && apt-get purge -y curl \
    && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

COPY server/package*.json ./

RUN npm ci

COPY server ./

RUN npm run build

COPY --from=frontend-build /app/client/dist ./public

ENV CHECKMATE_DEPLOYMENT=docker

USER node

EXPOSE 52345 52346

CMD ["node", "dist/index.js"]
