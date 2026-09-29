// server/src/api/routes/tagRoutes.ts
import type { ITagsController } from "@/api/controllers/tagController.js";
import type { RouteTable } from "@/api/routes/defineRoutes.js";
import {
	createTagBodyValidation,
	editTagBodyValidation,
	getTagByIdParamValidation,
	editTagParamValidation,
	deleteTagParamValidation,
	tagResponseSchema,
	tagListResponseSchema,
} from "@/api/validation/index.js";

export const tagRoutes: RouteTable<ITagsController> = {
	prefix: "/tags",
	tag: "tags",
	auth: "jwt",
	routes: [
		{ method: "post", path: "/", handler: "createTag", summary: "Create a tag", body: createTagBodyValidation, response: tagResponseSchema },
		{ method: "get", path: "/team", handler: "getTagsByTeamId", summary: "List the team's tags", response: tagListResponseSchema },
		{ method: "get", path: "/:id", handler: "getTagById", summary: "Get a tag", params: getTagByIdParamValidation, response: tagResponseSchema },
		{
			method: "patch",
			path: "/:id",
			handler: "editTag",
			summary: "Edit a tag",
			params: editTagParamValidation,
			body: editTagBodyValidation,
			response: tagResponseSchema,
		},
		{ method: "delete", path: "/:id", handler: "deleteTag", summary: "Delete a tag", params: deleteTagParamValidation },
	],
};
