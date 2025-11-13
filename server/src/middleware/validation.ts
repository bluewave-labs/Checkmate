import { Request, Response, NextFunction } from "express";
import { z, ZodObject, ZodRawShape, ZodError } from "zod";
import { getChildLogger } from "@/logger/Logger.js";

const logger = getChildLogger("ValidationMiddleware");

export const validateBody = <T extends ZodObject<ZodRawShape>>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.strict().parse(req.body); // enforce strict keys
      next();
    } catch (err) {
      logger.error("Error validating request body:", err);
      if (err instanceof ZodError) {
        return res.status(400).json({ errors: z.treeifyError(err) });
      }
      return res.status(500).json({ message: "Server error" });
    }
  };
};

export type TypedQueryRequest<T> = Request & { validatedQuery: T };

export const validateQuery = <T extends ZodObject<ZodRawShape>>(schema: T) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.validatedQuery = schema.strict().parse(req.query);
      next();
    } catch (err) {
      logger.error("Error validating request query:", err);
      if (err instanceof ZodError) {
        return res.status(400).json({ errors: z.treeifyError(err) });
      }
      return res.status(500).json({ message: "Server error" });
    }
  };
};
