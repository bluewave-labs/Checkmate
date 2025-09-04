# ---------------------
# Frontend build stage
# ---------------------
FROM node:24-slim AS frontend-build

WORKDIR /app/client

COPY client/package.json ./

RUN npm install

RUN npm install esbuild@0.25.5 --build-from-source

COPY client ./

RUN npm run build

# ---------------------
# Backend stage
# ---------------------
FROM node:24-slim AS backend

WORKDIR /app/server

COPY server/package.json ./

RUN npm install

COPY server ./

COPY --from=frontend-build /app/client/dist ./public

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ["sh", "-c", "./scripts/inject-vars.sh && node ./src/index.js"]
