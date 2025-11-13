import { Router } from "express";

import { TeamMemberController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";

class TeamMemberRoutes {
  private controller: TeamMemberController;
  private router: Router;
  constructor(teamMemberController: TeamMemberController) {
    this.controller = teamMemberController;
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

    this.router.get("/", verifyToken, addUserContext, this.controller.getAll);

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

export default TeamMemberRoutes;
