import { Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import multer from "multer";
import { fetchMonitorCertificate } from "../controllers/controllerUtils.js";
import Monitor from "../db/models/Monitor.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { verifyTeamAccess } from "../middleware/verifyTeamAccess.js";
const upload = multer({
	storage: multer.memoryStorage(), // Store file in memory as Buffer
});

class MonitorRoutes {
	constructor(monitorController) {
		this.router = Router();
		this.monitorController = monitorController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/", this.monitorController.getAllMonitors);
		this.router.get("/uptime", this.monitorController.getAllMonitorsWithUptimeStats);
		this.router.get(
			"/export",
			isAllowed(["admin", "superadmin"]),
			this.monitorController.exportMonitorsToCSV
		);
		this.router.get("/stats/:monitorId", this.monitorController.getMonitorStatsById);
		this.router.get(
			"/hardware/details/:monitorId",
			this.monitorController.getHardwareDetailsById
		);

		this.router.get(
			"/uptime/details/:monitorId",
			this.monitorController.getUptimeDetailsById
		);
		this.router.get("/certificate/:monitorId", (req, res, next) => {
			this.monitorController.getMonitorCertificate(
				req,
				res,
				next,
				fetchMonitorCertificate
			);
		});
		this.router.get("/team", this.monitorController.getMonitorsByTeamId);

		this.router.get("/:monitorId", this.monitorController.getMonitorById);

		this.router.get(
			"/summary/team",
			this.monitorController.getMonitorsAndSummaryByTeamId
		);

		this.router.get(
			"/team/with-checks",
			this.monitorController.getMonitorsWithChecksByTeamId
		);

		this.router.get(
			"/resolution/url",
			isAllowed(["admin", "superadmin"]),
			this.monitorController.checkEndpointResolution
		);

		this.router.delete(
			"/:monitorId",
			verifyOwnership(Monitor, "monitorId"),
			isAllowed(["admin", "superadmin"]),
			this.monitorController.deleteMonitor
		);

		this.router.post(
			"/",
			isAllowed(["admin", "superadmin"]),
			this.monitorController.createMonitor
		);

		this.router.put(
			"/:monitorId",
			verifyTeamAccess(Monitor, "monitorId"),
			isAllowed(["admin", "superadmin"]),
			this.monitorController.editMonitor
		);

		this.router.delete(
			"/",
			isAllowed(["superadmin"]),
			this.monitorController.deleteAllMonitors
		);

		this.router.post(
			"/pause/:monitorId",
			isAllowed(["admin", "superadmin"]),
			this.monitorController.pauseMonitor
		);

		this.router.post(
			"/demo",
			isAllowed(["admin", "superadmin"]),
			this.monitorController.addDemoMonitors
		);

		this.router.post(
			"/bulk",
			isAllowed(["admin", "superadmin"]),
			upload.single("csvFile"),
			this.monitorController.createBulkMonitors
		);

		this.router.post("/seed", isAllowed(["superadmin"]), this.monitorController.seedDb);

		this.router.post(
			"/test-email",
			isAllowed(["admin", "superadmin"]),
			this.monitorController.sendTestEmail
		);

		this.router.get(
			"/network/details/:monitorId",
			this.monitorController.getNetworkDetailsById
		);
	}

	getRouter() {
		return this.router;
	}
}

export default MonitorRoutes;
