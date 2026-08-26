import { MonitorModel } from "../../domain/monitors/monitor.model.js";
import type { ILogger } from "@/utils/logger.js";

const KEEP_KEYS = [
	"id",
	"status",
	"responseTime",
	"statusCode",
	"message",
	"createdAt",
	"cpu",
	"memory",
	"disk",
	"host",
	"accessibility",
	"bestPractices",
	"seo",
	"performance",
	"audits",
];

/**
 * Slim stored recentChecks snapshots down to the fields the slim CheckSnapshot type keeps.
 * The schema change only affects new writes; paused monitors never rotate their snapshots out.
 * Idempotent: re-running on already-slim snapshots is a no-op re-pick.
 */
export async function slimRecentChecks(logger: ILogger): Promise<void> {
	const SERVICE_NAME = "Migration:SlimRecentChecks";
	try {
		logger.info({ service: SERVICE_NAME, message: "Slimming recentChecks snapshots" });

		const result = await MonitorModel.updateMany({ "recentChecks.0": { $exists: true } }, [
			{
				$set: {
					recentChecks: {
						$map: {
							input: "$recentChecks",
							as: "snap",
							in: {
								$mergeObjects: [
									// 1) keep whitelisted top-level keys only (drops timings/errors/capture/net)
									{
										$arrayToObject: {
											$filter: {
												input: { $objectToArray: "$$snap" },
												as: "kv",
												cond: { $in: ["$$kv.k", KEEP_KEYS] },
											},
										},
									},
									// 2) where a nested group exists, overwrite it with its slim pick
									{
										$cond: [
											{ $eq: [{ $type: "$$snap.cpu" }, "object"] },
											{
												cpu: {
													physical_core: "$$snap.cpu.physical_core",
													logical_core: "$$snap.cpu.logical_core",
													frequency: "$$snap.cpu.frequency",
													current_frequency: "$$snap.cpu.current_frequency",
													temperature: "$$snap.cpu.temperature",
													usage_percent: "$$snap.cpu.usage_percent",
												},
											},
											{},
										],
									},
									{
										$cond: [
											{ $eq: [{ $type: "$$snap.memory" }, "object"] },
											{
												memory: {
													total_bytes: "$$snap.memory.total_bytes",
													used_bytes: "$$snap.memory.used_bytes",
													usage_percent: "$$snap.memory.usage_percent",
												},
											},
											{},
										],
									},
									{
										$cond: [
											{ $eq: [{ $type: "$$snap.disk" }, "array"] },
											{
												disk: {
													$map: {
														input: "$$snap.disk",
														as: "d",
														in: {
															device: "$$d.device",
															total_bytes: "$$d.total_bytes",
															used_bytes: "$$d.used_bytes",
															usage_percent: "$$d.usage_percent",
														},
													},
												},
											},
											{},
										],
									},
									{
										$cond: [
											{ $eq: [{ $type: "$$snap.host" }, "object"] },
											{
												host: {
													os: "$$snap.host.os",
													platform: "$$snap.host.platform",
													pretty_name: "$$snap.host.pretty_name",
												},
											},
											{},
										],
									},
								],
							},
						},
					},
				},
			},
		]);

		logger.info({ service: SERVICE_NAME, message: `Slimmed recentChecks on ${result.modifiedCount} monitors` });
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : String(error);
		logger.error({ service: SERVICE_NAME, message: `Error slimming recentChecks: ${errorMessage}` });
		throw error;
	}
}
