FROM node:20-slim AS frontend-build

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build

FROM node:20-slim AS app

WORKDIR /app/server

COPY server ./

COPY --from=frontend-build /app/client/dist ./public

RUN npm install

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ./scripts/inject-vars.sh && node ./src/index.js
