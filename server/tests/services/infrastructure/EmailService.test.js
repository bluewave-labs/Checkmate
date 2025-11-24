jest.mock("nodemailer", () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({})
    }))
  }
}));

import EmailService from "@/services/infrastructure/NotificationServices/Email.js";

// Mock user service to avoid calling getAllUsers
const userServiceMock = { getAllUsers: jest.fn().mockResolvedValue([{ email: "a@example.com" }]) };
// Settings service mock (unused path in test)
const settingsServiceMock = {};

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
});
