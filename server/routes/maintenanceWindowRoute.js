import { Router } from "express";
import MaintenanceWindow from "../db/models/MaintenanceWindow.js";
class MaintenanceWindowRoutes {
	constructor(maintenanceWindowController) {
		this.router = Router();
		this.mwController = maintenanceWindowController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.post("/", this.mwController.createMaintenanceWindows);
		this.router.get("/team/", this.mwController.getMaintenanceWindowsByTeamId);

		this.router.get("/monitor/:monitorId", this.mwController.getMaintenanceWindowsByMonitorId);

		this.router.get("/:id", this.mwController.getMaintenanceWindowById);
		this.router.put("/:id", this.mwController.editMaintenanceWindow);
		this.router.delete("/:id", this.mwController.deleteMaintenanceWindow);
	}

	getRouter() {
		return this.router;
	}
}

export default MaintenanceWindowRoutes;
