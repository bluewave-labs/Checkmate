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
		this.router.post("/register", upload.single("profileImage"), this.authController.registerUser);
		this.router.post("/login", this.authController.loginUser);

		this.router.post("/recovery/request", this.authController.requestRecovery);
		this.router.post("/recovery/validate", this.authController.validateRecovery);
		this.router.post("/recovery/reset/", this.authController.resetPassword);

		this.router.get("/users/superadmin", this.authController.checkSuperadminExists);
		this.router.get("/users", verifyJWT, isAllowed(["admin", "superadmin"]), this.authController.getAllUsers);

		this.router.put("/user/:userId", verifyJWT, upload.single("profileImage"), this.authController.editUser);
		this.router.delete("/user/:userId", verifyJWT, verifyOwnership(User, "userId"), this.authController.deleteUser);
	}

	getRouter() {
		return this.router;
	}
}

export default AuthRoutes;
