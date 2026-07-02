import { IStatusPageController } from "@/api/controllers/statusPageController.js";
import { RequestHandler, Router } from "express";
import { imageUpload } from "@/api/middleware/upload.js";

class StatusPageRoutes {
	private router: Router;
	private statusPageController: IStatusPageController;

	constructor(statusPageController: IStatusPageController, verifyJWT: RequestHandler, verifyStatusPageAccess: RequestHandler) {
		this.router = Router();
		this.statusPageController = statusPageController;
		this.initRoutes(verifyJWT, verifyStatusPageAccess);
	}

	initRoutes(verifyJWT: RequestHandler, verifyStatusPageAccess: RequestHandler) {
		this.router.get("/team", verifyJWT, this.statusPageController.getStatusPagesByTeamId);

		this.router.post("/", imageUpload.single("logo"), verifyJWT, this.statusPageController.createStatusPage);
		this.router.put("/:id", imageUpload.single("logo"), verifyJWT, this.statusPageController.updateStatusPage);

		this.router.get("/resolve", this.statusPageController.resolveStatusPageByDomain);
		this.router.get("/:url", verifyStatusPageAccess, this.statusPageController.getStatusPageByUrl);
		this.router.delete("/:id", verifyJWT, this.statusPageController.deleteStatusPage);
	}

	getRouter() {
		return this.router;
	}
}

export default StatusPageRoutes;
