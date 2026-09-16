import { describe, expect, it, jest } from "@jest/globals";
import { InviteService } from "../../../src/domain/invites/invite.service.ts";
import type { Invite } from "../../../src/domain/invites/invite.type.ts";
import type { UserRole } from "../../../src/domain/users/user.type.ts";

const makeInvite = (overrides?: Partial<Invite>): Invite => ({
	id: "inv-1",
	email: "invited@example.com",
	teamId: "team-1",
	role: ["user"] as UserRole[],
	token: "invite-token-123",
	expiry: "2026-12-31T00:00:00Z",
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
	...overrides,
});

const createService = (overrides?: Record<string, unknown>) => {
	const invitesRepository = {
		create: jest.fn().mockResolvedValue(makeInvite()),
		findByToken: jest.fn().mockResolvedValue(makeInvite()),
		findById: jest.fn().mockResolvedValue(makeInvite()),
		findByTeamId: jest.fn().mockResolvedValue([makeInvite()]),
		updateExpiryById: jest.fn().mockResolvedValue(makeInvite()),
		deleteById: jest.fn().mockResolvedValue(undefined),
	};
	const settingsService = {
		getSettings: jest.fn().mockReturnValue({ clientHost: "http://localhost:5173" }),
	};
	const emailService = {
		buildEmail: jest.fn().mockResolvedValue("<html>Invite</html>"),
		sendEmail: jest.fn().mockResolvedValue("msg-id-123"),
	};

	const defaults = { invitesRepository, settingsService, emailService, ...overrides };

	const service = new InviteService(defaults as any);
	return { service, ...defaults };
};

