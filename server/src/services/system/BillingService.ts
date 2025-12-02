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
  cancelSubscription(orgId: string): Promise<string>;
  confirmPlan(orgId: string, expectedPlanKey: PlanKey): Promise<boolean>;
}

const SERVICE_NAME = "BillingService";

class BillingService implements IBillingService {
  public SERVICE_NAME: string;
  private stripeClient: Stripe;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.stripeClient = new Stripe(config.STRIPE_SECRET);
  }
  listPlans = async () => {
    const order: PlanKey[] = ["free", "pro", "business", "enterprise"];
    const prices = await this.stripeClient.prices.list({});

    const plans = order.map((key) => {
      const plan = Plans[key];
      plan.price =
        prices.data.find((p) => p.lookup_key === key)?.unit_amount || 0;
      return plan;
    });

    console.log("Available plans:", plans);
    return plans;
  };

  private buildSuccessUrl = (planKey: PlanKey) =>
    `${config.ORIGIN}/billing/success?plan=${planKey}`;

  private updateExistingSubscription = async (
    customerId: string,
    subscriptionId: string,
    successUrl: string
  ): Promise<string> => {
    const session = await this.stripeClient.billingPortal.sessions.create({
      customer: customerId,
      return_url: successUrl,
      flow_data: {
        type: "subscription_update",
        subscription_update: {
          subscription: subscriptionId,
        },
      },
    });
    return session.url as string;
  };

  private createNewSubscription = async (
    orgId: string,
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> => {
    const session = await this.stripeClient.checkout.sessions.create({
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer: customerId,
      client_reference_id: orgId,
      subscription_data: { metadata: { orgId } },
      metadata: { orgId },
    });
    if (!session.url) {
      throw new ApiError("Failed to create checkout session", 500);
    }
    return session.url;
  };

  subscribePlan = async (email: string, orgId: string, planKey: PlanKey) => {
    if (!planKey) {
      throw new ApiError("planKey is required", 400);
    }

    if (planKey && !Plans[planKey]) {
      throw new ApiError("Invalid planKey", 400);
    }

    const org = await Org.findById(orgId);
    if (!org) throw new ApiError("Organization not found", 404);

    // If the org does not have a Stripe customer ID, create one
    if (!org.billingCustomerId) {
      const customer = await this.stripeClient.customers.create({
        email,
        metadata: { orgId: String(org._id) },
      });
      org.billingCustomerId = customer.id;
      await org.save();
    }

    // Look up price for the selected plan
    const prices = await this.stripeClient.prices.list({
      lookup_keys: [planKey],
      expand: ["data.product"],
    });

    let price = prices.data[0]?.id;
    if (!price) {
      throw new ApiError("Price not found for the selected plan", 404);
    }

    let redirectUrl: string;
    const successUrl = this.buildSuccessUrl(planKey);
    const cancelUrl = `${config.ORIGIN}/billing/`;

    const subscriptionId = org.subscriptionId;

    // Updating an existing subscription
    if (subscriptionId) {
      redirectUrl = await this.updateExistingSubscription(
        String(org.billingCustomerId),
        subscriptionId,
        successUrl
      );
    }

    // Creating a new subscription
    else {
      redirectUrl = await this.createNewSubscription(
        String(org._id),
        String(org.billingCustomerId),
        price,
        successUrl,
        cancelUrl
      );
    }

    return redirectUrl;
  };

  cancelSubscription = async (orgId: string): Promise<string> => {
    const successUrl = `${config.ORIGIN}/billing/success?plan=free`;

    const org = await Org.findById(orgId);
    if (!org) throw new ApiError("Organization not found", 404);

    const subscriptionId = org.subscriptionId;
    if (!subscriptionId) {
      throw new ApiError("No active subscription found", 400);
    }

    const session = await this.stripeClient.billingPortal.sessions.create({
      customer: String(org.billingCustomerId),
      return_url: successUrl,
      flow_data: {
        type: "subscription_cancel",
        subscription_cancel: {
          subscription: subscriptionId,
        },
      },
    });

    const redirect = session.url;
    if (!redirect) {
      throw new ApiError("Failed to create billing portal session", 500);
    }

    return redirect;
  };

  confirmPlan = async (orgId: string, expectedPlanKey: PlanKey) => {
    const org = await Org.findOne({ _id: orgId });
    if (!org) throw new ApiError("Organization not found", 404);

    if (!org.subscriptionId) {
      return expectedPlanKey === "free";
    }

    const sub = await this.stripeClient.subscriptions.retrieve(
      org.subscriptionId
    );
    const activePlan = sub.items.data[0]?.price.lookup_key;

    if (activePlan === org.planKey) {
      return true;
    }

    if (activePlan === expectedPlanKey) {
      return true;
    }

    if (activePlan !== expectedPlanKey) {
      return false;
    }

    return true;
  };
}

export default BillingService;
