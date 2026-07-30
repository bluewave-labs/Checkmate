// Fallback so /config.js always resolves (e.g. under the Vite dev server). In
// the Docker image the server shadows this path and renders the real config
// from its CLIENT_CONFIG_* environment variables.
window.__CHECKMATE_CONFIG__ = {};
