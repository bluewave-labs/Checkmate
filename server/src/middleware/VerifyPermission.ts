import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import { PERMISSIONS } from "@/types/permissions.js";
export const hasPermission = (
  permissions: string[],
  requiredPermissions: string[]
) => {
  if (requiredPermissions.includes(PERMISSIONS.master)) {
    return permissions.includes(PERMISSIONS.master);
  }

  if (permissions.includes("*")) return true;

  const matches = (requiredPermission: string, userPermission: string) => {
    if (userPermission === requiredPermission) return true;
    if (userPermission.endsWith(".*")) {
      const prefix = userPermission.slice(0, -2);
      return requiredPermission.startsWith(prefix + ".");
    }
    return false;
  };

  return requiredPermissions.every((requiredPermission) => {
    return permissions.some((permission) =>
      matches(requiredPermission, permission)
    );
  });
};

const verifyTeamPermission = (resourceActions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const tokenizedUser = req.user;

    if (!tokenizedUser) {
      return next(new ApiError("User not authenticated", 401));
    }

    const userId = tokenizedUser.sub;
    if (!userId) {
      return next(new ApiError("User not authenticated", 401));
    }

    const orgPermissions = tokenizedUser.roles?.orgRole?.permissions || [];
    const teamPermissions = tokenizedUser.roles?.teamRole.permissions || [];

    const allPermissions = [...orgPermissions, ...teamPermissions];

    const allowed = hasPermission(allPermissions, resourceActions);
    if (!allowed) {
      return next(new ApiError("Insufficient permissions", 403));
    }
    next();
  };
};

const verifyOrgPermission = (resourceActions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userContext = req.user;

    if (!userContext) {
      return next(new ApiError("User not authenticated", 401));
    }

    const orgPermissions = userContext.roles?.orgRole?.permissions || [];
    const allowed = hasPermission(orgPermissions, resourceActions);
    if (!allowed) {
      return next(new ApiError("Insufficient permissions", 403));
    }
    next();
  };
};

export { verifyTeamPermission, verifyOrgPermission };
