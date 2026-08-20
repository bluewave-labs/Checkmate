declare module "proxy-from-env" {
	/**
	 * Resolves the proxy that should handle a request to the given URL, reading
	 * HTTP_PROXY / HTTPS_PROXY / NO_PROXY (and their lowercase forms) from
	 * process.env. Returns an empty string when the request should go direct.
	 */
	export function getProxyForUrl(url: string): string;
}
