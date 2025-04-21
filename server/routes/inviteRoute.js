import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { isAllowed } from "../middleware/isAllowed.js";

class InviteRoutes {
	constructor(inviteController) {
		this.router = Router();
		this.inviteController = inviteController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.post(
			"/",
			isAllowed(["admin", "superadmin"]),
			verifyJWT,
			this.inviteController.getInviteToken
		);

		this.router.post("/send", this.inviteController.sendInviteEmail);
		this.router.post("/verify", this.inviteController.inviteVerifyController);
	}

	getRouter() {
		return this.router;
	}
}

export default InviteRoutes;
