import { Request, Response, NextFunction } from "express";
import { OrgMembership, TeamMembership, IRole } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

interface IRolesObj {
  orgRole?: IRole;
  teamRole: IRole;
}
interface IRolesCacheData {
  data: IRolesObj;
  expiresAt: number;
}

interface ITeamIdsCacheData {
  data: string[];
  expiresAt: number;
}

const CACHE_TTL = 5 * 60 * 1000;
const rolesCache = new Map<string, IRolesCacheData>();
const teamIdsCache = new Map<string, ITeamIdsCacheData>();

export const invalidateCachesForUser = (userId: string) => {
  for (const key of rolesCache.keys()) {
    if (key.startsWith(userId + ":")) {
      rolesCache.delete(key);
    }
  }

  for (const key of teamIdsCache.keys()) {
    if (key.startsWith(userId)) {
      teamIdsCache.delete(key);
    }
  }
};

const getTeamIds = async (userId: string): Promise<string[]> => {
  // Try to get from cache
  if (teamIdsCache.has(userId)) {
    const cached = teamIdsCache.get(userId);

    if (!cached) {
      throw new ApiError("TeamID cache retrieval error", 500);
    }

    if (cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  // If not in cache or expired, fetch from DB
  const teamMemberships = await TeamMembership.find({ userId })
    .select("teamId")
    .lean();
  const teamIds = teamMemberships.map((t) => t.teamId.toString());
  teamIdsCache.set(userId, {
    data: teamIds,
    expiresAt: Date.now() + CACHE_TTL,
  });
  return teamIds;
};

const getRoles = async (
  userId: string,
  orgId: string,
  currentTeamId: string
) => {
  // Try to get from cache
  if (rolesCache.has(`${userId}:${orgId}:${currentTeamId}`)) {
    const cached = rolesCache.get(`${userId}:${orgId}:${currentTeamId}`);

    if (!cached) {
      throw new ApiError("Roles cache retrieval error", 500);
    }

    if (cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  const [orgRole, teamRole] = await Promise.all([
    OrgMembership.findOne({ userId, orgId })
      .populate<{ roleId: IRole }>("roleId")
      .select("roleId")
      .lean(),

    TeamMembership.findOne({ userId, teamId: currentTeamId })
      .populate<{ roleId: IRole }>("roleId")
      .select("roleId")
      .lean(),
  ]);

  if (!orgRole) {
    throw new ApiError("User has no role in the organization", 403);
  }

  if (!teamRole) {
    throw new ApiError("User has no role in the team", 403);
  }

  const cacheData = { orgRole: orgRole.roleId, teamRole: teamRole.roleId };

  rolesCache.set(`${userId}:${orgId}:${currentTeamId}`, {
    data: cacheData,
    expiresAt: Date.now() + CACHE_TTL,
  });
  return cacheData;
};

export const addUserContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new ApiError("User not authenticated", 401);
    }

    // Get identifiers
    const sub = req.user.sub;
    const orgId = req.user.orgId;
    const currentTeamId = req.headers["x-team-id"] as string;

    // Get user team IDs
    const teamIds = await getTeamIds(sub);

    // Short circuit if user doesn't belong to selected team
    if (!teamIds.includes(currentTeamId)) {
      throw new ApiError("User does not belong to the selected team", 403);
    }

    // Get user roles to context
    const { orgRole, teamRole } = await getRoles(sub, orgId, currentTeamId);

    // Populate user context
    req.user.teamIds = teamIds;
    req.user.roles = {
      orgRole,
      teamRole,
    };
    req.user.currentTeamId = currentTeamId;

    return next();
  } catch (error) {
    next(error);
  }
};
