import { IMaintenanceWindowController } from "@/controllers/maintenanceWindowController.js";
import verifyJWT from "@/middleware/verifyJWT.js";
import { Router } from "express";

class MaintenanceWindowRoutes {
	private router: Router;
	private mwController: IMaintenanceWindowController;

	constructor(maintenanceWindowController: IMaintenanceWindowController) {
		this.router = Router();
		this.mwController = maintenanceWindowController;
		this.initRoutes();
	}
	initRoutes() {
		this.router.use(verifyJWT);
		this.router.post("/", this.mwController.createMaintenanceWindows);
		this.router.get("/team/", this.mwController.getMaintenanceWindowsByTeamId);

		this.router.get("/monitor/:monitorId", this.mwController.getMaintenanceWindowsByMonitorId);

		this.router.get("/:id", this.mwController.getMaintenanceWindowById);
		this.router.patch("/:id", this.mwController.editMaintenanceWindow);
		this.router.delete("/:id", this.mwController.deleteMaintenanceWindow);
	}

	getRouter() {
		return this.router;
	}
}

export default MaintenanceWindowRoutes;
