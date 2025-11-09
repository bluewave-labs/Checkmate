FROM node:20-slim AS frontend-build

ARG VITE_APP_VERSION

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build

FROM node:20-slim AS app

ARG VITE_APP_VERSION

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/server

COPY server ./


RUN npm install

RUN npm run build

COPY --from=frontend-build /app/client/dist ./public

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ./scripts/inject-vars.sh && node ./dist/index.js
