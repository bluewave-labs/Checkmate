import { Tag } from "@/domain/tags/tag.type.js";

export interface ITagsRepository {
	// create
	create(tagData: Partial<Tag>): Promise<Tag>;
	// read
	findById(tagId: string, teamId: string): Promise<Tag>;
	findByTeamId(teamId: string): Promise<Tag[]>;
	// update
	updateById(tagId: string, teamId: string, patch: Partial<Tag>): Promise<Tag>;
	// delete
	deleteById(tagId: string, teamId: string): Promise<Tag>;
}
