FROM node:20-slim

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server ./

RUN npm run build

RUN cp -r src/templates dist/templates

EXPOSE 52345

CMD ["node", "dist/index.js"]