import { describe, expect, it, beforeAll, afterAll, beforeEach } from "@jest/globals";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import MongoInvitesRepository from "../../src/domain/invites/invite.repository.mongo.ts";
import { InviteModel } from "../../src/domain/invites/invite.model.ts";
import { DEFAULT_INVITE_EXPIRY_HOURS, HOUR_IN_MS } from "../../src/domain/invites/invite.constants.ts";

let mongod: MongoMemoryServer;

beforeAll(async () => {
	mongod = await MongoMemoryServer.create();
	await mongoose.connect(mongod.getUri());
	await InviteModel.init();
}, 120_000);

afterAll(async () => {
	await mongoose.disconnect();
	await mongod.stop();
});

beforeEach(async () => {
	await InviteModel.deleteMany({});
});

const makeId = () => new mongoose.Types.ObjectId().toString();

describe("MongoInvitesRepository", () => {
	describe("create", () => {
		it("stores an absolute expiry timestamp roughly one default-duration away", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const before = Date.now();

			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId });

			const expiryMs = new Date(invite.expiry).getTime();
			expect(expiryMs).toBeGreaterThanOrEqual(before + DEFAULT_INVITE_EXPIRY_HOURS * HOUR_IN_MS);
			expect(expiryMs).toBeLessThan(before + DEFAULT_INVITE_EXPIRY_HOURS * HOUR_IN_MS + 5000);
		});

		it("has a per-document TTL index (expireAfterSeconds: 0) on expiry, not a fixed window", async () => {
			const indexes = await InviteModel.collection.indexes();
			const expiryIndex = indexes.find((index) => index.key?.expiry === 1);

			expect(expiryIndex?.expireAfterSeconds).toBe(0);
		});

		it("honors a custom expiresInHours instead of the default", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const before = Date.now();

			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId }, 72);

			const expiryMs = new Date(invite.expiry).getTime();
			expect(expiryMs).toBeGreaterThanOrEqual(before + 72 * HOUR_IN_MS);
			expect(expiryMs).toBeLessThan(before + 72 * HOUR_IN_MS + 5000);
		});
	});

	describe("findByTeamId", () => {
		it("only returns invites scoped to the given team, newest first", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const otherTeamId = makeId();

			const first = await repo.create({ email: "first@example.com", role: ["user"], teamId });
			await new Promise((resolve) => setTimeout(resolve, 5));
			const second = await repo.create({ email: "second@example.com", role: ["user"], teamId });
			await repo.create({ email: "other-team@example.com", role: ["user"], teamId: otherTeamId });

			const invites = await repo.findByTeamId(teamId);

			expect(invites.map((invite) => invite.id)).toEqual([second.id, first.id]);
		});
	});

	describe("findById", () => {
		it("throws 404 when the invite belongs to a different team", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId });

			await expect(repo.findById({ id: invite.id, teamId: makeId() })).rejects.toThrow("Invite not found");
		});
	});

	describe("updateExpiryById", () => {
		it("persists a new expiry timestamp, scoped to the invite's team", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId });
			const newExpiry = new Date(Date.now() + 7 * 24 * HOUR_IN_MS);

			const updated = await repo.updateExpiryById({ id: invite.id, teamId, expiry: newExpiry });

			expect(new Date(updated.expiry).getTime()).toBe(newExpiry.getTime());
		});

		it("throws 404 when scoped to the wrong team", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId });

			await expect(repo.updateExpiryById({ id: invite.id, teamId: makeId(), expiry: new Date() })).rejects.toThrow("Invite not found");
		});
	});
	describe("deleteById", () => {
		it("removes the invite so its token can no longer be redeemed", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId });

			await repo.deleteById({ id: invite.id, teamId });

			await expect(repo.findById({ id: invite.id, teamId })).rejects.toThrow("Invite not found");
			await expect(repo.findByToken(invite.token)).rejects.toThrow();
		});

		it("throws 404 and leaves the invite intact when scoped to the wrong team", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const invite = await repo.create({ email: "new@example.com", role: ["user"], teamId });

			await expect(repo.deleteById({ id: invite.id, teamId: makeId() })).rejects.toThrow("Invite not found");

			await expect(repo.findById({ id: invite.id, teamId })).resolves.toMatchObject({ email: "new@example.com" });
		});

		it("only removes the targeted invite, leaving the team's other invites alone", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const target = await repo.create({ email: "target@example.com", role: ["user"], teamId });
			await repo.create({ email: "keep@example.com", role: ["user"], teamId });

			await repo.deleteById({ id: target.id, teamId });

			const remaining = await repo.findByTeamId(teamId);
			expect(remaining.map((invite) => invite.email)).toEqual(["keep@example.com"]);
		});
	});
	describe("expired invites", () => {
		const insertExpired = async (teamId: mongoose.Types.ObjectId | string, email = "expired@example.com") => {
			const id = new mongoose.Types.ObjectId();
			await InviteModel.collection.insertOne({
				_id: id,
				email,
				teamId: new mongoose.Types.ObjectId(String(teamId)),
				role: ["user"],
				token: "expired-token",
				expiry: new Date(Date.now() - HOUR_IN_MS),
			});
			return id.toString();
		};

		it("is not listed for the team", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			await insertExpired(teamId);
			await repo.create({ email: "live@example.com", role: ["user"], teamId });

			const invites = await repo.findByTeamId(teamId);

			expect(invites.map((invite) => invite.email)).toEqual(["live@example.com"]);
		});

		it("cannot be fetched, extended or deleted by id", async () => {
			const repo = new MongoInvitesRepository();
			const teamId = makeId();
			const id = await insertExpired(teamId);

			await expect(repo.findById({ id, teamId })).rejects.toThrow("Invite not found");
			await expect(repo.updateExpiryById({ id, teamId, expiry: new Date(Date.now() + HOUR_IN_MS) })).rejects.toThrow("Invite not found");
			await expect(repo.deleteById({ id, teamId })).rejects.toThrow("Invite not found");
		});
	});
});
