FROM node:20-alpine AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client ./
RUN npm run build

FROM node:20-alpine AS backend

# Install Sharp dependencies for Alpine Linux
RUN apk add --no-cache \
    vips-dev \
    vips-tools \
    python3 \
    make \
    g++

WORKDIR /app/server

COPY server ./

COPY --from=frontend-build /app/client/dist ./public

RUN npm ci --include=optional && npm rebuild sharp

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ./scripts/inject-vars.sh && node ./src/index.js
