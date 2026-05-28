// Script output parser
//
// Parses the convention defined for Checkmate script monitors:
//   Status line: Success|Info|Warning|Error|Critical(<target>)=<message>
//   Datapoint:   Datapoint(<name>)=<numeric value>[ <unit>]
//   Variables:   %%name%% within the script body are replaced before
//                execution from the variable map passed to expandVariables.
//
// The parser is lenient: lines that do not match either pattern are
// preserved in `rawStdout`. The first status line (closest to the bottom
// of the script's stdout) wins so multi-step scripts can summarise their
// final status.

export const ScriptStatuses = ["Success", "Info", "Warning", "Error", "Critical"] as const;
export type ScriptStatus = (typeof ScriptStatuses)[number];

export const ScriptSeverities = ["success", "info", "warning", "error", "critical"] as const;
export type ScriptSeverity = (typeof ScriptSeverities)[number];

export interface ParsedDatapoint {
	name: string;
	value: number;
	unit?: string;
}

export interface ParsedScriptOutput {
	statusLine?: { status: ScriptStatus; target: string; message: string };
	datapoints: ParsedDatapoint[];
	rawStdout: string;
}

const STATUS_RE = /^(Success|Info|Warning|Error|Critical)\(([^)]+)\)=(.+)$/;
const DATAPOINT_RE = /^Datapoint\(([^)]+)\)=(-?\d+(?:\.\d+)?)(?:\s+([A-Za-z%/_-]+))?$/;
const VARIABLE_RE = /%%([a-zA-Z0-9_]+)%%/g;

export function parseScriptOutput(stdout: string): ParsedScriptOutput {
	const rawStdout = typeof stdout === "string" ? stdout : "";
	const lines = rawStdout.split(/\r?\n/);
	const datapoints: ParsedDatapoint[] = [];
	let statusLine: ParsedScriptOutput["statusLine"];

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (line.length === 0) continue;

		const statusMatch = STATUS_RE.exec(line);
		if (statusMatch && statusMatch[1] && statusMatch[2] && statusMatch[3]) {
			statusLine = {
				status: statusMatch[1] as ScriptStatus,
				target: statusMatch[2].trim(),
				message: statusMatch[3].trim(),
			};
			continue;
		}

		const dpMatch = DATAPOINT_RE.exec(line);
		if (dpMatch && dpMatch[1] && dpMatch[2]) {
			const numeric = Number(dpMatch[2]);
			if (!Number.isNaN(numeric)) {
				datapoints.push({
					name: dpMatch[1].trim(),
					value: numeric,
					unit: dpMatch[3]?.trim() || undefined,
				});
			}
		}
	}

	return { statusLine, datapoints, rawStdout };
}

export function severityFor(status: ScriptStatus): ScriptSeverity {
	switch (status) {
		case "Success":
			return "success";
		case "Info":
			return "info";
		case "Warning":
			return "warning";
		case "Error":
			return "error";
		case "Critical":
			return "critical";
	}
}

export function isUp(status: ScriptStatus, warningCountsAsDown: boolean): boolean {
	switch (status) {
		case "Success":
		case "Info":
			return true;
		case "Warning":
			return !warningCountsAsDown;
		case "Error":
		case "Critical":
			return false;
	}
}

export function expandVariables(body: string, vars: Record<string, string | undefined>): string {
	if (typeof body !== "string" || body.length === 0) return body;
	return body.replace(VARIABLE_RE, (full, key: string) => {
		const value = vars[key.toLowerCase()];
		return value == null ? full : value;
	});
}
