import { Router } from "express";

import { ChecksController, IncidentsController } from "@/controllers/index.js";
import { verifyToken } from "@/middleware/VerifyToken.js";
import { addUserContext } from "@/middleware/AddUserContext.js";
import { validateQuery, validateBody } from "@/middleware/validation.js";
import { verifyOrgPermission } from "@/middleware/VerifyPermission.js";
import { PERMISSIONS } from "@/services/business/AuthService.js";
import {
  getIncidentsQuerySchema,
  patchIncidentsBodySchema,
} from "@/validation/index.js";

class IncidentsRoutes {
  private controller: IncidentsController;
  private router: Router;
  constructor(incidentsController: IncidentsController) {
    this.controller = incidentsController;
    this.router = Router();
    this.initRoutes();
  }

  initRoutes = () => {
    this.router.get(
      "/",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.incidents.read]),
      validateQuery(getIncidentsQuerySchema),
      this.controller.getIncidents
    );

    this.router.patch(
      "/:id/resolve",
      verifyToken,
      addUserContext,
      verifyOrgPermission([PERMISSIONS.incidents.update]),
      validateBody(patchIncidentsBodySchema),
      this.controller.resolveIncident
    );
  };

  getRouter() {
    return this.router;
  }
}

export default IncidentsRoutes;
