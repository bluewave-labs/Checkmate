import { Router } from "express";
import InviteController from "../../controllers/v2/InviteController.js";
import { verifyToken } from "../../middleware/v2/VerifyToken.js";
import { verifyPermission } from "../../middleware/v2/VerifyPermissions.js";

class InviteRoutes {
	private router;
	private controller;
	constructor(inviteController: InviteController) {
		this.router = Router();
		this.controller = inviteController;
		this.initRoutes();
	}

	initRoutes = () => {
		this.router.post("/", verifyToken, verifyPermission(["invite.create"]), this.controller.create);

		this.router.get("/", verifyToken, verifyPermission(["invite.view"]), this.controller.getAll);

		this.router.get("/:token", verifyToken, verifyPermission(["invite.view"]), this.controller.get);

		this.router.delete("/:id", verifyToken, verifyPermission(["invite.delete"]), this.controller.delete);
	};

	getRouter() {
		return this.router;
	}
}

export default InviteRoutes;
