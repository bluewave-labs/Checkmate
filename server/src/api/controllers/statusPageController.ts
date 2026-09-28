import { RequestHandler } from "express";

import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	imageValidation,
	resolveStatusPageQueryValidation,
	getPublicMonitorIncidentsParamValidation,
	getPublicMonitorIncidentsQueryValidation,
	statusPageIdParamValidation,
} from "@/api/validation/statusPageValidation.js";
import { AppError } from "@/utils/AppError.js";
import { Handler, requireTeamId, requireUserId } from "@/api/controllers/controllerUtils.js";
import { IStatusPageService } from "@/domain/status-pages/status-page.service.js";
import { resolveStatusPageDomainFromRequest } from "@/utils/statusPageDomain.js";

export interface IStatusPageController {
	createStatusPage: RequestHandler;
	updateStatusPage: RequestHandler;
	getStatusPageByUrl: RequestHandler;
	getPublicMonitorIncidents: RequestHandler;
	resolveStatusPageByDomain: RequestHandler;
	getStatusPagesByTeamId: RequestHandler;
	deleteStatusPage: RequestHandler;
}

class StatusPageController implements IStatusPageController {
	private statusPageService: IStatusPageService;
	constructor(statusPageService: IStatusPageService) {
		this.statusPageService = statusPageService;
	}

	createStatusPage: Handler = async (req, res) => {
		const validatedBody = createStatusPageBodyValidation.parse(req.body);
		if (req.file) {
			imageValidation.parse(req.file);
		}
		const teamId = requireTeamId(req?.user?.teamId);
		const userId = requireUserId(req?.user?.id);
		const data = await this.statusPageService.createStatusPage(userId, teamId, req.file, validatedBody);
		res.json({ success: true, msg: "Status page created successfully", data });
	};

	updateStatusPage: Handler = async (req, res) => {
		const { id } = statusPageIdParamValidation.parse(req.params);
		const validatedBody = createStatusPageBodyValidation.parse(req.body);
		if (req.file) {
			imageValidation.parse(req.file);
		}
		const teamId = requireTeamId(req?.user?.teamId);
		const data = await this.statusPageService.updateStatusPage(id, teamId, req.file, validatedBody);
		res.json({ success: true, msg: "Status page updated successfully", data });
	};

	getStatusPageByUrl: Handler = async (req, res) => {
		const { url } = getStatusPageParamValidation.parse(req.params);
		const { range } = getStatusPageQueryValidation.parse(req.query);
		const statusPage = await this.statusPageService.getStatusPageByUrl(url);
		const data = await this.statusPageService.getPublicStatusPagePayload(statusPage, req.user?.teamId, range);
		res.json({ success: true, msg: "Status page retrieved successfully", data });
	};

	getPublicMonitorIncidents: Handler = async (req, res) => {
		const { url, monitorId } = getPublicMonitorIncidentsParamValidation.parse(req.params);
		const { date } = getPublicMonitorIncidentsQueryValidation.parse(req.query);
		const incidents = await this.statusPageService.getPublicMonitorIncidents(url, monitorId, date, req.user?.teamId);
		res.json({ success: true, msg: "Incidents retrieved successfully", data: { incidents } });
	};

	resolveStatusPageByDomain: Handler = async (req, res) => {
		const { range, domain: queryDomain } = resolveStatusPageQueryValidation.parse(req.query);
		const domain = resolveStatusPageDomainFromRequest(req.hostname, queryDomain);
		if (!domain) {
			throw new AppError({ message: "Domain is required", status: 400 });
		}

		const statusPage = await this.statusPageService.getStatusPageByCustomDomain(domain);
		if (!statusPage.isPublished) {
			throw new AppError({ message: "Status page not found", status: 404 });
		}

		const data = await this.statusPageService.getPublicStatusPagePayload(statusPage, req.user?.teamId, range);
		res.json({ success: true, msg: "Status page retrieved successfully", data });
	};

	getStatusPagesByTeamId: Handler = async (req, res) => {
		const teamId = requireTeamId(req.user?.teamId);
		const data = await this.statusPageService.getStatusPagesByTeamId(teamId);
		res.json({ success: true, msg: "Status pages retrieved successfully", data });
	};

	deleteStatusPage: Handler = async (req, res) => {
		const { id } = statusPageIdParamValidation.parse(req.params);
		const teamId = requireTeamId(req.user?.teamId);
		await this.statusPageService.deleteStatusPage(id, teamId);
		res.json({ success: true, msg: "Status page deleted successfully" });
	};
}

export default StatusPageController;
