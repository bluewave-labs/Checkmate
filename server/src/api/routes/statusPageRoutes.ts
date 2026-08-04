import { IStatusPageController } from "@/api/controllers/statusPageController.js";
import { RequestHandler, Router } from "express";
import { isAllowed } from "@/api/middleware/isAllowed.js";
import { imageUpload } from "@/api/middleware/upload.js";

export const createStatusPageRoutes = (
	statusPageController: IStatusPageController,
	verifyJWT: RequestHandler,
	verifyStatusPageAccess: RequestHandler
): Router => {
	const router = Router();
	router.get("/team", verifyJWT, statusPageController.getStatusPagesByTeamId);
	router.post("/", imageUpload.single("logo"), verifyJWT, isAllowed(["admin", "superadmin"]), statusPageController.createStatusPage);
	router.put("/:id", imageUpload.single("logo"), verifyJWT, isAllowed(["admin", "superadmin"]), statusPageController.updateStatusPage);
	router.get("/resolve", statusPageController.resolveStatusPageByDomain);
	router.get("/:url", verifyStatusPageAccess, statusPageController.getStatusPageByUrl);
	router.delete("/:id", verifyJWT, isAllowed(["admin", "superadmin"]), statusPageController.deleteStatusPage);
	return router;
};
