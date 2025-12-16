import { EntitlementsFactory, SaaSEntitlementsProvider, SelfHostedEntitlementsProvider } from "@/services/system/EntitlementsService.js";
import { Org } from "@/db/models/index.js";

jest.mock("@/db/models/index.js", () => ({
  Org: { findById: jest.fn() },
}));

describe("EntitlementsService", () => {
  afterEach(() => jest.resetAllMocks());

  test("SaaS provider maps plan keys to Plans", async () => {
    const cases = [
      { planKey: "free", expected: "free" },
      { planKey: "pro", expected: "pro" },
      { planKey: "business", expected: "business" },
      { planKey: "enterprise", expected: "enterprise" },
      { planKey: undefined, expected: "free" },
    ];

    for (const c of cases) {
      Org.findById.mockReturnValueOnce({ lean: () => Promise.resolve({ planKey: c.planKey }) });
      const provider = new SaaSEntitlementsProvider();
      const ent = await provider.getForOrg("org1");
      expect(ent.plan).toBe(c.expected);
    }
  });

  test("Self-hosted provider returns unlimited plan", async () => {
    const provider = new SelfHostedEntitlementsProvider();
    const ent = await provider.getForOrg("org1");
    expect(ent.plan).toBe("unlimited");
  });

  test("Factory returns correct provider based on DEPLOYMENT_MODE", () => {
    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock("@/config/index.js", () => ({ config: { DEPLOYMENT_MODE: "self_hosted" } }));
      const mod = require("@/services/system/EntitlementsService.js");
      expect(mod.EntitlementsFactory.create()).toBeInstanceOf(mod.SelfHostedEntitlementsProvider);
    });

    jest.resetModules();
    jest.isolateModules(() => {
      jest.doMock("@/config/index.js", () => ({ config: { DEPLOYMENT_MODE: "saas" } }));
      const mod = require("@/services/system/EntitlementsService.js");
      expect(mod.EntitlementsFactory.create()).toBeInstanceOf(mod.SaaSEntitlementsProvider);
    });
  });
});
