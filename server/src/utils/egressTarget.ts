import { z } from "zod";
import { dnsHostnameRegex } from "@/api/validation/shared.js";

// A reliability target for the egress self-check, in one of three shapes. Parsed here so the
// settings validator and the probe agree on exactly what is accepted.
export type EgressTarget =
	| { kind: "http"; url: string } // http(s):// URL, fetched
	| { kind: "port"; host: string; port: number } // host:port or [ipv6]:port, TCP connect
	| { kind: "ping"; host: string }; // bare hostname or IP address, ICMP

// "[ipv6]:port" or "host:port" where host has no colons, so a bare IPv6 address is never read as host:port.
const HOST_PORT_PATTERN = /^(?:\[([^\]]+)\]|([^:/\s[\]]+)):(\d{1,5})$/;
const BRACKETED_PATTERN = /^\[([^\]]+)\]$/;

const isIpv6 = (value: string): boolean => z.ipv6().safeParse(value).success;
const isHostOrIpv4 = (value: string): boolean => value === "localhost" || z.ipv4().safeParse(value).success || dnsHostnameRegex.test(value);

const parseHttp = (target: string): EgressTarget | null => {
	try {
		const { protocol, hostname } = new URL(target);
		return (protocol === "http:" || protocol === "https:") && hostname.length > 0 ? { kind: "http", url: target } : null;
	} catch {
		return null;
	}
};

export const parseEgressTarget = (raw: string): EgressTarget | null => {
	const target = raw.trim();
	if (target.length === 0) return null;

	if (/^https?:\/\//i.test(target)) return parseHttp(target);

	const hostPort = HOST_PORT_PATTERN.exec(target);
	if (hostPort) {
		const port = Number(hostPort[3]);
		if (port < 1 || port > 65535) return null;
		const bracketedHost = hostPort[1];
		if (bracketedHost !== undefined) return isIpv6(bracketedHost) ? { kind: "port", host: bracketedHost, port } : null;
		const host = hostPort[2]!;
		return isHostOrIpv4(host) ? { kind: "port", host, port } : null;
	}

	const bracketed = BRACKETED_PATTERN.exec(target);
	if (bracketed) return isIpv6(bracketed[1]!) ? { kind: "ping", host: bracketed[1]! } : null;

	if (isIpv6(target) || isHostOrIpv4(target)) return { kind: "ping", host: target };
	return null;
};
