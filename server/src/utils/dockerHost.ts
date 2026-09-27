export const DOCKER_TLS_URL = /^(tcp|https):\/\/([^/\s:]+)(?::(\d+))?\/?$/;
export const DOCKER_SOCKET_URL = /^(?:unix:\/\/\/\S+|\/\S+)$/;

export const isDockerTlsUrl = (url: string | undefined): boolean => DOCKER_TLS_URL.test(url?.trim() ?? "");
export const isDockerSocketUrl = (url: string | undefined): boolean => DOCKER_SOCKET_URL.test(url?.trim() ?? "");

export const isCaptureDockerUrl = (url: string | undefined): boolean => {
	try {
		const parsed = new URL(url?.trim() ?? "");
		const pathname = parsed.pathname.replace(/\/+$/, "");
		return (parsed.protocol === "http:" || parsed.protocol === "https:") && pathname.endsWith("/metrics/docker");
	} catch {
		return false;
	}
};
