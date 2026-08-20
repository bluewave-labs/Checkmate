import { IProxiesController } from "@/api/controllers/proxyController.js";
import { Router } from "express";

export const createProxyRoutes = (proxyController: IProxiesController): Router => {
	const router = Router();
	router.post("/", proxyController.createProxy);
	router.get("/team", proxyController.getProxiesByTeamId);
	router.get("/:id", proxyController.getProxyById);
	router.delete("/:id", proxyController.deleteProxy);
	router.patch("/:id", proxyController.editProxy);
	return router;
};
