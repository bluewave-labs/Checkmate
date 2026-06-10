import { Tag } from "@/domain/tags/tag.type.js";
import { IMonitorsRepository } from "@/domain/monitors/monitor.repository.interface.js";
import { ITagsRepository } from "@/domain/tags/tag.repository.interface.js";
export interface ITagsService {
	createTag(tag: Partial<Tag>, teamId: string): Promise<Tag>;
	getTag(tagId: string, teamId: string): Promise<Tag>;
	getTagsByTeamId(teamId: string): Promise<Tag[]>;
	updateTag(tagId: string, teamId: string, patch: Partial<Tag>): Promise<Tag>;
	deleteTag(tagId: string, teamId: string): Promise<Tag>;
}

export class TagsService implements ITagsService {
	constructor(
		private tagsRepository: ITagsRepository,
		private monitorsRepository: IMonitorsRepository
	) {}

	createTag = async (tagData: Partial<Tag>, teamId: string): Promise<Tag> => {
		tagData.teamId = teamId;
		return await this.tagsRepository.create(tagData);
	};

	getTag = async (tagId: string, teamId: string): Promise<Tag> => {
		return await this.tagsRepository.findById(tagId, teamId);
	};

	getTagsByTeamId = async (teamId: string): Promise<Tag[]> => {
		return await this.tagsRepository.findByTeamId(teamId);
	};

	updateTag = async (tagId: string, teamId: string, patch: Partial<Tag>): Promise<Tag> => {
		return await this.tagsRepository.updateById(tagId, teamId, patch);
	};
	deleteTag = async (tagId: string, teamId: string): Promise<Tag> => {
		await this.monitorsRepository.removeTagFromMonitors(tagId);
		return await this.tagsRepository.deleteById(tagId, teamId);
	};
}
