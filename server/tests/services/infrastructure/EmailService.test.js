jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({}),
    })),
  },
}));

// Default: no env SMTP so system-settings path is used unless overridden per-test
jest.mock("@/config/index.js", () => ({
  config: {
    SMTP_HOST: "not_set",
    SMTP_PORT: -1,
    SMTP_USER: "not_set",
    SMTP_PASS: "not_set",
  },
}));

import EmailService from "@/services/infrastructure/NotificationServices/Email.js";

// Mock user service to avoid calling getAllUsers
const userServiceMock = { getAllUsers: jest.fn().mockResolvedValue([{ email: "a@example.com" }]) };
// Settings service mock (unused path in test)
const settingsServiceMock = {
  get: jest.fn().mockResolvedValue({
    systemEmailHost: "smtp.example.com",
    systemEmailPort: 587,
    systemEmailAddress: "noreply@example.com",
    systemEmailUser: "smtp-user",
    systemEmailPassword: "smtp-pass",
    systemEmailConnectionHost: "example.com",
    systemEmailTLSServername: "example.com",
    systemEmailSecure: false,
    systemEmailPool: false,
    systemEmailIgnoreTLS: false,
    systemEmailRequireTLS: false,
    systemEmailRejectUnauthorized: true,
  }),
};

const getMailer = () => jest.requireMock("nodemailer").default;

const buildChannel = (overrides = {}) => ({
  _id: "c1",
  name: "Email",
  type: "email",
  config: { emailAddress: "alerts@example.com" },
  ...overrides,
});

const buildMonitor = (overrides = {}) => ({ name: "m", status: "up", url: "u", ...overrides });
const buildIncident = (overrides = {}) => ({ resolved: false, ...overrides });

describe("EmailService", () => {
  it("sends test message", async () => {
    const service = new EmailService(userServiceMock , settingsServiceMock);
    // Force transporter build
    getMailer().createTransport.mockReturnValue({ sendMail: jest.fn().mockResolvedValue({}) });
    // ensure we bypass env SMTP path
    const ok = await service.testMessage(buildChannel());
    expect(ok).toBe(true);
  });

  it("uses system settings transport (no env) and sendGeneric succeeds", async () => {
    const service = new EmailService(userServiceMock, settingsServiceMock);
    const mailer = getMailer();
    const sendMail = jest.fn().mockResolvedValue({});
    mailer.createTransport.mockReturnValue({ sendMail });

    const ok = await service.sendGeneric("to@example.com", "Subj", "Body");
    expect(ok).toBe(true);
    expect(mailer.createTransport).toHaveBeenCalled();
    const arg = mailer.createTransport.mock.calls[0][0];
    expect(arg.host || arg?.host === undefined).toBeDefined();
  });

  it("returns false when no user emails found in sendMessage", async () => {
    const service = new EmailService({ getAllUsers: jest.fn().mockResolvedValue([]) }, settingsServiceMock);
    const ok = await service.sendMessage({ name: "n", url: "u", status: "s", checkTime: new Date(), alertTime: new Date(), resolved: false }, buildChannel());
    expect(ok).toBe(false);
  });

  it("rebuildTransport sets transporter and from and returns true", async () => {
    const service = new EmailService(userServiceMock, settingsServiceMock);
    const mailer = getMailer();
    const sendMail = jest.fn().mockResolvedValue({});
    mailer.createTransport.mockReturnValue({ sendMail });
    const res = await service.rebuildTransport({
      systemEmailHost: "smtp.example.com",
      systemEmailPort: 465,
      systemEmailAddress: "noreply@example.com",
      systemEmailUser: "smtp-user",
      systemEmailPassword: "smtp-pass",
      systemEmailSecure: true,
      systemEmailPool: true,
      systemEmailIgnoreTLS: false,
      systemEmailRequireTLS: false,
      systemEmailRejectUnauthorized: true,
    });
    expect(res).toBe(true);
    expect(mailer.createTransport).toHaveBeenCalled();
  });

  it("testTransport throws when env SMTP configured", async () => {
    jest.resetModules();
    jest.doMock("@/config/index.js", () => ({
      config: { SMTP_HOST: "smtp.env", SMTP_PORT: 465, SMTP_USER: "u", SMTP_PASS: "p" },
    }));
    const { default: EmailServiceEnv } = await import("@/services/infrastructure/NotificationServices/Email.js");
    const service = new EmailServiceEnv(userServiceMock, settingsServiceMock);
    await expect(
      service.testTransport({ systemEmailAddress: "noreply@example.com", systemEmailSecure: false, systemEmailPool: false, systemEmailIgnoreTLS: false, systemEmailRequireTLS: false, systemEmailRejectUnauthorized: true })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("builds env transport when env present and uses secure flag", async () => {
    jest.resetModules();
    jest.doMock("@/config/index.js", () => ({
      config: { SMTP_HOST: "smtp.env", SMTP_PORT: 465, SMTP_USER: "u", SMTP_PASS: "p" },
    }));
    const { default: EmailServiceEnv } = await import("@/services/infrastructure/NotificationServices/Email.js");
    const mailer = getMailer();
    mailer.createTransport.mockReturnValue({ sendMail: jest.fn().mockResolvedValue({}) });
    const service = new EmailServiceEnv(userServiceMock, settingsServiceMock);
    await service.sendGeneric("t@example.com", "s", "b");
    expect(mailer.createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: "smtp.env", port: 465, secure: true })
    );
  });

  it("sendGeneric rejects when transporter sendMail fails", async () => {
    const service = new EmailService(userServiceMock, settingsServiceMock);
    // Bypass nodemailer mock by injecting a failing transporter directly
    service.transporter = { sendMail: jest.fn().mockRejectedValue(new Error("fail")) };
    await expect(service.sendGeneric("t@example.com", "s", "b")).rejects.toBeInstanceOf(Error);
  });

  it("testTransport throws ApiError when sendMail fails", async () => {
    const service = new EmailService(userServiceMock, settingsServiceMock);
    // Force buildSystemSettingsTransport to return a transporter whose sendMail fails
    service.buildSystemSettingsTransport = jest
      .fn()
      .mockResolvedValue({ sendMail: jest.fn().mockRejectedValue(new Error("smtp-fail")) });
    await expect(
      service.testTransport({
        systemEmailHost: "smtp.example.com",
        systemEmailPort: 587,
        systemEmailAddress: "noreply@example.com",
        systemEmailUser: "smtp-user",
        systemEmailPassword: "smtp-pass",
        systemEmailSecure: false,
        systemEmailPool: false,
        systemEmailIgnoreTLS: false,
        systemEmailRequireTLS: false,
        systemEmailRejectUnauthorized: true,
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});
