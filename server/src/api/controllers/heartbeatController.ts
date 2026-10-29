import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import type { IHeartbeatService } from "@/domain/heartbeat/heartbeat.service.js";
import { heartbeatExitCodeParamValidation, heartbeatParamValidation, heartbeatQueryValidation } from "@/api/validation/index.js";

export interface IHeartbeatController {
	ping: RequestHandler;
	fail: RequestHandler;
	exitCode: RequestHandler;
}

const received = {
	success: true,
	msg: "Heartbeat received",
	data: { received: true },
};

class HeartbeatController implements IHeartbeatController {
	constructor(private heartbeatService: IHeartbeatService) {}

	ping: Handler = async (req, res) => {
		const { pingKey, slug } = heartbeatParamValidation.parse(req.params);
		const { msg, duration } = heartbeatQueryValidation.parse(req.query);

		await this.heartbeatService.recordPing({
			pingKey,
			slug,
			action: "success",
			message: msg,
			duration,
		});

		res.json(received);
	};

	fail: Handler = async (req, res) => {
		const { pingKey, slug } = heartbeatParamValidation.parse(req.params);
		const { msg, duration } = heartbeatQueryValidation.parse(req.query);

		await this.heartbeatService.recordPing({
			pingKey,
			slug,
			action: "fail",
			message: msg,
			duration,
		});
		res.json(received);
	};

	exitCode: Handler = async (req, res) => {
		const { pingKey, slug, exitCode } = heartbeatExitCodeParamValidation.parse(req.params);
		const { msg, duration } = heartbeatQueryValidation.parse(req.query);

		await this.heartbeatService.recordPing({
			pingKey,
			slug,
			action: exitCode === 0 ? "success" : "fail",
			exitCode,
			message: msg,
			duration,
		});
		res.json(received);
	};
}

export default HeartbeatController;
