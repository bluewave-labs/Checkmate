# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-bookworm-slim AS build
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
