import { Monitor } from "@/domain/monitors/monitor.types.js";
import jmespath from "jmespath";
import RE2 from "re2";
type JmesPath = typeof jmespath;

export interface IAdvancedMatcher {
	validate<T>(payload: T, monitor: Monitor): { ok: boolean; message: string; extracted?: T | undefined };
}

export class AdvancedMatcher implements IAdvancedMatcher {
	constructor(private jmespath: JmesPath) {}

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

		if (!expectedValue) {
			const isFalsy = dataToValidate === false || dataToValidate === "false" || dataToValidate === undefined || dataToValidate === null;
			return {
				ok: !isFalsy,
				message: !isFalsy ? "Success" : "Extracted value is falsy",
				extracted: dataToValidate,
			};
		}

		let actual: string;
		try {
			actual = String(dataToValidate);
		} catch {
			return { ok: false, message: "Error evaluating response value", extracted: dataToValidate };
		}

		let ok: boolean;
		if (matchMethod === "include") {
			ok = actual.includes(expectedValue);
		} else if (matchMethod === "regex") {
			try {
				ok = new RE2(expectedValue).test(actual);
			} catch {
				return { ok: false, message: "Invalid regex pattern", extracted: dataToValidate };
			}
		} else {
			ok = actual === expectedValue;
		}

		return {
			ok,
			message: ok ? "Success" : "Expected value did not match",
			extracted: dataToValidate,
		};
	}
}
