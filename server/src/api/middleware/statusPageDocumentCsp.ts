import type { NextFunction, Request, Response } from "express";

const PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX = "/status/public";

// Browsers enforce the intersection of all CSP headers, so this only tightens the
// public status page on top of the global helmet policy: it blocks external images,
// fonts, and stylesheets from custom CSS while keeping the app's Google Fonts.
const STATUS_PAGE_CSP = [
	"img-src 'self' data:",
	"font-src 'self' data: https://fonts.gstatic.com",
	"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
].join("; ");

export const statusPageDocumentCsp = (req: Request, res: Response, next: NextFunction) => {
	if (req.path.startsWith(PUBLIC_STATUS_PAGE_DOCUMENT_PREFIX)) {
		res.append("Content-Security-Policy", STATUS_PAGE_CSP);
	}
	return next();
};
