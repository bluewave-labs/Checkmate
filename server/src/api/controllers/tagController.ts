import { Request, Response, RequestHandler } from "express";
import { catchAsync } from "@/utils/catchAsync.js";
import { ITagsService } from "@/domain/tags/tag.service.js";
import { requireTeamId } from "./controllerUtils.js";
import {
	createTagBodyValidation,
	editTagBodyValidation,
	getTagByIdParamValidation,
	editTagParamValidation,
	deleteTagParamValidation,
} from "@/api/validation/index.js";

export interface ITagsController {
	createTag: RequestHandler;
	getTagById: RequestHandler;
	getTagsByTeamId: RequestHandler;
	editTag: RequestHandler;
	deleteTag: RequestHandler;
}

class TagsController implements ITagsController {
	constructor(private tagsService: ITagsService) {}

	createTag = async (req: Request, res: Response) => {
		const validatedBody = createTagBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);

		const tag = await this.tagsService.createTag(validatedBody, teamId);
		res.json({ success: true, msg: "Tag created successfully", data: tag });
	};

	getTagById = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: tagId } = getTagByIdParamValidation.parse(req.params);
		const tag = await this.tagsService.getTag(tagId, teamId);
		res.json({ success: true, msg: "Tag retrieved successfully", data: tag });
	};

	getTagsByTeamId = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const tags = await this.tagsService.getTagsByTeamId(teamId);
		res.json({ success: true, msg: "Tags retrieved successfully", data: tags });
	};

	editTag = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: tagId } = editTagParamValidation.parse(req.params);
		const validatedBody = editTagBodyValidation.parse(req.body);
		const updatedTag = await this.tagsService.updateTag(tagId, teamId, validatedBody);
		res.json({ success: true, msg: "Tag updated successfully", data: updatedTag });
	};

	deleteTag = async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: tagId } = deleteTagParamValidation.parse(req.params);
		await this.tagsService.deleteTag(tagId, teamId);
		res.json({ success: true, msg: "Tag deleted successfully" });
	};
}

export default TagsController;
