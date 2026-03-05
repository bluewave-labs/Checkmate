import { IStatusProvider } from "@/service/infrastructure/network/IStatusProvider.js";
import { GameStatusPayload, MonitorStatusResponse } from "@/types/network.js";
import { Monitor, MonitorType } from "@/types/monitor.js";
import { GameDig } from "gamedig";
import { AppError } from "@/utils/AppError.js";
import { NETWORK_ERROR } from "@/service/infrastructure/network/utils.js";
import { ILogger } from "@/utils/logger.js";

type GameDigType = typeof GameDig;

const SERVICE_NAME = "GameProvider";
export class GameProvider implements IStatusProvider<GameStatusPayload> {
	readonly type = "game";
	constructor(
		private logger: ILogger,
		private gameDig: GameDigType
	) {}

	supports(type: MonitorType): boolean {
		return type === "game";
	}

	async handle(monitor: Monitor): Promise<MonitorStatusResponse<GameStatusPayload>> {
		const { url, port, gameId, id, teamId, type } = monitor;

		// Clean the host in case a full URL was passed
		const host = url?.replace(/^https?:\/\//, "").split(/[/?#:]/)[0] || "";
		try {
			const state = await this.gameDig
				.query({
					type: gameId ?? "unknown",
					host: host,
					port: port ?? 0,
				})
				.catch((error: unknown) => {
					this.logger.warn({
						message: error instanceof Error ? error.message : String(error),
						service: SERVICE_NAME,
						method: "handle",
						details: { host, port, gameId },
					});
					return undefined;
				});

			if (!state) {
				return {
					monitorId: id,
					teamId: teamId,
					type: type,
					status: false,
					code: NETWORK_ERROR,
					message: "No response from game server",
					responseTime: 0,
					payload: null,
				};
			}

			return {
				monitorId: id,
				teamId: teamId,
				type: type,
				status: true,
				code: 200,
				message: "Success",
				responseTime: state.ping ?? 0,
				payload: state,
			};
		} catch (err: unknown) {
			const originalMessage = err instanceof Error ? err.message : String(err);
			throw new AppError({
				message: originalMessage || "Error performing game server check",
				service: SERVICE_NAME,
				method: "handle",
				details: { url: monitor.url, port: monitor.port, gameId: monitor.gameId },
			});
		}
	}
}
