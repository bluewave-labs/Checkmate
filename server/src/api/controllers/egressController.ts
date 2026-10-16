import { RequestHandler } from "express";
import { Handler } from "@/api/controllers/controllerUtils.js";
import { IEgressStateService } from "@/domain/egress/egress-state.service.js";

export interface IEgressController {
	getState: RequestHandler;
}

class EgressController implements IEgressController {
	private egressStateService: IEgressStateService;
	constructor(egressStateService: IEgressStateService) {
		this.egressStateService = egressStateService;
	}

	getState: Handler = async (req, res) => {
		const data = await this.egressStateService.getState();
		res.json({ success: true, msg: "Egress state retrieved successfully", data });
	};
}

export default EgressController;
