# syntax=docker/dockerfile:1.6
ARG NODE_VERSION=20

# Build
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-slim AS build
ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Run stage
ARG TARGETPLATFORM
FROM --platform=$TARGETPLATFORM nginx:1.27.1-alpine

# Environment variables
COPY --from=build /app/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh

# Serve
COPY ./nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-slim AS build
ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Assets-only image: no web server. Contains built files at /dist.
FROM --platform=$TARGETPLATFORM busybox:stable
WORKDIR /
COPY --from=build /app/dist /dist
COPY env.sh /env.sh
RUN chmod +x /env.sh
# No CMD provided intentionally — this image is for copying/volume population.
# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-slim AS build
ENV NODE_OPTIONS="--max-old-space-size=4096"
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Assets-only image: no web server. Contains built files at /dist.
FROM --platform=$TARGETPLATFORM busybox:stable
WORKDIR /
COPY --from=build /app/dist /dist
# No CMD provided intentionally — this image is for copying/volume population.
