import type { CorsOptions } from "cors";
import type { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";

const CUSTOM_DOMAIN_CORS_POSITIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const CUSTOM_DOMAIN_CORS_NEGATIVE_CACHE_TTL_MS = 60 * 1000;

type CustomDomainCorsCacheEntry = {
	allowed: boolean;
	expiresAt: number;
};

const getCustomDomainCorsCacheTtlMs = (allowed: boolean): number =>
	allowed ? CUSTOM_DOMAIN_CORS_POSITIVE_CACHE_TTL_MS : CUSTOM_DOMAIN_CORS_NEGATIVE_CACHE_TTL_MS;

export const createStatusPageCorsOrigin = (clientHost: string, statusPagesRepository: IStatusPagesRepository): CorsOptions["origin"] => {
	const cache = new Map<string, CustomDomainCorsCacheEntry>();

	const cacheOriginResult = (customDomain: string, allowed: boolean) => {
		cache.set(customDomain, {
			allowed,
			expiresAt: Date.now() + getCustomDomainCorsCacheTtlMs(allowed),
		});
	};

	return (origin, callback) => {
		if (!origin) {
			callback(null, true);
			return;
		}

		if (origin === clientHost) {
			callback(null, true);
			return;
		}

		let customDomain: string | null = null;
		try {
			customDomain = normalizeStatusPageDomain(new URL(origin).hostname);
		} catch {
			callback(null, false);
			return;
		}

		if (!customDomain) {
			callback(null, false);
			return;
		}

		const cached = cache.get(customDomain);
		if (cached && cached.expiresAt > Date.now()) {
			callback(null, cached.allowed ? origin : false);
			return;
		}

		statusPagesRepository
			.findByCustomDomain(customDomain)
			.then((statusPage) => {
				const allowed = statusPage.isPublished;
				cacheOriginResult(customDomain, allowed);
				callback(null, allowed ? origin : false);
			})
			.catch(() => {
				cacheOriginResult(customDomain, false);
				callback(null, false);
			});
	};
};
