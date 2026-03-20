import { Monitor } from "@/types/monitor.js";
import jmespath from "jmespath";
type JmesPath = typeof jmespath;

export interface IAdvancedMatcher {
	validate<T>(payload: T, monitor: Monitor): { ok: boolean; message: string; extracted?: T | undefined };
}

export class AdvancedMatcher implements IAdvancedMatcher {
	constructor(private jmespath: JmesPath) {}

	private compare(actual: unknown, expected: string, method?: string): boolean {
		if (method === "equal") return String(actual) === expected;
		if (method === "include") return String(actual).includes(expected);
		if (method === "regex") return new RegExp(expected).test(String(actual));
		return String(actual) === expected; // Default
	}

	validate<T>(payload: T, monitor: Monitor): { ok: boolean; message: string; extracted?: T | undefined } {
		const { useAdvancedMatching, jsonPath, matchMethod, expectedValue } = monitor;
		if (!useAdvancedMatching) return { ok: true, message: "Success" };

		let dataToValidate = payload;

		if (jsonPath) {
			try {
				dataToValidate = this.jmespath.search(payload, jsonPath);
			} catch {
				return { ok: false, message: "Error evaluating JSON path" };
			}
		}

		if (expectedValue) {
			const ok = this.compare(dataToValidate, expectedValue, matchMethod);
			return {
				ok,
				message: ok ? "Success" : "Expected value did not match",
				extracted: dataToValidate,
			};
		}

		const isFalsy = dataToValidate === false || dataToValidate === "false" || dataToValidate === undefined || dataToValidate === null;
		return {
			ok: !isFalsy,
			message: !isFalsy ? "Success" : "Extracted value is falsy",
			extracted: dataToValidate,
		};
	}
}
