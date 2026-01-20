import { Router } from "express";
import { isAllowed } from "../../middleware/isAllowed.js";
import multer from "multer";
import { fetchMonitorCertificate } from "../../controllers/controllerUtils.js";
const upload = multer({
	storage: multer.memoryStorage(), // Store file in memory as Buffer
});

class MonitorRoutes {
	private router: Router;
	private monitorController: any;
	constructor(monitorController: any) {
		this.router = Router();
		this.monitorController = monitorController;
		this.initRoutes();
	}

	initRoutes() {
		// Team routes
		this.router.get("/team", this.monitorController.getMonitorsByTeamId);
		this.router.get("/team/with-checks", this.monitorController.getMonitorsWithChecksByTeamId);
		this.router.get("/team/groups", this.monitorController.getGroupsByTeamId);

		// Uptime routes
		this.router.get("/uptime/details/:monitorId", this.monitorController.getUptimeDetailsById);

		// Hardware routes
		this.router.get("/hardware/details/:monitorId", this.monitorController.getHardwareDetailsById);
		// PageSpeed routes
		this.router.get("/pagespeed/details/:monitorId", this.monitorController.getPageSpeedDetailsById);

		// General monitor routes
		this.router.post("/pause/:monitorId", isAllowed(["admin", "superadmin"]), this.monitorController.pauseMonitor);

		// Util routes
		this.router.get("/certificate/:monitorId", (req, res, next) => {
			this.monitorController.getMonitorCertificate(req, res, next, fetchMonitorCertificate);
		});

		// General monitor CRUD routes
		this.router.post("/", isAllowed(["admin", "superadmin"]), this.monitorController.createMonitor);
		this.router.delete("/", isAllowed(["superadmin"]), this.monitorController.deleteAllMonitors);

		// Other static routes
		this.router.post("/demo", isAllowed(["admin", "superadmin"]), this.monitorController.addDemoMonitors);
		this.router.get("/export/json", isAllowed(["admin", "superadmin"]), this.monitorController.exportMonitorsToJSON);
		this.router.post("/bulk", isAllowed(["admin", "superadmin"]), upload.single("csvFile"), this.monitorController.createBulkMonitors);
		this.router.post("/test-email", isAllowed(["admin", "superadmin"]), this.monitorController.sendTestEmail);
		this.router.get("/games", this.monitorController.getAllGames);

		// Individual monitor CRUD routes
		this.router.get("/:monitorId", this.monitorController.getMonitorById);
		this.router.put("/:monitorId", isAllowed(["admin", "superadmin"]), this.monitorController.editMonitor);
		this.router.delete("/:monitorId", isAllowed(["admin", "superadmin"]), this.monitorController.deleteMonitor);
	}

	getRouter() {
		return this.router;
	}
}

export default MonitorRoutes;
