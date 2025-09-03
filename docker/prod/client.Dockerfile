FROM node:20-slim AS build

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

COPY ./client/package*.json ./

RUN npm install

COPY ./client .

RUN npm run build

FROM nginx:1.27.1-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/env.sh /docker-entrypoint.d/env.sh
RUN chmod +x /docker-entrypoint.d/env.sh
CMD ["nginx", "-g", "daemon off;"]