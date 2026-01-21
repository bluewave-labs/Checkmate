import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";

class InviteRoutes {
	private router: Router;
	private inviteController: any;

	constructor(inviteController: any, verifyJWT: RequestHandler) {
		this.router = Router();
		this.inviteController = inviteController;
		this.initRoutes(verifyJWT);
	}

	initRoutes(verifyJWT: RequestHandler) {
		this.router.post("/send", verifyJWT, isAllowed(["admin", "superadmin"]), this.inviteController.sendInviteEmail);
		this.router.post("/verify", this.inviteController.verifyInviteToken);
		this.router.post("/", verifyJWT, isAllowed(["admin", "superadmin"]), this.inviteController.getInviteToken);
	}

	getRouter() {
		return this.router;
	}
}

export default InviteRoutes;
