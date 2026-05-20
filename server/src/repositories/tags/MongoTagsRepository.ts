import { ITagsRepository } from "@/repositories/tags/ITagsRepository.js";
import { Tag } from "@/types/tag.js";
import { TagDocument, TagModel } from "@/db/models/index.js";
import mongoose from "mongoose";
import { AppError } from "@/utils/AppError.js";

const SERVICE_NAME = "TagsRepository";

class MongoTagsRepository implements ITagsRepository {
	static SERVICE_NAME = SERVICE_NAME;

	private toStringId = (value?: mongoose.Types.ObjectId | string | null): string => {
		if (!value) {
			return "";
		}
		return value instanceof mongoose.Types.ObjectId ? value.toString() : String(value);
	};

	private toDateString = (value?: Date | string | null): string => {
		if (!value) {
			return new Date(0).toISOString();
		}
		return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
	};

	protected toEntity = (doc: TagDocument): Tag => {
		return {
			id: this.toStringId(doc._id),
			teamId: this.toStringId(doc.teamId),
			name: doc.name,
			color: doc.color,
			createdAt: this.toDateString(doc.createdAt),
			updatedAt: this.toDateString(doc.updatedAt),
		};
	};

	async create(tagData: Partial<Tag>): Promise<Tag> {
		try {
			const tag = await TagModel.create({ ...tagData });
			return this.toEntity(tag);
		} catch (error) {
			if (error && typeof error === "object" && (error as { code?: number }).code === 11000) {
				throw new AppError({ message: `A tag named "${tagData.name}" already exists`, service: SERVICE_NAME, status: 409 });
			}
			throw error;
		}
	}

	async findById(tagId: string, teamId: string): Promise<Tag> {
		const tag = await TagModel.findOne({ _id: tagId, teamId });
		if (!tag) {
			throw new AppError({ message: "Tag not found", service: SERVICE_NAME, status: 404 });
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
			throw new AppError({ message: "Tag not found or could not be updated", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(updatedTag);
	}

	async deleteById(tagId: string, teamId: string): Promise<Tag> {
		const deletedTag = await TagModel.findOneAndDelete({ _id: tagId, teamId });
		if (!deletedTag) {
			throw new AppError({ message: "Tag not found or could not be deleted", service: SERVICE_NAME, status: 404 });
		}
		return this.toEntity(deletedTag);
	}
}

export default MongoTagsRepository;
