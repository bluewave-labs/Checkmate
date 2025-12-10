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
