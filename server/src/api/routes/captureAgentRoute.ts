import { Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import type { ICaptureAgentController } from "@/api/controllers/captureAgentController.js";

class CaptureAgentRoutes {
	private readonly router: Router;
	private readonly captureAgentController: ICaptureAgentController;

	constructor(captureAgentController: ICaptureAgentController) {
		this.router = Router();
		this.captureAgentController = captureAgentController;
		this.initRoutes();
	}

	initRoutes() {
		// Agents
		this.router.post("/", isAllowed(["admin", "superadmin"]), this.captureAgentController.createAgent);
		this.router.get("/", this.captureAgentController.listAgents);
		this.router.get("/:agentId", this.captureAgentController.getAgent);
		this.router.patch("/:agentId", isAllowed(["admin", "superadmin"]), this.captureAgentController.updateAgent);
		this.router.delete("/:agentId", isAllowed(["admin", "superadmin"]), this.captureAgentController.deleteAgent);
		this.router.get("/:agentId/health", this.captureAgentController.health);

		// Devices
		this.router.post("/:agentId/devices", isAllowed(["admin", "superadmin"]), this.captureAgentController.addDevice);
		this.router.get("/:agentId/devices", this.captureAgentController.listDevices);
		this.router.patch("/:agentId/devices/:deviceId", isAllowed(["admin", "superadmin"]), this.captureAgentController.updateDevice);
		this.router.delete("/:agentId/devices/:deviceId", isAllowed(["admin", "superadmin"]), this.captureAgentController.deleteDevice);
	}

	getRouter() {
		return this.router;
	}
}

export default CaptureAgentRoutes;
