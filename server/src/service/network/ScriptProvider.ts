import { IStatusProvider } from "@/service/network/IStatusProvider.js";
import type { Monitor, MonitorType } from "@/domain/monitors/monitor.types.js";
import type { MonitorStatusResponse } from "@/types/network.js";
import type { ScriptStatusPayload } from "@/types/script.js";
import { NETWORK_ERROR } from "@/service/network/utils.js";
import type { IScriptService } from "@/service/business/scriptService.js";
import { ILogger } from "@/utils/logger.js";

const SERVICE_NAME = "ScriptProvider";

// ScriptProvider executes a script on the configured target agent
// (Capture or Probe) and maps the result into a MonitorStatusResponse.
//
// The "up" decision is based on:
//   1. timedOut === false
//   2. exitCode === monitor.scriptExitCodeSuccess (default 0)
//   3. if scriptOutputMatchRegex is set, stdout must match
//
// stdout/stderr are stored as a JSON-encoded string in the Check's
// `message` field so we avoid changing the Check timeseries schema.

export class ScriptProvider implements IStatusProvider<ScriptStatusPayload> {
	readonly type = "script";

	constructor(
		private readonly scriptService: IScriptService,
		private readonly logger: ILogger
	) {}

	supports(type: MonitorType): boolean {
		return type === "script";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<ScriptStatusPayload>> {
		try {
			const result = await this.scriptService.executeScriptForMonitor(monitor);

			const expectedExitCode = monitor.scriptExitCodeSuccess ?? 0;
			const exitOk = result.exitCode === expectedExitCode;
			const timedOut = result.timedOut;
			let regexOk = true;
			if (monitor.scriptOutputMatchRegex && monitor.scriptOutputMatchRegex.length > 0) {
				try {
					regexOk = new RegExp(monitor.scriptOutputMatchRegex).test(result.stdout ?? "");
				} catch {
					this.logger.warn({
						message: `Invalid output match regex on monitor ${monitor.id}`,
						service: SERVICE_NAME,
						method: "handle",
					});
					regexOk = false;
				}
			}
			// Prefer the parsed status when present (and supported by the
			// script output format). Fall back to the exit-code-based
			// classification otherwise.
			const status =
				result.statusBoolean !== undefined ? result.statusBoolean && regexOk : !timedOut && exitOk && regexOk;

			const summary = result.parsedMessage
				? result.parsedMessage
				: timedOut
					? "Script timed out"
					: !exitOk
						? `Script exited with code ${result.exitCode}`
						: !regexOk
							? "Script output did not match expected pattern"
							: "Script succeeded";

			const messagePayload = JSON.stringify({
				stdout: result.stdout,
				stderr: result.stderr,
				exitCode: result.exitCode,
				executionTimeMs: result.executionTimeMs,
				timedOut: result.timedOut,
				parsedStatus: result.parsedStatus,
				parsedTarget: result.parsedTarget,
				parsedMessage: result.parsedMessage,
				datapoints: result.datapoints ?? [],
				severity: result.severity,
			});

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: "script",
				status,
				code: status ? 200 : 500,
				message: messagePayload,
				responseTime: result.executionTimeMs,
				payload: {
					stdout: result.stdout,
					stderr: result.stderr,
					exitCode: result.exitCode,
					executionTimeMs: result.executionTimeMs,
					timedOut: result.timedOut,
				},
				// Stored intentionally so callers (UI) can extract a one-line
				// human summary without re-parsing the JSON.
				extracted: summary,
			};
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : "Script execution failed";
			this.logger.warn({
				message: `Script provider error: ${message}`,
				service: SERVICE_NAME,
				method: "handle",
				details: { monitorId: monitor.id },
			});
			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: "script",
				status: false,
				code: NETWORK_ERROR,
				message: JSON.stringify({ stdout: "", stderr: message, exitCode: -1, executionTimeMs: 0, timedOut: false }),
				responseTime: 0,
				payload: { stdout: "", stderr: message, exitCode: -1, executionTimeMs: 0, timedOut: false },
			};
		}
	}
}
