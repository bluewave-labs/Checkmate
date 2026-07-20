import { IMaintenanceWindowController } from "@/api/controllers/maintenanceWindowController.js";
import { Router } from "express";

export const createMaintenanceWindowRoutes = (maintenanceWindowController: IMaintenanceWindowController): Router => {
	const router = Router();
	router.post("/", maintenanceWindowController.createMaintenanceWindows);
	router.get("/team/", maintenanceWindowController.getMaintenanceWindowsByTeamId);

	router.get("/monitor/:monitorId", maintenanceWindowController.getMaintenanceWindowsByMonitorId);

	router.get("/:id", maintenanceWindowController.getMaintenanceWindowById);
	router.patch("/:id", maintenanceWindowController.editMaintenanceWindow);
	router.delete("/:id", maintenanceWindowController.deleteMaintenanceWindow);
	return router;
};
