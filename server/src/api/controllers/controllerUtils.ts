import { AppError, internalError } from "@/utils/AppError.js";
import { Monitor } from "@/domain/monitors/monitor.type.js";
import { UserRole } from "@/domain/users/user.type.js";
import sslChecker, { SSLDetails } from "ssl-checker";
import * as whoiser from "whoiser";
import { parse as parseDomain } from "tldts";
import { Request, Response } from "express";

type SSLCheckerType = typeof sslChecker;
type WhoisModule = typeof whoiser;
export type Handler = (req: Request, res: Response<ApiEnvelope>) => Promise<void>;
export type ApiEnvelope<T = unknown> = { success: boolean; msg: string; data?: T };

const SERVICE_NAME = "controllerUtils";

export const fetchMonitorCertificate = async (checker: SSLCheckerType, monitor: Monitor): Promise<SSLDetails> => {
	const monitorUrl = new URL(monitor.url);
	const hostname = monitorUrl.hostname;
	const cert = await checker(hostname);
	if (cert?.validTo === null || cert?.validTo === undefined) {
		throw new Error("Certificate not found");
	}
	return cert;
};

const WHOIS_TIMEOUT_MS = 10_000;
const DOMAIN_EXPIRY_CACHE_POSITIVE_TTL_MS = 60 * 60 * 1000; // 1 hour
const DOMAIN_EXPIRY_CACHE_NEGATIVE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const EXPIRY_DATE_KEY_PATTERN = /(expiry date|expiration|paid-?till|registration expiration)/i;
// TODO: remove once whoiser is upgraded to 2.x, which already has the current .tr server.
const WHOIS_SERVER_OVERRIDES: Record<string, string> = {
	tr: "whois.trabis.gov.tr",
};

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
const extractString = (value: unknown): string | undefined => {
	const candidate = Array.isArray(value) ? value[0] : value;
	if (typeof candidate !== "string" || candidate.length === 0) {
		return undefined;
	}
	return candidate;
};
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
	const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
	const fromParts = (year: string | undefined, month: string | undefined, day: string | undefined): Date | null => {
		const monthIndex = months.indexOf((month ?? "").toLowerCase());
		if (monthIndex === -1) {
			return null;
		}
		const parsed = new Date(Date.UTC(Number(year), monthIndex, Number(day)));
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	};

	// Some registries (e.g. Nominet for .uk) return "14-Feb-2027" style values.
	const dayFirst = /^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/.exec(raw.trim());
	if (dayFirst) {
		const parsed = fromParts(dayFirst[3], dayFirst[2], dayFirst[1]);
		if (parsed) {
			return parsed;
		}
	}

	// TRABIS (.tr) returns "2029-Sep-01" style values, which Date() only parses by
	// engine-specific leniency.
	const yearFirst = /^(\d{4})-([A-Za-z]{3})-(\d{1,2})\.?$/.exec(raw.trim());
	if (yearFirst) {
		const parsed = fromParts(yearFirst[1], yearFirst[2], yearFirst[3]);
		if (parsed) {
			return parsed;
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

	const serverOverride = WHOIS_SERVER_OVERRIDES[registrableDomain.split(".").pop() ?? ""];
	const result = await client.domain(registrableDomain, {
		timeout: WHOIS_TIMEOUT_MS,
		...(serverOverride ? { host: serverOverride } : {}),
	});
	const firstServerData = Object.values(result)[0];
	const expiryDate = extractDomainExpiryDate(
		typeof firstServerData === "object" && firstServerData !== null && !Array.isArray(firstServerData) ? firstServerData : {}
	);
	const domainExpiry: DomainExpiryResult = { domain: registrableDomain, expiryDate };
	cache.set(registrableDomain, domainExpiry);
	return domainExpiry;
};

export const requireTeamId = (teamId?: string): string => {
	if (!teamId) {
		throw new AppError(internalError, { message: "Team ID is required", service: SERVICE_NAME, method: "requireTeamId" });
	}
	return teamId;
};

export const requireUserId = (userId?: string): string => {
	if (!userId) {
		throw new AppError(internalError, { message: "User ID is required", service: SERVICE_NAME, method: "requireUserId" });
	}
	return userId;
};
export const requireUserEmail = (userEmail?: string): string => {
	if (!userEmail) {
		throw new AppError(internalError, { message: "User email is required", service: SERVICE_NAME, method: "requireUserEmail" });
	}
	return userEmail;
};

export const requireFirstName = (firstName?: string): string => {
	if (!firstName) {
		throw new AppError(internalError, { message: "First name is required", service: SERVICE_NAME, method: "requireFirstName" });
	}
	return firstName;
};

export const requireUserRoles = (userRoles?: UserRole[]): UserRole[] => {
	if (!userRoles || userRoles.length === 0) {
		throw new AppError(internalError, { message: "User roles are required", service: SERVICE_NAME, method: "requireUserRoles" });
	}
	return userRoles;
};
