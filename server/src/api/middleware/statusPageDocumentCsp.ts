import type { NextFunction, Request, Response } from "express";
import type { IStatusPagesRepository } from "@/domain/status-pages/status-page-repository.interface.js";
import type { StatusPage } from "@/domain/status-pages/status-page.type.js";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";

const API_PATH_PREFIX = "/api/";
const PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX = "/status/public";

const EMBED_ORIGINS_POSITIVE_CACHE_TTL_MS = 5 * 60 * 1000;
const EMBED_ORIGINS_NEGATIVE_CACHE_TTL_MS = 60 * 1000;
const EMBED_ORIGINS_CACHE_MAX_ENTRIES = 1000;

// Browsers enforce the intersection of all CSP headers, so this only tightens
// the status page on top of the global helmet policy, blocking external images,
// fonts, and stylesheets from custom CSS while keeping the app's Google Fonts.
const STATUS_PAGE_CSP = [
	"img-src 'self' data: blob:",
	"font-src 'self' data: https://fonts.gstatic.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
].join("; ");

type EmbedOriginsCacheEntry = {
	origins: string[];
	expiresAt: number;
};

const getEmbedOriginsCacheTtlMs = (origins: string[]): number =>
	origins.length > 0 ? EMBED_ORIGINS_POSITIVE_CACHE_TTL_MS : EMBED_ORIGINS_NEGATIVE_CACHE_TTL_MS;

// frame-ancestors is intersected like every other directive, so helmet must not
// emit it globally; this middleware sets it on every non-API response instead.
const frameAncestorsDirective = (origins: string[]): string => ["frame-ancestors 'self'", ...origins].join(" ");

const embedOriginsOf = (statusPage: StatusPage): string[] => (statusPage.isPublished ? (statusPage.embedAllowedOrigins ?? []) : []);

// Path segment after /status/public/, ignoring anything deeper.
const publicStatusPageUrlFromPath = (path: string): string | null => {
	const remainder = path.slice(PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX.length);
	if (!remainder.startsWith("/")) {
		return null;
	}

	const segment = remainder.slice(1).split("/")[0] ?? "";
	if (!segment) {
		return null;
	}

	try {
		return decodeURIComponent(segment);
	} catch {
		return null;
	}
};

// A status page document is served on the public path or on a custom domain
// (any host other than the app's own). Mirrors the client isCustomDomainHost.
export const createStatusPageDocumentCsp = (clientHost: string, statusPagesRepository: IStatusPagesRepository) => {
	const appHostname = normalizeStatusPageDomain(clientHost);
	const cache = new Map<string, EmbedOriginsCacheEntry>();

	const cacheOrigins = (key: string, origins: string[]) => {
		if (cache.size >= EMBED_ORIGINS_CACHE_MAX_ENTRIES) {
			const now = Date.now();
			for (const [cachedKey, entry] of cache) {
				if (entry.expiresAt <= now) {
					cache.delete(cachedKey);
				}
			}
			if (cache.size >= EMBED_ORIGINS_CACHE_MAX_ENTRIES) {
				cache.clear();
			}
		}

		cache.set(key, {
			origins,
			expiresAt: Date.now() + getEmbedOriginsCacheTtlMs(origins),
		});
	};

	const resolveEmbedOrigins = (key: string, lookup: () => Promise<StatusPage>): Promise<string[]> => {
		const cached = cache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return Promise.resolve(cached.origins);
		}

		return lookup()
			.then((statusPage) => {
				const origins = embedOriginsOf(statusPage);
				cacheOrigins(key, origins);
				return origins;
			})
			.catch(() => {
				cacheOrigins(key, []);
				return [];
			});
	};

	const lookupStatusPageOrigins = (req: Request, customDomain: string | null): Promise<string[]> => {
		if (customDomain) {
			return resolveEmbedOrigins(`custom:${customDomain}`, () => statusPagesRepository.findByCustomDomain(customDomain));
		}

		const url = publicStatusPageUrlFromPath(req.path);
		if (!url) {
			return Promise.resolve([]);
		}
		return resolveEmbedOrigins(`url:${url}`, () => statusPagesRepository.findByUrl(url));
	};

	return (req: Request, res: Response, next: NextFunction) => {
		if (req.path.startsWith(API_PATH_PREFIX)) {
			return next();
		}

		const requestHostname = normalizeStatusPageDomain(req.hostname);
		const onCustomDomain = appHostname !== null && requestHostname !== appHostname;
		if (!req.path.startsWith(PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX) && !onCustomDomain) {
			res.append("Content-Security-Policy", frameAncestorsDirective([]));
			return next();
		}

		lookupStatusPageOrigins(req, onCustomDomain ? requestHostname : null)
			.catch(() => [])
			.then((origins) => {
				res.append("Content-Security-Policy", `${STATUS_PAGE_CSP}; ${frameAncestorsDirective(origins)}`);
				next();
			});
	};
};
