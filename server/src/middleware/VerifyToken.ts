import { Request, Response, NextFunction } from "express";
import { decode } from "@/utils/JWTUtils.js";
import ApiError from "@/utils/ApiError.js";
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  if (!token) {
    const error = new ApiError("No token provided", 401);
    return next(error);
  }

  try {
    const decoded = decode(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export { verifyToken };
