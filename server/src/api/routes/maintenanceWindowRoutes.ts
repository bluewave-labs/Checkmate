import { IMaintenanceWindowController } from "@/api/controllers/maintenanceWindowController.js";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { Router } from "express";

export const createMaintenanceWindowRoutes = (maintenanceWindowController: IMaintenanceWindowController): Router => {
	const router = Router();
	router.post("/", isAllowed(["admin", "superadmin"]), maintenanceWindowController.createMaintenanceWindows);
	router.get("/team/", maintenanceWindowController.getMaintenanceWindowsByTeamId);

	router.get("/monitor/:monitorId", maintenanceWindowController.getMaintenanceWindowsByMonitorId);

	router.get("/:id", maintenanceWindowController.getMaintenanceWindowById);
	router.patch("/:id", isAllowed(["admin", "superadmin"]), maintenanceWindowController.editMaintenanceWindow);
	router.delete("/:id", isAllowed(["admin", "superadmin"]), maintenanceWindowController.deleteMaintenanceWindow);
	return router;
};
