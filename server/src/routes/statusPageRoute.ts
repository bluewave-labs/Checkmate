import { IStatusPageController } from "@/controllers/statusPageController.js";
import { RequestHandler, Router } from "express";
import multer from "multer";
const upload = multer();

class StatusPageRoutes {
	private router: Router;
	private statusPageController: IStatusPageController;

	constructor(
		statusPageController: IStatusPageController,
		verifyJWT: RequestHandler,
		verifyStatusPageAccess: RequestHandler,
		authApiLimiter: RequestHandler
	) {
		this.router = Router();
		this.statusPageController = statusPageController;
		this.initRoutes(verifyJWT, verifyStatusPageAccess, authApiLimiter);
	}

	initRoutes(verifyJWT: RequestHandler, verifyStatusPageAccess: RequestHandler, authApiLimiter: RequestHandler) {
		this.router.get("/team", verifyJWT, this.statusPageController.getStatusPagesByTeamId);

		this.router.post("/", upload.single("logo"), verifyJWT, this.statusPageController.createStatusPage);
		this.router.put("/:id", upload.single("logo"), verifyJWT, this.statusPageController.updateStatusPage);

		this.router.get("/:url", verifyStatusPageAccess, this.statusPageController.getStatusPageByUrl);
		// Two-layer defense on unlock: authApiLimiter caps IP volume (15/min,
		// shared across /api/v1/auth/*); the controller then enforces a per-page
		// brute-force lockout (10 attempts per 15-min window per IP) inside the
		// handler. The IP cap is shared with login, so an attacker hammering
		// unlock will also burn through their login budget — intentional.
		this.router.post("/:url/unlock", authApiLimiter, this.statusPageController.unlockStatusPage);
		this.router.post("/:url/lock", this.statusPageController.lockStatusPage);
		this.router.delete("/:id", verifyJWT, this.statusPageController.deleteStatusPage);
	}

	getRouter() {
		return this.router;
	}
}

export default StatusPageRoutes;
