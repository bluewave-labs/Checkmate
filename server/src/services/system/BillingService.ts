import {
  Plans,
  type Entitlements,
  type PlanKey,
} from "@/types/entitlements.js";
import { config } from "@/config/index.js";
import { Org } from "@/db/models/index.js";
import ApiError from "@/utils/ApiError.js";
import Stripe from "stripe";

export interface IBillingService {
  listPlans(): Promise<Entitlements[]>;
  subscribePlan(
    email: string,
    orgId: string,
    planKey: PlanKey
  ): Promise<string>;
}

const SERVICE_NAME = "BillingService";

class BillingService implements IBillingService {
  public SERVICE_NAME: string;
  private stripeClient: Stripe;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.stripeClient = new Stripe(config.STRIPE_SECRET);
  }
  async listPlans(): Promise<Entitlements[]> {
    const order: PlanKey[] = ["free", "pro", "business", "enterprise"];
    return order.map((key) => Plans[key]);
  }

  subscribePlan = async (email: string, orgId: string, planKey: PlanKey) => {
    if (!planKey) {
      throw new ApiError("planKey is required", 400);
    }

    if (planKey && !Plans[planKey]) {
      throw new ApiError("Invalid planKey", 400);
    }

    // Ensure billing customer exists for this org
    const org = await Org.findById(orgId);
    if (!org) throw new ApiError("Organization not found", 404);
    if (!org.billingCustomerId) {
      const customer = await this.stripeClient.customers.create({
        email,
        metadata: { orgId: String(org._id) },
      });
      org.billingCustomerId = customer.id;
      await org.save();
    }

    const prices = await this.stripeClient.prices.list({
      lookup_keys: [planKey],
      expand: ["data.product"],
    });

    let price = prices.data[0]?.id;
    if (!price) {
      throw new ApiError("Price not found for the selected plan", 404);
    }

    const successUrl = `${config.ORIGIN}/billing/success?plan=${planKey}`;
    const cancelUrl = `${config.ORIGIN}/billing/`;
    const session = await this.stripeClient.checkout.sessions.create({
      billing_address_collection: "auto",
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: String(org.billingCustomerId),
      client_reference_id: String(org._id),
      subscription_data: { metadata: { orgId: String(org._id) } },
      metadata: { orgId: String(org._id) },
    });
    if (session.url === null) {
      throw new ApiError("Failed to create checkout session", 500);
    }
    return session.url;
  };
}

export default BillingService;
