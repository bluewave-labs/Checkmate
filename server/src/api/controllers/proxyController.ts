import { Request, Response, RequestHandler } from "express";
import { IProxiesService } from "@/domain/proxies/proxy.service.js";
import { requireTeamId } from "./controllerUtils.js";
import {
	createProxyBodyValidation,
	editProxyBodyValidation,
	getProxyByIdParamValidation,
	editProxyParamValidation,
	deleteProxyParamValidation,
} from "@/api/validation/index.js";

export interface IProxiesController {
	createProxy: RequestHandler;
	getProxyById: RequestHandler;
	getAllProxies: RequestHandler;
	getProxiesByTeamId: RequestHandler;
	editProxy: RequestHandler;
	deleteProxy: RequestHandler;
}

class ProxyController implements IProxiesController {
	constructor(private proxiesService: IProxiesService) {}

	createProxy = async (req: Request, res: Response) => {
		const validatedBody = createProxyBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.proxiesService.createProxy(validatedBody, teamId);
		res.json({ success: true, msg: "Proxy created successfully", data });
	};

	getProxyById = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id } = getProxyByIdParamValidation.parse(req.params);
		const data = await this.proxiesService.getProxy(id, teamId);
		res.json({ success: true, msg: "Proxy retrieved successfully", data });
	};

	getAllProxies = async (req: Request, res: Response) => {
		const data = await this.proxiesService.getProxies();
		res.json({ success: true, msg: "Proxies retrieved successfully", data });
	};

	getProxiesByTeamId = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.proxiesService.getProxiesByTeamId(teamId);
		res.json({ success: true, msg: "Proxies retrieved successfully", data });
	};

	editProxy = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id } = editProxyParamValidation.parse(req.params);
		const validatedBody = editProxyBodyValidation.parse(req.body);
		const data = await this.proxiesService.updateProxy(id, teamId, validatedBody);
		res.json({ success: true, msg: "Proxy updated successfully", data });
	};

	deleteProxy = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id } = deleteProxyParamValidation.parse(req.params);
		await this.proxiesService.deleteProxy(id, teamId);
		res.json({ success: true, msg: "Proxy deleted successfully" });
	};
}

export default ProxyController;
