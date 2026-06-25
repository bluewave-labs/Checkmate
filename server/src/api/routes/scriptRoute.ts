import { Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import type { IScriptController } from "@/api/controllers/scriptController.js";

class ScriptRoutes {
	private readonly router: Router;
	private readonly scriptController: IScriptController;

	constructor(scriptController: IScriptController) {
		this.router = Router();
		this.scriptController = scriptController;
		this.initRoutes();
	}

	initRoutes() {
		// Script library
		this.router.get("/", this.scriptController.listScripts);
		this.router.post("/", isAllowed(["admin", "superadmin"]), this.scriptController.createScript);
		this.router.get("/:scriptId", isAllowed(["admin", "superadmin"]), this.scriptController.getScript);
		this.router.put("/:scriptId", isAllowed(["admin", "superadmin"]), this.scriptController.updateScript);
		this.router.delete("/:scriptId", isAllowed(["admin", "superadmin"]), this.scriptController.deleteScript);
	}

	getRouter() {
		return this.router;
	}
}

export class ProbeRoutes {
	private readonly router: Router;
	private readonly scriptController: IScriptController;

	constructor(scriptController: IScriptController) {
		this.router = Router();
		this.scriptController = scriptController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.get("/", this.scriptController.listProbes);
		this.router.post("/", isAllowed(["admin", "superadmin"]), this.scriptController.registerProbe);
		this.router.delete("/:probeId", isAllowed(["admin", "superadmin"]), this.scriptController.deregisterProbe);
	}

	getRouter() {
		return this.router;
	}
}

export default ScriptRoutes;
