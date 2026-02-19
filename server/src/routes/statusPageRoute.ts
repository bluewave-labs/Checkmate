import { RequestHandler, Router } from "express";
import multer from "multer";
const upload = multer();

class StatusPageRoutes {
	private router: Router;
	private statusPageController: any;

	constructor(statusPageController: any, verifyJWT: RequestHandler, verifyStatusPageAccess: RequestHandler) {
		this.router = Router();
		this.statusPageController = statusPageController;
		this.initRoutes(verifyJWT, verifyStatusPageAccess);
	}

	initRoutes(verifyJWT: RequestHandler, verifyStatusPageAccess: RequestHandler) {
		this.router.get("/team", verifyJWT, this.statusPageController.getStatusPagesByTeamId);

		this.router.post("/", upload.single("logo"), verifyJWT, this.statusPageController.createStatusPage);
		this.router.put("/:id", upload.single("logo"), verifyJWT, this.statusPageController.updateStatusPage);

		// Route 1: published pages — no JWT
		this.router.get("/:url", verifyStatusPageAccess, this.statusPageController.getStatusPageByUrl);
		// Route 2: unpublished pages — JWT required (reached via next("route"))
		this.router.get("/:url", verifyJWT, this.statusPageController.getStatusPageByUrl);
		this.router.delete("/:id", verifyJWT, this.statusPageController.deleteStatusPage);
	}

	getRouter() {
		return this.router;
	}
}

export default StatusPageRoutes;
