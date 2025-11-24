jest.mock("got", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import SlackService from "@/services/infrastructure/NotificationServices/Slack.js";

const getGot = () => jest.requireMock("got").default;

const buildChannel = (overrides = {}) => ({
  _id: "c1",
  name: "Slack",
  type: "slack",
  config: { url: "https://hooks.slack.com/services/T000/B000/XXX" },
  ...overrides,
});

const buildMonitor = (overrides = {}) => ({ name: "m", status: "up", url: "u", ...overrides });
const buildIncident = (overrides = {}) => ({ resolved: false, ...overrides });

describe("SlackService", () => {
  beforeEach(() => {
    getGot().post.mockReset();
  });

  it("sends message via webhook", async () => {
    const service = new SlackService();
    getGot().post.mockResolvedValue({});
    const channel = buildChannel();
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    const ok = await service.sendMessage(alert, channel);
    expect(getGot().post).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it("throws when url missing", async () => {
    const service = new SlackService();
    const channel = buildChannel({ config: {} });
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    await expect(service.sendMessage(alert, channel)).rejects.toThrow("Webhook URL not configured");
  });

  it("returns false when webhook post fails", async () => {
    const service = new SlackService();
    getGot().post.mockRejectedValue(new Error("net"));
    const channel = buildChannel();
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    const ok = await service.sendMessage(alert, channel);
    expect(ok).toBe(false);
  });

  it("includes resolution fields and timestamps in payload", async () => {
    const service = new SlackService();
    getGot().post.mockResolvedValue({});
    const channel = buildChannel();
    const incident = buildIncident({ resolved: true, resolutionType: "auto", resolutionNote: "n" });
    const alert = service.buildAlert(buildMonitor(), incident);
    await service.sendMessage(alert, channel);
    const payload = getGot().post.mock.calls[0][1].json;
    expect(payload.blocks.some((b) => JSON.stringify(b).includes("Resolution Type"))).toBe(true);
    expect(payload.blocks.some((b) => JSON.stringify(b).includes("Checked at"))).toBe(true);
  });
});
