import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { TeamModel } from "../../src/domain/teams/team.model.ts";
import MongoTeamsRepository from "../../src/domain/teams/team.repository.model.ts";
import { teamErrors } from "../../src/domain/teams/team.errors.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await TeamModel.init(); // builds the unique heartbeatKeyHash index
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await TeamModel.deleteMany({});
});

const setup = async () => {
	const repo = new MongoTeamsRepository();
	const team = await repo.create(`team-${new mongoose.Types.ObjectId().toString()}@example.com`);
	const userId = new mongoose.Types.ObjectId().toString();
	return { repo, team, userId };
};

describe("MongoTeamsRepository heartbeat key", () => {
	it("finds a team by its key hash, with the creator and without the hash", async () => {
		const { repo, team, userId } = await setup();

		await repo.setHeartbeatKey(team.id, "hash-a", userId);
		const found = await repo.findByHeartbeatKeyHash("hash-a");

		expect(found).toMatchObject({ id: team.id, heartbeatKeyCreatedBy: userId });
		expect(found).not.toHaveProperty("heartbeatKeyHash");
	});

	it("returns null for an unknown hash", async () => {
		const { repo } = await setup();

		await expect(repo.findByHeartbeatKeyHash("unknown")).resolves.toBeNull();
	});

	it("reports whether a team has a key", async () => {
		const { repo, team, userId } = await setup();

		await expect(repo.hasHeartbeatKey(team.id)).resolves.toBe(false);
		await repo.setHeartbeatKey(team.id, "hash-a", userId);
		await expect(repo.hasHeartbeatKey(team.id)).resolves.toBe(true);
	});

	it("replaces the previous hash on rotation", async () => {
		const { repo, team, userId } = await setup();

		await repo.setHeartbeatKey(team.id, "hash-a", userId);
		await repo.setHeartbeatKey(team.id, "hash-b", userId);

		await expect(repo.findByHeartbeatKeyHash("hash-a")).resolves.toBeNull();
		await expect(repo.findByHeartbeatKeyHash("hash-b")).resolves.toMatchObject({ id: team.id });
	});

	it("throws notFound for an unknown team", async () => {
		const { repo, userId } = await setup();

		await expect(repo.setHeartbeatKey(new mongoose.Types.ObjectId().toString(), "hash-a", userId)).rejects.toMatchObject({
			definition: teamErrors.notFound,
		});
	});

	it("keeps the hash out of normal reads", async () => {
		const { repo, team, userId } = await setup();

		await repo.setHeartbeatKey(team.id, "hash-a", userId);
		const doc = await TeamModel.findById(team.id).lean();

		expect(doc).not.toHaveProperty("heartbeatKeyHash");
	});

	it("rejects the same hash on two teams", async () => {
		const first = await setup();
		const second = await setup();

		await first.repo.setHeartbeatKey(first.team.id, "hash-a", first.userId);

		await expect(second.repo.setHeartbeatKey(second.team.id, "hash-a", second.userId)).rejects.toMatchObject({ code: 11000 });
	});
});
