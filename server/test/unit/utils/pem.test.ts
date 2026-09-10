import { describe, expect, it } from "@jest/globals";
import { readFileSync } from "node:fs";
import { X509Certificate } from "node:crypto";
import { keyMatchesCertificate, parseCertificates, parsePrivateKey, splitCertificateBundle } from "../../../src/utils/pem.ts";

const fixture = (name: string) => readFileSync(new URL(`../../fixtures/docker-tls/${name}`, import.meta.url), "utf8");

const CA = fixture("ca.pem");
const CLIENT_CERT = fixture("client-cert.pem");
const CLIENT_KEY = fixture("client-key.pem");
const OTHER_KEY = fixture("other-key.pem");
const ENCRYPTED_KEY = fixture("encrypted-key.pem");

describe("splitCertificateBundle", () => {
	it("returns one block for a single certificate", () => {
		expect(splitCertificateBundle(CA)).toHaveLength(1);
	});

	it("returns every block of a bundle in order", () => {
		const blocks = splitCertificateBundle(`${CA}\n${CLIENT_CERT}`);
		expect(blocks).toHaveLength(2);
		expect(blocks[0]).toBe(CA.trim());
		expect(blocks[1]).toBe(CLIENT_CERT.trim());
	});

	it("ignores text outside the blocks", () => {
		expect(splitCertificateBundle(`subject=CN=x\n${CA}\ntrailing`)).toHaveLength(1);
	});

	it("returns an empty array when there is no certificate block", () => {
		expect(splitCertificateBundle("")).toEqual([]);
		expect(splitCertificateBundle(CLIENT_KEY)).toEqual([]);
		expect(splitCertificateBundle("-----BEGIN CERTIFICATE-----\nunterminated")).toEqual([]);
	});
});

describe("parseCertificates", () => {
	it("parses a single certificate", () => {
		const [cert] = parseCertificates(CA);
		expect(cert).toBeInstanceOf(X509Certificate);
		expect(cert?.subject).toContain("CN=Checkmate Test CA");
	});

	it("parses every certificate in a bundle", () => {
		const certs = parseCertificates(`${CA}\n${CLIENT_CERT}`);
		expect(certs.map((c) => c.subject)).toEqual([expect.stringContaining("Checkmate Test CA"), expect.stringContaining("checkmate-test-client")]);
	});

	it("rejects input with no certificate block", () => {
		expect(() => parseCertificates("")).toThrow("No certificate found");
		expect(() => parseCertificates(CLIENT_KEY)).toThrow("No certificate found");
	});

	it("rejects a block whose body is not a certificate", () => {
		expect(() => parseCertificates("-----BEGIN CERTIFICATE-----\nbm90IGEgY2VydA==\n-----END CERTIFICATE-----")).toThrow(
			"Certificate is not valid PEM"
		);
	});
});

describe("parsePrivateKey", () => {
	it("parses an unencrypted PKCS#8 key", () => {
		expect(parsePrivateKey(CLIENT_KEY).type).toBe("private");
	});

	it("rejects an encrypted PKCS#8 key with a clear message", () => {
		expect(() => parsePrivateKey(ENCRYPTED_KEY)).toThrow("Encrypted private keys are not supported");
	});

	it("rejects a legacy encrypted key by its Proc-Type header", () => {
		const legacy = "-----BEGIN RSA PRIVATE KEY-----\nProc-Type: 4,ENCRYPTED\nDEK-Info: AES-128-CBC,00\n\nAAAA\n-----END RSA PRIVATE KEY-----";
		expect(() => parsePrivateKey(legacy)).toThrow("Encrypted private keys are not supported");
	});

	it("rejects input that is not a key", () => {
		expect(() => parsePrivateKey("")).toThrow("Private key is not valid PEM");
		expect(() => parsePrivateKey(CA)).toThrow("Private key is not valid PEM");
	});
});

describe("keyMatchesCertificate", () => {
	it("is true for the key the certificate was issued to", () => {
		const [cert] = parseCertificates(CLIENT_CERT);
		expect(keyMatchesCertificate(parsePrivateKey(CLIENT_KEY), cert!)).toBe(true);
	});

	it("is false for an unrelated key", () => {
		const [cert] = parseCertificates(CLIENT_CERT);
		expect(keyMatchesCertificate(parsePrivateKey(OTHER_KEY), cert!)).toBe(false);
	});
});
