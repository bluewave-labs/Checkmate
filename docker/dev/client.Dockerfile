FROM node:20-alpine AS build

ENV NODE_OPTIONS="--max-old-space-size=4096"

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make g++  \
    gcc \
    libc-dev \
    linux-headers \
    libusb-dev \
    eudev-dev


COPY ./client/package*.json ./

RUN npm install

COPY ./client .

RUN npm run build-dev

RUN npm install -g serve

CMD ["serve","-s", "dist", "-l", "5173"]
