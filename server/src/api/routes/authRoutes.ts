import { Router, RequestHandler } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { imageUpload } from "@/api/middleware/upload.js";
import { IAuthController } from "@/api/controllers/authController.js";

export const createAuthRoutes = (authController: IAuthController, verifyJWT: RequestHandler): Router => {
	const router = Router();
	router.post("/register", imageUpload.single("profileImage"), authController.registerUser);
	router.post("/login", authController.loginUser);

	router.post("/recovery/request", authController.requestRecovery);
	router.post("/recovery/validate", authController.validateRecovery);
	router.post("/recovery/reset/", authController.resetPassword);

	router.get("/users/superadmin", authController.checkSuperadminExists);

	router.get("/users", verifyJWT, isAllowed(["admin", "superadmin"]), authController.getAllUsers);
	router.post("/users", verifyJWT, isAllowed(["superadmin"]), imageUpload.single("profileImage"), authController.createUser);
	router.get("/users/:userId", verifyJWT, isAllowed(["admin", "superadmin"]), authController.getUserById);
	router.patch("/users/:userId", verifyJWT, isAllowed(["superadmin"]), authController.editUserById);
	router.patch("/users/:userId/password", verifyJWT, isAllowed(["superadmin"]), authController.editUserPasswordById);
	router.delete("/users/:userId", verifyJWT, isAllowed(["admin", "superadmin"]), authController.deleteUserById);

	router.patch("/user", verifyJWT, imageUpload.single("profileImage"), isAllowed(["admin", "superadmin", "user"]), authController.editUser);
	router.delete("/user", verifyJWT, isAllowed(["admin", "superadmin", "user"]), authController.deleteUser);
	return router;
};
