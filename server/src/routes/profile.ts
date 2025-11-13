import { Router } from "express";
import { ProfileController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { validateBody } from "@/middleware/validation.js";
import { profileSchema } from "@/validation/index.js";

class ProfileRoutes {
  private router;
  private controller;
  constructor(profileController: ProfileController) {
    this.router = Router();
    this.controller = profileController;
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get("/", verifyToken, addUserContext, this.controller.get);

    this.router.patch(
      "/",
      verifyToken,
      addUserContext,
      validateBody(profileSchema),
      this.controller.update
    );
  };

  getRouter() {
    return this.router;
  }
}

export default ProfileRoutes;
