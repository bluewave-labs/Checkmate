export const DOCKER_TLS_URL = /^(tcp|https):\/\/([^/\s:]+)(?::(\d+))?\/?$/;
export const DOCKER_SOCKET_URL = /^(?:unix:\/\/\/\S+|\/\S+)$/;

export const isDockerTlsUrl = (url: string | undefined): boolean => DOCKER_TLS_URL.test(url?.trim() ?? "");
export const isDockerSocketUrl = (url: string | undefined): boolean => DOCKER_SOCKET_URL.test(url?.trim() ?? "");
