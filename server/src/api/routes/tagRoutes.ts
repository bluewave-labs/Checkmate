import { ITagsController } from "@/api/controllers/tagController.js";
import { Router } from "express";

export const createTagRoutes = (tagController: ITagsController): Router => {
	const router = Router();
	router.post("/", tagController.createTag);
	router.get("/team", tagController.getTagsByTeamId);
	router.get("/:id", tagController.getTagById);
	router.delete("/:id", tagController.deleteTag);
	router.patch("/:id", tagController.editTag);
	return router;
};
