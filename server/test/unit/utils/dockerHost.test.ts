import { describe, expect, it } from "@jest/globals";
import { DOCKER_TLS_URL, isCaptureDockerUrl, isDockerSocketUrl, isDockerTlsUrl } from "../../../src/utils/dockerHost.ts";

describe("isDockerTlsUrl", () => {
	it.each(["tcp://host", "tcp://host:2376", "https://host", "https://host:2377", "tcp://host/", "tcp://10.0.0.1:2376", "  tcp://host  "])(
		"accepts %s",
		(url) => {
			expect(isDockerTlsUrl(url)).toBe(true);
		}
	);

	it.each([
		"http://host",
		"host:2376",
		"tcp://host/x",
		"tcp://host:abc",
		"tcp://a:b:c",
		"tcp://[::1]:2376",
		"tcp://ho st",
		"ssh://deploy@host",
		"unix:///var/run/docker.sock",
		"",
		undefined,
	])("rejects %s", (url) => {
		expect(isDockerTlsUrl(url)).toBe(false);
	});

	it("captures scheme, host and port for the provider", () => {
		expect(DOCKER_TLS_URL.exec("https://host:2377")?.slice(1)).toEqual(["https", "host", "2377"]);
		expect(DOCKER_TLS_URL.exec("tcp://host")?.slice(1)).toEqual(["tcp", "host", undefined]);
	});
});

describe("isCaptureDockerUrl", () => {
	it.each(["http://host:59232/api/v1/metrics/docker", "https://example.com/prefix/metrics/docker/?all=false"])("accepts %s", (url) => {
		expect(isCaptureDockerUrl(url)).toBe(true);
	});

	it.each([
		"https://host:2376",
		"tcp://host:2376/api/v1/metrics/docker",
		"https://example.com/api/v1/metrics/docker/containers",
		"https://example.com/?path=/metrics/docker",
		undefined,
	])("rejects %s", (url) => {
		expect(isCaptureDockerUrl(url)).toBe(false);
	});
});

describe("isDockerSocketUrl", () => {
	it.each(["unix:///var/run/docker.sock", "/var/run/docker.sock", "  /run/docker.sock  "])("accepts %s", (url) => {
		expect(isDockerSocketUrl(url)).toBe(true);
	});

	it.each(["unix://", "unix://relative/path", "tcp://host", "my-container", "", undefined])("rejects %s", (url) => {
		expect(isDockerSocketUrl(url)).toBe(false);
	});
});
