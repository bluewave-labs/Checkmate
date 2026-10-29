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
		const { token } = heartbeatParamValidation.parse(req.params);
		const { msg, duration } = heartbeatQueryValidation.parse(req.query);

		await this.heartbeatService.recordPing({
			token,
			action: "success",
			message: msg,
			duration,
		});

		res.json(received);
	};

	fail: Handler = async (req, res) => {
		const { token } = heartbeatParamValidation.parse(req.params);
		const { msg, duration } = heartbeatQueryValidation.parse(req.query);

		await this.heartbeatService.recordPing({
			token,
			action: "fail",
			message: msg,
			duration,
		});
		res.json(received);
	};

	exitCode: Handler = async (req, res) => {
		const { token, exitCode } = heartbeatExitCodeParamValidation.parse(req.params);
		const { msg, duration } = heartbeatQueryValidation.parse(req.query);

		await this.heartbeatService.recordPing({
			token,
			action: exitCode === 0 ? "success" : "fail",
			exitCode,
			message: msg,
			duration,
		});
		res.json(received);
	};
}

export default HeartbeatController;
