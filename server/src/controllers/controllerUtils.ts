import { AppError } from "@/utils/AppError.js";
import { Monitor, type MonitorType, MonitorTypes, UserRole } from "@/types/index.js";
import sslChecker, { SSLDetails } from "ssl-checker";
type SSLCheckerType = typeof sslChecker;

export const fetchMonitorCertificate = async (checker: SSLCheckerType, monitor: Monitor): Promise<SSLDetails> => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	const cert = await checker(hostname);
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}
	return cert;
};
export const requireString = (value: unknown, fieldName: string): string => {
	if (typeof value === "string" && value.trim().length > 0) {
		return value;
	}
	throw new AppError({ message: `${fieldName} is required`, status: 400 });
};

export const optionalString = (value: unknown, fieldName: string): string | undefined => {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === "string") {
		return value;
	}
	throw new AppError({ message: `${fieldName} must be a string`, status: 400 });
};

export const optionalNumber = (value: unknown, fieldName: string): number | undefined => {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === "number" && Number.isFinite(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}
	}
	throw new AppError({ message: `${fieldName} must be a number`, status: 400 });
};

export const optionalBoolean = (value: unknown, fieldName: string): boolean | undefined => {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === "boolean") {
		return value;
	}
	if (typeof value === "string") {
		if (value === "true") {
			return true;
		}
		if (value === "false") {
			return false;
		}
	}
	throw new AppError({ message: `${fieldName} must be a boolean`, status: 400 });
};

export const parseMonitorTypeFilter = (value: unknown): MonitorType | MonitorType[] | undefined => {
	const parseSingle = (input: unknown): MonitorType => {
		if (typeof input !== "string") {
			throw new AppError({ message: "Monitor type must be a string", status: 400 });
		}
		if (!MonitorTypes.includes(input as MonitorType)) {
			throw new AppError({ message: `Invalid monitor type: ${input}`, status: 400 });
		}
		return input as MonitorType;
	};

	if (value === undefined) {
		return undefined;
	}
	if (Array.isArray(value)) {
		return value.map((entry) => parseSingle(entry));
	}
	return parseSingle(value);
};

export const parseSortOrder = (value: unknown): "asc" | "desc" | undefined => {
	if (value === undefined) {
		return undefined;
	}
	if (value === "asc" || value === "desc") {
		return value;
	}
	throw new AppError({ message: "order must be either 'asc' or 'desc'", status: 400 });
};

export const requireTeamId = (teamId?: string): string => {
	if (!teamId) {
		throw new AppError({ message: "Team ID is required", status: 400 });
	}
	return teamId;
};

export const requireUserId = (userId?: string): string => {
	if (!userId) {
		throw new AppError({ message: "User ID is required", status: 400 });
	}
	return userId;
};
export const requireUserEmail = (userEmail?: string): string => {
	if (!userEmail) {
		throw new AppError({ message: "User email is required", status: 400 });
	}
	return userEmail;
};

export const requireFirstName = (firstName?: string): string => {
	if (!firstName) {
		throw new AppError({ message: "First name is required", status: 400 });
	}
	return firstName;
};

export const requireUserRoles = (userRoles?: UserRole[]): UserRole[] => {
	if (!userRoles || userRoles.length === 0) {
		throw new AppError({ message: "User roles are required", status: 400 });
	}
	return userRoles;
};
