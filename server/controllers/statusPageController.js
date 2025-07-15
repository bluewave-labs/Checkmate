import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	imageValidation,
} from "../validation/joi.js";
import { asyncHandler } from "../utils/errorUtils.js";

const SERVICE_NAME = "statusPageController";

class StatusPageController {
	constructor(db, stringService) {
		this.db = db;
		this.stringService = stringService;
	}

	createStatusPage = asyncHandler(
		async (req, res, next) => {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const { _id, teamId } = req.user;
			const statusPage = await this.db.createStatusPage({
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

	updateStatusPage = asyncHandler(
		async (req, res, next) => {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);

			const statusPage = await this.db.updateStatusPage(req.body, req.file);
			if (statusPage === null) {
				const error = new Error(this.stringService.statusPageNotFound);
				error.status = 404;
				throw error;
			}
			return res.success({
				msg: this.stringService.statusPageUpdate,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"updateStatusPage"
	);

	getStatusPage = asyncHandler(
		async (req, res, next) => {
			const statusPage = await this.db.getStatusPage();
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"getStatusPage"
	);

	getStatusPageByUrl = asyncHandler(
		async (req, res, next) => {
			await getStatusPageParamValidation.validateAsync(req.params);
			await getStatusPageQueryValidation.validateAsync(req.query);

			const statusPage = await this.db.getStatusPageByUrl(req.params.url, req.query.type);
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		},
		SERVICE_NAME,
		"getStatusPageByUrl"
	);

	getStatusPagesByTeamId = asyncHandler(
		async (req, res, next) => {
			const teamId = req.user.teamId;
			const statusPages = await this.db.getStatusPagesByTeamId(teamId);

			return res.success({
				msg: this.stringService.statusPageByTeamId,
				data: statusPages,
			});
		},
		SERVICE_NAME,
		"getStatusPagesByTeamId"
	);

	deleteStatusPage = asyncHandler(
		async (req, res, next) => {
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
