import helmet from "helmet";

// Applied to the SPA catch-all and API responses. worker-src covers the
// blob: workers MapLibre spawns, and connect-src/img-src allow the Carto
// basemap endpoints (style, tiles, glyphs, sprites) the geo checks map uses.
export const createSecurityHeaders = () =>
	helmet({
		hsts: false,
		contentSecurityPolicy: {
			useDefaults: true,
			directives: {
				upgradeInsecureRequests: null,
				"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
				"worker-src": ["'self'", "blob:"],
				"connect-src": ["'self'", "https://basemaps.cartocdn.com", "https://*.basemaps.cartocdn.com"],
				"img-src": ["'self'", "data:", "blob:", "https://img.shields.io", "https://basemaps.cartocdn.com", "https://*.basemaps.cartocdn.com"],
				"object-src": ["'none'"],
				"base-uri": ["'self'"],
			},
		},
	});
