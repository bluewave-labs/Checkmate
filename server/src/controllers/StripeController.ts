import type { Request, Response, NextFunction } from "express";
import { StripeService } from "@/services/index.js";
import { config } from "@/config/index.js";

export interface IStripeController {
  webhook: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}

class StripeController implements IStripeController {
  private stripeService: StripeService;

  constructor(stripeService: StripeService) {
    this.stripeService = stripeService;
  }
  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let event = req.body;
      const signature = req.headers["stripe-signature"];
      if (!signature || Array.isArray(signature)) {
        throw new Error("Stripe signature is missing or invalid");
      }

      const result = await this.stripeService.webhook(event, signature);
      res.status(200).send({ received: true });
    } catch (error) {
      throw error;
    }
  };
}

export default StripeController;
