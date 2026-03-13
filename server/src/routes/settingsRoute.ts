import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";

class SettingsRoutes {
	private router: Router;
	private settingsController: any;

	constructor(settingsController: any) {
		this.router = Router();
		this.settingsController = settingsController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/", this.settingsController.getAppSettings);
		this.router.get("/globalping-status", isAllowed(["admin", "superadmin"]), this.settingsController.getGlobalpingStatus);
		this.router.patch("/", isAllowed(["admin", "superadmin"]), this.settingsController.updateAppSettings);
		this.router.post("/test-email", isAllowed(["admin", "superadmin"]), this.settingsController.sendTestEmail);
	}

	getRouter() {
		return this.router;
	}
}

export default SettingsRoutes;
