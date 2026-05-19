import { Request, Response, NextFunction } from "express";
import { ITagsService } from "@/service/index.js";
import { requireTeamId } from "./controllerUtils.js";
import {
	createTagBodyValidation,
	editTagBodyValidation,
	getTagByIdParamValidation,
	editTagParamValidation,
	deleteTagParamValidation,
} from "@/validation/index.js";

export interface ITagsController {
	createTag: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getTagById: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	getTagsByTeamId: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	editTag: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
	deleteTag: (req: Request, res: Response, next: NextFunction) => Promise<Response | void>;
}

class TagsController implements ITagsController {
	constructor(private tagsService: ITagsService) {}

	createTag = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const validatedBody = createTagBodyValidation.parse(req.body);
			const teamId = requireTeamId(req.user?.teamId);

			const tag = await this.tagsService.createTag(validatedBody, teamId);
			return res.status(200).json({
				success: true,
				msg: "Tag created successfully",
				data: tag,
			});
		} catch (error) {
			next(error);
		}
	};
	getTagById = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const { id: tagId } = getTagByIdParamValidation.parse(req.params);
			const tag = await this.tagsService.getTag(tagId, teamId);
			return res.status(200).json({
				success: true,
				msg: "Tag retrieved successfully",
				data: tag,
			});
		} catch (error) {
			next(error);
		}
	};

	getTagsByTeamId = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const tags = await this.tagsService.getTagsByTeamId(teamId);
			return res.status(200).json({
				success: true,
				msg: "Tags retrieved successfully",
				data: tags,
			});
		} catch (error) {
			next(error);
		}
	};

	editTag = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const { id: tagId } = editTagParamValidation.parse(req.params);
			const validatedBody = editTagBodyValidation.parse(req.body);
			const updatedTag = await this.tagsService.updateTag(tagId, teamId, validatedBody);
			return res.status(200).json({
				success: true,
				msg: "Tag updated successfully",
				data: updatedTag,
			});
		} catch (error) {
			next(error);
		}
	};

	deleteTag = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const teamId = requireTeamId(req.user?.teamId);
			const { id: tagId } = deleteTagParamValidation.parse(req.params);
			await this.tagsService.deleteTag(tagId, teamId);
			return res.status(200).json({
				success: true,
				msg: "Tag deleted successfully",
			});
		} catch (error) {
			next(error);
		}
	};
}

export default TagsController;
