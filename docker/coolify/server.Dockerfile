FROM node:20-slim

# Install ping
RUN apt-get update \
    && apt-get install -y iputils-ping \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ../../package*.json ./

RUN npm install

COPY ../../ ./

EXPOSE 5000

CMD ["node", "index.js"]