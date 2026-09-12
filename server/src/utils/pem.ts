import { createPrivateKey, KeyObject, X509Certificate } from "node:crypto";

const PEM_CERT_BLOCK = /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;

export const splitCertificateBundle = (pem: string): string[] => pem.match(PEM_CERT_BLOCK) ?? [];

export const parseCertificates = (pem: string): X509Certificate[] => {
	const blocks = splitCertificateBundle(pem);
	if (blocks.length === 0) throw new Error("No certificate found; expected one or more PEM CERTIFICATE blocks");
	try {
		return blocks.map((block) => new X509Certificate(block));
	} catch {
		throw new Error("Certificate is not valid PEM");
	}
};

export const parsePrivateKey = (pem: string): KeyObject => {
	if (/^-----BEGIN ENCRYPTED PRIVATE KEY-----/m.test(pem) || /^Proc-Type: 4,ENCRYPTED/m.test(pem)) {
		throw new Error("Encrypted private keys are not supported; remove the passphrase first");
	}
	try {
		return createPrivateKey(pem);
	} catch {
		throw new Error("Private key is not valid PEM");
	}
};

export const keyMatchesCertificate = (key: KeyObject, certificate: X509Certificate): boolean => certificate.checkPrivateKey(key);
