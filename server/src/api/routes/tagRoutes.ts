// server/src/api/routes/tagRoutes.ts
import type { ITagsController } from "@/api/controllers/tagController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	createTagBodyValidation,
	editTagBodyValidation,
	getTagByIdParamValidation,
	editTagParamValidation,
	deleteTagParamValidation,
	tagListResponseSchema,
} from "@/api/validation/index.js";
import { tagSchema } from "@/domain/tags/tag.schema.js";

export const tagRoutes: RouteTable<ITagsController> = {
	prefix: "/tags",
	tag: "tags",
	auth: "jwt",
	routes: [
		{
			method: "post",
			path: "/",
			handler: "createTag",
			summary: "Create a tag",
			errors: { 409: "A tag with that name already exists" },
			body: createTagBodyValidation,
			response: tagSchema,
		},
		{ method: "get", path: "/team", handler: "getTagsByTeamId", summary: "List the team's tags", response: tagListResponseSchema },
		{
			method: "get",
			path: "/:id",
			handler: "getTagById",
			summary: "Get a tag",
			errors: { 404: "Tag not found" },
			params: getTagByIdParamValidation,
			response: tagSchema,
		},
		{
			method: "patch",
			path: "/:id",
			handler: "editTag",
			summary: "Edit a tag",
			errors: { 404: "Tag not found" },
			params: editTagParamValidation,
			body: editTagBodyValidation,
			response: tagSchema,
		},
		{
			method: "delete",
			path: "/:id",
			handler: "deleteTag",
			summary: "Delete a tag",
			errors: { 404: "Tag not found" },
			params: deleteTagParamValidation,
		},
	],
};
