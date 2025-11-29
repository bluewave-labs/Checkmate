import type { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import type { Entitlements } from "@/types/entitlements.js";

type BooleanKeys<T> = {
  [K in keyof T]-?: T[K] extends boolean ? K : never;
}[keyof T];

type NumberKeys<T> = {
  [K in keyof T]-?: T[K] extends number ? K : never;
}[keyof T];

const getEntitlements = (req: Request): Entitlements | undefined => {
  return req.entitlements;
};

export const requireFeature = (flag: BooleanKeys<Entitlements>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ent = getEntitlements(req);
    if (!ent) return next(new ApiError("Entitlements unavailable", 500));
    if (!ent[flag])
      return next(new ApiError("Feature not available on plan", 403));
    return next();
  };
};

export const enforceMax = (
  key: NumberKeys<Entitlements>,
  countFn: (req: Request) => Promise<number>
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const ent = getEntitlements(req);
      if (!ent) return next(new ApiError("Entitlements unavailable", 500));
      const max = ent[key] as unknown as number;
      const used = await countFn(req);
      if (typeof max === "number" && used >= max) {
        return next(new ApiError("Plan limit reached", 403));
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export const enforceMinInterval = (
  key: NumberKeys<Entitlements>,
  readInterval: (req: Request) => number
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ent = getEntitlements(req);
    if (!ent) return next(new ApiError("Entitlements unavailable", 500));
    const min = ent[key] as unknown as number;
    const value = readInterval(req);
    if (typeof min === "number" && (typeof value !== "number" || value < min)) {
      return next(
        new ApiError(
          `Minimum interval for your plan is ${min / 1000} seconds`,
          400
        )
      );
    }
    return next();
  };
};

export const enforceRetentionBounds = (
  key: NumberKeys<Entitlements>,
  readDays: (req: Request) => number
) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const ent = getEntitlements(req);
    if (!ent) return next(new ApiError("Entitlements unavailable", 500));
    const maxDays = ent[key] as unknown as number;
    const requested = readDays(req);
    if (
      typeof maxDays === "number" &&
      (typeof requested !== "number" || requested > maxDays)
    ) {
      return next(new ApiError(`Maximum retention is ${maxDays} days`, 403));
    }
    return next();
  };
};
