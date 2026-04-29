import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { ISettingsController } from "@/controllers/settingsController.js";

class SettingsRoutes {
	private router: Router;
	private settingsController: ISettingsController;

	constructor(settingsController: ISettingsController) {
		this.router = Router();
		this.settingsController = settingsController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/", this.settingsController.getAppSettings);
		this.router.patch("/", isAllowed(["admin", "superadmin"]), this.settingsController.updateAppSettings);
		this.router.post("/test-email", isAllowed(["admin", "superadmin"]), this.settingsController.sendTestEmail);
		this.router.post("/globalping/test", isAllowed(["admin", "superadmin"]), this.settingsController.testGlobalpingToken);
	}

	getRouter() {
		return this.router;
	}
}

export default SettingsRoutes;
