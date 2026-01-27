import { Router, RequestHandler } from "express";
import { isAllowed } from "../middleware/isAllowed.js";
import multer from "multer";

const upload = multer();

class AuthRoutes {
	private router: Router;
	private authController: any;

	constructor(authController: any, verifyJWT: RequestHandler) {
		this.router = Router();
		this.authController = authController;
		this.initRoutes(verifyJWT);
	}

	initRoutes(verifyJWT: RequestHandler) {
		this.router.post("/register", upload.single("profileImage"), this.authController.registerUser);
		this.router.post("/login", this.authController.loginUser);

		this.router.post("/recovery/request", this.authController.requestRecovery);
		this.router.post("/recovery/validate", this.authController.validateRecovery);
		this.router.post("/recovery/reset/", this.authController.resetPassword);

		this.router.get("/users/superadmin", this.authController.checkSuperadminExists);

		this.router.get("/users", verifyJWT, isAllowed(["admin", "superadmin"]), this.authController.getAllUsers);
		this.router.get("/users/:userId", verifyJWT, isAllowed(["superadmin"]), this.authController.getUserById);
		this.router.put("/users/:userId", verifyJWT, isAllowed(["superadmin"]), this.authController.editUserById);
		this.router.put("/users/:userId/password", verifyJWT, isAllowed(["superadmin"]), this.authController.editUserPasswordById);

		this.router.put("/user", verifyJWT, upload.single("profileImage"), this.authController.editUser);
		this.router.delete("/user", verifyJWT, this.authController.deleteUser);
	}

	getRouter() {
		return this.router;
	}
}

export default AuthRoutes;
