import BillingService from "@/services/system/BillingService.js";
import ApiError from "@/utils/ApiError.js";

// Mock Org model
jest.mock("@/db/models/index.js", () => ({
  Org: { findById: jest.fn(), findOne: jest.fn() },
}));
import { Org } from "@/db/models/index.js";

// Capture a shared mock Stripe client instance
jest.mock("stripe", () => {
  const mockClient = {
    prices: { list: jest.fn() },
    customers: { create: jest.fn() },
    checkout: { sessions: { create: jest.fn() } },
    billingPortal: { sessions: { create: jest.fn() } },
    subscriptions: { retrieve: jest.fn() },
  };
  const MockStripe = jest.fn(() => mockClient);
  MockStripe.__mockClient = mockClient;
  return { __esModule: true, default: MockStripe };
});
import Stripe from "stripe";

describe("BillingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listPlans", () => {
    it("lists plans in order and maps prices by lookup_key", async () => {
      (Stripe.__mockClient).prices.list.mockResolvedValue({
        data: [
          { lookup_key: "free", unit_amount: 0 },
          { lookup_key: "pro", unit_amount: 1000 },
          { lookup_key: "business", unit_amount: 2500 },
          { lookup_key: "enterprise", unit_amount: 9999 },
        ],
      });
      const svc = new BillingService();
      const plans = await svc.listPlans();
      expect(plans.map((p) => p.plan)).toEqual([
        "free",
        "pro",
        "business",
        "enterprise",
      ]);
      expect(plans.find((p) => p.plan === "pro")?.price).toBe(1000);
      expect(plans.find((p) => p.plan === "enterprise")?.price).toBe(9999);
    });
  });

  describe("subscribePlan", () => {
    it("throws when planKey missing", async () => {
      const svc = new BillingService();
      await expect(svc.subscribePlan("e@x.com", "org1", undefined)).rejects.toMatchObject({
        message: "planKey is required",
        status: 400,
      });
    });

    it("throws when planKey invalid", async () => {
      const svc = new BillingService();
      await expect(svc.subscribePlan("e@x.com", "org1", "bogus"))
        .rejects.toMatchObject({ message: "Invalid planKey", status: 400 });
    });

    it("throws when org not found", async () => {
      Org.findById.mockResolvedValue(null);
      const svc = new BillingService();
      await expect(svc.subscribePlan("e@x.com", "org1", "pro"))
        .rejects.toMatchObject({ message: "Organization not found", status: 404 });
    });

    it("creates customer and new subscription checkout when none exists", async () => {
      const org = { _id: "org1", save: jest.fn(), billingCustomerId: null, subscriptionId: null };
      Org.findById.mockResolvedValue(org);
      (Stripe.__mockClient).customers.create.mockResolvedValue({ id: "cus_123" });
      (Stripe.__mockClient).prices.list.mockResolvedValue({ data: [{ id: "price_123", lookup_key: "pro" }] });
      (Stripe.__mockClient).checkout.sessions.create.mockResolvedValue({ url: "https://checkout" });

      const svc = new BillingService();
      const url = await svc.subscribePlan("e@x.com", "org1", "pro");
      expect(org.billingCustomerId).toBe("cus_123");
      expect(org.save).toHaveBeenCalled();
      expect(Stripe.__mockClient.checkout.sessions.create).toHaveBeenCalled();
      expect(url).toBe("https://checkout");
    });

    it("updates existing subscription via billing portal when subscriptionId exists", async () => {
      const org = { _id: "org1", save: jest.fn(), billingCustomerId: "cus_123", subscriptionId: "sub_1" };
      Org.findById.mockResolvedValue(org);
      (Stripe.__mockClient).prices.list.mockResolvedValue({ data: [{ id: "price_123", lookup_key: "pro" }] });
      (Stripe.__mockClient).billingPortal.sessions.create.mockResolvedValue({ url: "https://portal" });

      const svc = new BillingService();
      const url = await svc.subscribePlan("e@x.com", "org1", "pro");
      expect(Stripe.__mockClient.billingPortal.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: "cus_123" })
      );
      expect(url).toBe("https://portal");
    });

    it("throws when no price found for plan", async () => {
      const org = { _id: "org1", save: jest.fn(), billingCustomerId: "cus_123", subscriptionId: null };
      Org.findById.mockResolvedValue(org);
      (Stripe.__mockClient).prices.list.mockResolvedValue({ data: [] });
      const svc = new BillingService();
      await expect(svc.subscribePlan("e@x.com", "org1", "pro"))
        .rejects.toMatchObject({ message: "Price not found for the selected plan", status: 404 });
    });
  });

  describe("cancelSubscription", () => {
    it("throws when org not found", async () => {
      Org.findById.mockResolvedValue(null);
      const svc = new BillingService();
      await expect(svc.cancelSubscription("org1"))
        .rejects.toMatchObject({ message: "Organization not found", status: 404 });
    });

    it("throws when no active subscription found", async () => {
      Org.findById.mockResolvedValue({ _id: "org1", subscriptionId: null });
      const svc = new BillingService();
      await expect(svc.cancelSubscription("org1"))
        .rejects.toMatchObject({ message: "No active subscription found", status: 400 });
    });

    it("returns billing portal url on success", async () => {
      Org.findById.mockResolvedValue({ _id: "org1", billingCustomerId: "cus_1", subscriptionId: "sub_1" });
      (Stripe.__mockClient).billingPortal.sessions.create.mockResolvedValue({ url: "https://cancel" });
      const svc = new BillingService();
      const url = await svc.cancelSubscription("org1");
      expect(url).toBe("https://cancel");
    });

    it("throws when billing portal session lacks url", async () => {
      Org.findById.mockResolvedValue({ _id: "org1", billingCustomerId: "cus_1", subscriptionId: "sub_1" });
      (Stripe.__mockClient).billingPortal.sessions.create.mockResolvedValue({ url: null });
      const svc = new BillingService();
      await expect(svc.cancelSubscription("org1"))
        .rejects.toMatchObject({ message: "Failed to create billing portal session", status: 500 });
    });
  });

  describe("confirmPlan", () => {
    it("throws when org not found", async () => {
      Org.findOne.mockResolvedValue(null);
      const svc = new BillingService();
      await expect(svc.confirmPlan("org1", "pro"))
        .rejects.toMatchObject({ message: "Organization not found", status: 404 });
    });

    it("returns true only when expected is free if no subscriptionId", async () => {
      Org.findOne.mockResolvedValue({ _id: "org1", subscriptionId: null });
      const svc = new BillingService();
      await expect(svc.confirmPlan("org1", "free")).resolves.toBe(true);
      await expect(svc.confirmPlan("org1", "pro")).resolves.toBe(false);
    });

    it("returns true when active plan equals org.planKey", async () => {
      Org.findOne.mockResolvedValue({ _id: "org1", subscriptionId: "sub1", planKey: "business" });
      (Stripe.__mockClient).subscriptions.retrieve.mockResolvedValue({ items: { data: [{ price: { lookup_key: "business" } }] } });
      const svc = new BillingService();
      await expect(svc.confirmPlan("org1", "pro")).resolves.toBe(true);
    });

    it("returns true when active plan equals expectedPlanKey", async () => {
      Org.findOne.mockResolvedValue({ _id: "org1", subscriptionId: "sub1", planKey: "pro" });
      (Stripe.__mockClient).subscriptions.retrieve.mockResolvedValue({ items: { data: [{ price: { lookup_key: "enterprise" } }] } });
      const svc = new BillingService();
      await expect(svc.confirmPlan("org1", "enterprise")).resolves.toBe(true);
    });

    it("returns false when active plan differs from expected", async () => {
      Org.findOne.mockResolvedValue({ _id: "org1", subscriptionId: "sub1", planKey: "pro" });
      (Stripe.__mockClient).subscriptions.retrieve.mockResolvedValue({ items: { data: [{ price: { lookup_key: "business" } }] } });
      const svc = new BillingService();
      await expect(svc.confirmPlan("org1", "enterprise")).resolves.toBe(false);
    });
  });
});
