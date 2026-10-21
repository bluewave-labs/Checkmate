import { describe, expect, it } from "@jest/globals";
import { parseEgressTarget } from "../../../src/utils/egressTarget.ts";

describe("parseEgressTarget", () => {
	it("parses http(s) URLs", () => {
		expect(parseEgressTarget("https://example.com/health")).toEqual({ kind: "http", url: "https://example.com/health" });
		expect(parseEgressTarget("HTTP://example.com")).toEqual({ kind: "http", url: "HTTP://example.com" });
		expect(parseEgressTarget("http://[2606:4700::1111]:8080/")).toEqual({ kind: "http", url: "http://[2606:4700::1111]:8080/" });
	});

	it("parses host:port with a hostname, IPv4 address, localhost or bracketed IPv6 address", () => {
		expect(parseEgressTarget("dns.google:53")).toEqual({ kind: "port", host: "dns.google", port: 53 });
		expect(parseEgressTarget("8.8.8.8:53")).toEqual({ kind: "port", host: "8.8.8.8", port: 53 });
		expect(parseEgressTarget("localhost:8080")).toEqual({ kind: "port", host: "localhost", port: 8080 });
		expect(parseEgressTarget("[2606:4700::1111]:443")).toEqual({ kind: "port", host: "2606:4700::1111", port: 443 });
	});

	it("parses bare hosts and addresses as ping targets", () => {
		expect(parseEgressTarget("1.1.1.1")).toEqual({ kind: "ping", host: "1.1.1.1" });
		expect(parseEgressTarget("example.com")).toEqual({ kind: "ping", host: "example.com" });
		expect(parseEgressTarget("2606:4700:4700::1111")).toEqual({ kind: "ping", host: "2606:4700:4700::1111" });
		expect(parseEgressTarget("[2606:4700:4700::1111]")).toEqual({ kind: "ping", host: "2606:4700:4700::1111" });
		expect(parseEgressTarget("  1.1.1.1  ")).toEqual({ kind: "ping", host: "1.1.1.1" });
	});

	it("rejects anything the probe could not reach", () => {
		for (const target of [
			"",
			"ftp://example.com",
			"http://",
			"bad host",
			"1.1.1.1;rm",
			"[1.1.1.1",
			"1.1.1.1]",
			"[::1",
			"::1]",
			"[[::1]]",
			"[not-an-address]:53",
			"[1.1.1.1]:53",
			"999.1.1.1",
			"1.1.1.1:0",
			"1.1.1.1:70000",
			"1.1.1.1:",
			"host-without-tld",
		]) {
			expect(parseEgressTarget(target)).toBeNull();
		}
	});
});
