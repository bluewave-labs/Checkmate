import { ITagsController } from "@/api/controllers/tagController.js";
import { Router } from "express";
class TagRoutes {
	private router: Router;
	private tagController: ITagsController;

	constructor(tagController: ITagsController) {
		this.router = Router();
		this.tagController = tagController;
		this.initializeRoutes();
	}

	initializeRoutes() {
		this.router.post("/", this.tagController.createTag);

		this.router.get("/team", this.tagController.getTagsByTeamId);

		this.router.get("/:id", this.tagController.getTagById);
		this.router.delete("/:id", this.tagController.deleteTag);
		this.router.patch("/:id", this.tagController.editTag);
	}

	getRouter() {
		return this.router;
	}
}

export default TagRoutes;
