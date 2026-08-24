// Global CSP for the app document. The public status page tightens this further
// in statusPageDocumentCsp; browsers enforce the intersection of both headers.
export const APP_CSP_DIRECTIVES = {
	upgradeInsecureRequests: null,
	"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
	// blob: covers the preview of a just-picked upload (URL.createObjectURL) and
	// the XHR that reads that blob back on submit. Both are same-origin, in-memory
	// objects the page created itself, so this grants no external access.
	"img-src": ["'self'", "data:", "blob:", "https://img.shields.io"],
	"connect-src": ["'self'", "blob:"],
	"object-src": ["'none'"],
	"base-uri": ["'self'"],
};
