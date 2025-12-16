import StripeService from "@/services/system/StripeService.js";

// Mocks
jest.mock("@/db/models/index.js", () => ({
  Org: { findOneAndUpdate: jest.fn() },
  Monitor: { countDocuments: jest.fn(), find: jest.fn(), deleteMany: jest.fn() },
  StatusPage: { countDocuments: jest.fn(), find: jest.fn(), deleteMany: jest.fn() },
  NotificationChannel: { countDocuments: jest.fn(), find: jest.fn(), deleteMany: jest.fn() },
}));
import { Org, Monitor, StatusPage, NotificationChannel } from "@/db/models/index.js";

jest.mock("@/config/index.js", () => ({
  config: {
    STRIPE_SECRET: "sk_test_mock",
    STRIPE_WEBHOOK_SECRET: "whsec_mock",
  },
}));

// Mock Stripe constructor and webhooks
jest.mock("stripe", () => {
  const mockConstructEvent = jest.fn();
  const mockStripe = function () {
    return {
      webhooks: { constructEvent: mockConstructEvent },
    };
  };
  mockStripe.__constructEvent = mockConstructEvent;
  return { __esModule: true, default: mockStripe };
});
import Stripe from "stripe";

const buildSub = (overrides = {}) => ({
  id: "sub_1",
  metadata: { orgId: "org1" },
  status: "active",
  items: { data: [{ price: { id: "price_1", lookup_key: "pro" }, current_period_start: 1, current_period_end: 2 }] },
  ...overrides,
});

describe("StripeService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when constructEvent fails", async () => {
    (Stripe.__constructEvent).mockImplementation(() => {
      throw new Error("bad sig");
    });
    const svc = new StripeService();
    const res = await svc.webhook("evt", "sig");
    expect(res).toBeNull();
  });

  it("handles subscription created/updated and updates org + prunes resources", async () => {
    (Stripe.__constructEvent).mockReturnValue({
      type: "customer.subscription.created",
      data: { object: buildSub() },
    });

    Monitor.countDocuments.mockResolvedValue(30);
    Monitor.find.mockReturnValue({ sort: () => ({ limit: () => ({ select: () => Promise.resolve([{ _id: "m1" }]) }) }) });
    Monitor.deleteMany.mockResolvedValue({});
    NotificationChannel.countDocuments.mockResolvedValue(0);
    StatusPage.countDocuments.mockResolvedValue(0);

    const svc = new StripeService();
    const res = await svc.webhook("evt", "sig");
    expect(Org.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "org1" },
      expect.objectContaining({ $set: expect.objectContaining({ planKey: "pro" }) }),
      { new: true }
    );
    expect(Monitor.deleteMany).toHaveBeenCalled();
    expect(res).toMatchObject({ status: "active" });
  });

  it("handles subscription deleted and resets org to free", async () => {
    (Stripe.__constructEvent).mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: buildSub() },
    });
    const svc = new StripeService();
    const res = await svc.webhook("evt", "sig");
    expect(Org.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: "org1" },
      expect.objectContaining({ $set: expect.objectContaining({ planKey: "free" }), $unset: expect.any(Object) }),
      { new: true }
    );
    expect(res).toMatchObject({ status: "active" });
  });

  it("returns subscription for updated event", async () => {
    (Stripe.__constructEvent).mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: buildSub({ status: "past_due" }) },
    });
    const svc = new StripeService();
    const res = await svc.webhook("evt", "sig");
    expect(res).toMatchObject({ status: "past_due" });
  });

  it("returns null for other events", async () => {
    (Stripe.__constructEvent).mockReturnValue({
      type: "invoice.payment_succeeded",
      data: { object: {} },
    });
    const svc = new StripeService();
    const res = await svc.webhook("evt", "sig");
    expect(res).toBeNull();
  });
});
