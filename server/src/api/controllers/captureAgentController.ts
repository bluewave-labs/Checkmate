import { Request, Response, NextFunction } from "express";
import {
	createCaptureAgentBodyValidation,
	updateCaptureAgentBodyValidation,
	createCaptureAgentDeviceBodyValidation,
	updateCaptureAgentDeviceBodyValidation,
	captureAgentIdParamValidation,
	captureAgentDeviceIdParamValidation,
} from "@/api/validation/captureAgentValidation.js";
import { ICaptureAgentService } from "@/service/business/captureAgentService.js";
import { requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";

const SERVICE_NAME = "captureAgentController";

export interface ICaptureAgentController {
	serviceName: string;
	createAgent: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	listAgents: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getAgent: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	updateAgent: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deleteAgent: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	health: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	addDevice: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	listDevices: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	updateDevice: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deleteDevice: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}

class CaptureAgentController implements ICaptureAgentController {
	static SERVICE_NAME = SERVICE_NAME;

	private captureAgentService: ICaptureAgentService;
	constructor(captureAgentService: ICaptureAgentService) {
		this.captureAgentService = captureAgentService;
	}

	get serviceName() {
		return CaptureAgentController.SERVICE_NAME;
	}

	createAgent = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = createCaptureAgentBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const agent = await this.captureAgentService.registerAgent(teamId, userId, {
				name: body.name,
				url: body.url,
				plainSecret: body.secret,
				canCollectMetrics: body.canCollectMetrics,
				canExecuteScripts: body.canExecuteScripts,
				tags: body.tags,
			});
			return res.status(201).json({
				success: true,
				msg: "Capture agent registered successfully",
				data: agent,
			});
		} catch (error) {
			next(error);
		}
	};

	listAgents = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const agents = await this.captureAgentService.listAgents(teamId);
			return res.status(200).json({
				success: true,
				msg: "Capture agents retrieved successfully",
				data: agents,
			});
		} catch (error) {
			next(error);
		}
	};

	getAgent = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const agent = await this.captureAgentService.getAgent(teamId, params.agentId);
			return res.status(200).json({
				success: true,
				msg: "Capture agent retrieved successfully",
				data: agent,
			});
		} catch (error) {
			next(error);
		}
	};

	updateAgent = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentIdParamValidation.parse(req.params);
			const body = updateCaptureAgentBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const agent = await this.captureAgentService.updateAgent(teamId, userId, params.agentId, {
				name: body.name,
				url: body.url,
				plainSecret: body.secret,
				canCollectMetrics: body.canCollectMetrics,
				canExecuteScripts: body.canExecuteScripts,
				isActive: body.isActive,
				tags: body.tags,
			});
			return res.status(200).json({
				success: true,
				msg: "Capture agent updated successfully",
				data: agent,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteAgent = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			await this.captureAgentService.deleteAgent(teamId, userId, params.agentId);
			return res.status(200).json({
				success: true,
				msg: "Capture agent deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	health = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const health = await this.captureAgentService.checkHealth(teamId, params.agentId);
			return res.status(200).json({
				success: true,
				msg: "Capture agent health retrieved",
				data: health,
			});
		} catch (error) {
			next(error);
		}
	};

	addDevice = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentIdParamValidation.parse(req.params);
			const body = createCaptureAgentDeviceBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const device = await this.captureAgentService.addDevice(teamId, userId, params.agentId, {
				name: body.name,
				hostname: body.hostname,
				ipAddress: body.ipAddress,
				os: body.os,
				authType: body.authType,
				username: body.username,
				plainPassword: body.password,
				sshKeyFingerprint: body.sshKeyFingerprint,
				port: body.port,
				tags: body.tags,
			});
			return res.status(201).json({
				success: true,
				msg: "Device added successfully",
				data: device,
			});
		} catch (error) {
			next(error);
		}
	};

	listDevices = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const devices = await this.captureAgentService.listDevices(teamId, params.agentId);
			return res.status(200).json({
				success: true,
				msg: "Devices retrieved successfully",
				data: devices,
			});
		} catch (error) {
			next(error);
		}
	};

	updateDevice = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentDeviceIdParamValidation.parse(req.params);
			const body = updateCaptureAgentDeviceBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const device = await this.captureAgentService.updateDevice(teamId, userId, params.agentId, params.deviceId, {
				name: body.name,
				hostname: body.hostname,
				ipAddress: body.ipAddress,
				os: body.os,
				authType: body.authType,
				username: body.username,
				plainPassword: body.password,
				sshKeyFingerprint: body.sshKeyFingerprint,
				port: body.port,
				tags: body.tags,
			});
			return res.status(200).json({
				success: true,
				msg: "Device updated successfully",
				data: device,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteDevice = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const params = captureAgentDeviceIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			await this.captureAgentService.deleteDevice(teamId, userId, params.agentId, params.deviceId);
			return res.status(200).json({
				success: true,
				msg: "Device deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default CaptureAgentController;