describe("InviteService", () => {
	describe("getInviteToken", () => {
		it("creates an invite with teamId assigned", async () => {
			const { service, invitesRepository } = createService();
			const invite: Partial<Invite> = { email: "new@example.com", role: ["user"] };

			const result = await service.getInviteToken({ invite, teamId: "team-1", userRoles: ["superadmin"] });

			expect(invitesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", teamId: "team-1" }), undefined);
			expect(result).toEqual(makeInvite());
		});

		it("forwards a custom expiresInHours to the repository", async () => {
			const { service, invitesRepository } = createService();
			const invite: Partial<Invite> = { email: "new@example.com", role: ["user"] };

			await service.getInviteToken({ invite, teamId: "team-1", userRoles: ["superadmin"], expiresInHours: 72 });

			expect(invitesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com" }), 72);
		});

		it("allows creation when role is undefined (defaults to empty)", async () => {
			const { service } = createService();

			const result = await service.getInviteToken({ invite: { email: "new@example.com" }, teamId: "team-1", userRoles: ["user"] });

			expect(result).toEqual(makeInvite());
		});

		it("throws 403 when actor cannot manage the target role", async () => {
			const { service } = createService();

			await expect(service.getInviteToken({ invite: { role: ["superadmin"] }, teamId: "team-1", userRoles: ["admin"] })).rejects.toThrow(
				"You do not have permission to create this invite"
			);
		});
	});

	describe("sendInviteEmail", () => {
		it("creates invite, builds email, and sends it", async () => {
			const { service, invitesRepository, emailService, settingsService } = createService();

			await service.sendInviteEmail({
				invite: { email: "new@example.com", role: ["user"] },
				firstName: "Test",
				userRoles: ["superadmin"],
			});

			expect(invitesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com" }), undefined);
			expect(settingsService.getSettings).toHaveBeenCalled();
			expect(emailService.buildEmail).toHaveBeenCalledWith("employeeActivationTemplate", {
				name: "Test",
				link: "http://localhost:5173/register/invite-token-123",
			});
			expect(emailService.sendEmail).toHaveBeenCalledWith("new@example.com", "Welcome to Uptime Monitor", "<html>Invite</html>");
		});

		it("throws 400 when invite email is missing", async () => {
			const { service } = createService();

			await expect(service.sendInviteEmail({ invite: {}, firstName: "Test", userRoles: ["superadmin"] })).rejects.toThrow(
				"Invite email is required to send an invite"
			);
		});

		it("throws 403 when actor cannot manage the target role", async () => {
			const { service } = createService();

			await expect(
				service.sendInviteEmail({ invite: { email: "new@example.com", role: ["superadmin"] }, firstName: "Test", userRoles: ["admin"] })
			).rejects.toThrow("You do not have permission to create this invite");
		});

		it("allows sending when role is undefined (defaults to empty)", async () => {
			const { service, emailService } = createService();

			await service.sendInviteEmail({ invite: { email: "new@example.com" }, firstName: "Test", userRoles: ["user"] });

			expect(emailService.sendEmail).toHaveBeenCalled();
		});

		it("forwards a custom expiresInHours to the repository", async () => {
			const { service, invitesRepository } = createService();

			await service.sendInviteEmail({
				invite: { email: "new@example.com", role: ["user"] },
				firstName: "Test",
				userRoles: ["superadmin"],
				expiresInHours: 168,
			});

			expect(invitesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com" }), 168);
		});

		it("throws 500 when buildEmail returns falsy", async () => {
			const { service } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue(null),
					sendEmail: jest.fn(),
				},
			});

			await expect(
				service.sendInviteEmail({ invite: { email: "new@example.com", role: ["user"] }, firstName: "Test", userRoles: ["superadmin"] })
			).rejects.toThrow("Failed to build invite e-mail");
		});

		it("throws 500 when sendEmail rejects", async () => {
			const { service } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue("<html>ok</html>"),
					sendEmail: jest.fn().mockRejectedValue(new Error("SMTP auth failed")),
				},
			});

			await expect(
				service.sendInviteEmail({ invite: { email: "new@example.com", role: ["user"] }, firstName: "Test", userRoles: ["superadmin"] })
			).rejects.toThrow("Failed to send invite e-mail");
		});
	});

	describe("verifyInviteToken", () => {
		it("delegates to repository", async () => {
			const { service, invitesRepository } = createService();

			const result = await service.verifyInviteToken({ inviteToken: "invite-token-123" });

			expect(invitesRepository.findByToken).toHaveBeenCalledWith("invite-token-123");
			expect(result).toEqual(makeInvite());
		});
	});

	describe("getInvites", () => {
		it("delegates to repository, scoped by team", async () => {
			const { service, invitesRepository } = createService();

			const result = await service.getInvites({ teamId: "team-1" });

			expect(invitesRepository.findByTeamId).toHaveBeenCalledWith("team-1");
			const { token: _token, ...expectedSummary } = makeInvite();
			expect(result).toEqual([expectedSummary]);
		});

		it("never returns the invite token (it's a bearer credential for accepting the invite)", async () => {
			const { service } = createService();

			const [invite] = await service.getInvites({ teamId: "team-1" });

			expect(invite).not.toHaveProperty("token");
		});
	});

	describe("updateInviteExpiry", () => {
		it("looks up the invite and updates its expiry to now + the requested hours", async () => {
			const { service, invitesRepository } = createService();
			const now = new Date("2026-01-01T00:00:00Z").getTime();
			jest.spyOn(Date, "now").mockReturnValue(now);

			await service.updateInviteExpiry({ id: "inv-1", teamId: "team-1", expiresInHours: 24, userRoles: ["superadmin"] });

			expect(invitesRepository.findById).toHaveBeenCalledWith({ id: "inv-1", teamId: "team-1" });
			expect(invitesRepository.updateExpiryById).toHaveBeenCalledWith({
				id: "inv-1",
				teamId: "team-1",
				expiry: new Date(now + 24 * 60 * 60 * 1000),
			});

			jest.restoreAllMocks();
		});

		it("does not return the invite token", async () => {
			const { service } = createService();

			const result = await service.updateInviteExpiry({ id: "inv-1", teamId: "team-1", expiresInHours: 24, userRoles: ["superadmin"] });

			expect(result).not.toHaveProperty("token");
		});

		it("throws 403 when actor cannot manage the invite's role", async () => {
			const { service, invitesRepository } = createService();
			invitesRepository.findById.mockResolvedValue(makeInvite({ role: ["superadmin"] }));

			await expect(service.updateInviteExpiry({ id: "inv-1", teamId: "team-1", expiresInHours: 24, userRoles: ["admin"] })).rejects.toThrow(
				"You do not have permission to modify this invite"
			);

			expect(invitesRepository.updateExpiryById).not.toHaveBeenCalled();
		});
	});

	describe("deleteInvite", () => {
		it("looks the invite up in the caller's team, then deletes it", async () => {
			const { service, invitesRepository } = createService();

			await service.deleteInvite({ id: "inv-1", teamId: "team-1", userRoles: ["superadmin"] });

			expect(invitesRepository.findById).toHaveBeenCalledWith({ id: "inv-1", teamId: "team-1" });
			expect(invitesRepository.deleteById).toHaveBeenCalledWith({ id: "inv-1", teamId: "team-1" });
		});

		it("throws 403 and deletes nothing when actor cannot manage the invite's role", async () => {
			const { service, invitesRepository } = createService();
			invitesRepository.findById.mockResolvedValue(makeInvite({ role: ["superadmin"] }));

			await expect(service.deleteInvite({ id: "inv-1", teamId: "team-1", userRoles: ["admin"] })).rejects.toThrow(
				"You do not have permission to delete this invite"
			);

			expect(invitesRepository.deleteById).not.toHaveBeenCalled();
		});

		it("propagates the repository 404 for an invite in another team", async () => {
			const { service, invitesRepository } = createService();
			invitesRepository.findById.mockRejectedValue(new Error("Invite not found"));

			await expect(service.deleteInvite({ id: "inv-1", teamId: "other-team", userRoles: ["superadmin"] })).rejects.toThrow("Invite not found");

			expect(invitesRepository.deleteById).not.toHaveBeenCalled();
		});
	});
});
