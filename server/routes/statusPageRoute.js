import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import multer from "multer";
const upload = multer();

class StatusPageRoutes {
	constructor(statusPageController) {
		this.router = Router();
		this.statusPageController = statusPageController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/", this.statusPageController.getStatusPage);
		this.router.get(
			"/team/:teamId",
			verifyJWT,
			this.statusPageController.getStatusPagesByTeamId
		);
		this.router.get("/:url", this.statusPageController.getStatusPageByUrl);

		this.router.post(
			"/",
			upload.single("logo"),
			verifyJWT,
			this.statusPageController.createStatusPage
		);
		this.router.put(
			"/",
			upload.single("logo"),
			verifyJWT,
			this.statusPageController.updateStatusPage
		);
		this.router.delete("/:url(*)", verifyJWT, this.statusPageController.deleteStatusPage);
	}

	getRouter() {
		return this.router;
	}
}

export default StatusPageRoutes;
