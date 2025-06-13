import { handleError, handleValidationError } from "./controllerUtils.js";
import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
	getStatusPageQueryValidation,
	imageValidation,
} from "../validation/joi.js";

const SERVICE_NAME = "statusPageController";

class StatusPageController {
	constructor(db, stringService) {
		this.db = db;
		this.stringService = stringService;
	}

	createStatusPage = async (req, res, next) => {
		try {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
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
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createStatusPage"));
		}
	};

	updateStatusPage = async (req, res, next) => {
		try {
			await createStatusPageBodyValidation.validateAsync(req.body);
			await imageValidation.validateAsync(req.file);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
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
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "updateStatusPage"));
		}
	};

	getStatusPage = async (req, res, next) => {
		try {
			const statusPage = await this.db.getStatusPage();
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getStatusPage"));
		}
	};

	getStatusPageByUrl = async (req, res, next) => {
		try {
			await getStatusPageParamValidation.validateAsync(req.params);
			await getStatusPageQueryValidation.validateAsync(req.query);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const statusPage = await this.db.getStatusPageByUrl(req.params.url, req.query.type);
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getStatusPageByUrl"));
		}
	};

	getStatusPagesByTeamId = async (req, res, next) => {
		try {
			const teamId = req.params.teamId;
			const statusPages = await this.db.getStatusPagesByTeamId(teamId);

			return res.success({
				msg: this.stringService.statusPageByTeamId,
				data: statusPages,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getStatusPageByTeamId"));
		}
	};

	deleteStatusPage = async (req, res, next) => {
		try {
			await this.db.deleteStatusPage(req.params.url);
			return res.success({
				msg: this.stringService.statusPageDelete,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "deleteStatusPage"));
		}
	};
}

export default StatusPageController;
