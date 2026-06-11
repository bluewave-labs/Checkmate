import type { CorsOptions } from "cors";
import type { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";

const CUSTOM_DOMAIN_CORS_CACHE_TTL_MS = 5 * 60 * 1000;

type CustomDomainCorsCacheEntry = {
	allowed: boolean;
	expiresAt: number;
};

export const createStatusPageCorsOrigin = (clientHost: string, statusPagesRepository: IStatusPagesRepository): CorsOptions["origin"] => {
	const cache = new Map<string, CustomDomainCorsCacheEntry>();

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
				cache.set(customDomain, {
					allowed,
					expiresAt: Date.now() + CUSTOM_DOMAIN_CORS_CACHE_TTL_MS,
				});
				callback(null, allowed ? origin : false);
			})
			.catch(() => {
				callback(null, false);
			});
	};
};
