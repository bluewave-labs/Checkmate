import { AppError } from "@/utils/AppError.js";
import { type MonitorType, MonitorTypes, UserRole } from "@/types/index.js";

const fetchMonitorCertificate = async (sslChecker: any, monitor: any): Promise<any> => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	const cert = await sslChecker(hostname);
	// Throw an error if no cert or if cert.validTo is not present
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}
	return cert;
};
const requireString = (value: unknown, fieldName: string): string => {
	if (typeof value === "string" && value.trim().length > 0) {
		return value;
	}
	throw new AppError({ message: `${fieldName} is required`, status: 400 });
};

const optionalString = (value: unknown, fieldName: string): string | undefined => {
	if (value === undefined) {
		return undefined;
	}
	if (typeof value === "string") {
		return value;
	}
	throw new AppError({ message: `${fieldName} must be a string`, status: 400 });
};

const optionalNumber = (value: unknown, fieldName: string): number | undefined => {
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

const optionalBoolean = (value: unknown, fieldName: string): boolean | undefined => {
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

const parseMonitorTypeFilter = (value: unknown): MonitorType | MonitorType[] | undefined => {
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

const parseSortOrder = (value: unknown): "asc" | "desc" | undefined => {
	if (value === undefined) {
		return undefined;
	}
	if (value === "asc" || value === "desc") {
		return value;
	}
	throw new AppError({ message: "order must be either 'asc' or 'desc'", status: 400 });
};

const requireTeamId = (teamId?: string): string => {
	if (!teamId) {
		throw new AppError({ message: "Team ID is required", status: 400 });
	}
	return teamId;
};

const requireUserId = (userId?: string): string => {
	if (!userId) {
		throw new AppError({ message: "User ID is required", status: 400 });
	}
	return userId;
};
const requireUserEmail = (userEmail?: string): string => {
	if (!userEmail) {
		throw new AppError({ message: "User email is required", status: 400 });
	}
	return userEmail;
};

export const requireUserRoles = (userRoles?: UserRole[]): UserRole[] => {
	if (!userRoles || userRoles.length === 0) {
		throw new AppError({ message: "User roles are required", status: 400 });
	}
	return userRoles;
};

export {
	fetchMonitorCertificate,
	requireString,
	optionalString,
	optionalNumber,
	optionalBoolean,
	parseMonitorTypeFilter,
	parseSortOrder,
	requireTeamId,
	requireUserId,
	requireUserEmail,
};
