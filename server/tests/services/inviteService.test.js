import sinon from "sinon";
import InviteService from "../../src/service/business/inviteService.js";

describe("InviteService", function () {
	let inviteService;
	let mockDb, mockSettingsService, mockEmailService, mockStringService, mockErrorService;

	const mockInviteToken = {
		_id: "invite123",
		token: "abc123token",
		email: "test@example.com",
		teamId: "team123",
		role: ["member"]
	};

	const mockInvite = {
		email: "test@example.com",
		role: ["member"]
	};

	beforeEach(function () {
		mockDb = {
			inviteModule: {
				requestInviteToken: sinon.stub(),
				getInviteToken: sinon.stub()
			}
		};

		mockSettingsService = {
			getSettings: sinon.stub()
		};

		mockEmailService = {
			buildEmail: sinon.stub(),
			sendEmail: sinon.stub()
		};

		mockStringService = {
			inviteIssued: "Invite issued successfully",
			inviteVerified: "Invite verified successfully"
		};

		mockErrorService = {
			createServerError: sinon.stub()
		};

		inviteService = new InviteService({
			db: mockDb,
			settingsService: mockSettingsService,
			emailService: mockEmailService,
			stringService: mockStringService,
			errorService: mockErrorService
		});
	});

	afterEach(function () {
		sinon.restore();
	});

	describe("getInviteToken", function () {
		it("should generate invite token with teamId", async function () {
			const teamId = "team123";
			const invite = { ...mockInvite };
			mockDb.inviteModule.requestInviteToken.resolves(mockInviteToken);

			const result = await inviteService.getInviteToken({ invite, teamId });

			expect(invite.teamId).to.equal(teamId);
			expect(mockDb.inviteModule.requestInviteToken).to.have.been.calledWith(invite);
			expect(result).to.equal(mockInviteToken);
		});

		it("should handle database errors", async function () {
			const error = new Error("Database error");
			const teamId = "team123";
			const invite = { ...mockInvite };
			mockDb.inviteModule.requestInviteToken.rejects(error);

			try {
				await inviteService.getInviteToken({ invite, teamId });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
			}
		});
	});

	describe("sendInviteEmail", function () {
		const inviteRequest = {
			email: "test@example.com",
			role: ["member"]
		};
		const firstName = "John";
		const clientHost = "https://example.com";
		const emailHtml = "<html>Welcome email</html>";

		beforeEach(function () {
			mockSettingsService.getSettings.returns({ clientHost });
			mockEmailService.buildEmail.resolves(emailHtml);
			mockEmailService.sendEmail.resolves(true);
			mockDb.inviteModule.requestInviteToken.resolves(mockInviteToken);
		});

		it("should send invite email successfully", async function () {
			await inviteService.sendInviteEmail({ inviteRequest, firstName });

			expect(mockDb.inviteModule.requestInviteToken).to.have.been.calledWith(inviteRequest);
			expect(mockSettingsService.getSettings).to.have.been.called;
			expect(mockEmailService.buildEmail).to.have.been.calledWith("employeeActivationTemplate", {
				name: firstName,
				link: `${clientHost}/register/${mockInviteToken.token}`
			});
			expect(mockEmailService.sendEmail).to.have.been.calledWith(
				inviteRequest.email,
				"Welcome to Uptime Monitor",
				emailHtml
			);
		});

		it("should handle invite token generation failure", async function () {
			const error = new Error("Token generation failed");
			mockDb.inviteModule.requestInviteToken.rejects(error);

			try {
				await inviteService.sendInviteEmail({ inviteRequest, firstName });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
			}
		});

		it("should handle email template building failure", async function () {
			const error = new Error("Template build failed");
			mockEmailService.buildEmail.rejects(error);

			try {
				await inviteService.sendInviteEmail({ inviteRequest, firstName });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
			}
		});

		it("should throw error when email sending fails", async function () {
			mockEmailService.sendEmail.resolves(false);
			const serverError = new Error("Failed to send invite e-mail... Please verify your settings.");
			mockErrorService.createServerError.returns(serverError);

			try {
				await inviteService.sendInviteEmail({ inviteRequest, firstName });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(mockErrorService.createServerError).to.have.been.calledWith(
					"Failed to send invite e-mail... Please verify your settings."
				);
				expect(err).to.equal(serverError);
			}
		});

		it("should handle settings service failure", async function () {
			const error = new Error("Settings service failed");
			mockSettingsService.getSettings.throws(error);

			try {
				await inviteService.sendInviteEmail({ inviteRequest, firstName });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
			}
		});
	});

	describe("verifyInviteToken", function () {
		const inviteToken = "abc123token";

		it("should verify invite token successfully", async function () {
			mockDb.inviteModule.getInviteToken.resolves(mockInviteToken);

			const result = await inviteService.verifyInviteToken({ inviteToken });

			expect(mockDb.inviteModule.getInviteToken).to.have.been.calledWith(inviteToken);
			expect(result).to.equal(mockInviteToken);
		});

		it("should handle token not found", async function () {
			const error = new Error("Invite not found");
			mockDb.inviteModule.getInviteToken.rejects(error);

			try {
				await inviteService.verifyInviteToken({ inviteToken });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
			}
		});

		it("should handle database errors", async function () {
			const error = new Error("Database connection failed");
			mockDb.inviteModule.getInviteToken.rejects(error);

			try {
				await inviteService.verifyInviteToken({ inviteToken });
				expect.fail("Should have thrown an error");
			} catch (err) {
				expect(err).to.equal(error);
			}
		});
	});

	describe("serviceName getter", function () {
		it("should return correct service name", function () {
			expect(inviteService.serviceName).to.equal("inviteService");
		});
	});

	describe("static SERVICE_NAME", function () {
		it("should have correct static service name", function () {
			expect(InviteService.SERVICE_NAME).to.equal("inviteService");
		});
	});
});