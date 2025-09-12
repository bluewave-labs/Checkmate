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

EXPOSE 52345

CMD ["node", "src/index.js"]