import { Router } from "express";
import { verifyJWT } from "../../middleware/v1/verifyJWT.js";
import { isAllowed } from "../../middleware/v1/isAllowed.js";

class InviteRoutes {
	constructor(inviteController) {
		this.router = Router();
		this.inviteController = inviteController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.post("/send", verifyJWT, isAllowed(["admin", "superadmin"]), this.inviteController.sendInviteEmail);
		this.router.post("/verify", this.inviteController.verifyInviteToken);
		this.router.post("/", verifyJWT, isAllowed(["admin", "superadmin"]), this.inviteController.getInviteToken);
	}

	getRouter() {
		return this.router;
	}
}

export default InviteRoutes;
