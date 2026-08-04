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

	createTag = catchAsync(async (req: Request, res: Response) => {
		const validatedBody = createTagBodyValidation.parse(req.body);
		const teamId = requireTeamId(req.user?.teamId);

		const tag = await this.tagsService.createTag(validatedBody, teamId);
		return res.status(200).json({
			success: true,
			msg: "Tag created successfully",
			data: tag,
		});
	});
	getTagById = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: tagId } = getTagByIdParamValidation.parse(req.params);
		const tag = await this.tagsService.getTag(tagId, teamId);
		return res.status(200).json({
			success: true,
			msg: "Tag retrieved successfully",
			data: tag,
		});
	});

	getTagsByTeamId = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const tags = await this.tagsService.getTagsByTeamId(teamId);
		return res.status(200).json({
			success: true,
			msg: "Tags retrieved successfully",
			data: tags,
		});
	});

	editTag = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: tagId } = editTagParamValidation.parse(req.params);
		const validatedBody = editTagBodyValidation.parse(req.body);
		const updatedTag = await this.tagsService.updateTag(tagId, teamId, validatedBody);
		return res.status(200).json({
			success: true,
			msg: "Tag updated successfully",
			data: updatedTag,
		});
	});

	deleteTag = catchAsync(async (req: Request, res: Response) => {
		const teamId = requireTeamId(req.user?.teamId);
		const { id: tagId } = deleteTagParamValidation.parse(req.params);
		await this.tagsService.deleteTag(tagId, teamId);
		return res.status(200).json({
			success: true,
			msg: "Tag deleted successfully",
		});
	});
}

export default TagsController;
