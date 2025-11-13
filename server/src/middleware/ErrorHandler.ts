import { Request, Response, NextFunction } from "express";
import { getChildLogger } from "@/logger/Logger.js";
import ApiError from "@/utils/ApiError.js";
const logger = getChildLogger("ErrorHandler");

export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error(err);
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message });
  } else {
    res.status(500).json({ message: err.message || "Internal Server Error" });
  }
};
