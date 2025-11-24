jest.mock("got", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import WebhookService from "@/services/infrastructure/NotificationServices/Webhook.js";
import ApiError from "@/utils/ApiError.js";

const getGot = () => jest.requireMock("got").default;

const buildChannel = (overrides = {}) => ({
  _id: "c1",
  name: "Webhook",
  type: "webhook",
  config: { url: "https://example.com/hook" },
  ...overrides,
});

const buildMonitor = (overrides = {}) => ({ name: "m", status: "up", url: "u", ...overrides });
const buildIncident = (overrides = {}) => ({ resolved: false, ...overrides });

describe("WebhookService", () => {
  beforeEach(() => {
    getGot().post.mockReset();
  });

  it("sends message via webhook", async () => {
    const service = new WebhookService();
    getGot().post.mockResolvedValue({});
    const channel = buildChannel();
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    const ok = await service.sendMessage(alert, channel);
    expect(getGot().post).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it("throws when url missing", async () => {
    const service = new WebhookService();
    const channel = buildChannel({ config: {} });
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    await expect(service.sendMessage(alert, channel)).rejects.toBeInstanceOf(ApiError);
  });
});

