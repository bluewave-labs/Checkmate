declare module "ssl-checker" {
	import { Agent } from "https";

	export interface SSLDetails {
		daysRemaining: number;
		valid: boolean;
		validFrom: string;
		validTo: string;
		validFor: string[];
	}

	export interface SSLOptions {
		method?: "GET" | "HEAD";
		port?: number;
		agent?: Agent;
		rejectUnauthorized?: boolean;
		validateSubjectAltName?: boolean;
	}

	function sslChecker(hostname: string, options?: SSLOptions): Promise<SSLDetails>;

	// Change 'export default' to 'export =' to allow it to be callable
	export = sslChecker;
}
