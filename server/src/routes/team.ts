import { Router } from "express";

import { TeamController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

class TeamRoutes {
  private controller: TeamController;
  private router: Router;
  constructor(teamController: TeamController) {
    this.controller = teamController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.post(
      "/",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.teams.write]),
      this.controller.create
    );

    this.router.get("/", verifyToken, this.controller.getOrg);
    this.router.get("/joined", verifyToken, this.controller.getJoined);

    this.router.get(
      "/:id",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.teams.read]),
      this.controller.get
    );

    this.router.patch(
      "/:id",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.teams.write]),
      this.controller.update
    );

    this.router.delete(
      "/:id",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.teams.delete]),
      this.controller.delete
    );
  };

  getRouter() {
    return this.router;
  }
}

export default TeamRoutes;
