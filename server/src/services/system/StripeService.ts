import Stripe from "stripe";
import { config } from "@/config/index.js";
import {
  Org,
  Monitor,
  StatusPage,
  NotificationChannel,
} from "@/db/models/index.js";
import { PlanKey, Plans } from "@/types/entitlements.js";

const SERVICE_NAME = "StripeService";

interface IStripeService {
  webhook: (
    event: string | Buffer,
    signature: string
  ) => Promise<Stripe.Subscription | null>;
}

class StripeService implements IStripeService {
  public SERVICE_NAME: string;
  private stripe: Stripe;

  constructor() {
    this.SERVICE_NAME = SERVICE_NAME;
    this.stripe = new Stripe(config.STRIPE_SECRET);
  }

  private handleSubscription = async (subscription: Stripe.Subscription) => {
    const orgId = subscription.metadata.orgId;
    const subscriptionId = subscription.id;
    const planKey =
      (subscription.items.data[0]?.price.lookup_key as PlanKey) || "free";
    const priceId = subscription.items.data[0]?.price.id || "unknown";
    const status = subscription.status;
    const currentPeriodStart =
      subscription.items.data[0]?.current_period_start || 0;
    const currentPeriodEnd =
      subscription.items.data[0]?.current_period_end || 0;

    await Org.findOneAndUpdate(
      { _id: orgId },
      {
        $set: {
          planKey,
          subscriptionId,
          subscriptionStatus: status,
          priceId,
          currentPeriodStart,
          currentPeriodEnd,
          entitlements: Plans[planKey],
        },
      },
      { new: true }
    );

    await this.pruneResourcesForOrg(String(orgId), Plans[planKey]);
  };

  private handleCancel = async (subscription: Stripe.Subscription) => {
    const orgId = subscription.metadata.orgId;
    await Org.findOneAndUpdate(
      { _id: orgId },
      {
        $set: {
          planKey: "free",
          entitlements: Plans["free"],
        },
        $unset: {
          subscriptionId: "",
          subscriptionStatus: "",
          priceId: "",
          currentPeriodStart: "",
          currentPeriodEnd: "",
        },
      },
      { new: true }
    );
    await this.pruneResourcesForOrg(String(orgId), Plans["free"]);
  };

  private pruneResourcesForOrg = async (
    orgId: string,
    entitlements: {
      monitorsMax: number;
      notificationChannelsMax: number;
      statusPagesMax: number;
    }
  ) => {
    const prune = async (
      model: any,
      cap: number,
      filter: Record<string, unknown>
    ) => {
      if (!Number.isFinite(cap) || cap === Number.MAX_SAFE_INTEGER) return;
      const count = await model.countDocuments(filter);
      if (count <= cap) return;
      const excess = count - cap;
      const docs = await model
        .find(filter)
        .sort({ createdAt: -1 })
        .limit(excess)
        .select("_id");
      const ids = docs.map((d: any) => d._id);
      if (ids.length) {
        await model.deleteMany({ _id: { $in: ids } });
      }
    };

    const baseFilter = { orgId } as const;
    await prune(Monitor, entitlements.monitorsMax, baseFilter);
    await prune(
      NotificationChannel,
      entitlements.notificationChannelsMax,
      baseFilter
    );
    await prune(StatusPage, entitlements.statusPagesMax, baseFilter);
  };

  webhook = async (event: string | Buffer, signature: string) => {
    const whSecret = config.STRIPE_WEBHOOK_SECRET;
    if (!whSecret || whSecret === "not_set") {
      throw new Error("Stripe webhook secret is not set");
    }

    const stripeEvent = this.stripe.webhooks.constructEvent(
      event,
      signature,
      whSecret
    );

    let subscription: Stripe.Subscription | null;
    let status: Stripe.Subscription.Status;
    switch (stripeEvent.type) {
      case "customer.subscription.deleted":
        subscription = stripeEvent.data.object;
        status = subscription.status;
        this.handleCancel(subscription);
        break;
      case "customer.subscription.created":
        subscription = stripeEvent.data.object;
        status = subscription.status;
        this.handleSubscription(subscription);
        break;
      case "customer.subscription.updated":
        subscription = stripeEvent.data.object;
        status = subscription.status;
        this.handleSubscription(subscription);
        break;

      case "checkout.session.completed":
        subscription = null;
        console.log("Checkout session completed.");
        break;

      case "invoice.payment_succeeded":
        subscription = null;
        console.log("Invoice payment succeeded.");
        break;

      default:
        // Unexpected event type
        subscription = null;
        console.log(`Unhandled event type ${stripeEvent.type}.`);
    }
    return subscription;
  };
}

export default StripeService;
