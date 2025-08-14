FROM node:20-alpine

ENV NODE_OPTIONS="--max-old-space-size=2048"

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server ./

EXPOSE 52345

CMD ["node", "src/index.js"]