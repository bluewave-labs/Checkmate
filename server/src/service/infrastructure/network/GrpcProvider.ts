import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { GrpcStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { AppError } from "@/utils/AppError.js";
import { timeRequest } from "@/service/infrastructure/network/utils.js";
import * as grpc from "@grpc/grpc-js";
import * as protoLoader from "@grpc/proto-loader";

import path from "path";
import { fileURLToPath } from "url";

type GrpcType = typeof grpc;
type ProtoLoaderType = typeof protoLoader;

const SERVICE_NAME = "GrpcProvider";

export class GrpcProvider implements IStatusProvider<GrpcStatusPayload> {
	readonly type = "grpc";
	constructor(
		private grpc: GrpcType,
		private protoLoader: ProtoLoaderType
	) {}

	supports(type: MonitorType): boolean {
		return type === "grpc";
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
		try {
			const { id, teamId, type, url, port, ignoreTlsErrors } = monitor;
			const grpcServiceName = monitor.grpcServiceName || "";

			if (!url) {
				throw new AppError({ message: "Monitor host is required", service: SERVICE_NAME, method: "handle" });
			}
			if (!port) {
				throw new AppError({ message: "Monitor port is required", service: SERVICE_NAME, method: "handle" });
			}

			const host = url.replace(/^https?:\/\//, "").split(/[/?#:]/)[0];
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
			const grpcObject = this.grpc.loadPackageDefinition(packageDefinition) as unknown as {
				grpc: {
					health: {
						v1: {
							Health: new (
								target: string,
								credentials: unknown
							) => {
								Check: (request: { service: string }, options: { deadline: Date }, callback: (err: unknown, response: unknown) => void) => void;
								close: () => void;
							};
						};
					};
				};
			};
			const healthService = grpcObject.grpc.health.v1.Health;

			let credentials;
			if (ignoreTlsErrors) {
				credentials = this.grpc.credentials.createSsl(null, null, null, {
					checkServerIdentity: () => undefined,
				});
			} else {
				credentials = this.grpc.credentials.createInsecure();
			}

			const client = new healthService(target, credentials);

			const TIMEOUT_MS = 10000;
			const deadline = new Date(Date.now() + TIMEOUT_MS);

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
				const grpcError = error as AppError & { grpcPayload?: GrpcStatusPayload; grpcCode?: number };
				const payload = grpcError.grpcPayload;
				return {
					monitorId: id,
					teamId: teamId,
					type: type,
					status: false,
					code: grpcError.grpcCode ?? 5000,
					message: grpcError.message ?? "gRPC health check failed",
					responseTime,
					payload: payload ?? null,
				};
			}

			const grpcPayload = response as GrpcStatusPayload;
			const isServing = grpcPayload.servingStatus === "SERVING";

			return {
				monitorId: id,
				teamId: teamId,
				type: type,
				status: isServing,
				code: isServing ? 200 : 5000,
				message: isServing ? `gRPC service healthy (${grpcPayload.servingStatus})` : `gRPC service unhealthy (${grpcPayload.servingStatus})`,
				responseTime,
				payload: grpcPayload,
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
