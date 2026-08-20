import { IProxiesController } from "@/api/controllers/proxyController.js";
import { Router } from "express";

export const createProxyRoutes = (tagController: IProxiesController): Router => {
	const router = Router();
	router.post("/", tagController.createProxy);
	router.get("/team", tagController.getProxiesByTeamId);
	router.get("/:id", tagController.getProxyById);
	router.delete("/:id", tagController.deleteProxy);
	router.patch("/:id", tagController.editProxy);
	return router;
};
