import { Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { IMonitorController } from "@/api/controllers/monitorController.js";

export const createMonitorRoutes = (monitorController: IMonitorController): Router => {
	const router = Router();

	// Team routes
	router.get("/team", monitorController.getMonitorsByTeamId);
	router.get("/team/with-checks", monitorController.getMonitorsWithChecksByTeamId);

	// Uptime routes
	router.get("/uptime/details/:monitorId", monitorController.getUptimeDetailsById);

	// Hardware routes
	router.get("/hardware/details/:monitorId", monitorController.getHardwareDetailsById);

	// PageSpeed routes
	router.get("/pagespeed/details/:monitorId", monitorController.getPageSpeedDetailsById);

	// Geo checks routes
	router.get("/:monitorId/geo-checks", monitorController.getGeoChecksByMonitorId);

	// General monitor routes
	router.post("/pause/:monitorId", isAllowed(["admin", "superadmin"]), monitorController.pauseMonitor);
	router.post("/bulk/pause", isAllowed(["admin", "superadmin"]), monitorController.bulkPauseMonitors);

	// Util routes
	router.get("/certificate/:monitorId", (req, res, next) => {
		monitorController.getMonitorCertificate(req, res, next);
	});

	// General monitor CRUD routes
	router.patch("/notifications", isAllowed(["admin", "superadmin"]), monitorController.updateNotifications);
	router.post("/", isAllowed(["admin", "superadmin"]), monitorController.createMonitor);
	router.delete("/", isAllowed(["superadmin"]), monitorController.deleteAllMonitors);

	// Other static routes
	router.post("/demo", isAllowed(["admin", "superadmin"]), monitorController.addDemoMonitors);
	router.get("/export/json", isAllowed(["admin", "superadmin"]), monitorController.exportMonitorsToJSON);
	router.post("/import/json", isAllowed(["admin", "superadmin"]), monitorController.importMonitorsFromJSON);

	router.get("/games", monitorController.getAllGames);

	// Individual monitor CRUD routes
	router.get("/:monitorId", monitorController.getMonitorById);
	router.patch("/:monitorId", isAllowed(["admin", "superadmin"]), monitorController.editMonitor);
	router.delete("/:monitorId", isAllowed(["admin", "superadmin"]), monitorController.deleteMonitor);
	return router;
};
