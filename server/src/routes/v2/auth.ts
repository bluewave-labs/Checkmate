import { Router } from "express";

import express from "express";
import AuthController from "../../controllers/v2/AuthController.js";
import { verifyToken } from "../../middleware/v2/VerifyToken.js";

const router = express.Router();

class AuthRoutes {
	private controller: AuthController;
	private router: Router;
	constructor(authController: AuthController) {
		this.controller = authController;
		this.router = Router();
		this.initRoutes();
	}

	initRoutes = () => {
		this.router.post("/register", this.controller.register);
		this.router.post("/register/invite/:token", this.controller.registerWithInvite);
		this.router.post("/login", this.controller.login);
		this.router.post("/logout", this.controller.logout);
		this.router.get("/me", verifyToken, this.controller.me);
	};

	getRouter() {
		return this.router;
	}
}

export default AuthRoutes;
