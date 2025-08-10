import { Router } from "express";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { verifyOwnership } from "../middleware/verifyOwnership.js";
import { isAllowed } from "../middleware/isAllowed.js";
import multer from "multer";
import User from "../db/models/User.js";

const upload = multer();

class AuthRoutes {
	constructor(authController) {
		this.router = Router();
		this.authController = authController;
		this.initRoutes();
	}

	initRoutes() {
		this.router.post(
			"/register",
			upload.single("profileImage"),
			this.authController.registerUser
		);
		this.router.post("/login", this.authController.loginUser);
		this.router.post("/logout", verifyJWT, this.authController.logoutUser);

		this.router.put(
			"/user/:userId",
			upload.single("profileImage"),
			verifyJWT,
			this.authController.editUser
		);

		this.router.get("/users/superadmin", this.authController.checkSuperadminExists);

		this.router.get(
			"/users",
			verifyJWT,
			isAllowed(["admin", "superadmin"]),
			this.authController.getAllUsers
		);

		this.router.delete(
			"/user/:userId",
			verifyJWT,
			verifyOwnership(User, "userId"),
			this.authController.deleteUser
		);

		// Recovery routes
		this.router.post("/recovery/request", this.authController.requestRecovery);
		this.router.post("/recovery/validate", this.authController.validateRecovery);
		this.router.post("/recovery/reset/", this.authController.resetPassword);
	}

	getRouter() {
		return this.router;
	}
}

export default AuthRoutes;
