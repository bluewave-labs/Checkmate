import { Router } from "express";
import { isAllowed } from "../../middleware/v1/isAllowed.js";

class InviteRoutes {
	constructor(inviteController, verifyJWT) {
		this.router = Router();
		this.inviteController = inviteController;
		this.initRoutes(verifyJWT);
	}

	initRoutes(verifyJWT) {
		this.router.post("/send", verifyJWT, isAllowed(["admin", "superadmin"]), this.inviteController.sendInviteEmail);
		this.router.post("/verify", this.inviteController.verifyInviteToken);
		this.router.post("/", verifyJWT, isAllowed(["admin", "superadmin"]), this.inviteController.getInviteToken);
	}

	getRouter() {
		return this.router;
	}
}

export default InviteRoutes;
