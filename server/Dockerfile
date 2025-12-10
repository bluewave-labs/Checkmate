FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 52345
CMD ["node", "dist/index.js"]
# syntax=docker/dockerfile:1.6

ARG NODE_VERSION=20

## Build stage (with dev deps, native to build platform)
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

## Production deps (native to target platform)
FROM --platform=$TARGETPLATFORM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

## Runtime image
FROM --platform=$TARGETPLATFORM node:${NODE_VERSION}-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY --from=build /app/dist ./dist
EXPOSE 52345
CMD ["node", "dist/index.js"]
