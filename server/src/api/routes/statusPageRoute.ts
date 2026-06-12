import { IStatusPageController } from "@/api/controllers/statusPageController.js";
import { RequestHandler, Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import multer from "multer";
const upload = multer();

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

		this.router.post("/", upload.single("logo"), verifyJWT, isAllowed(["admin", "superadmin"]), this.statusPageController.createStatusPage);
		this.router.put("/:id", upload.single("logo"), verifyJWT, isAllowed(["admin", "superadmin"]), this.statusPageController.updateStatusPage);

		this.router.get("/:url", verifyStatusPageAccess, this.statusPageController.getStatusPageByUrl);
		this.router.delete("/:id", verifyJWT, isAllowed(["admin", "superadmin"]), this.statusPageController.deleteStatusPage);
	}

	getRouter() {
		return this.router;
	}
}

export default StatusPageRoutes;
