import { describe, expect, it, jest } from "@jest/globals";
import { UserService } from "../../../src/service/business/userService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { User, UserRole } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeUser = (overrides?: Partial<User>): User => ({
	id: "user-1",
	firstName: "Test",
	lastName: "User",
	email: "test@example.com",
	password: "$2a$10$hashedpassword",
	isActive: true,
	isVerified: true,
	role: ["user"] as UserRole[],
	teamId: "team-1",
	createdAt: "2026-01-01T00:00:00Z",
	updatedAt: "2026-01-01T00:00:00Z",
	...overrides,
});

const makeAppSettings = () => ({
	jwtSecret: "test-secret",
	jwtTTL: "99d" as const,
	nodeEnv: "development",
	logLevel: "debug",
	clientHost: "http://localhost:5173",
	dbConnectionString: "mongodb://localhost:27017/test_db",
	dbType: "mongodb" as const,
});

const createService = (overrides?: Record<string, unknown>) => {
	const logger = createMockLogger();
	const usersRepository = {
		create: jest.fn().mockResolvedValue(makeUser()),
		findByEmail: jest.fn().mockResolvedValue(makeUser()),
		findById: jest.fn().mockResolvedValue(makeUser()),
		findAll: jest.fn().mockResolvedValue([makeUser()]),
		updateById: jest.fn().mockResolvedValue(makeUser()),
		deleteById: jest.fn().mockResolvedValue(makeUser()),
		findSuperAdmin: jest.fn().mockResolvedValue(true),
	};
	const invitesRepository = {
		findByTokenAndDelete: jest.fn().mockResolvedValue({ role: ["user"], teamId: "team-1", email: "invited@example.com" }),
	};
	const recoveryTokensRepository = {
		create: jest.fn().mockResolvedValue({ token: "recovery-token-123", email: "test@example.com" }),
		findByToken: jest.fn().mockResolvedValue({ token: "recovery-token-123", email: "test@example.com" }),
		deleteManyByEmail: jest.fn().mockResolvedValue(1),
	};
	const settingsRepository = {
		update: jest.fn().mockResolvedValue({}),
	};
	const teamsRepository = {
		create: jest.fn().mockResolvedValue({ id: "team-new" }),
	};
	const monitorsRepository = {
		findByTeamId: jest.fn().mockResolvedValue([{ id: "mon-1" }, { id: "mon-2" }]),
	};
	const emailService = {
		buildEmail: jest.fn().mockResolvedValue("<html>Welcome</html>"),
		sendEmail: jest.fn().mockResolvedValue("msg-id-123"),
	};
	const settingsService = {
		getSettings: jest.fn().mockReturnValue(makeAppSettings()),
	};
	const jobQueue = {
		deleteJob: jest.fn().mockResolvedValue(undefined),
	};
	const jwtMock = {
		sign: jest.fn().mockReturnValue("jwt-token-123"),
	};
	const cryptoMock = {
		randomBytes: jest.fn().mockReturnValue({ toString: () => "random-hex-secret" }),
	};

	const defaults = {
		logger,
		usersRepository,
		invitesRepository,
		recoveryTokensRepository,
		settingsRepository,
		teamsRepository,
		monitorsRepository,
		emailService,
		settingsService,
		jobQueue,
		jwt: jwtMock,
		crypto: cryptoMock,
		...overrides,
	};

	const service = new UserService(defaults as any);
	return { service, ...defaults };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("UserService", () => {
	describe("serviceName", () => {
		it("returns userService", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("userService");
		});
	});

	// ── issueToken ──────────────────────────────────────────────────────────

	describe("issueToken", () => {
		it("signs a JWT with the payload and settings", () => {
			const { service, jwt: jwtMock } = createService();
			const user = makeUser();
			const settings = makeAppSettings();

			const token = service.issueToken(user, settings);

			expect(token).toBe("jwt-token-123");
			expect(jwtMock.sign).toHaveBeenCalledWith(user, "test-secret", { expiresIn: "99d" });
		});
	});

	// ── registerUser ────────────────────────────────────────────────────────

	describe("registerUser", () => {
		it("registers an invited user when superadmin exists", async () => {
			const { service, usersRepository, invitesRepository } = createService();

			const result = await service.registerUser({ password: "password123" }, "invite-token", null);

			expect(invitesRepository.findByTokenAndDelete).toHaveBeenCalledWith("invite-token");
			expect(usersRepository.create).toHaveBeenCalledWith(
				expect.objectContaining({ role: ["user"], teamId: "team-1", email: "invited@example.com" }),
				null
			);
			expect(result.token).toBe("jwt-token-123");
			expect(result.user).toBeDefined();
		});

		it("creates first user as superadmin with new team and JWT secret", async () => {
			const {
				service,
				usersRepository,
				teamsRepository,
				settingsRepository,
				crypto: cryptoMock,
			} = createService({
				usersRepository: {
					create: jest.fn().mockResolvedValue(makeUser({ role: ["superadmin"], teamId: "team-new" })),
					findByEmail: jest.fn(),
					findById: jest.fn(),
					findAll: jest.fn(),
					updateById: jest.fn(),
					deleteById: jest.fn(),
					findSuperAdmin: jest.fn().mockResolvedValue(false),
				},
			});

			const result = await service.registerUser({ email: "first@example.com", password: "password123" }, "", null);

			expect(cryptoMock.randomBytes).toHaveBeenCalledWith(64);
			expect(settingsRepository.update).toHaveBeenCalledWith({ jwtSecret: "random-hex-secret" });
			expect(teamsRepository.create).toHaveBeenCalledWith("first@example.com");
			expect(result.user).toBeDefined();
		});

		it("throws when first user has no email", async () => {
			const { service } = createService({
				usersRepository: {
					create: jest.fn(),
					findByEmail: jest.fn(),
					findById: jest.fn(),
					findAll: jest.fn(),
					updateById: jest.fn(),
					deleteById: jest.fn(),
					findSuperAdmin: jest.fn().mockResolvedValue(false),
				},
			});

			await expect(service.registerUser({ password: "pass" }, "", null)).rejects.toThrow("Email is required for first user");
		});

		it("sends welcome email after registration", async () => {
			const { service, emailService } = createService();

			await service.registerUser({ password: "pass" }, "invite-token", null);

			expect(emailService.buildEmail).toHaveBeenCalledWith("welcomeEmailTemplate", expect.objectContaining({ name: "Test" }));
			expect(emailService.sendEmail).toHaveBeenCalledWith("test@example.com", "Welcome to Uptime Monitor", "<html>Welcome</html>");
		});

		it("logs warning when welcome email build returns null", async () => {
			const { service, logger } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue(null),
					sendEmail: jest.fn(),
				},
			});

			const result = await service.registerUser({ password: "pass" }, "invite-token", null);

			expect(result.user).toBeDefined();
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ method: "registerUser" }));
		});

		it("uses default role when invite has no role", async () => {
			const { service, usersRepository } = createService({
				invitesRepository: {
					findByTokenAndDelete: jest.fn().mockResolvedValue({ role: undefined, teamId: "team-1", email: "invited@example.com" }),
				},
			});

			await service.registerUser({ password: "pass" }, "invite-token", null);

			expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({ role: ["user"] }), null);
		});

		it("registers user without password", async () => {
			const { service, usersRepository } = createService();

			await service.registerUser({}, "invite-token", null);

			const call = (usersRepository.create as jest.Mock).mock.calls[0] as any[];
			// Password should not be hashed since it was never provided
			expect(call[0].password).toBeUndefined();
		});

		it("logs warning when sendEmail rejects (fire-and-forget)", async () => {
			const { service, logger } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue("<html>ok</html>"),
					sendEmail: jest.fn().mockRejectedValue(new Error("SMTP down")),
				},
			});

			await service.registerUser({ password: "pass" }, "invite-token", null);
			await new Promise((r) => setTimeout(r, 10));

			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "SMTP down" }));
		});

		it("logs 'Unknown error' when sendEmail rejects with non-Error", async () => {
			const { service, logger } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue("<html>ok</html>"),
					sendEmail: jest.fn().mockRejectedValue("string error"),
				},
			});

			await service.registerUser({ password: "pass" }, "invite-token", null);
			await new Promise((r) => setTimeout(r, 10));

			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error" }));
		});

		it("logs 'Unknown error' when buildEmail throws non-Error", async () => {
			const { service, logger } = createService({
				emailService: {
					buildEmail: jest.fn().mockRejectedValue(42),
					sendEmail: jest.fn(),
				},
			});

			const result = await service.registerUser({ password: "pass" }, "invite-token", null);

			expect(result.user).toBeDefined();
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ message: "Unknown error" }));
		});
	});

	// ── createUser ──────────────────────────────────────────────────────────

	describe("createUser", () => {
		it("creates a user with hashed password and assigned team", async () => {
			const { service, usersRepository } = createService();

			const result = await service.createUser({ password: "pass", role: ["user"] }, "team-1", ["superadmin"], null);

			expect(usersRepository.create).toHaveBeenCalledWith(expect.objectContaining({ teamId: "team-1" }), null);
			expect(result.password).toBe("");
		});

		it("creates user without password when not provided", async () => {
			const { service, usersRepository } = createService();

			await service.createUser({ role: ["user"] }, "team-1", ["superadmin"], null);

			const call = (usersRepository.create as jest.Mock).mock.calls[0] as any[];
			expect(call[0].password).toBeUndefined();
		});

		it("defaults to empty roles when userData.role is undefined", async () => {
			const { service } = createService();

			// No role provided, targetRoles defaults to [] via ?? [], loop doesn't execute, no permission error
			const result = await service.createUser({ password: "pass" }, "team-1", ["user"], null);

			expect(result).toBeDefined();
		});

		it("throws when actor cannot manage the target role", async () => {
			const { service } = createService();

			await expect(service.createUser({ role: ["superadmin"] }, "team-1", ["admin"], null)).rejects.toThrow(
				"You do not have permission to assign this role"
			);
		});
	});

	// ── loginUser ───────────────────────────────────────────────────────────

	describe("loginUser", () => {
		it("returns user and token on correct password", async () => {
			const { service, usersRepository } = createService();
			const bcrypt = await import("bcryptjs");
			const hashed = bcrypt.hashSync("correct-password", 10);
			(usersRepository.findByEmail as jest.Mock).mockResolvedValue(makeUser({ password: hashed }));

			const result = await service.loginUser("test@example.com", "correct-password");

			expect(result.token).toBe("jwt-token-123");
			expect(result.user.password).toBe("");
		});

		it("throws on incorrect password", async () => {
			const { service, usersRepository } = createService();
			const bcrypt = await import("bcryptjs");
			const hashed = bcrypt.hashSync("correct-password", 10);
			(usersRepository.findByEmail as jest.Mock).mockResolvedValue(makeUser({ password: hashed }));

			await expect(service.loginUser("test@example.com", "wrong-password")).rejects.toThrow("Incorrect password");
		});
	});

	// ── editUser ────────────────────────────────────────────────────────────

	describe("editUser", () => {
		it("updates user without password change", async () => {
			const { service, usersRepository } = createService();

			await service.editUser({ firstName: "Updated" }, null, "user-1", "test@example.com");

			expect(usersRepository.updateById).toHaveBeenCalledWith("user-1", { firstName: "Updated" }, null);
		});

		it("skips password flow when only password is provided without newPassword", async () => {
			const { service, usersRepository } = createService();

			await service.editUser({ password: "old-pass" }, null, "user-1", "test@example.com");

			expect(usersRepository.findByEmail).not.toHaveBeenCalled();
			expect(usersRepository.updateById).toHaveBeenCalledWith("user-1", expect.objectContaining({ password: "old-pass" }), null);
		});

		it("skips password flow when only newPassword is provided without password", async () => {
			const { service, usersRepository } = createService();

			await service.editUser({ newPassword: "new-pass" } as any, null, "user-1", "test@example.com");

			expect(usersRepository.findByEmail).not.toHaveBeenCalled();
		});

		it("changes password when old and new password provided", async () => {
			const { service, usersRepository } = createService();
			const bcrypt = await import("bcryptjs");
			const hashed = bcrypt.hashSync("old-password", 10);
			(usersRepository.findByEmail as jest.Mock).mockResolvedValue(makeUser({ password: hashed }));

			await service.editUser({ password: "old-password", newPassword: "new-password" }, null, "user-1", "test@example.com");

			expect(usersRepository.updateById).toHaveBeenCalledWith("user-1", expect.objectContaining({ email: "test@example.com" }), null);
			const call = (usersRepository.updateById as jest.Mock).mock.calls[0] as any[];
			expect(call[1].newPassword).toBeUndefined();
			expect(call[1].password).not.toBe("old-password");
		});

		it("throws when current password is incorrect", async () => {
			const { service, usersRepository } = createService();
			const bcrypt = await import("bcryptjs");
			const hashed = bcrypt.hashSync("actual-password", 10);
			(usersRepository.findByEmail as jest.Mock).mockResolvedValue(makeUser({ password: hashed }));

			await expect(service.editUser({ password: "wrong-password", newPassword: "new-pass" }, null, "user-1", "test@example.com")).rejects.toThrow(
				"Incorrect current password"
			);
		});
	});

	// ── checkSuperadminExists ───────────────────────────────────────────────

	describe("checkSuperadminExists", () => {
		it("delegates to repository", async () => {
			const { service, usersRepository } = createService();

			const result = await service.checkSuperadminExists();

			expect(result).toBe(true);
			expect(usersRepository.findSuperAdmin).toHaveBeenCalled();
		});
	});

	// ── requestRecovery ─────────────────────────────────────────────────────

	describe("requestRecovery", () => {
		it("creates recovery token and sends email", async () => {
			const { service, recoveryTokensRepository, emailService } = createService();

			const result = await service.requestRecovery("test@example.com");

			expect(recoveryTokensRepository.deleteManyByEmail).toHaveBeenCalledWith("test@example.com");
			expect(recoveryTokensRepository.create).toHaveBeenCalledWith("test@example.com");
			expect(emailService.buildEmail).toHaveBeenCalledWith(
				"passwordResetTemplate",
				expect.objectContaining({
					name: "Test",
					email: "test@example.com",
					url: "http://localhost:5173/set-new-password/recovery-token-123",
				})
			);
			expect(result).toBe("msg-id-123");
		});

		it("throws when email HTML fails to build", async () => {
			const { service } = createService({
				emailService: {
					buildEmail: jest.fn().mockResolvedValue(null),
					sendEmail: jest.fn(),
				},
			});

			await expect(service.requestRecovery("test@example.com")).rejects.toThrow("Failed to build password reset email HTML");
		});
	});

	// ── validateRecovery ────────────────────────────────────────────────────

	describe("validateRecovery", () => {
		it("delegates to repository findByToken", async () => {
			const { service, recoveryTokensRepository } = createService();

			await service.validateRecovery("recovery-token-123");

			expect(recoveryTokensRepository.findByToken).toHaveBeenCalledWith("recovery-token-123");
		});
	});

	// ── resetPassword ───────────────────────────────────────────────────────

	describe("resetPassword", () => {
		it("resets password and returns user with token", async () => {
			const { service, usersRepository, recoveryTokensRepository } = createService();
			// Ensure old password doesn't match new one (bcrypt.compare returns false)
			(usersRepository.findByEmail as jest.Mock).mockResolvedValue(makeUser({ password: "$2a$10$differenthash" }));

			const result = await service.resetPassword("new-password", "recovery-token-123");

			expect(recoveryTokensRepository.findByToken).toHaveBeenCalledWith("recovery-token-123");
			expect(usersRepository.updateById).toHaveBeenCalledWith("user-1", expect.objectContaining({ password: expect.any(String) }), null);
			expect(recoveryTokensRepository.deleteManyByEmail).toHaveBeenCalledWith("test@example.com");
			expect(result.token).toBe("jwt-token-123");
			expect(result.user.password).toBe("");
		});

		it("throws when new password matches old password", async () => {
			const { service, usersRepository } = createService();
			const bcrypt = await import("bcryptjs");
			const hashed = bcrypt.hashSync("same-password", 10);
			(usersRepository.findByEmail as jest.Mock).mockResolvedValue(makeUser({ password: hashed }));

			await expect(service.resetPassword("same-password", "recovery-token-123")).rejects.toThrow("New password cannot be same as old password");
		});
	});

	// ── deleteUser ──────────────────────────────────────────────────────────

	describe("deleteUser", () => {
		it("deletes user and cleans up monitor jobs for superadmin", async () => {
			const { service, usersRepository, jobQueue, monitorsRepository } = createService();

			await service.deleteUser({ userId: "user-1", teamId: "team-1", roles: ["superadmin"] });

			expect(monitorsRepository.findByTeamId).toHaveBeenCalledWith("team-1", {});
			expect(jobQueue.deleteJob).toHaveBeenCalledTimes(2);
			expect(usersRepository.deleteById).toHaveBeenCalledWith("user-1");
		});

		it("handles null monitors for superadmin gracefully", async () => {
			const { service, usersRepository, jobQueue } = createService({
				monitorsRepository: { findByTeamId: jest.fn().mockResolvedValue(null) },
			});

			await service.deleteUser({ userId: "user-1", teamId: "team-1", roles: ["superadmin"] });

			expect(jobQueue.deleteJob).not.toHaveBeenCalled();
			expect(usersRepository.deleteById).toHaveBeenCalledWith("user-1");
		});

		it("skips monitor cleanup for non-superadmin", async () => {
			const { service, usersRepository, monitorsRepository } = createService();

			await service.deleteUser({ userId: "user-1", teamId: "team-1", roles: ["user"] });

			expect(monitorsRepository.findByTeamId).not.toHaveBeenCalled();
			expect(usersRepository.deleteById).toHaveBeenCalledWith("user-1");
		});

		it("throws when deleting a demo user", async () => {
			const { service } = createService();

			await expect(service.deleteUser({ userId: "user-1", teamId: "team-1", roles: ["demo"] })).rejects.toThrow("Demo user cannot be deleted");
		});
	});

	// ── deleteUserById ──────────────────────────────────────────────────────

	describe("deleteUserById", () => {
		it("deletes target user when actor has permission", async () => {
			const { service, usersRepository, logger } = createService();

			await service.deleteUserById({ actorId: "admin-1", actorTeamId: "team-1", actorRoles: ["superadmin"], targetUserId: "user-1" });

			expect(usersRepository.deleteById).toHaveBeenCalledWith("user-1");
			expect(logger.info).toHaveBeenCalledWith(expect.objectContaining({ message: "User user-1 deleted by admin-1" }));
		});

		it("throws when actor tries to delete themselves", async () => {
			const { service } = createService();

			await expect(
				service.deleteUserById({ actorId: "user-1", actorTeamId: "team-1", actorRoles: ["superadmin"], targetUserId: "user-1" })
			).rejects.toThrow("Cannot delete your own account from here");
		});

		it("throws when target is on a different team", async () => {
			const { service, usersRepository } = createService();
			(usersRepository.findById as jest.Mock).mockResolvedValue(makeUser({ teamId: "team-other" }));

			await expect(
				service.deleteUserById({ actorId: "admin-1", actorTeamId: "team-1", actorRoles: ["superadmin"], targetUserId: "user-1" })
			).rejects.toThrow("User is not on your team");
		});

		it("throws when target is a demo user", async () => {
			const { service, usersRepository } = createService();
			(usersRepository.findById as jest.Mock).mockResolvedValue(makeUser({ role: ["demo"] }));

			await expect(
				service.deleteUserById({ actorId: "admin-1", actorTeamId: "team-1", actorRoles: ["superadmin"], targetUserId: "user-1" })
			).rejects.toThrow("Demo user cannot be deleted");
		});

		it("throws when actor lacks permission to manage target role", async () => {
			const { service, usersRepository } = createService();
			(usersRepository.findById as jest.Mock).mockResolvedValue(makeUser({ role: ["superadmin"] }));

			await expect(
				service.deleteUserById({ actorId: "admin-1", actorTeamId: "team-1", actorRoles: ["admin"], targetUserId: "user-1" })
			).rejects.toThrow("You do not have permission to remove this user");
		});
	});

	// ── getAllUsers ──────────────────────────────────────────────────────────

	describe("getAllUsers", () => {
		it("delegates to repository", async () => {
			const { service, usersRepository } = createService();

			const result = await service.getAllUsers();

			expect(result).toEqual([makeUser()]);
			expect(usersRepository.findAll).toHaveBeenCalled();
		});
	});

	// ── getUserById ─────────────────────────────────────────────────────────

	describe("getUserById", () => {
		it("returns user for admin", async () => {
			const { service, usersRepository } = createService();

			const result = await service.getUserById(["admin"], "user-1");

			expect(result).toEqual(makeUser());
			expect(usersRepository.findById).toHaveBeenCalledWith("user-1");
		});

		it("returns user for superadmin", async () => {
			const { service } = createService();

			const result = await service.getUserById(["superadmin"], "user-1");

			expect(result).toEqual(makeUser());
		});

		it("throws for non-admin roles", async () => {
			const { service } = createService();

			await expect(service.getUserById(["user"], "user-1")).rejects.toThrow("Insufficient permissions");
		});
	});

	// ── editUserById ────────────────────────────────────────────────────────

	describe("editUserById", () => {
		it("delegates to repository", async () => {
			const { service, usersRepository } = createService();

			await service.editUserById("user-1", { firstName: "New" });

			expect(usersRepository.updateById).toHaveBeenCalledWith("user-1", { firstName: "New" }, null);
		});
	});

	// ── setPasswordByUserId ─────────────────────────────────────────────────

	describe("setPasswordByUserId", () => {
		it("hashes and sets password", async () => {
			const { service, usersRepository } = createService();

			const result = await service.setPasswordByUserId("user-1", "new-password");

			expect(usersRepository.updateById).toHaveBeenCalledWith("user-1", expect.objectContaining({ password: expect.any(String) }), null);
			// Ensure the stored password is hashed, not plaintext
			const call = (usersRepository.updateById as jest.Mock).mock.calls[0] as any[];
			expect(call[1].password).not.toBe("new-password");
			expect(result).toEqual(makeUser());
		});
	});
});
