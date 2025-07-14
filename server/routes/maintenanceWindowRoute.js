import { Router } from "express";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { verifyTeamAccess } from "../middleware/verifyTeamAccess.js";
import Monitor from "../db/models/Monitor.js";
import MaintenanceWindow from "../db/models/MaintenanceWindow.js";
class MaintenanceWindowRoutes {
	constructor(maintenanceWindowController) {
		this.router = Router();
		this.maintenanceWindowController = maintenanceWindowController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.post("/", this.maintenanceWindowController.createMaintenanceWindows);

		this.router.get(
			"/monitor/:monitorId",
			verifyOwnership(Monitor, "monitorId"),
			this.maintenanceWindowController.getMaintenanceWindowsByMonitorId
		);

		this.router.get(
			"/team/",
			this.maintenanceWindowController.getMaintenanceWindowsByTeamId
		);

		this.router.get("/:id", this.maintenanceWindowController.getMaintenanceWindowById);

		this.router.put(
			"/:id",
			verifyTeamAccess(MaintenanceWindow, "id"),
			this.maintenanceWindowController.editMaintenanceWindow
		);

		this.router.delete(
			"/:id",
			verifyTeamAccess(MaintenanceWindow, "id"),
			this.maintenanceWindowController.deleteMaintenanceWindow
		);
	}

	getRouter() {
		return this.router;
	}
}

export default MaintenanceWindowRoutes;
