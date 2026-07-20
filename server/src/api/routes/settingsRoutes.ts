import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { ISettingsController } from "@/api/controllers/settingsController.js";

export const createSettingsRoutes = (settingsController: ISettingsController): Router => {
	const router = Router();
	router.get("/", settingsController.getAppSettings);
	router.patch("/", isAllowed(["admin", "superadmin"]), settingsController.updateAppSettings);
	router.post("/test-email", isAllowed(["admin", "superadmin"]), settingsController.sendTestEmail);
	return router;
};
