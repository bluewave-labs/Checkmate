FROM node:20-slim AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client ./
RUN npm run build

FROM node:20-slim AS backend

WORKDIR /app/server

COPY server ./

COPY --from=frontend-build /app/client/dist ./public

RUN npm ci --omit=optional

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ./scripts/inject-vars.sh && node ./src/index.js
