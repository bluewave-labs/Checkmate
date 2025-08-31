FROM node:20-alpine

# Install Sharp dependencies for Alpine Linux
RUN apk add --no-cache \
    vips-dev \
    vips-tools \
    python3 \
    make \
    g++

ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install --include=optional && npm rebuild sharp

COPY ./server ./

EXPOSE 52345

CMD ["node", "src/index.js"]