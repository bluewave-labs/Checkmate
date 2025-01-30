import { handleError, handleValidationError } from "./controllerUtils.js";
import {
	createStatusPageBodyValidation,
	getStatusPageParamValidation,
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
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const statusPage = await this.db.createStatusPage(req.body);
			return res.success({
				msg: this.stringService.statusPageCreate,
				data: statusPage,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "createStatusPage"));
		}
	};
	getStatusPageByUrl = async (req, res, next) => {
		try {
			await getStatusPageParamValidation.validateAsync(req.params);
		} catch (error) {
			next(handleValidationError(error, SERVICE_NAME));
			return;
		}

		try {
			const { url } = req.params;
			const statusPage = await this.db.getStatusPageByUrl(url);
			return res.success({
				msg: this.stringService.statusPageByUrl,
				data: statusPage,
			});
		} catch (error) {
			next(handleError(error, SERVICE_NAME, "getStatusPage"));
		}
	};
}

export default StatusPageController;
