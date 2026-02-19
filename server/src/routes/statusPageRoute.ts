import { RequestHandler, Router } from "express";
import multer from "multer";
const upload = multer();

class StatusPageRoutes {
	private router: Router;
	private statusPageController: any;

	constructor(statusPageController: any, verifyJWT: RequestHandler) {
		this.router = Router();
		this.statusPageController = statusPageController;
		this.initRoutes(verifyJWT);
	}

	initRoutes(verifyJWT: RequestHandler) {
		this.router.get("/team", verifyJWT, this.statusPageController.getStatusPagesByTeamId);

		this.router.post("/", upload.single("logo"), verifyJWT, this.statusPageController.createStatusPage);
		this.router.put("/:id", upload.single("logo"), verifyJWT, this.statusPageController.updateStatusPage);

		this.router.get("/:url", verifyJWT, this.statusPageController.getStatusPageByUrl);
		this.router.delete("/:id", verifyJWT, this.statusPageController.deleteStatusPage);
	}

	getRouter() {
		return this.router;
	}
}

export default StatusPageRoutes;
