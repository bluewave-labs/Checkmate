import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { EmailService } from "../../../src/service/infrastructure/emailService.ts";
import { createMockLogger } from "../../helpers/createMockLogger.ts";
import type { ISettingsService } from "../../../src/service/system/settingsService.ts";
import type { EmailTransportConfig } from "../../../src/types/index.ts";

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeTransportConfig = (overrides?: Partial<EmailTransportConfig>): EmailTransportConfig =>
	({
		systemEmailHost: "smtp.example.com",
		systemEmailPort: 587,
		systemEmailSecure: false,
		systemEmailPool: false,
		systemEmailUser: "user@example.com",
		systemEmailAddress: "noreply@example.com",
		systemEmailPassword: "password123",
		systemEmailConnectionHost: "mail.example.com",
		systemEmailTLSServername: "smtp.example.com",
		systemEmailIgnoreTLS: false,
		systemEmailRequireTLS: true,
		systemEmailRejectUnauthorized: true,
		...overrides,
	}) as EmailTransportConfig;

const createMockSettingsService = () =>
	({
		getDBSettings: jest.fn().mockResolvedValue(makeTransportConfig()),
	}) as unknown as jest.Mocked<ISettingsService>;

const createMockFs = (templateContent: string = "<mjml><mj-body></mj-body></mjml>") =>
	({
		readFileSync: jest.fn().mockReturnValue(templateContent),
	}) as any;

const createMockPath = () =>
	({
		join: jest.fn((...args: string[]) => args.join("/")),
		dirname: jest.fn().mockReturnValue("/mock/dir"),
	}) as any;

const createMockCompile = (result: string = "<mjml>compiled</mjml>") => {
	const compiledFn = jest.fn().mockReturnValue(result);
	const compile = jest.fn().mockReturnValue(compiledFn) as any;
	compile.__compiledFn = compiledFn;
	return compile;
};

const createMockMjml = (html: string = "<html>rendered</html>") => jest.fn().mockReturnValue({ html }) as any;

const createMockTransporter = () => ({
	verify: jest.fn().mockResolvedValue(true),
	sendMail: jest.fn().mockResolvedValue({ messageId: "msg-123" }),
});

const createMockNodemailer = (transporter?: ReturnType<typeof createMockTransporter>) => {
	const t = transporter ?? createMockTransporter();
	return {
		createTransport: jest.fn().mockReturnValue(t),
		__transporter: t,
	} as any;
};

