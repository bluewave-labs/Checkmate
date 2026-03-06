import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { DockerStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { ILogger } from "@/utils/logger.js";
import { AppError } from "@/utils/AppError.js";
import Dockerode from "dockerode";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";

type DockerodeType = typeof Dockerode;

const SERVICE_NAME = "DockerProvider";

export interface DockerError extends Error {
	statusCode?: number;
	reason?: string;
	json?: { message?: string };
}

export class DockerProvider implements IStatusProvider<DockerStatusPayload> {
	readonly type = "docker";
	private docker: Dockerode;
	constructor(
		private logger: ILogger,
		private DockerLib: DockerodeType
	) {
		this.docker = new this.DockerLib();
	}

	supports(type: MonitorType): boolean {
		return type === "docker";
	}

	private isDockerError(error: unknown): error is DockerError {
		return error instanceof Error && ("statusCode" in error || "reason" in error || "json" in error);
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<DockerStatusPayload>> {
		const { url: containerInput } = monitor;
		try {
			if (!containerInput) {
				throw new Error("Container name or ID is required for Docker monitor");
			}

			const containers = await this.docker.listContainers({ all: true });
			const normalizedInput = containerInput.replace(/^\/+/, "").toLowerCase();

			// Priority-based matching to avoid ambiguity:
			// 1. Exact full ID match (64-char)
			const exactIdMatch = containers.find((c) => c.Id.toLowerCase() === normalizedInput);

			// 2. Exact container name match (case-insensitive)
			const exactNameMatch = containers.find((c) =>
				c.Names.some((name: string) => {
					const cleanName = name.replace(/^\/+/, "").toLowerCase();
					return cleanName === normalizedInput;
				})
			);

			// 3. Partial ID match (fallback for backwards compatibility)
			const partialIdMatch = containers.find((c) => c.Id.toLowerCase().startsWith(normalizedInput));

			// Select container based on priority
			const targetContainer = exactIdMatch || exactNameMatch || partialIdMatch;

			// Handle no match
			if (!targetContainer) {
				this.logger.warn({
					message: `No container found for "${monitor.url}".`,
					service: SERVICE_NAME,
					method: "handle",
					details: { url: monitor.url },
				});

				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: 404,
					message: "Docker container not found",
					responseTime: 0,
					payload: null,
				};
			}

			// 5. Handle Ambiguity Check
			const matchTypes: string[] = [];
			if (exactIdMatch) matchTypes.push("exact ID");
			if (exactNameMatch) matchTypes.push("exact name");
			if (partialIdMatch && !exactIdMatch) matchTypes.push("partial ID");

			if (matchTypes.length > 1) {
				const message = `Ambiguous container match for "${containerInput}". Matched by: ${matchTypes.join(", ")}. Using ${exactIdMatch ? "exact ID" : exactNameMatch ? "exact name" : "partial ID"} match.`;

				this.logger.warn({
					message,
					service: SERVICE_NAME,
					method: "handle",
					details: { url: containerInput },
				});

				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: NETWORK_ERROR,
					message,
					responseTime: 0,
					payload: null,
				};
			}

			// 6. Inspect Container Status
			const container = this.docker.getContainer(targetContainer.Id);
			const { response, responseTime, error } = await timeRequest(() => container.inspect());

			if (error) {
				let message = "Failed to fetch Docker container information";
				let code = NETWORK_ERROR;

				if (this.isDockerError(error)) {
					code = error.statusCode ?? NETWORK_ERROR;
					message = error.json?.message ?? error.reason ?? error.message;
				} else if (error instanceof Error) {
					message = error.message;
				}

				return {
					monitorId: monitor.id,
					teamId: monitor.teamId,
					type: monitor.type,
					status: false,
					code: code,
					message: message,
					responseTime,
					payload: null,
				};
			}

			return {
				monitorId: monitor.id,
				teamId: monitor.teamId,
				type: monitor.type,
				status: response?.State?.Status === "running",
				code: 200,
				message: "Docker container status fetched successfully",
				responseTime,
				payload: response as unknown as DockerStatusPayload,
			};
		} catch (err: unknown) {
			throw new AppError({
				message: err instanceof Error ? err.message : "Error performing Docker request",
				service: SERVICE_NAME,
				method: "handle",
				details: { url: containerInput },
			});
		}
	}
}
