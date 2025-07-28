import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";

class SettingsRoutes {
	constructor(settingsController) {
		this.router = Router();
		this.settingsController = settingsController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/", this.settingsController.getAppSettings);
		this.router.put("/", isAllowed(["admin", "superadmin"]), this.settingsController.updateAppSettings);
		this.router.post("/test-email", isAllowed(["admin", "superadmin"]), this.settingsController.sendTestEmail);
	}

	getRouter() {
		return this.router;
	}
}

export default SettingsRoutes;
