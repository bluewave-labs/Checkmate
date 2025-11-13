import winston from "winston";
import MemoryTransport from "@/logger/MemoryTransport.js";
import { config } from "@/config/index.js";

const { combine, timestamp, errors, colorize, printf, json } = winston.format;

const buildLogMsg = (info: winston.Logform.TransformableInfo) => {
  if (!info) return "Logging error: no info provided";
  const timestamp = info.timestamp;
  const level = info.level;
  const message = info.message;
  const service = info.service;
  const stack = info.stack || "";
  return `[${timestamp}]${
    service ? ` [${service}]` : ""
  } ${level}: ${message} ${stack}`;
};

export const memoryTransport = new MemoryTransport({
  maxItems: Number(process.env.IN_MEMORY_LOG_LIMIT) || 100,
  format: combine(timestamp(), errors({ stack: true }), json()),
});

const logger = winston.createLogger({
  level: config.LOG_LEVEL || "info",

  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp(),
        colorize({ all: true }),
        errors({ stack: true }),
        printf((info) => {
          return buildLogMsg(info);
        })
      ),
    }),
    memoryTransport,
    new winston.transports.File({
      filename: "logs/server.log",
      level: "warn",
      format: combine(timestamp(), json()),
    }),
  ],
});

export const getChildLogger = (serviceName: string): winston.Logger => {
  return logger.child({ service: serviceName });
};

export default logger;
