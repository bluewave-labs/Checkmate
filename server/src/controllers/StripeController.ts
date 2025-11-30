import type { Request, Response, NextFunction } from "express";

export interface IStripeController {
  webhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

class StripeController implements IStripeController {
  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sig = req.headers["stripe-signature"] as string | undefined;
      const raw = req.body as unknown; // Buffer when express.raw is used

      let event: any = undefined;
      if (Buffer.isBuffer(raw)) {
        const json = raw.toString("utf8");
        try {
          event = JSON.parse(json);
        } catch (_e) {
          res.status(401).json({ message: "Unauthorized" });
        }
      } else if (typeof raw === "string") {
        try {
          event = JSON.parse(raw);
        } catch (_e) {
          res.status(400).json({ message: "Invalid JSON payload" });
        }
      } else if (raw && typeof raw === "object") {
        event = raw;
      }

      // Basic routing by event type (no-ops for now)
      const type = event?.type;
      switch (type) {
        case "checkout.session.completed":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
        case "invoice.payment_succeeded":
        case "invoice.payment_failed":
        default:
          break;
      }

      res.status(200);
    } catch (error) {
      throw error;
    }
  };
}

export default StripeController;
