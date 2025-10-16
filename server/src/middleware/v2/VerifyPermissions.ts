import { Request, Response, NextFunction } from "express";
import ApiError from "../../utils/ApiError.js";
import { User, IUser, Role, IRole } from "../../db/v2/models/index.js";

const rolesCache = new Map<string, { roles: IRole[]; timestamp: number }>();
// const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_TTL = 1; // 30 minutes
const MAX_CACHE_SIZE = 1000;

const getCachedRoles = async (userId: string) => {
	if (rolesCache.size >= MAX_CACHE_SIZE) {
		const oldestKey = rolesCache.keys().next().value;
		if (!oldestKey) return null;
		rolesCache.delete(oldestKey);
	}

	const cached = rolesCache.get(userId);

	if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
		return cached.roles;
	}

	const user: IUser | null = await User.findById(userId);
	if (!user) {
		return null;
	}

	const roles = await Role.find({ _id: { $in: user.roles } });
	rolesCache.set(userId, { roles, timestamp: Date.now() });
	return roles;
};

const hasPermission = (roles: IRole[], requiredPermissions: string[]) => {
	const userPermissions = [...new Set(roles.flatMap((role) => role.permissions))];

	if (userPermissions.includes("*")) return true;

	const matches = (requiredPermission: string, userPermission: string) => {
		if (userPermission === requiredPermission) return true;
		if (userPermission.endsWith(".*")) {
			const prefix = userPermission.slice(0, -2);
			return requiredPermission.startsWith(prefix + ".");
		}
		return false;
	};

	return requiredPermissions.every((requiredPermission) => {
		return userPermissions.some((userPermission) => matches(requiredPermission, userPermission));
	});
};

const verifyPermission = (resourceActions: string[]) => {
	return async (req: Request, res: Response, next: NextFunction) => {
		const tokenizedUser = req.user;

		if (!tokenizedUser) {
			throw new ApiError("No user", 400);
		}

		const userId = tokenizedUser.sub;
		if (!userId) {
			throw new ApiError("No user ID", 400);
		}

		const userRoles = await getCachedRoles(userId);
		if (!userRoles) {
			throw new ApiError("User roles not found", 400);
		}
		const allowed = hasPermission(userRoles, resourceActions);
		if (!allowed) {
			throw new ApiError("Insufficient permissions", 403);
		}
		next();
	};
};

export { verifyPermission };
