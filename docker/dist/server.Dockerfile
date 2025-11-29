FROM node:20-slim

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server/ ./

RUN npm run build

EXPOSE 52345

CMD ["node", "dist/index.js"]