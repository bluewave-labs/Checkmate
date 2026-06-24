import type { NextFunction, Request, Response } from "express";
import { normalizeStatusPageDomain } from "@/utils/statusPageDomain.js";

const PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX = "/status/public";

// Browsers enforce the intersection of all CSP headers, so this only tightens
// the status page on top of the global helmet policy, blocking external images,
// fonts, and stylesheets from custom CSS while keeping the app's Google Fonts.
const STATUS_PAGE_CSP = [
	"img-src 'self' data:",
	"font-src 'self' data: https://fonts.gstatic.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
].join("; ");

// A status page document is served on the public path or on a custom domain
// (any host other than the app's own). Mirrors the client isCustomDomainHost.
export const createStatusPageDocumentCsp = (clientHost: string) => {
	const appHostname = normalizeStatusPageDomain(clientHost);

	return (req: Request, res: Response, next: NextFunction) => {
		const onCustomDomain = appHostname !== null && normalizeStatusPageDomain(req.hostname) !== appHostname;
		if (req.path.startsWith(PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX) || onCustomDomain) {
			res.append("Content-Security-Policy", STATUS_PAGE_CSP);
		}
		return next();
	};
};
