# ---------------------
# Frontend build stage
# ---------------------
FROM --platform=$BUILDPLATFORM node:24-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./

RUN npm ci

COPY client ./

RUN npm rebuild esbuild

RUN npm run build

# ---------------------
# Backend stage
# ---------------------
FROM --platform=$BUILDPLATFORM node:24-slim AS backend

WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci

COPY server ./

COPY --from=frontend-build /app/client/dist ./public

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ["sh", "-c", "./scripts/inject-vars.sh && node ./src/index.js"]
