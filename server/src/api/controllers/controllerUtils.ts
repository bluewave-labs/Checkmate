import { AppError } from "@/utils/AppError.js";
import { Monitor, MonitorTypes, type MonitorType } from "@/domain/monitors/monitor.type.js";
import { UserRole } from "@/domain/users/user.type.js";
import sslChecker, { SSLDetails } from "ssl-checker";
import * as whoiser from "whoiser";
import { parse as parseDomain } from "tldts";
type SSLCheckerType = typeof sslChecker;
type WhoisModule = typeof whoiser;

const DEFAULT_HTTPS_PORT = 443;

export const fetchMonitorCertificate = async (checker: SSLCheckerType, monitor: Monitor): Promise<SSLDetails> => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	// URL.port is "" for default ports, so fall back to 443; without this the
	// certificate of a monitor on a non-standard port was probed on 443.
	const port = monitorUrl.port === "" ? DEFAULT_HTTPS_PORT : Number(monitorUrl.port);
	const cert = await checker(hostname, { port });
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}
	return cert;
};

const WHOIS_TIMEOUT_MS = 10_000;
const DOMAIN_EXPIRY_CACHE_POSITIVE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DOMAIN_EXPIRY_CACHE_NEGATIVE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EXPIRY_DATE_KEY_PATTERN = /(expiry date|expiration|paid-?till|registration expiration)/i;

export interface DomainExpiryResult {
	domain: string | null;
	expiryDate: string | null;
}

interface DomainExpiryCacheEntry extends DomainExpiryResult {
	expiresAt: number;
}

interface DomainExpiryCache {
	get(domain: string): DomainExpiryResult | undefined;
	set(domain: string, result: DomainExpiryResult): void;
}

export const createDomainExpiryCache = (positiveTtlMs: number, negativeTtlMs: number): DomainExpiryCache => {
	const entries = new Map<string, DomainExpiryCacheEntry>();

	return {
		get(domain: string): DomainExpiryResult | undefined {
			const entry = entries.get(domain);
			if (entry === undefined) {
				return undefined;
			}
			if (entry.expiresAt <= Date.now()) {
				entries.delete(domain);
				return undefined;
			}
			return { domain: entry.domain, expiryDate: entry.expiryDate };
		},
		set(domain: string, result: DomainExpiryResult): void {
			entries.set(domain, {
				...result,
				expiresAt: Date.now() + (result.expiryDate === null ? negativeTtlMs : positiveTtlMs),
			});
		},
	};
};

const domainExpiryCache = createDomainExpiryCache(DOMAIN_EXPIRY_CACHE_POSITIVE_TTL_MS, DOMAIN_EXPIRY_CACHE_NEGATIVE_TTL_MS);

export const extractDomainExpiryDate = (whoisData: object): string | null => {
	const matchingKey = Object.keys(whoisData).find((key) => EXPIRY_DATE_KEY_PATTERN.test(key));
	if (!matchingKey) {
		return null;
	}
	const raw = extractString((whoisData as Record<string, unknown>)[matchingKey] ?? null);
	if (!raw) {
		return null;
	}

	const parsed = parseDomainExpiryValue(raw);
	return parsed === null ? null : parsed.toISOString();
};

const parseDomainExpiryValue = (raw: string): Date | null => {
	// Some registries (e.g. Nominet for .uk) return "14-Feb-2027" style values.
	const monthMatch = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(raw.trim());
	if (monthMatch) {
		const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
		const monthIndex = months.indexOf((monthMatch[2] ?? "").toLowerCase());
		if (monthIndex !== -1) {
			const parsed = new Date(Date.UTC(Number(monthMatch[3]), monthIndex, Number(monthMatch[1])));
			if (!Number.isNaN(parsed.getTime())) {
				return parsed;
			}
		}
	}

	const date = new Date(raw);
	if (!Number.isNaN(date.getTime())) {
		return date;
	}
	return null;
};

export const fetchMonitorDomain = async (
	client: WhoisModule,
	monitor: Monitor,
	cache: DomainExpiryCache = domainExpiryCache
): Promise<DomainExpiryResult> => {
	const monitorUrl = new URL(monitor.url);
	const registrableDomain = parseDomain(monitorUrl.hostname).domain;
	if (registrableDomain === null) {
		// Bare IP addresses, localhost, and other non-domain hosts have no WHOIS expiry.
		return { domain: null, expiryDate: null };
	}

	const cached = cache.get(registrableDomain);
	if (cached !== undefined) {
		return cached;
	}

	const result = await client.domain(registrableDomain, { timeout: WHOIS_TIMEOUT_MS });
	const firstServerData = Object.values(result)[0];
	const expiryDate = extractDomainExpiryDate(
		typeof firstServerData === "object" && firstServerData !== null && !Array.isArray(firstServerData) ? firstServerData : {}
	);
	const domainExpiry: DomainExpiryResult = { domain: registrableDomain, expiryDate };
	cache.set(registrableDomain, domainExpiry);
	return domainExpiry;
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

export const extractString = (value: unknown): string | undefined => {
	const candidate = Array.isArray(value) ? value[0] : value;
	if (typeof candidate !== "string" || candidate.length === 0) {
		return undefined;
	}
	return candidate;
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
