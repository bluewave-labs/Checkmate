import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { IEgressStateService } from "@/domain/egress/egress-state.service.js";

export interface IEgressController {
	getState: RequestHandler;
}

class EgressController implements IEgressController {
	constructor(private egressStateService: IEgressStateService) {}

	getState = catchAsync(async (req: Request, res: Response) => {
		const state = await this.egressStateService.getState();
		return res.status(200).json({
			success: true,
			msg: "Egress state retrieved successfully",
			data: state,
		});
	});
}

export default EgressController;
