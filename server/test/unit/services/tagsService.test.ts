import { describe, expect, it, jest } from "@jest/globals";
import { TagsService } from "../../../src/domain/tags/tag.service.ts";
import type { Tag } from "../../../src/domain/tags/tag.type.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const createTagsRepo = () => ({
	create: jest.fn(),
	findById: jest.fn(),
	findByTeamId: jest.fn(),
	updateById: jest.fn(),
	deleteById: jest.fn(),
});

const createMonitorsRepo = () => ({
	removeTagFromMonitors: jest.fn(),
});

const createService = (overrides?: Record<string, unknown>) => {
	const tagsRepository = createTagsRepo();
	const monitorsRepository = createMonitorsRepo();

	const defaults = {
		tagsRepository,
		monitorsRepository,
		...overrides,
	};

	const service = new TagsService(defaults.tagsRepository as any, defaults.monitorsRepository as any);

	return { service, ...defaults };
};

const makeTag = (overrides?: Partial<Tag>): Tag =>
	({
		id: "tag-1",
		teamId: "team-1",
		name: "Production",
		color: "#13715B",
		createdAt: "2026-01-01T00:00:00Z",
		updatedAt: "2026-01-01T00:00:00Z",
		...overrides,
	}) as Tag;

// ── Tests ────────────────────────────────────────────────────────────────────

describe("TagsService", () => {
	describe("createTag", () => {
		it("sets teamId and delegates to repository", async () => {
			const created = makeTag();
			const { service, tagsRepository } = createService();
			(tagsRepository.create as jest.Mock).mockResolvedValue(created);

			const result = await service.createTag({ name: "Production", color: "#13715B" }, "team-1");

			expect(result).toBe(created);
			expect(tagsRepository.create).toHaveBeenCalledWith(expect.objectContaining({ teamId: "team-1", name: "Production", color: "#13715B" }));
		});
	});

	describe("getTag", () => {
		it("delegates to repository", async () => {
			const tag = makeTag();
			const { service, tagsRepository } = createService();
			(tagsRepository.findById as jest.Mock).mockResolvedValue(tag);

			const result = await service.getTag("tag-1", "team-1");

			expect(result).toBe(tag);
			expect(tagsRepository.findById).toHaveBeenCalledWith("tag-1", "team-1");
		});
	});

	describe("getTagsByTeamId", () => {
		it("delegates to repository", async () => {
			const tags = [makeTag()];
			const { service, tagsRepository } = createService();
			(tagsRepository.findByTeamId as jest.Mock).mockResolvedValue(tags);

			const result = await service.getTagsByTeamId("team-1");

			expect(result).toBe(tags);
			expect(tagsRepository.findByTeamId).toHaveBeenCalledWith("team-1");
		});
	});

	describe("updateTag", () => {
		it("delegates to repository", async () => {
			const updated = makeTag({ name: "Staging" });
			const { service, tagsRepository } = createService();
			(tagsRepository.updateById as jest.Mock).mockResolvedValue(updated);

			const result = await service.updateTag("tag-1", "team-1", { name: "Staging" });

			expect(result).toBe(updated);
			expect(tagsRepository.updateById).toHaveBeenCalledWith("tag-1", "team-1", { name: "Staging" });
		});
	});

	describe("deleteTag", () => {
		it("removes the tag from monitors and deletes it", async () => {
			const deleted = makeTag();
			const { service, tagsRepository, monitorsRepository } = createService();
			(tagsRepository.deleteById as jest.Mock).mockResolvedValue(deleted);

			const result = await service.deleteTag("tag-1", "team-1");

			expect(result).toBe(deleted);
			expect(monitorsRepository.removeTagFromMonitors).toHaveBeenCalledWith("tag-1");
			expect(tagsRepository.deleteById).toHaveBeenCalledWith("tag-1", "team-1");
		});

		it("detaches the tag from monitors before deleting it", async () => {
			const { service, tagsRepository, monitorsRepository } = createService();
			(tagsRepository.deleteById as jest.Mock).mockResolvedValue(makeTag());

			await service.deleteTag("tag-1", "team-1");

			const removeOrder = (monitorsRepository.removeTagFromMonitors as jest.Mock).mock.invocationCallOrder[0];
			const deleteOrder = (tagsRepository.deleteById as jest.Mock).mock.invocationCallOrder[0];
			expect(removeOrder).toBeLessThan(deleteOrder);
		});
	});
});
