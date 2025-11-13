import mongoose from "mongoose";
import { getChildLogger } from "@/logger/Logger.js";
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/saas";

const RETRY_INTERVAL_MS = 2000; // wait 2 seconds between retries
const MAX_RETRIES = 10; // number of retries before giving up
const logger = getChildLogger("MongoDB");

export const connectDatabase = async (): Promise<boolean> => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(MONGODB_URI);
      logger.info("Connected to MongoDB");
      return true;
    } catch (error) {
      logger.error(
        `MongoDB connection attempt ${attempt} failed. Retrying in ${RETRY_INTERVAL_MS}ms...`,
        error
      );

      if (attempt === MAX_RETRIES) {
        logger.error(
          "Could not connect to MongoDB after max retries. Exiting."
        );
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    }
  }

  return false;
};
export const disconnectDatabase = async (): Promise<boolean> => {
  try {
    await mongoose.disconnect();
    logger.info("Disconnected from MongoDB");
    return true;
  } catch (error) {
    logger.error("MongoDB disconnection error:", error);
    return false;
  }
};
