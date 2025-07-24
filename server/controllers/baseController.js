import { asyncHandler } from "../service/infrastructure/errorService.js";

class BaseController {
	constructor() {
		this.asyncHandler = asyncHandler;
	}
}
export default BaseController;
