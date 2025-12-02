import type { Request, Response, NextFunction } from "express";
import { StripeService } from "@/services/index.js";

export interface IStripeController {
  webhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

class StripeController implements IStripeController {
  private stripeService: StripeService;

  constructor(stripeService: StripeService) {
    this.stripeService = stripeService;
  }
  webhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const event = req.body;
      const signature = req.headers["stripe-signature"];
      if (!signature || Array.isArray(signature)) {
        res
          .status(400)
          .json({ message: "Stripe signature is missing or invalid" });
        return;
      }

      await this.stripeService.webhook(event, signature);
      res.status(200).send({ received: true });
      return;
    } catch (error: any) {
      const msg = String(error?.message ?? "");
      const isSignatureIssue =
        msg.includes(
          "Webhook payload must be provided as a string or a Buffer"
        ) ||
        msg.includes("No signatures found matching the expected signature") ||
        msg.includes("Stripe signature is missing or invalid") ||
        msg.includes("Error while decoding the event") ||
        msg.includes("Invalid payload");

      if (isSignatureIssue) {
        res.status(400).json({ message: "Invalid Stripe webhook signature" });
        return;
      }
      next(error);
    }
  };
}

export default StripeController;
