FROM node:20-alpine

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server/ ./

EXPOSE 5000

CMD ["node", "index.js"]