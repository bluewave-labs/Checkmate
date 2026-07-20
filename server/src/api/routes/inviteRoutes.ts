import { RequestHandler, Router } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import { IInviteController } from "@/api/controllers/inviteController.js";

export const createInviteRoutes = (inviteController: IInviteController, verifyJWT: RequestHandler): Router => {
	const router = Router();
	router.post("/send", verifyJWT, isAllowed(["admin", "superadmin"]), inviteController.sendInviteEmail);
	router.post("/verify", inviteController.verifyInviteToken);
	router.post("/", verifyJWT, isAllowed(["admin", "superadmin"]), inviteController.getInviteToken);
	return router;
};
