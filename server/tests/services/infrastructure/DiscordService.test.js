jest.mock("got", () => ({
  __esModule: true,
  default: { post: jest.fn() },
}));

import DiscordService from "@/services/infrastructure/NotificationServices/Discord.js";
import ApiError from "@/utils/ApiError.js";

const getGot = () => jest.requireMock("got").default;

const buildChannel = (overrides = {}) => ({
  _id: "c1",
  name: "Discord",
  type: "discord",
  config: { url: "https://discordapp.com/api/webhooks/XXX" },
  ...overrides,
});

const buildMonitor = (overrides = {}) => ({ name: "m", status: "up", url: "u", ...overrides });
const buildIncident = (overrides = {}) => ({ resolved: false, ...overrides });

describe("DiscordService", () => {
  beforeEach(() => {
    getGot().post.mockReset();
  });

  it("sends message via webhook", async () => {
    const service = new DiscordService();
    getGot().post.mockResolvedValue({});
    const channel = buildChannel();
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    const ok = await service.sendMessage(alert, channel);
    expect(getGot().post).toHaveBeenCalled();
    expect(ok).toBe(true);
  });

  it("throws when url missing", async () => {
    const service = new DiscordService();
    const channel = buildChannel({ config: {} });
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    await expect(service.sendMessage(alert, channel)).rejects.toBeInstanceOf(ApiError);
  });

  it("returns false when webhook post fails", async () => {
    const service = new (await import("@/services/infrastructure/NotificationServices/Discord.js")).default();
    const getGot = () => jest.requireMock("got").default;
    getGot().post.mockRejectedValue(new Error("net"));
    const channel = buildChannel();
    const alert = service.buildAlert(buildMonitor(), buildIncident());
    const ok = await service.sendMessage(alert, channel);
    expect(ok).toBe(false);
  });

  it("uses red color embed when status is down", async () => {
    const service = new DiscordService();
    const getGot = () => jest.requireMock("got").default;
    getGot().post.mockResolvedValue({});
    const channel = buildChannel();
    const alert = service.buildAlert(
      buildMonitor({ status: "down" }),
      buildIncident()
    );
    await service.sendMessage(alert, channel);
    const call = getGot().post.mock.calls[0];
    const payload = call[1].json;
    expect(payload.embeds[0].color).toBe(16711680);
  });
});
