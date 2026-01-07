import { Router } from "express";

import { AuthController } from "@/controllers/index.js";
import { validateBody } from "@/middleware/validation.js";
import {
  registerSchema,
  registerWithInviteSchema,
  loginSchema,
} from "@/validation/index.js";

class AuthRoutes {
  private controller: AuthController;
  private router: Router;
  constructor(authController: AuthController) {
    this.controller = authController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/register",
      validateBody(registerSchema),
      this.controller.register
    );
    this.router.post(
      "/register/invite/:token",
      validateBody(registerWithInviteSchema),
      this.controller.registerWithInvite
    );
    this.router.post(
      "/login",
      validateBody(loginSchema),
      this.controller.login
    );
    this.router.post("/logout", this.controller.logout);
    // this.router.get("/me", verifyToken, this.controller.me);
  };

  getRouter() {
    return this.router;
  }
}

export default AuthRoutes;
