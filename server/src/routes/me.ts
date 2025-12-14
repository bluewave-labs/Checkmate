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

    this.router.get("/permissions", verifyToken, addUserContext, (req, res) => {
      const orgPerms = req.user?.roles?.orgRole?.permissions || [];
      const teamPerms = req.user?.roles?.teamRole?.permissions || [];
      const currentTeamId = req.user?.currentTeamId;
      return res.json({
        message: "OK",
        data: {
          org: orgPerms,
          team: Array.isArray(teamPerms)
            ? teamPerms.map((p: string) => ({ teamId: currentTeamId, permission: p }))
            : [],
        },
      });
    });
  };

  getRouter() {
    return this.router;
  }
}

export default MeRoutes;
