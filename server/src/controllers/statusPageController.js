import { createStatusPageBodyValidation, getStatusPageParamValidation, getStatusPageQueryValidation, imageValidation } from "../validation/joi.js";
import BaseController from "./baseController.js";

const SERVICE_NAME = "statusPageController";

class StatusPageController extends BaseController {
	static SERVICE_NAME = SERVICE_NAME;
	constructor(commonDependencies) {
		super(commonDependencies);
	}

	get serviceName() {
		return StatusPageController.SERVICE_NAME;
	}

	createStatusPage = this.asyncHandler(
		async (req, res) => {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const { _id, teamId } = req.user;
			const statusPage = await this.db.statusPageModule.createStatusPage({
				statusPageData: req.body,
				image: req.file,
				userId: _id,
				teamId,
			});
			return res.success({
				msg: this.stringService.statusPageCreate,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"createStatusPage"
	);

	updateStatusPage = this.asyncHandler(
		async (req, res) => {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const statusPage = await this.db.statusPageModule.updateStatusPage(req.body, req.file);
			if (statusPage === null) {
				throw this.errorService.createNotFoundError(this.stringService.statusPageNotFound);
			}
			return res.success({
				msg: this.stringService.statusPageUpdate,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"updateStatusPage"
	);

	getStatusPage = this.asyncHandler(
		async (req, res) => {
			const statusPage = await this.db.statusPageModule.getStatusPage();
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"getStatusPage"
	);

	getStatusPageByUrl = this.asyncHandler(
		async (req, res) => {
			await getStatusPageParamValidation.validateAsync(req.params);
			await getStatusPageQueryValidation.validateAsync(req.query);

			const statusPage = await this.db.statusPageModule.getStatusPageByUrl(req.params.url);
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"getStatusPageByUrl"
	);

	getStatusPagesByTeamId = this.asyncHandler(
		async (req, res) => {
			const teamId = req.user.teamId;
			const statusPages = await this.db.statusPageModule.getStatusPagesByTeamId(teamId);

			return res.success({
				msg: this.stringService.statusPageByTeamId,
				data: statusPages,
			});
		},
		SERVICE_NAME,
		"getStatusPagesByTeamId"
	);

	deleteStatusPage = this.asyncHandler(
		async (req, res) => {
			await this.db.deleteStatusPage(req.params.url);
			return res.success({
				msg: this.stringService.statusPageDelete,
			});
		},
		SERVICE_NAME,
		"deleteStatusPage"
	);
}

export default StatusPageController;
