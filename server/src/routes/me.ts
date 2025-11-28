import { Router } from "express";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";

class MeRoutes {
  private router;
  constructor() {
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get(
      "/entitlements",
      verifyToken,
      addUserContext,
      (req, res) => {
        const entitlements = req.entitlements || {};
        return res.json({ entitlements });
      }
    );
  };

  getRouter() {
    return this.router;
  }
}

export default MeRoutes;
