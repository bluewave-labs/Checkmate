import { describe, expect, it, jest } from "@jest/globals";
import { InviteService } from "../../../src/service/business/inviteService.ts";
import type { Invite, UserRole } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Tests ────────────────────────────────────────────────────────────────────

describe("InviteService", () => {
	describe("serviceName", () => {
		it("returns inviteService from static property", () => {
			expect(InviteService.SERVICE_NAME).toBe("inviteService");
		});

		it("returns inviteService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("inviteService");
		});
	});

	// ── getInviteToken ──────────────────────────────────────────────────────

	describe("getInviteToken", () => {
		it("creates an invite with teamId assigned", async () => {
			const { service, invitesRepository } = createService();
			const invite: Partial<Invite> = { email: "new@example.com", role: ["user"] };

			const result = await service.getInviteToken({ invite, teamId: "team-1", userRoles: ["superadmin"] });

			expect(invitesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com", teamId: "team-1" }));
			expect(result).toEqual(makeInvite());
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

	// ── sendInviteEmail ─────────────────────────────────────────────────────

	describe("sendInviteEmail", () => {
		it("creates invite, builds email, and sends it", async () => {
			const { service, invitesRepository, emailService, settingsService } = createService();

			await service.sendInviteEmail({
				invite: { email: "new@example.com", role: ["user"] },
				firstName: "Test",
				userRoles: ["superadmin"],
			});

			expect(invitesRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: "new@example.com" }));
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

		it("throws 500 when sendEmail returns falsy", async () => {
			const { service } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue("<html>ok</html>"),
					sendEmail: jest.fn().mockResolvedValue(false),
				},
			});

			await expect(
				service.sendInviteEmail({ invite: { email: "new@example.com", role: ["user"] }, firstName: "Test", userRoles: ["superadmin"] })
			).rejects.toThrow("Failed to send invite e-mail");
		});
	});

	// ── verifyInviteToken ───────────────────────────────────────────────────

	describe("verifyInviteToken", () => {
		it("delegates to repository", async () => {
			const { service, invitesRepository } = createService();

			const result = await service.verifyInviteToken({ inviteToken: "invite-token-123" });

			expect(invitesRepository.findByToken).toHaveBeenCalledWith("invite-token-123");
			expect(result).toEqual(makeInvite());
		});
	});
});
