import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
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

	createProxy = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = createProxyBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);

		const proxy = await this.proxiesService.createProxy(validatedBody, teamId);
		return res.status(200).json({
			success: true,
			msg: "Proxy created successfully",
			data: proxy,
		});
	});
	getProxyById = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: proxyId } = getProxyByIdParamValidation.parse(req.params);
		const proxy = await this.proxiesService.getProxy(proxyId, teamId);
		return res.status(200).json({
			success: true,
			msg: "Proxy retrieved successfully",
			data: proxy,
		});
	});

	getAllProxies = catchAsync(async (req: Request, res: Response) => {
		const proxies = await this.proxiesService.getProxies();
		return res.status(200).json({
			success: true,
			msg: "Proxies retrieved successfully",
			data: proxies,
		});
	});

	getProxiesByTeamId = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const proxies = await this.proxiesService.getProxiesByTeamId(teamId);
		return res.status(200).json({
			success: true,
			msg: "Proxies retrieved successfully",
			data: proxies,
		});
	});

	editProxy = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: proxyId } = editProxyParamValidation.parse(req.params);
		const validatedBody = editProxyBodyValidation.parse(req.body);
		const updatedProxy = await this.proxiesService.updateProxy(proxyId, teamId, validatedBody);
		return res.status(200).json({
			success: true,
			msg: "Proxy updated successfully",
			data: updatedProxy,
		});
	});

	deleteProxy = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: proxyId } = deleteProxyParamValidation.parse(req.params);
		await this.proxiesService.deleteProxy(proxyId, teamId);
		return res.status(200).json({
			success: true,
			msg: "Proxy deleted successfully",
		});
	});
}

export default ProxyController;
