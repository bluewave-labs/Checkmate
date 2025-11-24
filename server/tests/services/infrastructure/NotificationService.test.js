// Mock HTTP client used by notification transports to avoid ESM import issues
jest.mock("got", () => {
  const extend = jest.fn(() => jest.fn());
  return { __esModule: true, default: { extend } };
});

import NotificationService from "@/services/infrastructure/NotificationService.js";
import {
  EmailService,
  SlackService,
  DiscordService,
  WebhookService,
} from "@/services/infrastructure/NotificationServices/index.js";
import { Monitor, NotificationChannel } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";

// Helper builders
const buildMonitor = (overrides = {}) => ({
  _id: "m1",
  teamId: "t1",
  name: "My Monitor",
  status: "up",
  notificationChannels: [],
  ...overrides,
});

const buildChannel = (overrides = {}) => ({
  _id: "c1",
  name: "Email Alerts",
  type: "email",
  config: { emailAddress: "alerts@example.com", url: "" },
  ...overrides,
});

// Create a concrete service instance using real constructor (deps are not used directly here)
const createService = () =>
  new NotificationService({} /** UserService */, {} /** SettingsService */);

describe("NotificationService.testEmailTransport", () => {
  it("delegates to EmailService.testTransport", async () => {
    const service = createService();
    const spy = jest
      .spyOn(service["emailService"], "testTransport")
      .mockResolvedValue(true);
    const result = await service.testEmailTransport({
      systemEmailSecure: false,
      systemEmailPool: false,
      systemEmailIgnoreTLS: false,
      systemEmailRequireTLS: false,
      systemEmailRejectUnauthorized: true,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });
});

describe("NotificationService.testNotificationChannel", () => {
  afterEach(() => jest.restoreAllMocks());

  it("tests email channel and returns sent flag", async () => {
    const service = createService();
    jest.spyOn(service["emailService"], "testMessage").mockResolvedValue(true);
    const channel = buildChannel({
      type: "email",
      config: { emailAddress: "x@example.com" },
    });
    const sent = await service.testNotificationChannel(channel);
    expect(sent).toBe(true);
  });

  it("tests slack/discord/webhook channels and returns sent flag", async () => {
    const service = createService();
    jest.spyOn(service["slackService"], "testMessage").mockResolvedValue(true);
    jest
      .spyOn(service["discordService"], "testMessage")
      .mockResolvedValue(false);
    jest
      .spyOn(service["webhookService"], "testMessage")
      .mockResolvedValue(true);

    const slack = buildChannel({
      _id: "c2",
      type: "slack",
      config: { url: "https://hooks.slack.com/.." },
    });
    const discord = buildChannel({
      _id: "c3",
      type: "discord",
      config: { url: "https://discordapp.com/api/webhooks/..." },
    });
    const webhook = buildChannel({
      _id: "c4",
      type: "webhook",
      config: { url: "https://example.com/hook" },
    });

    await expect(service.testNotificationChannel(slack)).resolves.toBe(true);
    await expect(service.testNotificationChannel(discord)).resolves.toBe(false);
    await expect(service.testNotificationChannel(webhook)).resolves.toBe(true);
  });
});

describe("NotificationService.testNotificationChannels", () => {
  afterEach(() => jest.restoreAllMocks());

  it("throws 404 when monitor missing", async () => {
    const service = createService();
    jest.spyOn(Monitor, "findOne").mockResolvedValue(null);
    await expect(
      service.testNotificationChannels("m1", "t1")
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      service.testNotificationChannels("m1", "t1")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("aggregates results for all channels", async () => {
    const service = createService();
    const monitor = buildMonitor({
      notificationChannels: ["c1", "c2", "c3", "c4"],
    });
    jest.spyOn(Monitor, "findOne").mockResolvedValue(monitor);
    const channels = [
      buildChannel({
        _id: "c1",
        type: "email",
        config: { emailAddress: "a@example.com" },
      }),
      buildChannel({
        _id: "c2",
        type: "slack",
        config: { url: "https://slack" },
      }),
      buildChannel({
        _id: "c3",
        type: "discord",
        config: { url: "https://discord" },
      }),
      buildChannel({
        _id: "c4",
        type: "webhook",
        config: { url: "https://webhook" },
      }),
    ];
    jest
      .spyOn(NotificationChannel, "find")
      .mockReturnValue({ lean: () => channels });
    jest.spyOn(service["emailService"], "testMessage").mockResolvedValue(true);
    jest.spyOn(service["slackService"], "testMessage").mockResolvedValue(false);
    jest
      .spyOn(service["discordService"], "testMessage")
      .mockResolvedValue(true);
    jest
      .spyOn(service["webhookService"], "testMessage")
      .mockResolvedValue(true);

    const results = await service.testNotificationChannels("m1", "t1");
    expect(Array.isArray(results)).toBe(true);
    expect(results).toHaveLength(4);
    const byType = Object.fromEntries(
      results.map((r) => [r.channelType, r.sent])
    );
    expect(byType.email).toBe(true);
    expect(byType.slack).toBe(false);
    expect(byType.discord).toBe(true);
    expect(byType.webhook).toBe(true);
  });
});

describe("NotificationService.handleNotifications", () => {
  afterEach(() => jest.restoreAllMocks());

  it("returns early when no channels configured", async () => {
    const service = createService();
    const monitor = buildMonitor({ notificationChannels: [] });
    await expect(
      service.handleNotifications(monitor, { _id: "i1" })
    ).resolves.toBeUndefined();
  });

  it("invokes appropriate service by channel type", async () => {
    const service = createService();
    const monitor = buildMonitor({
      notificationChannels: ["c1", "c2", "c3", "c4"],
    });
    const channelDocs = [
      buildChannel({
        _id: "c1",
        type: "email",
        config: { emailAddress: "a@example.com" },
      }),
      buildChannel({
        _id: "c2",
        type: "slack",
        config: { url: "https://slack" },
      }),
      buildChannel({
        _id: "c3",
        type: "discord",
        config: { url: "https://discord" },
      }),
      buildChannel({
        _id: "c4",
        type: "webhook",
        config: { url: "https://webhook" },
      }),
    ];
    jest.spyOn(NotificationChannel, "find").mockResolvedValue(channelDocs);

    const emailSpy = jest
      .spyOn(service["emailService"], "sendMessage")
      .mockResolvedValue(true);
    const slackSpy = jest
      .spyOn(service["slackService"], "sendMessage")
      .mockResolvedValue(true);
    const discordSpy = jest
      .spyOn(service["discordService"], "sendMessage")
      .mockResolvedValue(true);
    const webhookSpy = jest
      .spyOn(service["webhookService"], "sendMessage")
      .mockResolvedValue(true);

    await service.handleNotifications(monitor, { _id: "i1", monitorId: "m1" });

    expect(emailSpy).toHaveBeenCalled();
    expect(slackSpy).toHaveBeenCalled();
    expect(discordSpy).toHaveBeenCalled();
    expect(webhookSpy).toHaveBeenCalled();
  });
});
