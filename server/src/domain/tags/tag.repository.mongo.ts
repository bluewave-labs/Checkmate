import { ITagsRepository } from "@/domain/tags/tag.repository.interface.js";
import { Tag } from "@/domain/tags/tag.type.js";
import { TagDocument, TagModel } from "@/domain/tags/tag.model.js";
import { AppError } from "@/utils/AppError.js";
import { toStringId, toDateString } from "@/utils/mongoMappers.js";
import { tagErrors } from "@/domain/tags/tag.errors.js";

const SERVICE_NAME = "TagsRepository";

class MongoTagsRepository implements ITagsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toEntity = (doc: TagDocument): Tag => {
		return {
			id: toStringId(doc._id),
			teamId: toStringId(doc.teamId),
			name: doc.name,
			color: doc.color,
			createdAt: toDateString(doc.createdAt),
			updatedAt: toDateString(doc.updatedAt),
		};
	};

	async create(tagData: Partial<Tag>): Promise<Tag> {
		try {
			const tag = await TagModel.create({ ...tagData });
			return this.toEntity(tag);
		} catch (error) {
			if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
				throw new AppError(tagErrors.nameTaken, { message: `A tag named "${tagData.name}" already exists`, service: SERVICE_NAME, method: "create" });
			}
			throw error;
		}
	}

	async findById(tagId: string, teamId: string): Promise<Tag> {
		const tag = await TagModel.findOne({ _id: tagId, teamId });
		if (!tag) {
			throw new AppError(tagErrors.notFound, { service: SERVICE_NAME, method: "findById" });
		}
		return this.toEntity(tag);
	}

	async findByTeamId(teamId: string): Promise<Tag[]> {
		const tags = await TagModel.find({ teamId });
		return tags.map(this.toEntity);
	}

	async updateById(tagId: string, teamId: string, patch: Partial<Tag>): Promise<Tag> {
		const updatedTag = await TagModel.findOneAndUpdate(
			{ _id: tagId, teamId },
			{
				$set: {
					...patch,
				},
			},
			{ new: true, runValidators: true }
		);
		if (!updatedTag) {
			throw new AppError(tagErrors.notFound, { service: SERVICE_NAME, method: "updateById" });
		}
		return this.toEntity(updatedTag);
	}

	async deleteById(tagId: string, teamId: string): Promise<Tag> {
		const deletedTag = await TagModel.findOneAndDelete({ _id: tagId, teamId });
		if (!deletedTag) {
			throw new AppError(tagErrors.notFound, { service: SERVICE_NAME, method: "deleteById" });
		}
		return this.toEntity(deletedTag);
	}
}

export default MongoTagsRepository;