const createService = (overrides?: { settingsService?: any; fs?: any; path?: any; compile?: any; mjml?: any; nodemailer?: any }) => {
	const logger = createMockLogger();
	const settingsService = overrides?.settingsService ?? createMockSettingsService();
	const mockFs = overrides?.fs ?? createMockFs();
	const mockPath = overrides?.path ?? createMockPath();
	const compile = overrides?.compile ?? createMockCompile();
	const mjml = overrides?.mjml ?? createMockMjml();
	const mockNodemailer = overrides?.nodemailer ?? createMockNodemailer();

	const service = new EmailService(settingsService, mockFs, mockPath, compile, mjml, mockNodemailer, logger as any);

	return { service, logger, settingsService, mockFs, mockPath, compile, mjml, mockNodemailer };
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe("EmailService", () => {
	describe("SERVICE_NAME", () => {
		it("returns EmailService from static property", () => {
			expect(EmailService.SERVICE_NAME).toBe("EmailService");
		});

		it("returns EmailService from instance getter", () => {
			const { service } = createService();
			expect(service.serviceName).toBe("EmailService");
		});
	});

	// ── init / loadTemplate ──────────────────────────────────────────────

	describe("init", () => {
		it("loads all expected templates on construction", () => {
			const { mockFs } = createService();

			// 6 templates loaded
			expect(mockFs.readFileSync).toHaveBeenCalledTimes(6);
		});

		it("compiles each loaded template", () => {
			const { compile } = createService();

			expect(compile).toHaveBeenCalledTimes(6);
		});

		it("logs error when a template file is not found", () => {
			const failFs = {
				readFileSync: jest.fn().mockImplementation(() => {
					throw new Error("ENOENT: no such file");
				}),
			};

			const { logger } = createService({ fs: failFs });

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "ENOENT: no such file",
					service: "EmailService",
					method: "loadTemplate",
				})
			);
		});

		it("logs 'Unknown error' for non-Error thrown values in loadTemplate", () => {
			const failFs = {
				readFileSync: jest.fn().mockImplementation(() => {
					throw "string error";
				}),
			};

			const { logger } = createService({ fs: failFs });

			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					stack: undefined,
				})
			);
		});

		it("can be called again to reinitialize templates", () => {
			const { service, mockFs } = createService();
			const initialCalls = mockFs.readFileSync.mock.calls.length;

			service.init();

			expect(mockFs.readFileSync).toHaveBeenCalledTimes(initialCalls + 6);
		});
	});

	// ── buildEmail ───────────────────────────────────────────────────────

	describe("buildEmail", () => {
		it("compiles template with context and returns rendered HTML", async () => {
			const { service } = createService();

			const result = await service.buildEmail("welcomeEmailTemplate", { name: "Test" });

			expect(result).toBe("<html>rendered</html>");
		});

		it("passes context to the compiled template function", async () => {
			const compile = createMockCompile();
			const { service } = createService({ compile });
			const context = { name: "Alex", url: "https://example.com" };

			await service.buildEmail("welcomeEmailTemplate", context);

			expect(compile.__compiledFn).toHaveBeenCalledWith(context);
		});

		it("returns undefined and logs error when template is not found", async () => {
			const { service, logger } = createService();

			const result = await service.buildEmail("nonExistentTemplate", {});

			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Template nonExistentTemplate not found",
					service: "EmailService",
					method: "buildEmail",
				})
			);
		});

		it("returns undefined and logs error when template function returns falsy", async () => {
			const compile = jest.fn().mockReturnValue(jest.fn().mockReturnValue(undefined)) as any;
			const { service, logger } = createService({ compile });

			const result = await service.buildEmail("welcomeEmailTemplate", {});

			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Template welcomeEmailTemplate not found",
				})
			);
		});

		it("returns undefined and logs error when mjml throws", async () => {
			const mjml = jest.fn().mockImplementation(() => {
				throw new Error("MJML parse error");
			}) as any;
			const { service, logger } = createService({ mjml });

			const result = await service.buildEmail("welcomeEmailTemplate", {});

			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "MJML parse error",
					method: "buildEmail",
				})
			);
		});

		it("logs 'Unknown error' for non-Error thrown values in buildEmail", async () => {
			const mjml = jest.fn().mockImplementation(() => {
				throw null;
			}) as any;
			const { service, logger } = createService({ mjml });

			const result = await service.buildEmail("welcomeEmailTemplate", {});

			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					method: "buildEmail",
					stack: undefined,
				})
			);
		});
	});

	// ── sendEmail ────────────────────────────────────────────────────────

	describe("sendEmail", () => {
		it("sends email with provided transport config and returns messageId", async () => {
			const transporter = createMockTransporter();
			const nodemailer = createMockNodemailer(transporter);
			const { service } = createService({ nodemailer });
			const config = makeTransportConfig();

			const result = await service.sendEmail("to@example.com", "Subject", "<p>body</p>", config);

			expect(result).toBe("msg-123");
			expect(transporter.verify).toHaveBeenCalled();
			expect(transporter.sendMail).toHaveBeenCalledWith({
				to: "to@example.com",
				from: "noreply@example.com",
				subject: "Subject",
				html: "<p>body</p>",
			});
		});

		it("falls back to DB settings when no transport config is provided", async () => {
			const settingsService = createMockSettingsService();
			const transporter = createMockTransporter();
			const nodemailer = createMockNodemailer(transporter);
			const { service } = createService({ settingsService, nodemailer });

			await service.sendEmail("to@example.com", "Subject", "<p>body</p>");

			expect(settingsService.getDBSettings).toHaveBeenCalled();
		});

		it("creates transporter with correct email config", async () => {
			const transporter = createMockTransporter();
			const nodemailer = createMockNodemailer(transporter);
			const { service } = createService({ nodemailer });
			const config = makeTransportConfig({
				systemEmailHost: "smtp.test.com",
				systemEmailPort: 465,
				systemEmailSecure: true,
				systemEmailPool: true,
				systemEmailUser: "testuser",
				systemEmailPassword: "testpass",
				systemEmailConnectionHost: "conn.test.com",
				systemEmailRejectUnauthorized: false,
				systemEmailIgnoreTLS: true,
				systemEmailRequireTLS: false,
				systemEmailTLSServername: "tls.test.com",
			});

			await service.sendEmail("to@example.com", "Subject", "<p>body</p>", config);

			expect(nodemailer.createTransport).toHaveBeenCalledWith({
				host: "smtp.test.com",
				port: 465,
				secure: true,
				auth: { user: "testuser", pass: "testpass" },
				name: "conn.test.com",
				connectionTimeout: 5000,
				pool: true,
				tls: {
					rejectUnauthorized: false,
					ignoreTLS: true,
					requireTLS: false,
					servername: "tls.test.com",
				},
			});
		});

		it("uses systemEmailAddress as auth user when systemEmailUser is falsy", async () => {
			const transporter = createMockTransporter();
			const nodemailer = createMockNodemailer(transporter);
			const { service } = createService({ nodemailer });
			const config = makeTransportConfig({ systemEmailUser: "", systemEmailAddress: "fallback@example.com" });

			await service.sendEmail("to@example.com", "Subject", "<p>body</p>", config);

			expect(nodemailer.createTransport).toHaveBeenCalledWith(
				expect.objectContaining({
					auth: expect.objectContaining({ user: "fallback@example.com" }),
				})
			);
		});

		it("uses 'localhost' as name when systemEmailConnectionHost is falsy", async () => {
			const transporter = createMockTransporter();
			const nodemailer = createMockNodemailer(transporter);
			const { service } = createService({ nodemailer });
			const config = makeTransportConfig({ systemEmailConnectionHost: "" });

			await service.sendEmail("to@example.com", "Subject", "<p>body</p>", config);

			expect(nodemailer.createTransport).toHaveBeenCalledWith(expect.objectContaining({ name: "localhost" }));
		});

		it("returns false when transporter verification fails", async () => {
			const transporter = createMockTransporter();
			(transporter.verify as jest.Mock).mockRejectedValue(new Error("SMTP auth failed"));
			const nodemailer = createMockNodemailer(transporter);
			const { service, logger } = createService({ nodemailer });

			const result = await service.sendEmail("to@example.com", "Subject", "<p>body</p>", makeTransportConfig());

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Email transporter verification failed",
					service: "EmailService",
					method: "verifyTransporter",
				})
			);
		});

		it("logs stack as undefined when verification fails with non-Error", async () => {
			const transporter = createMockTransporter();
			(transporter.verify as jest.Mock).mockRejectedValue("connection refused");
			const nodemailer = createMockNodemailer(transporter);
			const { service, logger } = createService({ nodemailer });

			const result = await service.sendEmail("to@example.com", "Subject", "<p>body</p>", makeTransportConfig());

			expect(result).toBe(false);
			expect(logger.warn).toHaveBeenCalledWith(expect.objectContaining({ stack: undefined }));
		});

		it("returns undefined and logs error when sendMail throws", async () => {
			const transporter = createMockTransporter();
			(transporter.sendMail as jest.Mock).mockRejectedValue(new Error("Recipient rejected"));
			const nodemailer = createMockNodemailer(transporter);
			const { service, logger } = createService({ nodemailer });

			const result = await service.sendEmail("to@example.com", "Subject", "<p>body</p>", makeTransportConfig());

			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Recipient rejected",
					service: "EmailService",
					method: "sendEmail",
				})
			);
		});

		it("logs 'Unknown error' for non-Error thrown values in sendMail", async () => {
			const transporter = createMockTransporter();
			(transporter.sendMail as jest.Mock).mockRejectedValue(42);
			const nodemailer = createMockNodemailer(transporter);
			const { service, logger } = createService({ nodemailer });

			const result = await service.sendEmail("to@example.com", "Subject", "<p>body</p>", makeTransportConfig());

			expect(result).toBeUndefined();
			expect(logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Unknown error",
					method: "sendEmail",
					stack: undefined,
				})
			);
		});

		// ── from-header formatting ───────────────────────────────────────

		describe("from header formatting", () => {
			const sendAndGetFrom = async (overrides: Partial<EmailTransportConfig>) => {
				const transporter = createMockTransporter();
				const nodemailer = createMockNodemailer(transporter);
				const { service } = createService({ nodemailer });

				await service.sendEmail("to@example.com", "Subject", "<p>body</p>", makeTransportConfig(overrides));

				const call = (transporter.sendMail as jest.Mock).mock.calls[0]?.[0] as { from: unknown } | undefined;
				return call?.from;
			};

			it("uses bare address when systemEmailDisplayName is undefined", async () => {
				const from = await sendAndGetFrom({
					systemEmailAddress: "noreply@example.com",
					systemEmailDisplayName: undefined,
				});

				expect(from).toBe("noreply@example.com");
			});

			it("uses bare address when systemEmailDisplayName is empty string", async () => {
				const from = await sendAndGetFrom({
					systemEmailAddress: "noreply@example.com",
					systemEmailDisplayName: "",
				});

				expect(from).toBe("noreply@example.com");
			});

			it("uses bare address when systemEmailDisplayName is whitespace-only", async () => {
				const from = await sendAndGetFrom({
					systemEmailAddress: "noreply@example.com",
					systemEmailDisplayName: "   ",
				});

				expect(from).toBe("noreply@example.com");
			});

			it("uses {name, address} when display name and address are both set", async () => {
				const from = await sendAndGetFrom({
					systemEmailAddress: "noreply@example.com",
					systemEmailDisplayName: "Checkmate notifications",
				});

				expect(from).toEqual({
					name: "Checkmate notifications",
					address: "noreply@example.com",
				});
			});

			it("trims surrounding whitespace from display name", async () => {
				const from = await sendAndGetFrom({
					systemEmailAddress: "noreply@example.com",
					systemEmailDisplayName: "   Checkmate   ",
				});

				expect(from).toEqual({
					name: "Checkmate",
					address: "noreply@example.com",
				});
			});

			it("falls back to bare address when display name is set but address is empty", async () => {
				const from = await sendAndGetFrom({
					systemEmailAddress: "",
					systemEmailDisplayName: "Checkmate",
				});

				expect(from).toBe("");
			});
		});
	});
});
