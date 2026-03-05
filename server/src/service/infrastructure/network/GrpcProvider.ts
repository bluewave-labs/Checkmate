import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { GrpcStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR, timeRequest } from "@/service/infrastructure/network/utils.js";
import { ILogger } from "@/utils/logger.js";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import path from "path";
import { fileURLToPath } from "url";
import { Network } from "inspector/promises";

type GrpcType = typeof grpc;
type ProtoLoaderType = typeof protoLoader;

const SERVICE_NAME = "GrpcProvider";

export interface GrpcError extends Error {
	code: number;
	details?: string;
}

export class GrpcProvider implements IStatusProvider<GrpcStatusPayload> {
	readonly type = "grpc";
	constructor(
		private logger: ILogger,
		private grpc: GrpcType,
		private protoLoader: ProtoLoaderType
	) {}

	supports(type: MonitorType): boolean {
		return type === "grpc";
	}

	private isGrpcError(error: unknown): error is GrpcError {
		return error instanceof Error && "code" in error && typeof (error as Record<string, unknown>).code === "number";
	}

	private getGrpcStatusName(code: number): string {
		const statusNames: Record<number, string> = {
			0: "OK",
			1: "CANCELLED",
			2: "UNKNOWN",
			3: "INVALID_ARGUMENT",
			4: "DEADLINE_EXCEEDED",
			5: "NOT_FOUND",
			6: "ALREADY_EXISTS",
			7: "PERMISSION_DENIED",
			8: "RESOURCE_EXHAUSTED",
			9: "FAILED_PRECONDITION",
			10: "ABORTED",
			11: "OUT_OF_RANGE",
			12: "UNIMPLEMENTED",
			13: "INTERNAL",
			14: "UNAVAILABLE",
			15: "DATA_LOSS",
			16: "UNAUTHENTICATED",
		};
		return statusNames[code] || "UNKNOWN";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<GrpcStatusPayload>> {
		const { id, teamId, type, url, port, ignoreTlsErrors } = monitor;
		const grpcServiceName = monitor.grpcServiceName || "";
		const host = url?.replace(/^https?:\/\//, "").split(/[/?#:]/)[0];

		try {
			if (!host || !port) {
				throw new Error("Valid host and port are required");
			}
			const target = `${host}:${port}`;
			const currentFilePath = fileURLToPath(import.meta.url);
			const protoPath = path.join(path.dirname(currentFilePath), "protos", "health.proto");
			const packageDefinition = this.protoLoader.loadSync(protoPath, {
				keepCase: true,
				longs: String,
				enums: String,
				defaults: true,
				oneofs: true,
			});
			const grpcObject = this.grpc.loadPackageDefinition(packageDefinition) as any;
			const HealthClient = grpcObject.grpc.health.v1.Health;
			let credentials;
			if (ignoreTlsErrors) {
				credentials = this.grpc.credentials.createSsl(null, null, null, {
					checkServerIdentity: () => undefined,
				});
			} else {
				credentials = this.grpc.credentials.createInsecure();
			}
			const client = new HealthClient(target, credentials);
			const deadline = new Date(Date.now() + 10000); // 10s timeout
			const { response, responseTime, error } = await timeRequest<GrpcStatusPayload>(() => {
				return new Promise<GrpcStatusPayload>((resolve, reject) => {
					client.Check({ service: grpcServiceName }, { deadline }, (err: unknown, response: unknown) => {
						client.close();

						if (err) {
							const grpcErr = err as { code?: number; details?: string; message?: string };
							const payload: GrpcStatusPayload = {
								grpcStatusCode: grpcErr.code ?? -1,
								grpcStatusName: this.getGrpcStatusName(grpcErr.code ?? -1),
								serviceName: grpcServiceName,
								servingStatus: "UNKNOWN",
							};
							const grpcError = new AppError({
								message: grpcErr.details || grpcErr.message || "gRPC error",
								service: SERVICE_NAME,
								method: "handle",
							}) as AppError & { grpcPayload?: GrpcStatusPayload; grpcCode?: number };
							grpcError.grpcPayload = payload;
							grpcError.grpcCode = grpcErr.code;
							reject(grpcError);
							return;
						}

						const resp = response as { status?: string } | undefined;
						const servingStatus = resp?.status ?? "UNKNOWN";
						resolve({
							grpcStatusCode: 0,
							grpcStatusName: "OK",
							serviceName: grpcServiceName,
							servingStatus,
						});
					});
				});
			});

			if (error) {
				let grpcCode = -1;
				let message = error instanceof Error ? error.message : "gRPC health check failed";

				if (this.isGrpcError(error)) {
					grpcCode = error.code;
					message = error.details || error.message;
				}

				return {
					monitorId: id,
					teamId: teamId,
					type: type,
					status: false,
					code: 500,
					message: message,
					responseTime,
					payload: {
						grpcStatusCode: grpcCode,
						grpcStatusName: this.getGrpcStatusName(grpcCode),
						serviceName: grpcServiceName,
						servingStatus: "UNKNOWN",
					},
				};
			}

			if (!response) {
				throw new Error("No response received from gRPC health check");
			}

			const isServing = response.servingStatus === "SERVING";

			return {
				monitorId: id,
				teamId: teamId,
				type: type,
				status: isServing,
				code: isServing ? 200 : NETWORK_ERROR,
				message: isServing ? "gRPC health check successful" : "gRPC health check failed",
				responseTime,
				payload: {
					grpcStatusCode: isServing ? 200 : NETWORK_ERROR,
					grpcStatusName: response.grpcStatusName,
					serviceName: response.serviceName,
					servingStatus: response.servingStatus || "UNKNOWN",
				},
			};
		} catch (err: unknown) {
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing gRPC health check",
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url, port: monitor.port, grpcServiceName: monitor.grpcServiceName },
			});
		}
	}
}
