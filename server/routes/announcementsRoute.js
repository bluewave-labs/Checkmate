import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { isAllowed } from "../middleware/isAllowed.js";

class AnnouncementRoutes {
	constructor(controller) {
		this.router = Router();
		this.announcementController = controller;
		this.initRoutes();
	}

	initRoutes() {
		/**
		 * @route   POST /
		 * @desc    Create a new announcement
		 * @access  Private (Requires JWT verification)
		 */
		this.router.post(
			"/",
			verifyJWT,
			isAllowed(["admin", "superadmin"]),
			this.announcementController.createAnnouncement
		);

		/**
		 * @route   GET /
		 * @desc    Get announcements
		 * @access  Public
		 */
		this.router.get("/", this.announcementController.getAnnouncement);
	}

	getRouter() {
		return this.router;
	}
}

export default AnnouncementRoutes;
