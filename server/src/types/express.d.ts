import { IUserContext } from "@/db/models/index.ts";
import type { Entitlements } from "@/types/entitlements.ts";
declare global {
  namespace Express {
    interface Request {
      user?: IUserContext;
      resource?: any;
      validatedQuery: Record<string, any>;
      entitlements?: Entitlements;
    }
  }
}
