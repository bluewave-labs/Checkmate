FROM node:20-alpine

WORKDIR /app

COPY ./server/package*.json ./

RUN npm install

COPY ./server/ ./

EXPOSE 52345

CMD ["node", "src/index.js"]