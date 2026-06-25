import { Request, Response, NextFunction } from "express";
import {
	createScriptBodyValidation,
	updateScriptBodyValidation,
	scriptIdParamValidation,
	createProbeBodyValidation,
	probeIdParamValidation,
} from "@/api/validation/scriptValidation.js";
import { requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";
import type { IScriptService } from "@/service/business/scriptService.js";
import { decryptScriptBody } from "@/utils/scriptCrypto.js";

const SERVICE_NAME = "scriptController";

export interface IScriptController {
	createScript: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	listScripts: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getScript: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	updateScript: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deleteScript: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;

	registerProbe: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	listProbes: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deregisterProbe: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}

class ScriptController implements IScriptController {
	static SERVICE_NAME = SERVICE_NAME;

	private readonly scriptService: IScriptService;

	constructor(scriptService: IScriptService) {
		this.scriptService = scriptService;
	}

	get serviceName() {
		return ScriptController.SERVICE_NAME;
	}

	createScript = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = createScriptBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const script = await this.scriptService.createScript(teamId, userId, body);
			// Do not return encryptedBody in the create response; just return summary
			const { encryptedBody, ...summary } = script;
			void encryptedBody;
			return res.status(201).json({
				success: true,
				msg: "Script created successfully",
				data: summary,
			});
		} catch (error) {
			next(error);
		}
	};

	listScripts = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const scripts = await this.scriptService.listScripts(teamId);
			return res.status(200).json({
				success: true,
				msg: "Scripts retrieved successfully",
				data: scripts,
			});
		} catch (error) {
			next(error);
		}
	};

	getScript = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { scriptId } = scriptIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const script = await this.scriptService.getScript(teamId, scriptId);
			// Decrypt body for the admin viewer; keep encryptedBody out of the response
			const { encryptedBody, ...summary } = script;
			void encryptedBody;
			const decrypted = decryptScriptBody(script.encryptedBody);
			return res.status(200).json({
				success: true,
				msg: "Script retrieved successfully",
				data: { ...summary, body: decrypted },
			});
		} catch (error) {
			next(error);
		}
	};

	updateScript = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { scriptId } = scriptIdParamValidation.parse(req.params);
			const body = updateScriptBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const script = await this.scriptService.updateScript(teamId, userId, scriptId, body);
			const { encryptedBody, ...summary } = script;
			void encryptedBody;
			return res.status(200).json({
				success: true,
				msg: "Script updated successfully",
				data: summary,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteScript = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { scriptId } = scriptIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			await this.scriptService.deleteScript(teamId, userId, scriptId);
			return res.status(200).json({
				success: true,
				msg: "Script deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};

	registerProbe = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const body = createProbeBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			const probe = await this.scriptService.registerProbe(teamId, userId, body);
			return res.status(201).json({
				success: true,
				msg: "Probe registered successfully",
				data: probe,
			});
		} catch (error) {
			next(error);
		}
	};

	listProbes = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const probes = await this.scriptService.listProbes(teamId);
			return res.status(200).json({
				success: true,
				msg: "Probes retrieved successfully",
				data: probes,
			});
		} catch (error) {
			next(error);
		}
	};

	deregisterProbe = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const { probeId } = probeIdParamValidation.parse(req.params);
			const teamId = requireTeamId(req.user?.teamId);
			const userId = requireUserId(req.user?.id);
			await this.scriptService.deregisterProbe(teamId, userId, probeId);
			return res.status(200).json({
				success: true,
				msg: "Probe deregistered successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default ScriptController;
