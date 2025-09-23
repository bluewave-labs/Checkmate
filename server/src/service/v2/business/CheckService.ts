import { json } from "stream/consumers";
import { ICheck, Check, Monitor } from "../../../db/v2/models/index.js";
import type { ISystemInfo, ICaptureInfo } from "../../../db/v2/models/index.js";
import { MonitorType } from "../../../db/v2/models/monitors/Monitor.js";
import { StatusResponse } from "../infrastructure/NetworkService.js";
import type { ICapturePayload, ILighthousePayload } from "../infrastructure/NetworkService.js";
import mongoose from "mongoose";

export interface ICheckService {
	buildCheck: (statusResponse: StatusResponse, type: MonitorType) => Promise<ICheck>;
	cleanupOrphanedChecks: () => Promise<boolean>;
}

class CheckService implements ICheckService {
	private isCapturePayload = (payload: any): payload is ICapturePayload => {
		if (!payload || typeof payload !== "object") return false;

		if (!("data" in payload) || typeof payload.data !== "object") {
			return false;
		}

		const data = payload.data as Partial<ISystemInfo>;
		if (!data.cpu || typeof data.cpu !== "object" || typeof data.cpu.usage_percent !== "number") {
			return false;
		}

		if (!data.memory || typeof data.memory !== "object" || typeof data.memory.usage_percent !== "number") {
			return false;
		}

		if (data.disk && !Array.isArray(data.disk)) {
			return false;
		}
		if (data.net && !Array.isArray(data.net)) {
			return false;
		}

		if (!("capture" in payload) || typeof payload.capture !== "object") return false;
		const capture = payload.capture as Record<string, any>;
		if (typeof capture.version !== "string" || typeof capture.mode !== "string") return false;

		return true;
	};

	private isPagespeedPayload = (payload: any): payload is ILighthousePayload => {
		if (!payload || typeof payload !== "object") return false;

		if (!("lighthouseResult" in payload) || typeof payload.lighthouseResult !== "object") {
			return false;
		}
		return true;
	};

	private buildBaseCheck = (statusResponse: StatusResponse) => {
		const monitorId = new mongoose.Types.ObjectId(statusResponse.monitorId);
		const check = new Check({
			monitorId: monitorId,
			type: statusResponse?.type,
			status: statusResponse?.status,
			message: statusResponse?.message,
			responseTime: statusResponse?.responseTime,
			timings: statusResponse?.timings,
		});
		return check;
	};

	private buildInfrastructureCheck = (statusResponse: StatusResponse<ICapturePayload>) => {
		if (!this.isCapturePayload(statusResponse.payload)) {
			throw new Error("Invalid payload for infrastructure monitor");
		}
		const check = this.buildBaseCheck(statusResponse);
		check.system = statusResponse.payload.data;
		check.capture = statusResponse.payload.capture;
		return check;
	};

	private buildPagespeedCheck = (statusResponse: StatusResponse<ILighthousePayload>) => {
		if (!this.isPagespeedPayload(statusResponse.payload)) {
			throw new Error("Invalid payload for pagespeed monitor");
		}
		const check = this.buildBaseCheck(statusResponse);
		const lighthouseResult = statusResponse?.payload?.lighthouseResult;
		check.lighthouse = {
			accessibility: lighthouseResult?.categories?.accessibility?.score || 0,
			bestPractices: lighthouseResult?.categories?.["best-practices"]?.score || 0,
			seo: lighthouseResult?.categories?.seo?.score || 0,
			performance: lighthouseResult?.categories?.performance?.score || 0,
			audits: {
				cls: lighthouseResult?.audits?.["cumulative-layout-shift"] || {},
				si: lighthouseResult?.audits?.["speed-index"] || {},
				fcp: lighthouseResult?.audits?.["first-contentful-paint"] || {},
				lcp: lighthouseResult?.audits?.["largest-contentful-paint"] || {},
				tbt: lighthouseResult?.audits?.["total-blocking-time"] || {},
			},
		};
		return check;
	};

	buildCheck = async (statusResponse: StatusResponse, type: MonitorType): Promise<ICheck> => {
		switch (type) {
			case "infrastructure":
				return this.buildInfrastructureCheck(statusResponse as StatusResponse<ICapturePayload>);

			case "pagespeed":
				return this.buildPagespeedCheck(statusResponse as StatusResponse<ILighthousePayload>);
			case "http":
			case "https":
				return this.buildBaseCheck(statusResponse);

			case "ping":
				return this.buildBaseCheck(statusResponse);
			default:
				throw new Error(`Unsupported monitor type: ${type}`);
		}
	};

	cleanupOrphanedChecks = async () => {
		try {
			const monitorIds = await Monitor.find().distinct("_id");
			const result = await Check.deleteMany({
				monitorId: { $nin: monitorIds },
			});
			console.log(`Deleted ${result.deletedCount} orphaned Checks.`);
			return true;
		} catch (error) {
			console.error("Error cleaning up orphaned Checks:", error);
			return false;
		}
	};
}

export default CheckService;
