FROM node:20-alpine AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build

FROM node:20-alpine AS app

WORKDIR /app/server

COPY server ./

COPY --from=frontend-build /app/client/dist ./public

RUN npm install

RUN chmod +x ./scripts/inject-vars.sh

EXPOSE 52345

CMD ./scripts/inject-vars.sh && node ./index.js
