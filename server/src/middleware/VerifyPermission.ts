import { Request, Response, NextFunction } from "express";
import ApiError from "@/utils/ApiError.js";
import { TeamMembership } from "@/db/models/index.js";
import type { IRole } from "@/db/models/index.js";
export const hasPermission = (
  permissions: string[],
  requiredPermissions: string[]
) => {
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
      throw new ApiError("No user", 400);
    }

    const userId = tokenizedUser.sub;
    if (!userId) {
      throw new ApiError("No user ID", 400);
    }

    const orgPermissions = tokenizedUser.roles?.orgRole?.permissions || [];
    const teamPermissions = tokenizedUser.roles?.teamRole.permissions || [];

    const allPermissions = [...orgPermissions, ...teamPermissions];

    const allowed = hasPermission(allPermissions, resourceActions);
    if (!allowed) {
      throw new ApiError("Insufficient permissions", 403);
    }
    next();
  };
};

const verifyOrgPermission = (resourceActions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userContext = req.user;

    if (!userContext) {
      throw new ApiError("No user", 400);
    }

    const orgPermissions = userContext.roles?.orgRole?.permissions || [];
    const allowed = hasPermission(orgPermissions, resourceActions);
    if (!allowed) {
      throw new ApiError("Insufficient permissions", 403);
    }
    next();
  };
};

export { verifyTeamPermission, verifyOrgPermission };
